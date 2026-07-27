import { useEffect, useMemo, useState } from 'react';
import useLogistica from './useLogistica';
import useRRHH from './useRRHH';
import { supabase } from '../lib/supabase';
import { traducirError } from '../lib/errores';
import { formatDateOnlyInAppTimeZone } from '../lib/dates';
import { useAuth } from '../context/auth/useAuth';

const ACTIVE_INVENTORY_STATES = ['asignado', 'devolucion_solicitada'];

const useProjectHerramientas = (proyectoId) => {
  const { activos, asignaciones: asignacionesActivos, loading: logisticaLoading } = useLogistica();
  const { empleados, asignaciones: asignacionesRRHH, loading: rrhhLoading } = useRRHH();
  const { user } = useAuth();
  const [inventarioObjetos, setInventarioObjetos] = useState([]);
  const [asignacionesInventario, setAsignacionesInventario] = useState([]);
  const [inventarioLoading, setInventarioLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        setInventarioLoading(true);
        setError(null);
        const [objetosRes, asignacionesRes] = await Promise.all([
          supabase.from('inventario_objetos').select('id,nombre,tipo_inventario,serial,proyecto_id'),
          supabase.from('asignaciones_inventario').select('*').order('created_at', { ascending: false })
        ]);

        if (objetosRes.error) throw objetosRes.error;
        if (asignacionesRes.error) throw asignacionesRes.error;

        setInventarioObjetos(objetosRes.data || []);
        setAsignacionesInventario(asignacionesRes.data || []);
      } catch (err) {
        console.error('Error cargando herramientas del proyecto:', err);
        setError(traducirError(err));
      } finally {
        setInventarioLoading(false);
      }
    };

    fetchInventario();
  }, []);

  const empleadosProyecto = useMemo(() => {
    if (!asignacionesRRHH || !proyectoId) return [];
    return asignacionesRRHH
      .filter(item => Number(item.proyecto_id) === Number(proyectoId) && item.estado === 'Activo')
      .map(item => Number(item.empleado_id));
  }, [asignacionesRRHH, proyectoId]);

  const herramientas = useMemo(() => {
    if (!proyectoId) return [];

    const activosAsignados = (asignacionesActivos || [])
      .filter(item => item.estado === 'Activa')
      .filter(item => (
        (item.tipo_asignacion === 'Proyecto' && Number(item.ref_id) === Number(proyectoId)) ||
        (item.tipo_asignacion === 'Empleado' && empleadosProyecto.includes(Number(item.ref_id)))
      ))
      .map(item => {
        const activo = activos.find(act => Number(act.id) === Number(item.activo_id));
        const empleado = item.tipo_asignacion === 'Empleado'
          ? empleados.find(emp => Number(emp.id) === Number(item.ref_id))
          : null;

        return {
          id: `activo-${item.id}`,
          nombre: activo?.nombre || 'Activo no disponible',
          tipo: activo?.tipo || 'Activo',
          destino: empleado?.nombre || 'Proyecto',
          cantidad: 1,
          fecha: item.fecha_asignacion,
          estado: item.estado,
          origen: 'Activo'
        };
      });

    const inventarioAsignado = (asignacionesInventario || [])
      .filter(item => ACTIVE_INVENTORY_STATES.includes((item.estado || '').toLowerCase()))
      .filter(item => (
        Number(item.proyecto_id) === Number(proyectoId) ||
        empleadosProyecto.includes(Number(item.empleado_id))
      ))
      .map(item => {
        const objeto = inventarioObjetos.find(obj => Number(obj.id) === Number(item.inventario_objeto_id));
        const empleado = empleados.find(emp => Number(emp.id) === Number(item.empleado_id));

        return {
          id: `inventario-${item.id}`,
          nombre: objeto?.nombre || 'Objeto no disponible',
          tipo: objeto?.tipo_inventario || 'Inventario',
          destino: empleado?.nombre || 'Proyecto',
          cantidad: Number(item.cantidad || 0),
          fecha: item.fecha_asignacion || item.created_at,
          estado: item.estado,
          origen: 'Inventario'
        };
      });

    return [...inventarioAsignado, ...activosAsignados]
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  }, [
    activos,
    asignacionesActivos,
    asignacionesInventario,
    empleados,
    empleadosProyecto,
    inventarioObjetos,
    proyectoId
  ]);

  const solicitarDevolucion = async (asignacionId) => {
    const { error: requestError } = await supabase.from('asignaciones_inventario')
      .update({ estado: 'devolucion_solicitada', fecha_devolucion: new Date().toISOString().slice(0, 10) })
      .eq('id', asignacionId);
    if (requestError) throw new Error(traducirError(requestError));
    setAsignacionesInventario((prev) => prev.map((item) => item.id === asignacionId ? { ...item, estado: 'devolucion_solicitada' } : item));
  };

  return {
    herramientas: herramientas.map(item => ({
      ...item,
      fechaMostrar: formatDateOnlyInAppTimeZone(item.fecha)
    })),
    loading: logisticaLoading || rrhhLoading || inventarioLoading,
    error,
    solicitarDevolucion
  };
};

export default useProjectHerramientas;
