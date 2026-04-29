import { useState } from 'react';
import axios from 'axios';
import useMarketing from '../../hooks/useMarketing';
import './CotizacionesView.css';

const CotizacionesView = () => {
  const { clientes, cotizaciones, loading, refetch } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: '', titulo: '', monto: '', estado: 'Pendiente', 
    fecha: new Date().toISOString().split('T')[0], descripcion: '', validez: '30 días'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/cotizaciones', {
        ...formData,
        clienteId: Number(formData.clienteId),
        monto: Number(formData.monto)
      });
      refetch();
      setShowForm(false);
      setFormData({
        clienteId: '', titulo: '', monto: '', estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0], descripcion: '', validez: '30 días'
      });
    } catch (error) {
      console.error('Error al crear cotización:', error);
      alert('❌ Error al guardar la cotización');
    }
  };

  const handleConvertir = async (cotizacionId) => {
    if (!window.confirm('¿Convertir esta cotización en un nuevo proyecto?')) return;
    
    try {
      await axios.post(`http://localhost:3001/api/cotizaciones/${cotizacionId}/convertir`);
      refetch();
      alert('✅ Cotización convertida en proyecto exitosamente');
    } catch (error) {
      console.error('Error al convertir:', error);
      alert('❌ Error al convertir la cotización');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Cargando cotizaciones...</div>;

  return (
    <div className="marketing-view">
      <div className="view-header">
        <h2>📄 Cotizaciones</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Cotización'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="clienteId" required value={formData.clienteId} onChange={handleInputChange}>
            <option value="">Seleccionar Cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="titulo" placeholder="Título del Proyecto *" required value={formData.titulo} onChange={handleInputChange} />
          <input name="monto" type="number" placeholder="Monto ($)" required value={formData.monto} onChange={handleInputChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleInputChange} />
          <textarea name="descripcion" placeholder="Descripción" rows="2" value={formData.descripcion} onChange={handleInputChange} />
          <select name="validez" value={formData.validez} onChange={handleInputChange}>
            <option value="15 días">15 días</option>
            <option value="30 días">30 días</option>
            <option value="45 días">45 días</option>
          </select>
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
            {cotizaciones.map(q => (
              <tr key={q.id}>
                <td className="cell-bold">{q.clienteNombre}</td>
                <td>{q.titulo}</td>
                <td><strong>${q.monto.toLocaleString()}</strong></td>
                <td>
                  <span className={`badge ${
                    q.estado === 'Aceptada' ? 'badge-green' : 
                    q.estado === 'Rechazada' ? 'badge-red' : 'badge-yellow'
                  }`}>
                    {q.estado}
                  </span>
                </td>
                <td>
                  {q.proyectoNombre ? (
                    <span className="badge badge-blue">🔗 {q.proyectoNombre}</span>
                  ) : (
                    <span className="text-muted">Sin proyecto</span>
                  )}
                </td>
                <td>{q.fecha}</td>
                <td className="cell-actions">
                  {q.estado === 'Pendiente' && !q.proyectoId && (
                    <button 
                      className="btn-action btn-convert"
                      onClick={() => handleConvertir(q.id)}
                      title="Convertir en proyecto"
                    >
                      🔄
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