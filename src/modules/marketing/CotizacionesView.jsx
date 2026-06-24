import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import { useAuth } from '../../context/auth/useAuth';
import { uploadPrivateFile } from '../../lib/storage';
import { useNotification } from '../../context/NotificationContext';
import './CotizacionesView.css';

const today = () => new Date().toISOString().split('T')[0];

const initialForm = () => ({
  cliente_id: '',
  titulo: '',
  cantidad: '1',
  unidad: 'DIA',
  periodo_servicio: 'dias',
  precio_unitario: '',
  precio_total: '0',
  estado: 'borrador',
  fecha: today(),
  fecha_inicio: today(),
  fecha_fin: '',
  descripcion: '',
  validez: '30 dias'
});

const CotizacionesView = () => {
  const { user } = useAuth();
  const {
    clientes,
    cotizaciones,
    addCotizacion,
    updateCotizacion,
    anularCotizacion,
    convertirCotizacion,
    refetch,
    loading
  } = useMarketing();
  const { showConfirm } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [adjuntos, setAdjuntos] = useState([]);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialForm());
    setAdjuntos([]);
  };

  const buildPayload = (archivosPaths = []) => ({
    ...formData,
    fecha: formData.fecha_inicio || formData.fecha || today(),
    archivos_adjuntos: archivosPaths.length > 0 ? archivosPaths : undefined,
    cantidad: Number(formData.cantidad),
    unidad: formData.unidad,
    precio_unitario: Number(formData.precio_unitario),
    precio_total: Number(formData.precio_total),
    monto: Number(formData.precio_total),
    cliente_id: Number(formData.cliente_id)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let archivosPaths = [];
      if (adjuntos.length > 0) {
        setSubiendoAdjunto(true);
        for (const file of adjuntos) {
          const upload = await uploadPrivateFile({
            file,
            folder: 'cotizaciones',
            userId: user?.id
          });
          archivosPaths.push(upload.publicUrl);
        }
      }

      const payload = buildPayload(archivosPaths);
      if (editingId) {
        await updateCotizacion(editingId, payload);
      } else {
        await addCotizacion(payload);
      }
      resetForm();
      await refetch();
      alert(editingId ? 'Cotizacion actualizada correctamente' : 'Cotizacion creada correctamente');
    } catch (error) {
      console.error('Error al guardar cotizacion:', error);
      alert(error.message || 'No se pudo guardar la cotizacion');
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => {
      const updated = { ...p, [name]: value };
      if (name === 'periodo_servicio') {
        updated.unidad = value === 'horas' ? 'HORAS' : value === 'semanas' ? 'SEMANA' : 'DIA';
      }
      if (name === 'cantidad' || name === 'precio_unitario') {
        const cantidad = parseFloat(updated.cantidad) || 0;
        const precio = parseFloat(updated.precio_unitario) || 0;
        updated.precio_total = (cantidad * precio).toFixed(2);
      }
      return updated;
    });
  };

  const handleEdit = (cotizacion) => {
    setEditingId(cotizacion.id);
    setShowForm(true);
    setAdjuntos([]);
    setFormData({
      cliente_id: cotizacion.cliente_id ? String(cotizacion.cliente_id) : '',
      titulo: cotizacion.titulo || '',
      cantidad: String(cotizacion.cantidad || 1),
      unidad: cotizacion.unidad || 'DIA',
      periodo_servicio: cotizacion.periodo_servicio || (cotizacion.unidad === 'HORAS' ? 'horas' : cotizacion.unidad === 'SEMANA' ? 'semanas' : 'dias'),
      precio_unitario: String(cotizacion.precio_unitario || ''),
      precio_total: String(cotizacion.precio_total || cotizacion.monto || 0),
      estado: cotizacion.estado || 'borrador',
      fecha: cotizacion.fecha || today(),
      fecha_inicio: cotizacion.fecha_inicio || cotizacion.fecha || today(),
      fecha_fin: cotizacion.fecha_fin || '',
      descripcion: cotizacion.descripcion || '',
      validez: cotizacion.validez || ''
    });
  };

  const handleAnular = async (cotizacion) => {
    const confirmed = await showConfirm('Anular esta cotizacion la deja fuera del flujo comercial, sin borrar el historial.', 'Confirmar anulacion');
    if (!confirmed) return;
    try {
      await anularCotizacion(cotizacion.id);
      await refetch();
    } catch (error) {
      console.error('Error al anular:', error);
      alert(error.message || 'No se pudo anular la cotizacion');
    }
  };

  const handleConvertir = async (cotizacion) => {
    const confirmed = await showConfirm('Aprobar cotizacion y generar proyecto + factura de venta automaticamente?', 'Confirmar aprobacion');
    if (!confirmed) return;

    try {
      await convertirCotizacion(cotizacion.id);
      alert('Cotizacion aprobada. Se crearon automaticamente el proyecto y la factura de venta.');
      await refetch();
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert(error.message || 'No se pudo aprobar la cotizacion');
    }
  };

  if (loading) return <div className="loading">Cargando cotizaciones...</div>;

  return (
    <div className="cotizaciones-view">
      <div className="view-header">
        <h2>Cotizaciones</h2>
        <button className="btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancelar' : '+ Nueva cotizacion'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="cliente_id" required value={formData.cliente_id} onChange={handleChange}>
            <option value="">Lead / cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="titulo" placeholder="Titulo del proyecto *" required value={formData.titulo} onChange={handleChange} />
          <div className="form-row">
            <select name="periodo_servicio" value={formData.periodo_servicio} onChange={handleChange}>
              <option value="horas">Servicio por horas</option>
              <option value="dias">Servicio por dias</option>
              <option value="semanas">Servicio por semanas</option>
            </select>
            <input name="cantidad" type="number" placeholder="Cantidad" value={formData.cantidad} onChange={handleChange} min="1" />
          </div>
          <div className="form-row">
            <input name="precio_unitario" type="number" placeholder="Precio unitario (S/)" required value={formData.precio_unitario} onChange={handleChange} step="0.01" />
            <input name="precio_total" type="number" placeholder="Precio total (S/)" value={formData.precio_total} readOnly className="input-readonly" />
          </div>
          <div className="form-row">
            <input name="fecha_inicio" type="date" required value={formData.fecha_inicio} onChange={handleChange} />
            <input name="fecha_fin" type="date" value={formData.fecha_fin} onChange={handleChange} />
          </div>
          <textarea name="descripcion" placeholder="Descripcion" value={formData.descripcion} onChange={handleChange} />
          <input name="validez" placeholder="Validez comercial (ej: 30 dias)" value={formData.validez} onChange={handleChange} />
          <div className="file-input-wrapper">
            <input
              type="file"
              multiple
              onChange={(event) => setAdjuntos(Array.from(event.target.files || []))}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              id="adjuntos"
            />
            <label htmlFor="adjuntos" className="file-label">
              Adjuntar archivos
            </label>
          </div>
          {adjuntos.length > 0 && (
            <div className="file-list">
              {adjuntos.map((file, index) => (
                <span key={index} className="file-tag">
                  {file.name}
                  <button type="button" onClick={() => setAdjuntos(adjuntos.filter((_, i) => i !== index))}>x</button>
                </span>
              ))}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={subiendoAdjunto}>
            {subiendoAdjunto ? 'Subiendo archivo...' : editingId ? 'Actualizar cotizacion' : 'Crear cotizacion'}
          </button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lead / Cliente</th>
              <th>Titulo</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio unit.</th>
              <th>Precio total</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Adjunto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map(c => (
              <tr key={c.id}>
                <td className="cell-bold">{c.clienteNombre || c.cliente_nombre || '-'}</td>
                <td>{c.titulo}</td>
                <td>{c.cantidad || '-'}</td>
                <td>{c.periodo_servicio || c.unidad || '-'}</td>
                <td>S/ {Number(c.precio_unitario || 0).toLocaleString()}</td>
                <td><strong>S/ {Number(c.precio_total || c.monto || 0).toLocaleString()}</strong></td>
                <td>
                  <span className={`badge badge-${
                    c.estado === 'aprobada' ? 'green' : c.estado === 'rechazada' || c.estado === 'vencida' ? 'red' : 'yellow'
                  }`}
                  >
                    {c.estado === 'rechazada' ? 'anulada' : c.estado}
                  </span>
                </td>
                <td>{c.fecha_inicio || c.fecha}</td>
                <td>{c.fecha_fin || '-'}</td>
                <td>
                  {c.archivos_adjuntos && c.archivos_adjuntos.length > 0 ? (
                    <div className="adjuntos-list">
                      {c.archivos_adjuntos.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="adjunto-link">
                          Ver {idx + 1}
                        </a>
                      ))}
                    </div>
                  ) : c.archivo_adjunto_path ? (
                    <a href={c.archivo_adjunto_path} target="_blank" rel="noreferrer">Ver</a>
                  ) : '-'}
                </td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-action" type="button" onClick={() => handleEdit(c)}>Editar</button>
                    {c.estado === 'borrador' && (
                      <button className="btn-action btn-convert" type="button" onClick={() => handleConvertir(c)}>
                        Aprobar
                      </button>
                    )}
                    {c.estado !== 'rechazada' && (
                      <button className="btn-action btn-danger" type="button" onClick={() => handleAnular(c)}>
                        Anular
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CotizacionesView;
