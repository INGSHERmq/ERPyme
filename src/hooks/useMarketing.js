import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useMarketing = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [clientesRes, cotizacionesRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('v_cotizaciones_completas').select('*').eq('user_id', user.id).order('fecha', { ascending: false })
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (cotizacionesRes.error) throw cotizacionesRes.error;

      setClientes(clientesRes.data || []);
      setCotizaciones(cotizacionesRes.data || []);
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

  const convertirCotizacion = async (cotizacionId, proyectoData) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: proyecto, error: projError } = await supabase
      .from('proyectos')
      .insert([{ ...proyectoData, user_id: user.id, progreso: 0 }])
      .select()
      .single();
    if (projError) throw projError;

    const { error: cotError } = await supabase
      .from('cotizaciones')
      .update({ estado: 'Aceptada', proyecto_id: proyecto.id })
      .eq('id', cotizacionId)
      .eq('user_id', user.id);
    if (cotError) throw cotError;

    setCotizaciones(prev => prev.map(c => 
      c.id === cotizacionId ? { ...c, estado: 'Aceptada', proyecto_id: proyecto.id } : c
    ));
    return { proyecto, cotizacionId };
  };

  return {
    clientes,
    cotizaciones,
    loading,
    error,
    addCliente,
    addCotizacion,
    convertirCotizacion,
    refetch: fetchData
  };
};

export default useMarketing;