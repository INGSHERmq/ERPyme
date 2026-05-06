import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './CotizacionesView.css';

const initialForm = () => ({
  cliente_id: '',
  titulo: '',
  monto: '',
  estado: 'Pendiente',
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  validez: '30 dias'
});

const CotizacionesView = () => {
  const { clientes, cotizaciones, addCotizacion, convertirCotizacion, refetch, loading } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCotizacion({
        ...formData,
        monto: Number(formData.monto),
        cliente_id: Number(formData.cliente_id)
      });
      setShowForm(false);
      setFormData(initialForm());
      refetch();
      alert('Cotizacion creada correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('No se pudo crear la cotizacion');
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleConvertir = async (cotizacion) => {
    if (!window.confirm('Confirmar cotizacion y crear el ingreso pendiente?')) return;

    try {
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + 30);

      const hoy = fechaInicio.toISOString().split('T')[0];
      const finEstimado = fechaFin.toISOString().split('T')[0];

      await convertirCotizacion(cotizacion.id, {
        nombre: cotizacion.titulo,
        cliente_id: cotizacion.cliente_id,
        cotizacion_id: cotizacion.id,
        estado: 'En Progreso',
        prioridad: 'Media',
        inicio: hoy,
        fin: finEstimado,
        descripcion: cotizacion.descripcion || 'Proyecto creado desde cotizacion',
        monto: cotizacion.monto,
        progreso: 0
      });

      alert('Cotizacion confirmada. Ya aparece como ingreso pendiente en Dinero.');
      refetch();
    } catch (error) {
      console.error('Error al confirmar:', error);
      alert(error.message || 'No se pudo confirmar la cotizacion');
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
          <button type="submit" className="btn-primary">Crear cotizacion</button>
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
              <th>Proyecto</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map(c => (
              <tr key={c.id}>
                <td className="cell-bold">{c.clienteNombre || '-'}</td>
                <td>{c.titulo}</td>
                <td><strong>S/ {Number(c.monto || 0).toLocaleString()}</strong></td>
                <td><span className={`badge badge-${c.estado === 'Aceptada' ? 'green' : c.estado === 'Rechazada' ? 'red' : 'yellow'}`}>{c.estado}</span></td>
                <td>{c.proyectoNombre || 'Sin proyecto'}</td>
                <td>{c.fecha}</td>
                <td>
                  {c.estado === 'Pendiente' && (
                    <button className="btn-action btn-convert" onClick={() => handleConvertir(c)}>
                      Confirmar
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
