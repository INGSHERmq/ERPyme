import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const getToday = () => new Date().toISOString().split('T')[0];

const FacturasCompraView = () => {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [rows, setRows] = useState([]);
  const [payingId, setPayingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    orden_compra_id: '',
    proveedor_id: '',
    fecha_emision: getToday(),
    total: '0'
  });

  const fetchData = async () => {
    if (!user?.id) return;
    const [ocRes, prRes, fvRes] = await Promise.all([
      supabase.from('ordenes_compra').select('id,numero,nombre_compra,proveedor_id,estado').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('proveedores').select('id,nombre').eq('user_id', user.id).order('nombre'),
      supabase.from('facturas_compra').select('*').order('created_at', { ascending: false })
    ]);
    setOrdenes(ocRes.data || []);
    setProveedores(prRes.data || []);
    setRows(fvRes.data || []);
  };

  useEffect(() => {
    fetchData();
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
    }

    setPayingId(null);
    await fetchData();
  };

  const handleCancelar = async (row) => {
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
      await supabase.from('ordenes_compra').update({ estado: 'Cancelada' }).eq('id', row.orden_compra_id);
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
      fecha_emision: formData.fecha_emision,
      total: Number(formData.total || 0)
    }]);
    if (error) {
      alert(error.message || 'No se pudo registrar');
      return;
    }
    setFormData({ numero: '', orden_compra_id: '', proveedor_id: '', fecha_emision: getToday(), total: '0' });
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
            <label htmlFor="fc-numero">Numero de factura</label>
            <input id="fc-numero" placeholder="Numero factura" required value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fc-orden">Orden de compra</label>
            <select id="fc-orden" value={formData.orden_compra_id} onChange={(e) => {
              const ordenId = e.target.value;
              const oc = ordenes.find((item) => String(item.id) === String(ordenId));
              setFormData((p) => ({ ...p, orden_compra_id: ordenId, proveedor_id: oc?.proveedor_id ? String(oc.proveedor_id) : '' }));
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
            <label htmlFor="fc-fecha">Fecha de emision</label>
            <input id="fc-fecha" type="date" required value={formData.fecha_emision} onChange={(e) => setFormData((p) => ({ ...p, fecha_emision: e.target.value }))} />
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
              <th>Numero</th>
              <th>Orden compra</th>
              <th>Proveedor</th>
              <th>Estado orden</th>
              <th>Estado factura</th>
              <th>Fecha emision</th>
              <th>Total</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="cell-bold">{row.numero}</td>
                <td>{ordenes.find((oc) => oc.id === row.orden_compra_id)?.numero || '-'}</td>
                <td>{proveedores.find((p) => p.id === row.proveedor_id)?.nombre || '-'}</td>
                <td>{ordenes.find((oc) => oc.id === row.orden_compra_id)?.estado || '-'}</td>
                <td>{row.estado === 'registrada' ? 'en proceso' : row.estado}</td>
                <td>{row.fecha_emision}</td>
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
