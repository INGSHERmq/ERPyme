import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';
import { traducirError } from '../lib/errores';
import { validarCamposRequeridos } from '../lib/validacion';

const useLogistica = () => {
  const { user } = useAuth();
  const [activos, setActivos] = useState([]);
  const [inventarioLogistica, setInventarioLogistica] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [guias, setGuias] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) {
      setActivos([]);
      setInventarioLogistica([]);
      setAsignaciones([]);
      setMantenimientos([]);
      setGuias([]);
      setDashboardData(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const [actRes, productosRes, asigRes, mantRes, guiasRes] = await Promise.all([
        supabase.from('activos').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('productos_servicios').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('asignaciones_activos').select('*').eq('user_id', user.id).eq('estado', 'Activa'),
        supabase.from('mantenimientos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('guias_salida').select('*').eq('user_id', user.id).order('fecha_salida', { ascending: false })
      ]);

      if (actRes.error) throw actRes.error;
      if (productosRes.error) throw productosRes.error;
      if (asigRes.error) throw asigRes.error;
      if (mantRes.error) throw mantRes.error;
      if (guiasRes.error) throw guiasRes.error;

      setActivos(actRes.data || []);
      setInventarioLogistica((productosRes.data || []).map(producto => ({
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        tipo: producto.tipo,
        unidad: producto.unidad,
        marca: producto.codigo || '-',
        modelo: producto.unidad || '',
        ubicacion: 'Inventario',
        costo: producto.costo,
        stockActual: producto.stock_actual,
        stockMinimo: producto.stock_minimo,
        estado: producto.estado || 'Activo'
      })));
      setAsignaciones(asigRes.data || []);
      setMantenimientos((mantRes.data || []).map(m => ({
        ...m,
        activoNombre: actRes.data?.find(a => a.id === m.activo_id)?.nombre || 'Sin activo'
      })));
      setGuias((guiasRes.data || []).map(g => ({
        ...g,
        activoNombre: actRes.data?.find(a => a.id === g.activo_id)?.nombre || 'Sin activo',
        fechaSalida: g.fecha_salida,
        fechaRegreso: g.fecha_regreso
      })));

      const productos = productosRes.data || [];
      const total = productos.length;
      const disponibles = productos.filter(producto => producto.estado === 'Activo').length;
      const enUso = actRes.data?.filter(a => a.estado === 'En uso').length || 0;
      const valorTotal = productos.reduce((s, producto) => s + ((producto.costo || 0) * (producto.stock_actual || 0)), 0);
      const porTipo = productos.reduce((acc, producto) => {
        const tipo = producto.tipo || 'Sin tipo';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      setDashboardData({
        total,
        disponibles,
        enUso,
        enMantenimiento: actRes.data?.filter(a => a.estado === 'En mantenimiento').length || 0,
        valorTotal,
        mantenimientosPendientes: mantRes.data?.filter(m => m.estado === 'Pendiente').length || 0,
        porTipo: Object.entries(porTipo).map(([name, value]) => ({ name, value }))
      });
    } catch (err) {
      console.error('Error cargando logística:', err);
      setError(traducirError(err));
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
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'nombre', etiqueta: 'Nombre del activo' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

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
    if (error) throw new Error(traducirError(error));
    setActivos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const asignarActivo = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'activo_id', etiqueta: 'Activo' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

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
    if (error) throw new Error(traducirError(error));
    
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
    if (error) throw new Error(traducirError(error));
    
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
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'activo_id', etiqueta: 'Activo' },
      { nombre: 'descripcion', etiqueta: 'Descripción' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

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
    if (error) throw new Error(traducirError(error));
    
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
    if (error) throw new Error(traducirError(error));
    
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
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'destino', etiqueta: 'Destino' },
      { nombre: 'responsable', etiqueta: 'Responsable' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

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
    if (error) throw new Error(traducirError(error));
    
    if (data.activo_id) {
      await supabase.from('activos').update({ estado: 'En tránsito' }).eq('id', data.activo_id).eq('user_id', user.id);
      setActivos(prev => prev.map(a => a.id === data.activo_id ? { ...a, estado: 'En tránsito' } : a));
    }
    
    setGuias(prev => [...prev, nueva]);
    return nueva;
  };

  const addGuia = (data) => emitirGuia({
    activo_id: data.activo_id ?? data.activoId,
    destino: data.destino,
    fecha_salida: data.fecha_salida ?? data.fechaSalida,
    fecha_regreso: (data.fecha_regreso ?? data.fechaRegreso) || null,
    responsable: data.responsable,
    estado: data.estado
  });

  return {
    activos,
    inventarioLogistica,
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
    addGuia,
    refetch: fetchData
  };
};

export default useLogistica;
