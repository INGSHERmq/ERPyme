import { useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import './AsistenciasView.css';

const AsistenciasView = () => {
  // ✅ Cambiamos addAsistencia por registrarAsistencia (nombre real en el hook)
  const { empleados, asistencias, registrarAsistencia, refetch, loading } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    empleado_id: '', 
    fecha: new Date().toISOString().split('T')[0], 
    hora_entrada: '', 
    hora_salida: '', 
    estado: 'Presente', 
    observaciones: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Usamos el nombre correcto + campos en snake_case
      await registrarAsistencia({ 
        ...formData, 
        empleado_id: Number(formData.empleado_id) 
      });
      setShowForm(false);
      setFormData({ 
        empleado_id: '', 
        fecha: new Date().toISOString().split('T')[0], 
        hora_entrada: '', 
        hora_salida: '', 
        estado: 'Presente', 
        observaciones: '' 
      });
      refetch();
      alert('✅ Asistencia registrada correctamente');
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo registrar la asistencia'));
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando asistencias...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>📅 Control de Asistencia</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Registrar'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="empleado_id" required value={formData.empleado_id} onChange={handleChange}>
            <option value="">Seleccionar Empleado *</option>
            {empleados.filter(e => e.estado === 'Activo').map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <input name="hora_entrada" type="time" placeholder="Hora de Entrada" value={formData.hora_entrada} onChange={handleChange} />
          <input name="hora_salida" type="time" placeholder="Hora de Salida" value={formData.hora_salida} onChange={handleChange} />
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option>Presente</option>
            <option>Tarde</option>
            <option>Ausente</option>
            <option>Vacaciones</option>
          </select>
          <input name="observaciones" placeholder="Observaciones" value={formData.observaciones} onChange={handleChange} />
          <button type="submit" className="btn-primary">Guardar Asistencia</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.slice().reverse().map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.empleado_nombre || '—'}</td>
                <td>{a.fecha}</td>
                <td>{a.hora_entrada || '—'}</td>
                <td>{a.hora_salida || '—'}</td>
                <td>
                  <span className={`badge ${
                    a.estado === 'Presente' ? 'badge-green' : 
                    a.estado === 'Tarde' ? 'badge-yellow' : 'badge-red'
                  }`}>
                    {a.estado}
                  </span>
                </td>
                <td className="text-muted">{a.observaciones || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AsistenciasView;