import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useProjects from '../../hooks/useProjects';
import {
  datetimeLocalToAppIso,
  formatDateTimeInAppTimeZone,
  getTodayInAppTimeZone
} from '../../lib/dates';

const OrdenesCompraView = () => {
  const { user, membership, profile } = useAuth();
  const { proyectos } = useProjects();
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [materialesPorOrden, setMaterialesPorOrden] = useState({});
  const [facturasPorOrden, setFacturasPorOrden] = useState({});
  const [enviandoOrdenId, setEnviandoOrdenId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo_comprobante: '01',
    serie: '',
    correlativo: '',
    nombre_compra: '',
    proveedor_id: '',
    proyecto_id: '',
    fecha: getTodayInAppTimeZone(),
    fecha_vencimiento: '',
    cantidad: '1',
    costo_unitario: '0'
  });
  const convertingOrden = null;
  const conversionData = { tipo_comprobante: '01', serie: '', correlativo: '' };
  const setConvertingOrden = () => {};
  const setConversionData = () => {};

  const fetchData = async () => {
    if (!user?.id) return;
    const [provRes, ordenRes, materialesRes, facturasRes] = await Promise.all([
      supabase.from('proveedores').select('id,nombre,ruc').eq('user_id', user.id).order('nombre'),
      supabase.from('ordenes_compra').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('logistica_materiales').select('orden_compra_id,cantidad,costo_unitario,proyecto_id').order('created_at', { ascending: false }),
      supabase.from('facturas_compra').select('id,orden_compra_id,numero,estado,total').eq('empresa_id', membership?.empresa_id || profile?.empresa_actual_id).order('created_at', { ascending: false })
    ]);
    setProveedores(provRes.data || []);
    
    const ordenesData = ordenRes.data || [];
    const facturasData = facturasRes.data || [];
    
    const ordenesSync = ordenesData.map(orden => {
      const factura = facturasData.find(f => f.orden_compra_id === orden.id);
      if (factura) {
        if (factura.estado === 'pagada') {
          return { ...orden, estado: 'Pagado' };
        } else if (factura.estado === 'anulada') {
          return { ...orden, estado: 'Anulado' };
        } else if (orden.estado === 'Borrador') {
          return { ...orden, estado: 'Enviada' };
        }
      }
      return orden;
    });
    
    setOrdenes(ordenesSync);
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
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const total = Number(formData.cantidad || 0) * Number(formData.costo_unitario || 0);
    const empresaId = membership?.empresa_id || profile?.empresa_actual_id;
    const cleanSerie = formData.serie.toUpperCase().trim();
    const cleanCorrelativo = formData.correlativo.trim();
    const numeroOrden = `${cleanSerie}-${cleanCorrelativo}`;

    const { data: orden, error: ordenError } = await supabase.from('ordenes_compra').insert([{
      user_id: user?.id,
      empresa_id: empresaId,
      numero: numeroOrden,
      nombre_compra: formData.nombre_compra,
      proveedor_id: Number(formData.proveedor_id),
      proyecto_id: formData.proyecto_id ? Number(formData.proyecto_id) : null,
      fecha: formData.fecha,
      fecha_vencimiento: datetimeLocalToAppIso(formData.fecha_vencimiento),
      subtotal: total,
      total,
      tipo_comprobante: formData.tipo_comprobante,
      serie: cleanSerie,
      correlativo: cleanCorrelativo
    }]).select().single();

    if (ordenError) {
      alert(ordenError.message || 'No se pudo crear la orden');
      return;
    }

    const { error: materialError } = await supabase.from('logistica_materiales').insert([{
      empresa_id: empresaId,
      orden_compra_id: orden.id,
      proyecto_id: formData.proyecto_id ? Number(formData.proyecto_id) : null,
      descripcion: formData.nombre_compra,
      cantidad: Number(formData.cantidad || 0),
      costo_unitario: Number(formData.costo_unitario || 0),
      estado: 'pendiente_contabilidad'
    }]);

    if (materialError) {
      alert(materialError.message || 'Se creó la orden, pero falló el registro del material');
    }

    setFormData({ tipo_comprobante: '01', serie: '', correlativo: '', nombre_compra: '', proveedor_id: '', proyecto_id: '', fecha: getTodayInAppTimeZone(), fecha_vencimiento: '', cantidad: '1', costo_unitario: '0' });
    setShowForm(false);
    await fetchData();
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
    if (['Anulado', 'Cancelada'].includes(orden.estado)) {
      alert('No se puede enviar una orden anulada o cancelada.');
      return;
    }
    const cantidad = Number(material?.cantidad || 0);
    const costoUnitario = Number(material?.costo_unitario || 0);
    const total = Number((cantidad * costoUnitario).toFixed(2));

    const cleanSerie = String(orden.serie || '').toUpperCase().trim();
    const cleanCorrelativo = String(orden.correlativo || '').trim();
    const numeroFactura = `${cleanSerie}-${cleanCorrelativo}`;

    setEnviandoOrdenId(orden.id);
    const { error } = await supabase.from('facturas_compra').insert([{
      empresa_id: membership?.empresa_id || profile?.empresa_actual_id,
      orden_compra_id: orden.id,
      proveedor_id: orden.proveedor_id || null,
      proyecto_id: orden.proyecto_id || null,
      numero: numeroFactura,
      serie: cleanSerie,
      correlativo: cleanCorrelativo,
      tipo_comprobante: orden.tipo_comprobante || '01',
      fecha_emision: orden.fecha || getTodayInAppTimeZone(),
      fecha_vencimiento: orden.fecha_vencimiento || null,
      total,
      estado: 'registrada'
    }]);

    if (error) {
      setEnviandoOrdenId(null);
      alert(error.message || 'No se pudo enviar la orden a contabilidad');
      return;
    }

    // Automatically update the order status to 'Enviada'
    await supabase.from('ordenes_compra').update({ estado: 'Enviada' }).eq('id', orden.id);

    setEnviandoOrdenId(null);
    alert('Orden enviada a contabilidad. Ya aparece en Facturas de compra.');
    await fetchData();
  };

  const handleConfirmarFactura = (event) => {
    event.preventDefault();
  };

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Órdenes de compra</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva orden'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="oc-tipo">Tipo Comprobante</label>
            <select id="oc-tipo" value={formData.tipo_comprobante} onChange={(e) => setFormData((p) => ({ ...p, tipo_comprobante: e.target.value }))}>
              <option value="01">01 - Factura</option>
              <option value="03">03 - Boleta de Venta</option>
              <option value="07">07 - Nota de Crédito</option>
              <option value="08">08 - Nota de Débito</option>
              <option value="R1">R1 - Recibo por Honorarios</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="oc-serie">Serie</label>
            <input id="oc-serie" placeholder="F001" required value={formData.serie} onChange={(e) => setFormData((p) => ({ ...p, serie: e.target.value }))} className="uppercase" />
          </div>
          <div className="form-field">
            <label htmlFor="oc-correlativo">Correlativo</label>
            <input id="oc-correlativo" placeholder="Correlativo" required value={formData.correlativo} onChange={(e) => setFormData((p) => ({ ...p, correlativo: e.target.value }))} />
          </div>

          <div className="form-field">
            <label htmlFor="oc-proveedor">Proveedor</label>
            <select id="oc-proveedor" required value={formData.proveedor_id} onChange={(e) => setFormData((p) => ({ ...p, proveedor_id: e.target.value }))}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.nombre} {prov.ruc ? `(RUC: ${prov.ruc})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="oc-compra">Qué se compra</label>
            <input id="oc-compra" placeholder="Qué se compra" required value={formData.nombre_compra} onChange={(e) => setFormData((p) => ({ ...p, nombre_compra: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-proyecto">Proyecto</label>
            <select id="oc-proyecto" value={formData.proyecto_id} onChange={(e) => setFormData((p) => ({ ...p, proyecto_id: e.target.value }))}>
              <option value="">Sin proyecto</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre_mostrar || proyecto.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="oc-fecha">Fecha de emisión</label>
            <input id="oc-fecha" type="date" required value={formData.fecha} onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-vencimiento">Fecha vencimiento</label>
            <input id="oc-vencimiento" type="datetime-local" value={formData.fecha_vencimiento} onChange={(e) => setFormData((p) => ({ ...p, fecha_vencimiento: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="oc-cantidad">Cantidad</label>
            <input id="oc-cantidad" type="number" min="1" required placeholder="Cantidad" value={formData.cantidad} onChange={(e) => setFormData((p) => ({ ...p, cantidad: e.target.value }))} />
          </div>

          <div className="form-field">
            <label htmlFor="oc-costo-unitario">Costo unitario</label>
            <input id="oc-costo-unitario" type="number" min="0" step="0.01" required placeholder="Costo unitario" value={formData.costo_unitario} onChange={(e) => setFormData((p) => ({ ...p, costo_unitario: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Total Calculado</label>
            <div className="form-total">S/ {Number((Number(formData.cantidad || 0) * Number(formData.costo_unitario || 0)).toFixed(2)).toLocaleString()}</div>
          </div>
          <div></div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar orden</button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Serie</th>
              <th>Correlativo</th>
              <th>Compra</th>
              <th>Proveedor</th>
              <th>Proyecto</th>
              <th>Fecha</th>
              <th>Vencimiento</th>
              <th>Cantidad</th>
              <th>Costo unitario</th>
              <th>Estado</th>
              <th>Contabilidad</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id}>
                <td className="cell-bold">{orden.tipo_comprobante || '-'}</td>
                <td>{orden.serie || '-'}</td>
                <td>{orden.correlativo || '-'}</td>
                <td>{orden.nombre_compra}</td>
                <td>{proveedores.find((p) => p.id === orden.proveedor_id)?.nombre || '-'}</td>
                <td>{proyectos.find((p) => Number(p.id) === Number(orden.proyecto_id))?.nombre_mostrar || proyectos.find((p) => Number(p.id) === Number(orden.proyecto_id))?.nombre || '-'}</td>
                <td>{orden.fecha}</td>
                <td>{formatDateTimeInAppTimeZone(orden.fecha_vencimiento)}</td>
                <td>{materialesPorOrden[orden.id]?.cantidad ?? '-'}</td>
                <td>S/ {Number(materialesPorOrden[orden.id]?.costo_unitario || 0).toLocaleString()}</td>
                <td>
                  <span className={`estado-badge ${
                    orden.estado === 'Pagado' ? 'estado-pagado' : 
                    orden.estado === 'Anulado' ? 'estado-anulado' :
                    orden.estado === 'Borrador' ? 'estado-borrador' :
                    orden.estado === 'Enviada' ? 'estado-enviada' : ''
                  }`}>
                    {orden.estado || 'Borrador'}
                  </span>
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

      {convertingOrden && (
        <div className="profile-modal-backdrop" onClick={() => setConvertingOrden(null)}>
          <div className="profile-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <header>
              <span>Convertir a Factura</span>
              <button type="button" onClick={() => setConvertingOrden(null)}>✕</button>
            </header>
            <h2>Convertir Orden: {convertingOrden.numero}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '8px 0 20px' }}>
              Ingrese la serie y correlativo del comprobante que emitió el proveedor para esta compra.
            </p>
            <form className="profile-form" onSubmit={handleConfirmarFactura}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '12px', gridColumn: '1 / -1', width: '100%' }}>
                <label>
                  Tipo Comprobante
                  <select value={conversionData.tipo_comprobante} onChange={(e) => setConversionData((p) => ({ ...p, tipo_comprobante: e.target.value }))}>
                    <option value="01">01 - Factura</option>
                    <option value="03">03 - Boleta de Venta</option>
                    <option value="07">07 - Nota de Crédito</option>
                    <option value="08">08 - Nota de Débito</option>
                    <option value="R1">R1 - Recibo por Honorarios</option>
                  </select>
                </label>
                <label>
                  Serie
                  <input placeholder="F001" required value={conversionData.serie} onChange={(e) => setConversionData((p) => ({ ...p, serie: e.target.value }))} className="uppercase" />
                </label>
                <label>
                  Correlativo
                  <input placeholder="Correlativo" required value={conversionData.correlativo} onChange={(e) => setConversionData((p) => ({ ...p, correlativo: e.target.value }))} />
                </label>
              </div>
              <label>
                Proveedor
                <input type="text" readOnly value={proveedores.find((p) => p.id === convertingOrden.proveedor_id)?.nombre || '-'} className="input-readonly" />
              </label>
              <label>
                Total
                <input type="text" readOnly value={`S/ ${Number((Number(materialesPorOrden[convertingOrden.id]?.cantidad || 0) * Number(materialesPorOrden[convertingOrden.id]?.costo_unitario || 0)).toFixed(2)).toLocaleString()}`} className="input-readonly" />
              </label>
              <button type="submit" className="btn-primary" disabled={enviandoOrdenId === convertingOrden.id}>
                {enviandoOrdenId === convertingOrden.id ? 'Registrando...' : 'Registrar Comprobante'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompraView;
