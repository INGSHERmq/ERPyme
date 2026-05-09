import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const getToday = () => new Date().toISOString().split('T')[0];

const OrdenesCompraView = () => {
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [materialesPorOrden, setMaterialesPorOrden] = useState({});
  const [facturasPorOrden, setFacturasPorOrden] = useState({});
  const [enviandoOrdenId, setEnviandoOrdenId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    nombre_compra: '',
    proveedor_id: '',
    fecha: getToday(),
    cantidad: '1',
    costo_unitario: '0'
  });

  const fetchData = async () => {
    if (!user?.id) return;
    const [provRes, ordenRes, materialesRes, facturasRes] = await Promise.all([
      supabase.from('proveedores').select('id,nombre').eq('user_id', user.id).order('nombre'),
      supabase.from('ordenes_compra').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('logistica_materiales').select('orden_compra_id,cantidad,costo_unitario').order('created_at', { ascending: false }),
      supabase.from('facturas_compra').select('id,orden_compra_id,numero,estado,total').order('created_at', { ascending: false })
    ]);
    setProveedores(provRes.data || []);
    setOrdenes(ordenRes.data || []);
    const mapaMateriales = (materialesRes.data || []).reduce((acc, item) => {
      if (!item.orden_compra_id || acc[item.orden_compra_id]) return acc;
      acc[item.orden_compra_id] = item;
      return acc;
    }, {});
    setMaterialesPorOrden(mapaMateriales);
    const mapaFacturas = (facturasRes.data || []).reduce((acc, item) => {
      if (!item.orden_compra_id || acc[item.orden_compra_id]) return acc;
      acc[item.orden_compra_id] = item;
      return acc;
    }, {});
    setFacturasPorOrden(mapaFacturas);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const total = Number(formData.cantidad || 0) * Number(formData.costo_unitario || 0);

    const { data: orden, error: ordenError } = await supabase.from('ordenes_compra').insert([{
      numero: formData.numero,
      nombre_compra: formData.nombre_compra,
      proveedor_id: Number(formData.proveedor_id),
      fecha: formData.fecha,
      subtotal: total,
      total
    }]).select().single();

    if (ordenError) {
      alert(ordenError.message || 'No se pudo crear la orden');
      return;
    }

    const { error: materialError } = await supabase.from('logistica_materiales').insert([{
      orden_compra_id: orden.id,
      descripcion: formData.nombre_compra,
      cantidad: Number(formData.cantidad || 0),
      costo_unitario: Number(formData.costo_unitario || 0),
      estado: 'pendiente_contabilidad'
    }]);

    if (materialError) {
      alert(materialError.message || 'Se creo la orden, pero fallo el material');
    }

    setFormData({ numero: '', nombre_compra: '', proveedor_id: '', fecha: getToday(), cantidad: '1', costo_unitario: '0' });
    setShowForm(false);
    await fetchData();
  };

  const handleEstadoChange = async (ordenId, estado) => {
    const { error } = await supabase.from('ordenes_compra').update({ estado }).eq('id', ordenId).eq('user_id', user?.id);
    if (error) {
      alert(error.message || 'No se pudo actualizar el estado');
      return;
    }
    setOrdenes((prev) => prev.map((orden) => (orden.id === ordenId ? { ...orden, estado } : orden)));
  };

  const handleEnviarContabilidad = async (orden) => {
    const material = materialesPorOrden[orden.id];
    if (!material) {
      alert('Esta orden no tiene cantidad/costo de material para enviar.');
      return;
    }
    if (facturasPorOrden[orden.id]) {
      alert('Esta orden ya fue enviada a contabilidad.');
      return;
    }

    const cantidad = Number(material.cantidad || 0);
    const costoUnitario = Number(material.costo_unitario || 0);
    const total = Number((cantidad * costoUnitario).toFixed(2));
    const numeroFactura = `FC-OC-${orden.id}`;

    setEnviandoOrdenId(orden.id);
    const { error } = await supabase.from('facturas_compra').insert([{
      orden_compra_id: orden.id,
      proveedor_id: orden.proveedor_id || null,
      numero: numeroFactura,
      fecha_emision: orden.fecha || getToday(),
      total,
      estado: 'registrada'
    }]);
    setEnviandoOrdenId(null);

    if (error) {
      alert(error.message || 'No se pudo enviar la orden a contabilidad');
      return;
    }

    // Automatically update the order status to 'Enviada'
    await supabase.from('ordenes_compra').update({ estado: 'Enviada' }).eq('id', orden.id);

    alert('Orden enviada a contabilidad. Ya aparece en Facturas de compra.');
    await fetchData();
  };

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Ordenes de compra</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva orden'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="oc-numero">Numero de orden</label>
            <input id="oc-numero" placeholder="Numero" required value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-compra">Que se compra</label>
            <input id="oc-compra" placeholder="Que se compra" required value={formData.nombre_compra} onChange={(e) => setFormData((p) => ({ ...p, nombre_compra: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-proveedor">Proveedor</label>
            <select id="oc-proveedor" required value={formData.proveedor_id} onChange={(e) => setFormData((p) => ({ ...p, proveedor_id: e.target.value }))}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((prov) => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="oc-fecha">Fecha</label>
            <input id="oc-fecha" type="date" required value={formData.fecha} onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-cantidad">Cantidad</label>
            <input id="oc-cantidad" type="number" min="1" required placeholder="Cantidad" value={formData.cantidad} onChange={(e) => setFormData((p) => ({ ...p, cantidad: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-costo-unitario">Costo unitario</label>
            <input id="oc-costo-unitario" type="number" min="0" step="0.01" required placeholder="Costo unitario" value={formData.costo_unitario} onChange={(e) => setFormData((p) => ({ ...p, costo_unitario: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary">Guardar orden</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Compra</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Cantidad</th>
              <th>Costo unitario</th>
              <th>Estado</th>
              <th>Contabilidad</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id}>
                <td>{orden.numero}</td>
                <td>{orden.nombre_compra}</td>
                <td>{proveedores.find((p) => p.id === orden.proveedor_id)?.nombre || '-'}</td>
                <td>{orden.fecha}</td>
                <td>{materialesPorOrden[orden.id]?.cantidad ?? '-'}</td>
                <td>S/ {Number(materialesPorOrden[orden.id]?.costo_unitario || 0).toLocaleString()}</td>
                <td>
                  <select 
                    value={orden.estado || 'Borrador'} 
                    onChange={(event) => handleEstadoChange(orden.id, event.target.value)}
                    style={orden.estado === 'Cancelada' ? { color: 'red', fontWeight: 'bold' } : {}}
                  >
                    <option value="Borrador">Borrador</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </td>
                <td>
                  {facturasPorOrden[orden.id] ? (
                    <span className="badge badge-green">Enviada</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-action btn-cobrar"
                      disabled={enviandoOrdenId === orden.id}
                      onClick={() => handleEnviarContabilidad(orden)}
                    >
                      {enviandoOrdenId === orden.id ? 'Enviando...' : 'Enviar a contabilidad'}
                    </button>
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

export default OrdenesCompraView;
