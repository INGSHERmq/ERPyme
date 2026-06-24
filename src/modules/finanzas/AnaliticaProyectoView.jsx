import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const AnaliticaProyectoView = () => {
  const { user, membership, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildRowsFromTables = async () => {
    const empresaId = membership?.empresa_id || profile?.empresa_actual_id;
    const [projectsRes, ingresosRes, egresosRes, ordenesRes, inventarioRes, mantenimientoObjetosRes, mantenimientosRes] = await Promise.all([
      supabase.from('v_proyectos_completos').select('id,nombre').eq('user_id', user.id),
      supabase.from('ingresos').select('proyecto_id,monto,estado').eq('user_id', user.id),
      supabase.from('egresos').select('proyecto_id,monto').eq('user_id', user.id),
      empresaId
        ? supabase.from('ordenes_compra').select('proyecto_id,total,estado').eq('empresa_id', empresaId)
        : supabase.from('ordenes_compra').select('proyecto_id,total,estado').eq('user_id', user.id),
      empresaId
        ? supabase.from('inventario_objetos').select('id,proyecto_id').eq('empresa_id', empresaId)
        : Promise.resolve({ data: [], error: null }),
      empresaId
        ? supabase.from('mantenimiento_objetos').select('inventario_objeto_id,costo,estado').eq('empresa_id', empresaId)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('mantenimientos').select('activo_id,costo,estado').eq('user_id', user.id)
    ]);

    const firstError = [projectsRes, ingresosRes, egresosRes, ordenesRes, inventarioRes, mantenimientoObjetosRes, mantenimientosRes].find((result) => result.error);
    if (firstError?.error) throw firstError.error;

    const inventarioProyectoPorId = new Map((inventarioRes.data || []).map((item) => [Number(item.id), item.proyecto_id]));

    return (projectsRes.data || []).map((proyecto) => {
      const ingresosCobrados = (ingresosRes.data || [])
        .filter((item) => Number(item.proyecto_id) === Number(proyecto.id) && item.estado === 'Cobrado')
        .reduce((sum, item) => sum + Number(item.monto || 0), 0);
      const gastos = (egresosRes.data || [])
        .filter((item) => Number(item.proyecto_id) === Number(proyecto.id))
        .reduce((sum, item) => sum + Number(item.monto || 0), 0);
      const compras = (ordenesRes.data || [])
        .filter((item) => (
          Number(item.proyecto_id) === Number(proyecto.id)
          && !['Anulado', 'Cancelada'].includes(item.estado)
        ))
        .reduce((sum, item) => sum + Number(item.total || 0), 0);
      const mantenimientoObjetos = (mantenimientoObjetosRes.data || [])
        .filter((item) => (
          Number(inventarioProyectoPorId.get(Number(item.inventario_objeto_id))) === Number(proyecto.id)
          && item.estado !== 'cancelado'
        ))
        .reduce((sum, item) => sum + Number(item.costo || 0), 0);
      const mantenimientosActivos = (mantenimientosRes.data || [])
        .filter((item) => Number(inventarioProyectoPorId.get(Number(item.activo_id))) === Number(proyecto.id))
        .reduce((sum, item) => sum + Number(item.costo || 0), 0);
      const egresos = gastos + compras + mantenimientoObjetos + mantenimientosActivos;

      return {
        proyecto_id: proyecto.id,
        proyecto_nombre: proyecto.nombre,
        ingresos_cobrados: ingresosCobrados,
        egresos,
        utilidad: ingresosCobrados - egresos
      };
    });
  };

  const fetchData = async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await buildRowsFromTables());
    } catch (err) {
      console.error('Error cargando analítica por proyecto:', err);
      setError(err.message || 'No se pudo cargar la analítica');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) return <div className="loading">Cargando analítica...</div>;
  if (error) return <div className="empty-state">No se pudo cargar analítica: {error}</div>;

  return (
    <div className="finanzas-view">
      <div className="view-header">
        <h2>Analítica por proyecto</h2>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Ingresos cobrados</th>
              <th>Egresos</th>
              <th>Utilidad/Pérdida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.proyecto_id}>
                <td className="cell-bold">{r.proyecto_nombre}</td>
                <td>S/ {Number(r.ingresos_cobrados || 0).toLocaleString()}</td>
                <td>S/ {Number(r.egresos || 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${Number(r.utilidad || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>
                    S/ {Number(r.utilidad || 0).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnaliticaProyectoView;
