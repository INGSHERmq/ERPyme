import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './CotizacionesView.css';

const CotizacionesView = () => {
  const { clientes, cotizaciones, addCotizacion, convertirCotizacion, refetch, loading } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    titulo: '',
    monto: '',
    estado: 'Pendiente',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    validez: '30 días'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCotizacion({
        ...formData,
        monto: Number(formData.monto),
        cliente_id: Number(formData.cliente_id)
      });
      setShowForm(false);
      setFormData({
        cliente_id: '',
        titulo: '',
        monto: '',
        estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        validez: '30 días'
      });
      refetch();
      alert('✅ Cotización creada correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo crear la cotización'));
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ✅ Función para convertir cotización en proyecto (usa Supabase, NO axios)
  const handleConvertir = async (cotizacion) => {
    if (!window.confirm('¿Confirmar cotización y crear proyecto?')) return;
    
    try {
      // ✅ Fechas calculadas sin Date.now() (puro React)
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + 30);
      
      const hoy = fechaInicio.toISOString().split('T')[0];
      const finEstimado = fechaFin.toISOString().split('T')[0];

      // ✅ Usamos la función del hook que ya maneja Supabase + user_id
      await convertirCotizacion(cotizacion.id, {
        nombre: cotizacion.titulo,
        cliente_id: cotizacion.cliente_id,
        cotizacion_id: cotizacion.id,
        estado: 'En Progreso',
        prioridad: 'Media',
        inicio: hoy,
        fin: finEstimado,
        descripcion: cotizacion.descripcion || 'Proyecto creado desde cotización',
        monto: cotizacion.monto,
        progreso: 0
      });

      alert('✅ Cotización convertida en proyecto e ingreso creado');
      refetch();
    } catch (error) {
      console.error('Error al convertir:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo convertir la cotización'));
    }
  };

  if (loading) return <div className="loading">Cargando cotizaciones...</div>;

  return (
    <div className="cotizaciones-view">
      <div className="view-header">
        <h2>📄 Cotizaciones</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Cotización'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="cliente_id" required value={formData.cliente_id} onChange={handleChange}>
            <option value="">Cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="titulo" placeholder="Título del proyecto *" required value={formData.titulo} onChange={handleChange} />
          <input name="monto" type="number" placeholder="Monto ($)" required value={formData.monto} onChange={handleChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
          <input name="validez" placeholder="Validez (ej: 30 días)" value={formData.validez} onChange={handleChange} />
          <button type="submit" className="btn-primary">Crear Cotización</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Título</th>
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
                <td className="cell-bold">{c.clienteNombre || '—'}</td>
                <td>{c.titulo}</td>
                <td><strong>${c.monto.toLocaleString()}</strong></td>
                <td><span className={`badge badge-${c.estado === 'Aceptada' ? 'green' : c.estado === 'Rechazada' ? 'red' : 'yellow'}`}>{c.estado}</span></td>
                <td>{c.proyectoNombre || 'Sin proyecto'}</td>
                <td>{c.fecha}</td>
                <td>
                  {c.estado === 'Pendiente' && (
                    <button className="btn-action btn-convert" onClick={() => handleConvertir(c)}>
                      ✅ Confirmar
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