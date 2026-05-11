import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import { useAuth } from '../../context/auth/useAuth';
import { uploadPrivateFile } from '../../lib/storage';
import './CotizacionesView.css';

const initialForm = () => ({
  cliente_id: '',
  titulo: '',
  cantidad: '1',
  unidad: 'UND',
  precio_unitario: '',
  precio_total: '0',
  estado: 'borrador',
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  validez: '30 dias'
});

const CotizacionesView = () => {
  const { user } = useAuth();
  const { clientes, cotizaciones, addCotizacion, convertirCotizacion, refetch, loading } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [adjuntos, setAdjuntos] = useState([]);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let archivosPaths = [];
      if (adjuntos.length > 0) {
        setSubiendoAdjunto(true);
        for (const file of adjuntos) {
          const upload = await uploadPrivateFile({
            file: file,
            folder: 'cotizaciones',
            userId: user?.id
          });
          archivosPaths.push(upload.publicUrl);
        }
      }

      await addCotizacion({
        ...formData,
        archivos_adjuntos: archivosPaths,
        cantidad: Number(formData.cantidad),
        unidad: formData.unidad,
        precio_unitario: Number(formData.precio_unitario),
        precio_total: Number(formData.precio_total),
        monto: Number(formData.precio_total),
        cliente_id: Number(formData.cliente_id)
      });
      setShowForm(false);
      setFormData(initialForm());
      setAdjuntos([]);
      refetch();
      alert('Cotizacion creada correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('No se pudo crear la cotizacion');
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => {
      const updated = { ...p, [name]: value };
      if (name === 'cantidad' || name === 'precio_unitario') {
        const cantidad = parseFloat(updated.cantidad) || 0;
        const precio = parseFloat(updated.precio_unitario) || 0;
        updated.precio_total = (cantidad * precio).toFixed(2);
      }
      return updated;
    });
  };

  const handleConvertir = async (cotizacion) => {
    if (!window.confirm('Aprobar cotizacion y generar proyecto + factura de venta borrador automaticamente?')) return;

    try {
      await convertirCotizacion(cotizacion.id);
      alert('Cotizacion aprobada. Se crearon automaticamente el proyecto y la factura de venta borrador.');
      refetch();
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
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva cotizacion'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="cliente_id" required value={formData.cliente_id} onChange={handleChange}>
            <option value="">Cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="titulo" placeholder="Titulo del proyecto *" required value={formData.titulo} onChange={handleChange} />
          <div className="form-row">
            <input name="cantidad" type="number" placeholder="Cantidad" value={formData.cantidad} onChange={handleChange} min="1" />
            <select name="unidad" value={formData.unidad} onChange={handleChange}>
              <option value="UND">UND</option>
              <option value="KG">KG</option>
              <option value="MT">MT</option>
              <option value="LTS">LTS</option>
              <option value="HORAS">HORAS</option>
              <option value="DIA">DIA</option>
              <option value="SERVICIO">SERVICIO</option>
            </select>
          </div>
          <div className="form-row">
            <input name="precio_unitario" type="number" placeholder="Precio Unitario (S/)" required value={formData.precio_unitario} onChange={handleChange} step="0.01" />
            <input name="precio_total" type="number" placeholder="Precio Total (S/)" value={formData.precio_total} readOnly className="input-readonly" />
          </div>
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <textarea name="descripcion" placeholder="Descripcion" value={formData.descripcion} onChange={handleChange} />
          <input name="validez" placeholder="Validez (ej: 30 dias)" value={formData.validez} onChange={handleChange} />
          <div className="file-input-wrapper">
            <input
              type="file"
              multiple
              onChange={(event) => setAdjuntos(Array.from(event.target.files || []))}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              id="adjuntos"
            />
            <label htmlFor="adjuntos" className="file-label">
              📎 Adjuntar archivos
            </label>
          </div>
          {adjuntos.length > 0 && (
            <div className="file-list">
              {adjuntos.map((file, index) => (
                <span key={index} className="file-tag">
                  {file.name}
                  <button type="button" onClick={() => setAdjuntos(adjuntos.filter((_, i) => i !== index))}>×</button>
                </span>
              ))}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={subiendoAdjunto}>
            {subiendoAdjunto ? 'Subiendo archivo...' : 'Crear cotizacion'}
          </button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Titulo</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio Unit.</th>
              <th>Precio Total</th>
              <th>Estado</th>
              <th>Fecha</th>
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
                <td>{c.unidad || '-'}</td>
                <td>S/ {Number(c.precio_unitario || 0).toLocaleString()}</td>
                <td><strong>S/ {Number(c.precio_total || c.monto || 0).toLocaleString()}</strong></td>
                <td>
                  <span className={`badge badge-${
                    c.estado === 'aprobada' ? 'green' : c.estado === 'rechazada' || c.estado === 'vencida' ? 'red' : 'yellow'
                  }`}
                  >
                    {c.estado}
                  </span>
                </td>
                <td>{c.fecha}</td>
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
                  ) : '—'}
                </td>
                <td>
                  {c.estado === 'borrador' && (
                    <button className="btn-action btn-convert" onClick={() => handleConvertir(c)}>
                      Aprobar
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

export default CotizacionesView;
