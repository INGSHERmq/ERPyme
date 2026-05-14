import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useProjects from '../../hooks/useProjects';

const MaterialesView = () => {
  const { user, membership, profile } = useAuth();
  const { proyectos } = useProjects();
  const [rows, setRows] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data }, ordenesRes] = await Promise.all([
      supabase
      .from('logistica_materiales')
      .select('*')
      .order('created_at', { ascending: false }),
      supabase.from('ordenes_compra').select('id,numero,proyecto_id').eq('user_id', user.id)
    ]);
    setRows(data || []);
    setOrdenes(ordenesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRecibido = async (row) => {
    setReceivingId(row.id);

    const cantidad = Number(row.cantidad || 0);
    const costoUnitario = Number(row.costo_unitario || 0);
    const proyectoId = row.proyecto_id || ordenes.find((orden) => orden.id === row.orden_compra_id)?.proyecto_id || null;

    let inventarioQuery = supabase
      .from('inventario_objetos')
      .select('id,stock_actual')
      .eq('nombre', row.descripcion)
      .eq('tipo_inventario', 'consumible')
      .limit(1);

    inventarioQuery = proyectoId ? inventarioQuery.eq('proyecto_id', proyectoId) : inventarioQuery.is('proyecto_id', null);
    const { data: existente, error: existenteError } = await inventarioQuery.maybeSingle();

    if (existenteError) {
      setReceivingId(null);
      alert(existenteError.message || 'No se pudo validar inventario');
      return;
    }

    if (existente?.id) {
      const { error: updateInvError } = await supabase
        .from('inventario_objetos')
        .update({
          stock_actual: Number(existente.stock_actual || 0) + cantidad,
          costo_unitario: costoUnitario,
          proyecto_id: proyectoId
        })
        .eq('id', existente.id);
      if (updateInvError) {
        setReceivingId(null);
        alert(updateInvError.message || 'No se pudo actualizar inventario');
        return;
      }
    } else {
      const { error: insertInvError } = await supabase
        .from('inventario_objetos')
        .insert([{
          empresa_id: membership?.empresa_id || profile?.empresa_actual_id,
          codigo: `MAT-${row.id}`,
          nombre: row.descripcion,
          proyecto_id: proyectoId,
          tipo_inventario: 'consumible',
          stock_actual: cantidad,
          costo_unitario: costoUnitario
        }]);
      if (insertInvError) {
        setReceivingId(null);
        alert(insertInvError.message || 'No se pudo registrar en inventario');
        return;
      }
    }

    const { error: matError } = await supabase
      .from('logistica_materiales')
      .update({
        estado: 'ingresado_inventario',
        recepcionado_at: new Date().toISOString()
      })
      .eq('id', row.id);
    setReceivingId(null);

    if (matError) {
      alert(matError.message || 'Se ingreso inventario, pero no se actualizo material');
      return;
    }

    await fetchData();
  };

  if (loading) return <div className="loading">Cargando materiales...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Materiales (en espera de aprobacion)</h2>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Orden compra</th>
              <th>Descripcion</th>
              <th>Proyecto</th>
              <th>Cantidad</th>
              <th>Costo unitario</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.orden_compra_id}</td>
                <td className="cell-bold">{row.descripcion}</td>
                <td>{proyectos.find((p) => Number(p.id) === Number(row.proyecto_id || ordenes.find((orden) => orden.id === row.orden_compra_id)?.proyecto_id))?.nombre_mostrar || proyectos.find((p) => Number(p.id) === Number(row.proyecto_id || ordenes.find((orden) => orden.id === row.orden_compra_id)?.proyecto_id))?.nombre || '-'}</td>
                <td>{row.cantidad}</td>
                <td>S/ {Number(row.costo_unitario || 0).toLocaleString()}</td>
                <td>{row.estado}</td>
                <td>
                  {row.estado === 'aceptada' ? (
                    <button
                      type="button"
                      className="btn-action btn-cobrar"
                      disabled={receivingId === row.id}
                      onClick={() => handleRecibido(row)}
                    >
                      {receivingId === row.id ? 'Recibiendo...' : 'Recibido'}
                    </button>
                  ) : row.estado === 'ingresado_inventario' ? (
                    <span className="badge badge-green">Ingresado</span>
                  ) : (
                    <span className="badge badge-gray">Pendiente pago</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialesView;
