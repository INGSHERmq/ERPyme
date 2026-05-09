import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import { useAuth } from '../../context/auth/useAuth';
import { uploadPrivateFile } from '../../lib/storage';
import './CotizacionesView.css';

const initialForm = () => ({
  cliente_id: '',
  titulo: '',
  monto: '',
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
  const [adjuntoFile, setAdjuntoFile] = useState(null);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let archivoAdjuntoPath = null;
      if (adjuntoFile) {
        setSubiendoAdjunto(true);
        const upload = await uploadPrivateFile({
          file: adjuntoFile,
          folder: 'cotizaciones',
          userId: user?.id
        });
        archivoAdjuntoPath = upload.publicUrl;
      }

      await addCotizacion({
        ...formData,
        archivo_adjunto_path: archivoAdjuntoPath,
        monto: Number(formData.monto),
        cliente_id: Number(formData.cliente_id)
      });
      setShowForm(false);
      setFormData(initialForm());
      setAdjuntoFile(null);
      refetch();
      alert('Cotizacion creada correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('No se pudo crear la cotizacion');
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

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
          <input name="monto" type="number" placeholder="Monto (S/)" required value={formData.monto} onChange={handleChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <textarea name="descripcion" placeholder="Descripcion" value={formData.descripcion} onChange={handleChange} />
          <input name="validez" placeholder="Validez (ej: 30 dias)" value={formData.validez} onChange={handleChange} />
          <input
            type="file"
            onChange={(event) => setAdjuntoFile(event.target.files?.[0] || null)}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
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
              <th>Monto</th>
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
                <td><strong>S/ {Number(c.monto || 0).toLocaleString()}</strong></td>
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
                  {c.archivo_adjunto_path ? (
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
