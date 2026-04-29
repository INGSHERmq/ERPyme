import { useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import './EmpleadosView.css';

const EmpleadosView = () => {
  const { empleados, addEmpleado, refetch, loading } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', cargo: '', departamento: 'Tecnología', salario: '', estado: 'Activo' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addEmpleado({ ...formData, salario: Number(formData.salario) });
    setShowForm(false);
    setFormData({ nombre: '', email: '', cargo: '', departamento: 'Tecnología', salario: '', estado: 'Activo' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>👥 Gestión de Empleados</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Empleado'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <input name="nombre" placeholder="Nombre completo *" required value={formData.nombre} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email corporativo *" required value={formData.email} onChange={handleChange} />
          <input name="cargo" placeholder="Cargo *" required value={formData.cargo} onChange={handleChange} />
          <select name="departamento" value={formData.departamento} onChange={handleChange}>
            <option>Tecnología</option><option>Diseño</option><option>Gestión</option><option>Seguridad</option><option>Ventas</option>
          </select>
          <input name="salario" type="number" placeholder="Salario mensual ($)" required value={formData.salario} onChange={handleChange} />
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Cargo</th><th>Departamento</th><th>Salario</th><th>Proyectos</th><th>Estado</th></tr></thead>
          <tbody>
            {empleados.map(e => (
              <tr key={e.id}>
                <td className="cell-bold">{e.nombre}</td>
                <td>{e.cargo}</td>
                <td>{e.departamento}</td>
                <td>${e.salario.toLocaleString()}</td>
                <td><span className="badge badge-blue">{e.proyectosAsignados || 0}</span></td>
                <td><span className={`badge ${e.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>{e.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmpleadosView;