import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { traducirError } from '../lib/errores';
import { validarCamposRequeridos } from '../lib/validacion';

const RRHHContext = createContext();

export const RRHHProvider = ({ children }) => {
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, asistRes, asigRes, incRes] = await Promise.all([
        supabase.from('v_empleados_stats').select('*').order('nombre'),
        supabase.from('asistencias').select('*').order('fecha', { ascending: false }).limit(50),
        supabase.from('asignaciones_proyecto').select('*').eq('estado', 'Activo'),
        supabase.from('incidentes_ssoma').select('*').order('fecha', { ascending: false }).limit(20)
      ]);
      if (empRes.error) throw empRes.error;
      if (asistRes.error) throw asistRes.error;
      if (asigRes.error) throw asigRes.error;
      if (incRes.error) throw incRes.error;

      setEmpleados(empRes.data || []);
      setAsistencias(asistRes.data || []);
      setAsignaciones(asigRes.data || []);
      setIncidentes(incRes.data || []);

      const activos = empRes.data?.filter(e => e.estado === 'Activo') || [];
      const presentesHoy = asistRes.data?.filter(a => 
        a.fecha === new Date().toISOString().split('T')[0] && a.estado === 'Presente'
      ).length || 0;
      const planillaMensual = activos.reduce((s, e) => s + (e.salario || 0), 0);

      setDashboardData({
        totalEmpleados: activos.length,
        presentesHoy,
        planillaMensual,
        incidentesMes: incRes.data?.filter(i => i.fecha?.startsWith(new Date().toISOString().slice(0, 7))).length || 0
      });
    } catch (err) {
      console.error('Error cargando RRHH:', err);
      setError(traducirError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
  }, []);

  const addEmpleado = async (data) => {
    const errores = validarCamposRequeridos(data, [
      { nombre: 'nombre', etiqueta: 'Nombre del empleado' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nuevo, error } = await supabase
      .from('empleados')
      .insert([{ ...data, fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0], estado: data.estado || 'Activo' }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
    setEmpleados(prev => [...prev, nuevo]);
    return nuevo;
  };

  const registrarAsistencia = async (data) => {
    const errores = validarCamposRequeridos(data, [
      { nombre: 'empleado_id', etiqueta: 'Empleado' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nueva, error } = await supabase
      .from('asistencias')
      .insert([{ ...data, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
    setAsistencias(prev => [...prev, nueva]);
    return nueva;
  };

  const asignarAProyecto = async (data) => {
    const errores = validarCamposRequeridos(data, [
      { nombre: 'empleado_id', etiqueta: 'Empleado' },
      { nombre: 'proyecto_id', etiqueta: 'Proyecto' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nueva, error } = await supabase
      .from('asignaciones_proyecto')
      .insert([{ ...data, fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0], estado: data.estado || 'Activo' }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
    setAsignaciones(prev => [...prev, nueva]);
    return nueva;
  };

  const registrarIncidente = async (data) => {
    const errores = validarCamposRequeridos(data, [
      { nombre: 'empleado_id', etiqueta: 'Empleado' },
      { nombre: 'tipo', etiqueta: 'Tipo de incidente' },
    ]);
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    const { data: nuevo, error } = await supabase
      .from('incidentes_ssoma')
      .insert([{ ...data, fecha: data.fecha || new Date().toISOString().split('T')[0], fecha_reporte: data.fecha_reporte || new Date().toISOString().split('T')[0], estado: data.estado || 'Abierto' }])
      .select()
      .single();
    if (error) throw new Error(traducirError(error));
    setIncidentes(prev => [...prev, nuevo]);
    return nuevo;
  };

  return (
    <RRHHContext.Provider value={{ 
      empleados, asistencias, asignaciones, incidentes, dashboardData,
      loading, error,
      addEmpleado, registrarAsistencia, asignarAProyecto, registrarIncidente,
      refetch: fetchData 
    }}>
      {children}
    </RRHHContext.Provider>
  );
};

export default RRHHContext;
