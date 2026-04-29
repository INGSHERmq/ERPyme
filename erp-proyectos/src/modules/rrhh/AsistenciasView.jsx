import { useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import './AsistenciasView.css';

const AsistenciasView = () => {
  const { empleados, asistencias, addAsistencia, refetch, loading } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ empleadoId: '', fecha: new Date().toISOString().split('T')[0], horaEntrada: '', horaSalida: '', estado: 'Presente', observaciones: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addAsistencia({ ...formData, empleadoId: Number(formData.empleadoId) });
    setShowForm(false);
    setFormData({ empleadoId: '', fecha: new Date().toISOString().split('T')[0], horaEntrada: '', horaSalida: '', estado: 'Presente', observaciones: '' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>📅 Control de Asistencia</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Registrar'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="empleadoId" required value={formData.empleadoId} onChange={handleChange}>
            <option value="">Seleccionar Empleado *</option>
            {empleados.filter(e => e.estado === 'Activo').map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <input name="horaEntrada" type="time" placeholder="Entrada" value={formData.horaEntrada} onChange={handleChange} />
          <input name="horaSalida" type="time" placeholder="Salida" value={formData.horaSalida} onChange={handleChange} />
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option>Presente</option><option>Tarde</option><option>Ausente</option><option>Vacaciones</option>
          </select>
          <input name="observaciones" placeholder="Observaciones" value={formData.observaciones} onChange={handleChange} />
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Empleado</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Obs.</th></tr></thead>
          <tbody>
            {asistencias.slice().reverse().map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.empleadoNombre}</td>
                <td>{a.fecha}</td>
                <td>{a.horaEntrada || '—'}</td>
                <td>{a.horaSalida || '—'}</td>
                <td><span className={`badge ${a.estado === 'Presente' ? 'badge-green' : a.estado === 'Tarde' ? 'badge-yellow' : 'badge-red'}`}>{a.estado}</span></td>
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