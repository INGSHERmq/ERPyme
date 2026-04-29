import { useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import './AsignacionesView.css';

const AsignacionesView = () => {
  const { empleados, asignaciones, addAsignacion, refetch, loading } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ empleadoId: '', proyectoId: '', rol: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: '', horasSemanales: 40, estado: 'Activo' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addAsignacion({ ...formData, empleadoId: Number(formData.empleadoId), proyectoId: Number(formData.proyectoId), horasSemanales: Number(formData.horasSemanales) });
    setShowForm(false);
    setFormData({ empleadoId: '', proyectoId: '', rol: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: '', horasSemanales: 40, estado: 'Activo' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>🏗️ Asignaciones a Proyectos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nueva Asignación'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="empleadoId" required value={formData.empleadoId} onChange={handleChange}>
            <option value="">Empleado *</option>
            {empleados.filter(e => e.estado === 'Activo').map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <input name="proyectoId" type="number" placeholder="ID Proyecto *" required value={formData.proyectoId} onChange={handleChange} />
          <input name="rol" placeholder="Rol en el proyecto *" required value={formData.rol} onChange={handleChange} />
          <input name="fechaInicio" type="date" required value={formData.fechaInicio} onChange={handleChange} />
          <input name="fechaFin" type="date" placeholder="Fecha Fin (opcional)" value={formData.fechaFin} onChange={handleChange} />
          <input name="horasSemanales" type="number" placeholder="Horas/Semana" value={formData.horasSemanales} onChange={handleChange} />
          <button type="submit" className="btn-primary">Asignar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Empleado</th><th>Proyecto</th><th>Rol</th><th>Inicio</th><th>Fin</th><th>Horas/Sem</th><th>Estado</th></tr></thead>
          <tbody>
            {asignaciones.map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.empleadoNombre}</td>
                <td><span className="badge badge-blue">{a.proyectoNombre}</span></td>
                <td>{a.rol}</td>
                <td>{a.fechaInicio}</td>
                <td>{a.fechaFin || 'Indefinido'}</td>
                <td>{a.horasSemanales}h</td>
                <td><span className={`badge ${a.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>{a.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AsignacionesView;