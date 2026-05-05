import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useLogistica = () => {
  const { user } = useAuth();
  const [activos, setActivos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [guias, setGuias] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [actRes, asigRes, mantRes, guiasRes] = await Promise.all([
        supabase.from('activos').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('asignaciones_activos').select('*').eq('user_id', user.id).eq('estado', 'Activa'),
        supabase.from('mantenimientos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('guias_salida').select('*').eq('user_id', user.id).order('fecha_salida', { ascending: false })
      ]);

      if (actRes.error) throw actRes.error;
      if (asigRes.error) throw asigRes.error;
      if (mantRes.error) throw mantRes.error;
      if (guiasRes.error) throw guiasRes.error;

      setActivos(actRes.data || []);
      setAsignaciones(asigRes.data || []);
      setMantenimientos(mantRes.data || []);
      setGuias(guiasRes.data || []);

      const total = actRes.data?.length || 0;
      const disponibles = actRes.data?.filter(a => a.estado === 'Disponible').length || 0;
      const enUso = actRes.data?.filter(a => a.estado === 'En uso').length || 0;
      const valorTotal = actRes.data?.reduce((s, a) => s + (a.costo || 0), 0) || 0;

      setDashboardData({
        total,
        disponibles,
        enUso,
        enMantenimiento: actRes.data?.filter(a => a.estado === 'En mantenimiento').length || 0,
        valorTotal,
        mantenimientosPendientes: mantRes.data?.filter(m => m.estado === 'Pendiente').length || 0
      });
    } catch (err) {
      console.error('Error cargando logística:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addActivo = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('activos')
      .insert([{ 
        ...data, 
        user_id: user.id,
        fecha_compra: data.fecha_compra || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Disponible'
      }])
      .select()
      .single();
    if (error) throw error;
    setActivos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const asignarActivo = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('asignaciones_activos')
      .insert([{ 
        ...data, 
        user_id: user.id,
        fecha_asignacion: data.fecha_asignacion || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Activa'
      }])
      .select()
      .single();
    if (error) throw error;
    
    if (data.activo_id) {
      await supabase.from('activos').update({ estado: 'En uso' }).eq('id', data.activo_id).eq('user_id', user.id);
      setActivos(prev => prev.map(a => a.id === data.activo_id ? { ...a, estado: 'En uso' } : a));
    }
    
    setAsignaciones(prev => [...prev, nueva]);
    return nueva;
  };

  const devolverActivo = async (asignacionId, activoId) => {
    const { error } = await supabase
      .from('asignaciones_activos')
      .update({ 
        estado: 'Devuelta', 
        fecha_devolucion: new Date().toISOString().split('T')[0] 
      })
      .eq('id', asignacionId)
      .eq('user_id', user?.id);
    if (error) throw error;
    
    if (activoId) {
      await supabase.from('activos').update({ estado: 'Disponible' }).eq('id', activoId).eq('user_id', user?.id);
      setActivos(prev => prev.map(a => a.id === activoId ? { ...a, estado: 'Disponible' } : a));
    }
    
    setAsignaciones(prev => prev.map(a => 
      a.id === asignacionId ? { ...a, estado: 'Devuelta', fecha_devolucion: new Date().toISOString().split('T')[0] } : a
    ));
  };

  const programarMantenimiento = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('mantenimientos')
      .insert([{ 
        ...data, 
        user_id: user.id,
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Pendiente'
      }])
      .select()
      .single();
    if (error) throw error;
    
    if (data.activo_id) {
      await supabase.from('activos').update({ estado: 'En mantenimiento' }).eq('id', data.activo_id).eq('user_id', user.id);
      setActivos(prev => prev.map(a => a.id === data.activo_id ? { ...a, estado: 'En mantenimiento' } : a));
    }
    
    setMantenimientos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const completarMantenimiento = async (mantenimientoId, activoId) => {
    const { error } = await supabase
      .from('mantenimientos')
      .update({ estado: 'Completado' })
      .eq('id', mantenimientoId)
      .eq('user_id', user?.id);
    if (error) throw error;
    
    if (activoId) {
      await supabase.from('activos').update({ estado: 'Disponible' }).eq('id', activoId).eq('user_id', user?.id);
      setActivos(prev => prev.map(a => a.id === activoId ? { ...a, estado: 'Disponible' } : a));
    }
    
    setMantenimientos(prev => prev.map(m => 
      m.id === mantenimientoId ? { ...m, estado: 'Completado' } : m
    ));
  };

  const emitirGuia = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('guias_salida')
      .insert([{ 
        ...data, 
        user_id: user.id,
        fecha_salida: data.fecha_salida || new Date().toISOString().split('T')[0],
        estado: data.estado || 'En tránsito'
      }])
      .select()
      .single();
    if (error) throw error;
    
    if (data.activo_id) {
      await supabase.from('activos').update({ estado: 'En tránsito' }).eq('id', data.activo_id).eq('user_id', user.id);
      setActivos(prev => prev.map(a => a.id === data.activo_id ? { ...a, estado: 'En tránsito' } : a));
    }
    
    setGuias(prev => [...prev, nueva]);
    return nueva;
  };

  return {
    activos,
    asignaciones,
    mantenimientos,
    guias,
    dashboardData,
    loading,
    error,
    addActivo,
    asignarActivo,
    devolverActivo,
    programarMantenimiento,
    completarMantenimiento,
    emitirGuia,
    refetch: fetchData
  };
};

export default useLogistica;