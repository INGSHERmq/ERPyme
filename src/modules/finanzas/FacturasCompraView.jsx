import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useProjects from '../../hooks/useProjects';

const getToday = () => new Date().toISOString().split('T')[0];
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FacturasCompraView = () => {
  const { user, membership, profile } = useAuth();
  const { proyectos } = useProjects();
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [rows, setRows] = useState([]);
  const [payingId, setPayingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    orden_compra_id: '',
    proveedor_id: '',
    proyecto_id: '',
    fecha_emision: getToday(),
    fecha_vencimiento: '',
    total: '0'
  });

  const fetchData = async () => {
    if (!user?.id) return;
    const [ocRes, prRes, fvRes] = await Promise.all([
      supabase.from('ordenes_compra').select('id,numero,nombre_compra,proveedor_id,proyecto_id,fecha_vencimiento,estado').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('proveedores').select('id,nombre').eq('user_id', user.id).order('nombre'),
      supabase.from('facturas_compra').select('*').order('created_at', { ascending: false })
    ]);
    setOrdenes(ocRes.data || []);
    setProveedores(prRes.data || []);
    setRows(fvRes.data || []);
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePagar = async (row) => {
    setPayingId(row.id);
    const { error: facturaError } = await supabase
      .from('facturas_compra')
      .update({ estado: 'pagada' })
      .eq('id', row.id);

    if (facturaError) {
      setPayingId(null);
      alert(facturaError.message || 'No se pudo marcar como pagada');
      return;
    }

    if (row.orden_compra_id) {
      const { error: materialError } = await supabase
        .from('logistica_materiales')
        .update({ estado: 'aceptada' })
        .eq('orden_compra_id', row.orden_compra_id)
        .eq('estado', 'pendiente_contabilidad');
      if (materialError) {
        setPayingId(null);
        alert(materialError.message || 'Se pago, pero no se pudo enviar a Materiales');
        return;
      }
      await supabase.from('ordenes_compra').update({ estado: 'Pagado' }).eq('id', row.orden_compra_id);
    }

    setPayingId(null);
    await fetchData();
  };

  const handleCancelar = async (row) => {
    if (!window.confirm('¿Anular esta factura? La orden de compra también se marcará como anulada.')) return;
    
    setPayingId(row.id);
    const { error: facturaError } = await supabase
      .from('facturas_compra')
      .update({ estado: 'anulada' })
      .eq('id', row.id);

    if (facturaError) {
      setPayingId(null);
      alert(facturaError.message || 'No se pudo cancelar');
      return;
    }

    if (row.orden_compra_id) {
      await supabase.from('ordenes_compra').update({ estado: 'Anulado' }).eq('id', row.orden_compra_id);
      await supabase.from('logistica_materiales').update({ estado: 'anulado' }).eq('orden_compra_id', row.orden_compra_id);
    }

    setPayingId(null);
    await fetchData();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { error } = await supabase.from('facturas_compra').insert([{
      numero: formData.numero,
      orden_compra_id: formData.orden_compra_id ? Number(formData.orden_compra_id) : null,
      proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
      proyecto_id: formData.proyecto_id ? Number(formData.proyecto_id) : null,
      empresa_id: membership?.empresa_id || profile?.empresa_actual_id,
      fecha_emision: formData.fecha_emision,
      fecha_vencimiento: formData.fecha_vencimiento || null,
      total: Number(formData.total || 0)
    }]);
    if (error) {
      alert(error.message || 'No se pudo registrar');
      return;
    }
    setFormData({ numero: '', orden_compra_id: '', proveedor_id: '', proyecto_id: '', fecha_emision: getToday(), fecha_vencimiento: '', total: '0' });
    setShowForm(false);
    await fetchData();
  };

  return (
    <div className="finanzas-view">
      <div className="view-header">
        <h2>Facturas de compra</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="fc-numero">Número de factura</label>
            <input id="fc-numero" placeholder="Número factura" required value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fc-orden">Orden de compra</label>
            <select id="fc-orden" value={formData.orden_compra_id} onChange={(e) => {
              const ordenId = e.target.value;
              const oc = ordenes.find((item) => String(item.id) === String(ordenId));
              setFormData((p) => ({
                ...p,
                orden_compra_id: ordenId,
                proveedor_id: oc?.proveedor_id ? String(oc.proveedor_id) : '',
                proyecto_id: oc?.proyecto_id ? String(oc.proyecto_id) : p.proyecto_id,
                fecha_vencimiento: oc?.fecha_vencimiento || p.fecha_vencimiento
              }));
            }}>
              <option value="">Seleccionar orden</option>
              {ordenes.map((oc) => <option key={oc.id} value={oc.id}>{oc.numero} - {oc.nombre_compra}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fc-proveedor">Proveedor</label>
            <select id="fc-proveedor" value={formData.proveedor_id} onChange={(e) => setFormData((p) => ({ ...p, proveedor_id: e.target.value }))}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((prov) => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fc-fecha">Fecha de emisión</label>
            <input id="fc-fecha" type="date" required value={formData.fecha_emision} onChange={(e) => setFormData((p) => ({ ...p, fecha_emision: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fc-proyecto">Proyecto</label>
            <select id="fc-proyecto" value={formData.proyecto_id} onChange={(e) => setFormData((p) => ({ ...p, proyecto_id: e.target.value }))}>
              <option value="">Sin proyecto</option>
              {proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre_mostrar || proyecto.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fc-vencimiento">Fecha vencimiento</label>
            <input id="fc-vencimiento" type="datetime-local" value={formData.fecha_vencimiento} onChange={(e) => setFormData((p) => ({ ...p, fecha_vencimiento: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fc-total">Total</label>
            <input id="fc-total" type="number" min="0" step="0.01" required placeholder="Total" value={formData.total} onChange={(e) => setFormData((p) => ({ ...p, total: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Orden compra</th>
              <th>Proveedor</th>
              <th>Proyecto</th>
              <th>Estado orden</th>
              <th>Estado factura</th>
              <th>Fecha emisión</th>
              <th>Vencimiento</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="cell-bold">{row.numero}</td>
                <td>{ordenes.find((oc) => oc.id === row.orden_compra_id)?.numero || '-'}</td>
                <td>{proveedores.find((p) => p.id === row.proveedor_id)?.nombre || '-'}</td>
                <td>{proyectos.find((p) => Number(p.id) === Number(row.proyecto_id))?.nombre_mostrar || proyectos.find((p) => Number(p.id) === Number(row.proyecto_id))?.nombre || '-'}</td>
                <td>{ordenes.find((oc) => oc.id === row.orden_compra_id)?.estado || '-'}</td>
                <td>{row.estado === 'registrada' ? 'en proceso' : row.estado}</td>
                <td>{row.fecha_emision}</td>
                <td>{formatDateTime(row.fecha_vencimiento)}</td>
                <td>S/ {Number(row.total || 0).toLocaleString()}</td>
                <td>
                  {row.estado === 'pagada' ? (
                    <span className="badge badge-green">Pagada</span>
                  ) : row.estado === 'anulada' ? (
                    <span className="badge badge-red" style={{ color: 'red' }}>Anulada</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-action btn-cobrar"
                        disabled={payingId === row.id}
                        onClick={() => handlePagar(row)}
                      >
                        {payingId === row.id ? 'Pagando...' : 'Pagar'}
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-eliminar"
                        style={{ backgroundColor: '#ff4444', color: 'white' }}
                        disabled={payingId === row.id}
                        onClick={() => handleCancelar(row)}
                      >
                        Anular
                      </button>
                    </div>
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

export default FacturasCompraView;
