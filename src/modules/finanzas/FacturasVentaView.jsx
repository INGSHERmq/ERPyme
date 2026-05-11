import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const getToday = () => new Date().toISOString().split('T')[0];

const FacturasVentaView = () => {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [rows, setRows] = useState([]);
  const [collectingId, setCollectingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    cotizacion_id: '',
    cliente_id: '',
    fecha_emision: getToday(),
    total: '0'
  });

  const fetchData = async () => {
    if (!user?.id) return;
    const [cotiRes, cliRes, facRes] = await Promise.all([
      supabase.from('cotizaciones').select('id,titulo,cliente_id,monto').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,nombre').eq('user_id', user.id).order('nombre'),
      supabase.from('facturas_venta').select('*').order('created_at', { ascending: false })
    ]);
    setCotizaciones(cotiRes.data || []);
    setClientes(cliRes.data || []);
    setRows(facRes.data || []);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCobrar = async (rowId) => {
    setCollectingId(rowId);
    
    const factura = rows.find(r => r.id === rowId);

    const { error } = await supabase
      .from('facturas_venta')
      .update({ estado: 'cobrada' })
      .eq('id', rowId);

    if (error) {
      setCollectingId(null);
      alert(error.message || 'No se pudo registrar el cobro');
      return;
    }

    if (factura && factura.cotizacion_id) {
       const { data: proyectos } = await supabase.from('proyectos').select('id,nombre');
       const proyecto = (proyectos || []).find(p => p.nombre?.includes(`#${factura.cotizacion_id}`));
       
       await supabase.from('ingresos').insert([{
         concepto: 'Cobro de factura ' + factura.numero,
         tipo: 'Proyecto',
         monto: factura.total,
         fecha: new Date().toISOString().split('T')[0],
         estado: 'Cobrado',
         metodo: 'Transferencia',
         proyecto_id: proyecto ? proyecto.id : null,
         user_id: user.id
       }]);
    }

    setCollectingId(null);
    await fetchData();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { error } = await supabase.from('facturas_venta').insert([{
      numero: formData.numero,
      cotizacion_id: formData.cotizacion_id ? Number(formData.cotizacion_id) : null,
      cliente_id: formData.cliente_id ? Number(formData.cliente_id) : null,
      fecha_emision: formData.fecha_emision,
      total: Number(formData.total || 0)
    }]);
    if (error) {
      alert(error.message || 'No se pudo registrar');
      return;
    }
    setFormData({ numero: '', cotizacion_id: '', cliente_id: '', fecha_emision: getToday(), total: '0' });
    setShowForm(false);
    await fetchData();
  };

  return (
    <div className="finanzas-view">
      <div className="view-header">
        <h2>Facturas de venta</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="fv-numero">Número de factura</label>
            <input id="fv-numero" placeholder="Número factura" required value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fv-cotizacion">Cotización</label>
            <select id="fv-cotizacion" value={formData.cotizacion_id} onChange={(e) => {
              const cotId = e.target.value;
              const coti = cotizaciones.find((item) => String(item.id) === String(cotId));
              setFormData((p) => ({
                ...p,
                cotizacion_id: cotId,
                cliente_id: coti?.cliente_id ? String(coti.cliente_id) : '',
                total: coti?.monto ? String(coti.monto) : p.total
              }));
            }}>
              <option value="">Seleccionar cotización</option>
              {cotizaciones.map((cot) => <option key={cot.id} value={cot.id}>{cot.titulo}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fv-cliente">Cliente</label>
            <select id="fv-cliente" value={formData.cliente_id} onChange={(e) => setFormData((p) => ({ ...p, cliente_id: e.target.value }))}>
              <option value="">Seleccionar cliente</option>
              {clientes.map((cli) => <option key={cli.id} value={cli.id}>{cli.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fv-fecha">Fecha de emisión</label>
            <input id="fv-fecha" type="date" required value={formData.fecha_emision} onChange={(e) => setFormData((p) => ({ ...p, fecha_emision: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="fv-total">Total</label>
            <input id="fv-total" type="number" min="0" step="0.01" required placeholder="Total" value={formData.total} onChange={(e) => setFormData((p) => ({ ...p, total: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cotización</th>
              <th>Cliente</th>
              <th>Estado factura</th>
              <th>Fecha emisión</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="cell-bold">{row.numero}</td>
                <td>{cotizaciones.find((cot) => cot.id === row.cotizacion_id)?.titulo || '-'}</td>
                <td>{clientes.find((c) => c.id === row.cliente_id)?.nombre || '-'}</td>
                <td>{row.estado === 'emitida' ? 'en proceso' : row.estado}</td>
                <td>{row.fecha_emision}</td>
                <td>S/ {Number(row.total || 0).toLocaleString()}</td>
                <td>
                  {row.estado === 'cobrada' ? (
                    <span className="badge badge-green">Cobrada</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-action btn-cobrar"
                      disabled={collectingId === row.id}
                      onClick={() => handleCobrar(row.id)}
                    >
                      {collectingId === row.id ? 'Cobrando...' : 'Cobrar'}
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

export default FacturasVentaView;
