import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useMarketing = () => {
  const { user, company, membership, profile } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [leads, setLeads] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const empresaId = company?.id || membership?.empresa_id || profile?.empresa_actual_id || null;

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
      .insert([{ ...data, user_id: user.id, empresa_id: empresaId, creado: new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  const updateCliente = async (clienteId, updates) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data: actualizado, error } = await supabase
      .from('clientes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', clienteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setClientes(prev => prev
      .map(cliente => (Number(cliente.id) === Number(clienteId) ? { ...cliente, ...actualizado } : cliente))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
    );
    setLeads(prev => prev.map(lead => (Number(lead.id) === Number(clienteId) ? { ...lead, ...actualizado } : lead)));
    return actualizado;
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
      Number(cliente.id) === Number(clienteId) ? { ...cliente, estado: actualizado.estado } : cliente
    )));
    setLeads(prev => prev.map(lead => (
      Number(lead.id) === Number(clienteId) ? { ...lead, estado: actualizado.estado } : lead
    )));
    return actualizado;
  };

  const addCotizacion = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('cotizaciones')
      .insert([{ ...data, user_id: user.id, empresa_id: empresaId, fecha: data.fecha || data.fecha_inicio || new Date().toISOString().split('T')[0] }])
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
        empresa_id: empresaId,
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

  const updateCotizacion = async (cotizacionId, updates) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const payload = {
      ...updates,
      fecha: updates.fecha || updates.fecha_inicio || updates.fecha,
      updated_at: new Date().toISOString()
    };

    const { data: actualizada, error } = await supabase
      .from('cotizaciones')
      .update(payload)
      .eq('id', cotizacionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setCotizaciones(prev => prev.map(c => (
      Number(c.id) === Number(cotizacionId) ? { ...c, ...actualizada } : c
    )));
    return actualizada;
  };

  const anularCotizacion = (cotizacionId) => updateCotizacion(cotizacionId, { estado: 'rechazada' });

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

    let proyectoId = cotizacionActualizada.proyecto_id || null;
    if (!proyectoId) {
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert([{
          user_id: user.id,
          empresa_id: empresaId,
          cliente_id: cotizacionActualizada.cliente_id,
          cotizacion_id: cotizacionActualizada.id,
          nombre: `Proyecto cotizacion #${cotizacionActualizada.id} - ${cotizacionActualizada.titulo}`,
          estado: 'En Progreso',
          prioridad: 'Media',
          inicio: cotizacionActualizada.fecha_inicio || cotizacionActualizada.fecha || new Date().toISOString().split('T')[0],
          fin: cotizacionActualizada.fecha_fin || null,
          descripcion: cotizacionActualizada.descripcion,
          monto: cotizacionActualizada.precio_total || cotizacionActualizada.monto || 0,
          progreso: 0
        }])
        .select()
        .single();

      if (proyectoError) throw proyectoError;
      proyectoId = proyecto.id;
      await supabase
        .from('cotizaciones')
        .update({ proyecto_id: proyectoId })
        .eq('id', cotizacionId)
        .eq('user_id', user.id);
    }

    if (empresaId) {
      const { data: facturaExistente } = await supabase
        .from('facturas_venta')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('cotizacion_id', cotizacionActualizada.id)
        .limit(1);

      if (!facturaExistente?.length) {
        await supabase.from('facturas_venta').insert([{
          empresa_id: empresaId,
          numero: `FV-${String(cotizacionActualizada.id).padStart(5, '0')}`,
          cotizacion_id: cotizacionActualizada.id,
          cliente_id: cotizacionActualizada.cliente_id,
          fecha_emision: new Date().toISOString().split('T')[0],
          total: cotizacionActualizada.precio_total || cotizacionActualizada.monto || 0,
          estado: 'emitida'
        }]);
      }
    }

    setCotizaciones(prev => prev.map(c => 
      Number(c.id) === Number(cotizacionId) ? { ...c, ...cotizacionActualizada, proyecto_id: proyectoId } : c
    ));
    return { ...cotizacionActualizada, proyecto_id: proyectoId };
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
    updateCliente,
    updateClienteEstado,
    addCotizacion,
    updateCotizacion,
    anularCotizacion,
    addLead,
    addOportunidad,
    convertirCotizacion,
    refetch: fetchData
  };
};

export default useMarketing;
