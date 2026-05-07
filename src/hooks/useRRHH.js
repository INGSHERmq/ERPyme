import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useRRHH = () => {
  const { user } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setEmpleados([]);
      setAsistencias([]);
      setAsignaciones([]);
      setIncidentes([]);
      setDashboardData(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const [empRes, asistRes, asigRes, incRes] = await Promise.all([
        supabase.from('v_empleados_stats').select('*').eq('user_id', user.id).order('nombre'),
        supabase.from('asistencias').select('*').eq('user_id', user.id).order('fecha', { ascending: false }).limit(50),
        supabase.from('asignaciones_proyecto').select('*').eq('user_id', user.id).eq('estado', 'Activo'),
        supabase.from('incidentes_ssoma').select('*').eq('user_id', user.id).order('fecha', { ascending: false }).limit(20)
      ]);
      
      if (empRes.error) throw empRes.error;
      if (asistRes.error) throw asistRes.error;
      if (asigRes.error) throw asigRes.error;
      if (incRes.error) throw incRes.error;

      setEmpleados(empRes.data || []);
      setAsistencias((asistRes.data || []).map(a => ({
        ...a,
        empleadoNombre: empRes.data?.find(e => e.id === a.empleado_id)?.nombre || 'Sin empleado'
      })));
      setAsignaciones(asigRes.data || []);
      setIncidentes((incRes.data || []).map(i => ({
        ...i,
        empleadoNombre: empRes.data?.find(e => e.id === i.empleado_id)?.nombre || 'Sin empleado',
        accionesTomadas: i.acciones_tomadas
      })));

      const activos = empRes.data?.filter(e => e.estado === 'Activo') || [];
      const presentesHoy = asistRes.data?.filter(a => 
        a.fecha === new Date().toISOString().split('T')[0] && a.estado === 'Presente'
      ).length || 0;
      const planillaMensual = activos.reduce((s, e) => s + (e.salario || 0), 0);
      const empleadosPorDepartamento = Object.entries(
        activos.reduce((acc, empleado) => {
          const departamento = empleado.departamento || empleado.area || 'Sin area';
          acc[departamento] = (acc[departamento] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

      setDashboardData({
        totalEmpleados: activos.length,
        presentesHoy,
        planillaMensual,
        incidentesMes: incRes.data?.filter(i => i.fecha?.startsWith(new Date().toISOString().slice(0, 7))).length || 0,
        empleadosPorDepartamento
      });
    } catch (err) {
      console.error('Error cargando RRHH:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    (async () => { await fetchData(); })();
  }, [fetchData]);

  const addEmpleado = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('empleados')
      .insert([{ ...data, user_id: user.id, fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0], estado: data.estado || 'Activo' }])
      .select()
      .single();
    if (error) throw error;
    setEmpleados(prev => [...prev, nuevo]);
    return nuevo;
  };

  const registrarAsistencia = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('asistencias')
      .insert([{ ...data, user_id: user.id, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setAsistencias(prev => [...prev, nueva]);
    return nueva;
  };

  const asignarAProyecto = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    try {
      const { data: existente, error: fetchError } = await supabase
        .from('asignaciones_proyecto')
        .select('*')
        .eq('empleado_id', data.empleado_id)
        .eq('proyecto_id', data.proyecto_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let resultado;
      
      if (existente) {
        const { data: actualizado, error: updateError } = await supabase
          .from('asignaciones_proyecto')
          .update({
            rol: data.rol,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            horas_semanales: data.horas_semanales,
            estado: data.estado || 'Activo'
          })
          .eq('id', existente.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        resultado = actualizado;
        setAsignaciones(prev => prev.map(a => a.id === existente.id ? actualizado : a));
      } else {
        const { data: nuevo, error: insertError } = await supabase
          .from('asignaciones_proyecto')
          .insert([{
            empleado_id: data.empleado_id,
            proyecto_id: data.proyecto_id,
            user_id: user.id,
            rol: data.rol,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            horas_semanales: data.horas_semanales,
            estado: data.estado || 'Activo'
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        resultado = nuevo;
        setAsignaciones(prev => [...prev, nuevo]);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error en asignarAProyecto:', error);
      throw error;
    }
  };

  const registrarIncidente = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('incidentes_ssoma')
      .insert([{ ...data, user_id: user.id, fecha: data.fecha || new Date().toISOString().split('T')[0], fecha_reporte: data.fecha_reporte || new Date().toISOString().split('T')[0], estado: data.estado || 'Abierto' }])
      .select()
      .single();
    if (error) throw error;
    setIncidentes(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addIncidente = (data) => registrarIncidente({
    empleado_id: data.empleado_id ?? data.empleadoId,
    tipo: data.tipo,
    gravedad: data.gravedad,
    descripcion: data.descripcion,
    acciones_tomadas: data.acciones_tomadas ?? data.accionesTomadas,
    estado: data.estado,
    fecha: data.fecha
  });

  return {
    empleados,
    asistencias,
    asignaciones,
    incidentes,
    dashboardData,
    loading,
    error,
    addEmpleado,
    registrarAsistencia,
    asignarAProyecto,
    registrarIncidente,
    addIncidente,
    refetch: fetchData
  };
};

export default useRRHH;
