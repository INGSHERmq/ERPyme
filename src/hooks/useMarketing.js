import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useMarketing = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [leads, setLeads] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) {
      setClientes([]);
      setCotizaciones([]);
      setProyectos([]);
      setLeads([]);
      setOportunidades([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const [clientesRes, cotizacionesRes, proyectosRes, oportunidadesRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('v_cotizaciones_completas').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('proyectos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('oportunidades').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (cotizacionesRes.error) throw cotizacionesRes.error;
      if (proyectosRes.error) throw proyectosRes.error;
      if (oportunidadesRes.error) throw oportunidadesRes.error;

      const clientesData = clientesRes.data || [];
      setClientes(clientesData);
      setCotizaciones(cotizacionesRes.data || []);
      setProyectos(proyectosRes.data || []);
      setLeads(clientesData);
      setOportunidades(oportunidadesRes.data || []);
    } catch (err) {
      console.error('Error cargando marketing:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addCliente = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('clientes')
      .insert([{ ...data, user_id: user.id, creado: new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  const updateClienteEstado = async (clienteId, estado) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data: actualizado, error } = await supabase
      .from('clientes')
      .update({ estado })
      .eq('id', clienteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setClientes(prev => prev.map(cliente => (
      cliente.id === clienteId ? { ...cliente, estado: actualizado.estado } : cliente
    )));
    return actualizado;
  };

  const addCotizacion = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('cotizaciones')
      .insert([{ ...data, user_id: user.id, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setCotizaciones(prev => [...prev, nueva]);
    return nueva;
  };

  const addLead = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const leadEmail = data.email?.trim();
    const leadName = data.nombre?.trim();
    let clienteExistente = null;

    if (leadEmail) {
      const { data: clientePorEmail, error: clienteEmailError } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .eq('email', leadEmail)
        .limit(1);

      if (clienteEmailError) throw clienteEmailError;
      clienteExistente = clientePorEmail?.[0] || null;
    }

    if (!clienteExistente && leadName) {
      const { data: clientePorNombre, error: clienteNombreError } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .eq('nombre', leadName)
        .limit(1);

      if (clienteNombreError) throw clienteNombreError;
      clienteExistente = clientePorNombre?.[0] || null;
    }

    if (!clienteExistente) {
      const payload = {
        user_id: user.id,
        nombre: data.nombre,
        contacto: data.contacto || null,
        email: data.email || null,
        telefono: data.telefono || null,
        industria: data.industria || null,
        dni_ruc: data.dni_ruc || null,
        tipo_identificacion: data.tipo_identificacion || 'DNI',
        estado: data.estado || 'Activo',
        creado: new Date().toISOString().split('T')[0]
      };

      const { data: nuevoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();

      if (clienteError) throw clienteError;
      setClientes(prev => [...prev, nuevoCliente].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
      setLeads(prev => [nuevoCliente, ...prev]);
      return nuevoCliente;
    }

    setLeads(prev => prev.map(item => (item.id === clienteExistente.id ? clienteExistente : item)));
    return clienteExistente;
  };

  const addOportunidad = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const payload = {
      ...data,
      user_id: user.id,
      lead_id: data.lead_id || null,
      cliente_id: data.cliente_id || null,
      monto_estimado: Number(data.monto_estimado || 0),
      tiempo_respuesta_horas: data.tiempo_respuesta_horas === '' ? null : Number(data.tiempo_respuesta_horas || 0),
      etapa: data.etapa || 'Prospeccion'
    };

    const { data: nueva, error } = await supabase
      .from('oportunidades')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    setOportunidades(prev => [nueva, ...prev]);
    return nueva;
  };

  const convertirCotizacion = async (cotizacionId) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data: cotizacionActualizada, error: cotError } = await supabase
      .from('cotizaciones')
      .update({ estado: 'aprobada' })
      .eq('id', cotizacionId)
      .eq('user_id', user.id)
      .select()
      .single();
    if (cotError) throw cotError;

    setCotizaciones(prev => prev.map(c => 
      c.id === cotizacionId ? { ...c, ...cotizacionActualizada } : c
    ));
    return cotizacionActualizada;
  };

  return {
    clientes,
    cotizaciones,
    proyectos,
    leads,
    oportunidades,
    loading,
    error,
    addCliente,
    updateClienteEstado,
    addCotizacion,
    addLead,
    addOportunidad,
    convertirCotizacion,
    refetch: fetchData
  };
};

export default useMarketing;
