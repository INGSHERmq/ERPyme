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
  validez: '30 días'
});

const CotizaciónesView = () => {
  const { user } = useAuth();
  const {
    clientes,
    cotizaciones: cotizaciónes,
    addCotizacion: addCotización,
    updateCotizacion: updateCotización,
    anularCotizacion: anularCotización,
    convertirCotizacion: convertirCotización,
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
            folder: 'cotizaciónes',
            userId: user?.id
          });
          archivosPaths.push(upload.publicUrl);
        }
      }

      const payload = buildPayload(archivosPaths);
      if (editingId) {
        await updateCotización(editingId, payload);
      } else {
        await addCotización(payload);
      }
      resetForm();
      await refetch();
      alert(editingId ? 'Cotización actualizada correctamente' : 'Cotización creada correctamente');
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      alert(error.message || 'No se pudo guardar la cotización');
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

  const handleEdit = (cotización) => {
    setEditingId(cotización.id);
    setShowForm(true);
    setAdjuntos([]);
    setFormData({
      cliente_id: cotización.cliente_id ? String(cotización.cliente_id) : '',
      titulo: cotización.titulo || '',
      cantidad: String(cotización.cantidad || 1),
      unidad: cotización.unidad || 'DIA',
      periodo_servicio: cotización.periodo_servicio || (cotización.unidad === 'HORAS' ? 'horas' : cotización.unidad === 'SEMANA' ? 'semanas' : 'dias'),
      precio_unitario: String(cotización.precio_unitario || ''),
      precio_total: String(cotización.precio_total || cotización.monto || 0),
      estado: cotización.estado || 'borrador',
      fecha: cotización.fecha || today(),
      fecha_inicio: cotización.fecha_inicio || cotización.fecha || today(),
      fecha_fin: cotización.fecha_fin || '',
      descripcion: cotización.descripcion || '',
      validez: cotización.validez || ''
    });
  };

  const handleAnular = async (cotización) => {
    const confirmed = await showConfirm('Anular esta cotización la deja fuera del flujo comercial, sin borrar el historial.', 'Confirmar anulación');
    if (!confirmed) return;
    try {
      await anularCotización(cotización.id);
      await refetch();
    } catch (error) {
      console.error('Error al anular:', error);
      alert(error.message || 'No se pudo anular la cotización');
    }
  };

  const handleConvertir = async (cotización) => {
    const confirmed = await showConfirm('Aprobar cotización y generar proyecto + factura de venta automáticamente?', 'Confirmar aprobación');
    if (!confirmed) return;

    try {
      await convertirCotización(cotización.id);
      alert('Cotización aprobada. Se crearon automáticamente el proyecto y la factura de venta.');
      await refetch();
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert(error.message || 'No se pudo aprobar la cotización');
    }
  };

  if (loading) return <div className="loading">Cargando cotizaciónes...</div>;

  return (
    <div className="cotizaciónes-view">
      <div className="view-header">
        <h2>Cotizaciónes</h2>
        <button className="btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancelar' : '+ Nueva cotización'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="cliente_id" required value={formData.cliente_id} onChange={handleChange}>
            <option value="">Lead / cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="titulo" placeholder="Título del proyecto *" required value={formData.titulo} onChange={handleChange} />
          <div className="form-row">
            <select name="periodo_servicio" value={formData.periodo_servicio} onChange={handleChange}>
              <option value="horas">Servicio por horas</option>
              <option value="dias">Servicio por días</option>
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
            {subiendoAdjunto ? 'Subiendo archivo...' : editingId ? 'Actualizar cotización' : 'Crear cotización'}
          </button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lead / Cliente</th>
              <th>Título</th>
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
            {cotizaciónes.map(c => (
              <tr key={c.id}>
                <td className="cell-bold">{c.clienteNombre || c.cliente_nombre || '-'}</td>
                <td>{c.titulo}</td>
                <td>{c.cantidad || '-'}</td>
                <td>{c.periodo_servicio || c.unidad || '-'}</td>
                <td>S/ {Number(c.precio_unitario || 0).toLocaleString('en-US')}</td>
                <td><strong>S/ {Number(c.precio_total || c.monto || 0).toLocaleString('en-US')}</strong></td>
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

export default CotizaciónesView;
