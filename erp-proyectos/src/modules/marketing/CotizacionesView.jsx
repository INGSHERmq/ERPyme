import { useState } from 'react';
import axios from 'axios';
import useMarketing from '../../hooks/useMarketing';
import './CotizacionesView.css';

const CotizacionesView = () => {
  const { clientes, cotizaciones, addCotizacion, refetch, loading } = useMarketing();
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
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al crear la cotización');
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ✅ Función para convertir cotización en proyecto e ingreso
  const handleConvertir = async (cotizacion) => {
    try {
      // ✅ Fechas calculadas sin Date.now()
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + 30);
      
      const hoy = fechaInicio.toISOString().split('T')[0];
      const finEstimado = fechaFin.toISOString().split('T')[0];

      // 1. Crear proyecto
      const proyectoData = {
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
      };

      const { data: proyecto } = await axios.post('http://localhost:3001/api/proyectos', proyectoData);

      // 2. Crear ingreso automático (50% inicial)
      const ingresoData = {
        tipo: 'Proyecto',
        concepto: `Pago inicial - ${cotizacion.titulo}`,
        monto: cotizacion.monto * 0.5,
        fecha: hoy,
        proyecto_id: proyecto.id,
        cliente_id: cotizacion.cliente_id,
        estado: 'Pendiente',
        metodo: 'Pendiente'
      };

      await axios.post('http://localhost:3001/api/finanzas/ingresos', ingresoData);

      // 3. Actualizar cotización
      await axios.put(`http://localhost:3001/api/cotizaciones/${cotizacion.id}`, {
        estado: 'Aceptada',
        proyecto_id: proyecto.id
      });

      alert('✅ Cotización convertida en proyecto e ingreso creado');
      refetch();
    } catch (error) {
      console.error('Error al convertir:', error);
      alert('❌ Error al convertir la cotización');
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