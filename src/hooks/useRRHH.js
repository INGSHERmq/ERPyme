import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';
import { traducirError } from '../lib/errores';
import { validarCamposRequeridos } from '../lib/validacion';

const useRRHH = () => {
  const { user, company, profile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const empresaIdActual = company?.id || profile?.empresa_actual_id || null;

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
      const empresaId = empresaIdActual;
      const ownerFilter = empresaId ? `empresa_id.eq.${empresaId},user_id.eq.${user.id}` : `user_id.eq.${user.id}`;
      const [empRes, asistRes, asigRes, incRes] = await Promise.all([
        // Read the base table so recently added fields (such as payment period)
        // are never hidden by a stale reporting view.
        supabase.from('empleados').select('*').or(ownerFilter).order('nombre'),
        supabase.from('asistencias').select('*').or(ownerFilter).order('fecha', { ascending: false }).limit(50),
        supabase.from('asignaciones_proyecto').select('*').or(ownerFilter),
        supabase.from('registro_accidentes').select('*').or(ownerFilter).order('fecha', { ascending: false }).limit(20)
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
      setError(traducirError(err));
    } finally {
      setLoading(false);
    }
  }, [empresaIdActual, user]);

  useEffect(() => {
    (async () => { await fetchData(); })();
  }, [fetchData]);

  const addEmpleado = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'nombre', etiqueta: 'Nombre del empleado' },
      { nombre: 'salario', etiqueta: 'Salario' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nuevo, error } = await supabase
      .from('empleados')
      .insert([{
        ...data,
        user_id: user.id,
        empresa_id: empresaIdActual,
        fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Activo'
      }])
      .select()
      .single();
    if (error) {
      const err = new Error(traducirError(error));
      err.code = error.code;
      err.details = error.details;
      err.constraint = error.constraint;
      throw err;
    }
    setEmpleados(prev => [...prev, nuevo]);
    return nuevo;
  };

  const updateEmpleado = async (empleadoId, updates) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data: actualizado, error } = await supabase
      .from('empleados')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', empleadoId)
      .or(empresaIdActual ? `user_id.eq.${user.id},empresa_id.eq.${empresaIdActual}` : `user_id.eq.${user.id}`)
      .select()
      .single();

    if (error) {
      const err = new Error(traducirError(error));
      err.code = error.code;
      err.details = error.details;
      err.constraint = error.constraint;
      throw err;
    }
    setEmpleados(prev => prev.map(empleado => (Number(empleado.id) === Number(empleadoId) ? { ...empleado, ...actualizado } : empleado)));
    return actualizado;
  };

  const desactivarEmpleado = (empleadoId) => updateEmpleado(empleadoId, {
    estado: 'Inactivo',
    estado_laboral: 'Inactivo'
  });

  const registrarAsistencia = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'empleado_id', etiqueta: 'Empleado' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nueva, error } = await supabase
      .from('asistencias')
      .insert([{ ...data, user_id: user.id, empresa_id: empresaIdActual, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
    setAsistencias(prev => [...prev, nueva]);
    return nueva;
  };

  const asignarAProyecto = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    try {
      const errores = validarCamposRequeridos(data, [
        { nombre: 'empleado_id', etiqueta: 'Empleado' },
        { nombre: 'proyecto_id', etiqueta: 'Proyecto' },
      ]);
      if (errores.length > 0) {
        throw new Error(errores.join('\n'));
      }

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
            tipo_asignacion: data.tipo_asignacion || 'horas_semana',
            estado: data.estado || 'Activo'
          })
          .eq('id', existente.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (updateError) throw new Error(traducirError(updateError));
        resultado = actualizado;
        setAsignaciones(prev => prev.map(a => a.id === existente.id ? actualizado : a));
      } else {
        const { data: nuevo, error: insertError } = await supabase
          .from('asignaciones_proyecto')
          .insert([{
            empleado_id: data.empleado_id,
            proyecto_id: data.proyecto_id,
            user_id: user.id,
            empresa_id: empresaIdActual,
            rol: data.rol,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            horas_semanales: data.horas_semanales,
            tipo_asignacion: data.tipo_asignacion || 'horas_semana',
            estado: data.estado || 'Activo'
          }])
          .select()
          .single();
        
        if (insertError) throw new Error(traducirError(insertError));
        resultado = nuevo;
        setAsignaciones(prev => [...prev, nuevo]);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error en asignarAProyecto:', error);
      throw error;
    }
  };

  const updateAsignacionProyecto = async (asignacionId, updates) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data: actualizada, error } = await supabase
      .from('asignaciones_proyecto')
      .update(updates)
      .eq('id', asignacionId)
      .or(empresaIdActual ? `user_id.eq.${user.id},empresa_id.eq.${empresaIdActual}` : `user_id.eq.${user.id}`)
      .select()
      .single();

    if (error) throw new Error(traducirError(error));
    setAsignaciones(prev => prev.map(asignacion => (
      Number(asignacion.id) === Number(asignacionId) ? { ...asignacion, ...actualizada } : asignacion
    )));
    return actualizada;
  };

  const desactivarAsignacionProyecto = (asignacionId) => updateAsignacionProyecto(asignacionId, { estado: 'Pendiente' });

  const registrarIncidente = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const errores = validarCamposRequeridos(data, [
      { nombre: 'empleado_id', etiqueta: 'Empleado' },
      { nombre: 'tipo', etiqueta: 'Tipo de incidente' },
      { nombre: 'descripcion', etiqueta: 'Descripción' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nuevo, error } = await supabase
      .from('registro_accidentes')
      .insert([{
        ...data,
        user_id: user.id,
        empresa_id: empresaIdActual,
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        fecha_reporte: data.fecha_reporte || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Abierto'
      }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
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
    updateEmpleado,
    desactivarEmpleado,
    registrarAsistencia,
    asignarAProyecto,
    updateAsignacionProyecto,
    desactivarAsignacionProyecto,
    registrarIncidente,
    addIncidente,
    refetch: fetchData
  };
};

export default useRRHH;
