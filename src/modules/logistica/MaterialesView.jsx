import { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useProjects from '../../hooks/useProjects';
import { uploadPrivateFile } from '../../lib/storage';

const MaterialesView = () => {
  const { user, membership, profile } = useAuth();
  const { proyectos } = useProjects();
  const [rows, setRows] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState(null);
  const [evidencias, setEvidencias] = useState({});

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const empresaId = membership?.empresa_id || profile?.empresa_actual_id;
    const materialesQuery = supabase
      .from('logistica_materiales')
      .select('*')
      .neq('estado', 'anulado')
      .order('created_at', { ascending: false });
    const ordenesQuery = supabase
      .from('ordenes_compra')
      .select('id,numero,proyecto_id,estado');

    const [{ data }, ordenesRes] = await Promise.all([
      empresaId ? materialesQuery.eq('empresa_id', empresaId) : materialesQuery,
      empresaId ? ordenesQuery.eq('empresa_id', empresaId) : ordenesQuery.eq('user_id', user.id)
    ]);
    const ordenesActivas = (ordenesRes.data || []).filter((orden) => !['Anulado', 'Cancelada'].includes(orden.estado));
    const ordenesActivasIds = new Set(ordenesActivas.map((orden) => Number(orden.id)));
    setRows((data || []).filter((row) => ordenesActivasIds.has(Number(row.orden_compra_id))));
    setOrdenes(ordenesActivas);
    setLoading(false);
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRecibido = async (row) => {
    setReceivingId(row.id);
    let evidencia_recepcion_path = row.evidencia_recepcion_path || null;
    const file = evidencias[row.id];
    if (file) {
      try {
        evidencia_recepcion_path = (await uploadPrivateFile({ file, folder: 'evidencias-recepcion-material', userId: user?.id })).publicUrl;
      } catch (error) {
        setReceivingId(null);
        alert(error.message || 'No se pudo subir la evidencia de recepción');
        return;
      }
    }

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
        recepcionado_at: new Date().toISOString(),
        evidencia_recepcion_path
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
      <DataTable
        data={rows}
        searchKeys={['descripcion', 'estado']}
        searchPlaceholder="Buscar por descripción o estado..."
        pageSize={10}
        columns={['Orden compra', 'Descripcion', 'Proyecto', 'Cantidad', 'Costo unitario', 'Estado', 'Evidencia', 'Accion']}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{row.orden_compra_id}</td>
            <td className="cell-bold">{row.descripcion}</td>
            <td>{proyectos.find((p) => Number(p.id) === Number(row.proyecto_id || ordenes.find((orden) => orden.id === row.orden_compra_id)?.proyecto_id))?.nombre_mostrar || proyectos.find((p) => Number(p.id) === Number(row.proyecto_id || ordenes.find((orden) => orden.id === row.orden_compra_id)?.proyecto_id))?.nombre || '-'}</td>
            <td>{row.cantidad}</td>
            <td>S/ {Number(row.costo_unitario || 0).toLocaleString('en-US')}</td>
            <td>{row.estado}</td>
            <td>
              {row.evidencia_recepcion_path ? <a href={row.evidencia_recepcion_path} target="_blank" rel="noreferrer">Ver evidencia</a> : row.estado === 'aceptada' && (
                <input type="file" accept="image/*,.pdf" onChange={(e) => setEvidencias((prev) => ({ ...prev, [row.id]: e.target.files?.[0] }))} />
              )}
            </td>
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
        )}
      />
    </div>
  );
};

export default MaterialesView;
