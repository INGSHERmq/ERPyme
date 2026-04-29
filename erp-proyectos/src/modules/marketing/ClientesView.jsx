import { useState } from 'react';
import axios from 'axios';
import useMarketing from '../../hooks/useMarketing';
import './ClientesView.css';

const ClientesView = () => {
  const { clientes, loading, refetch } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/clientes', formData);
      refetch();
      setShowForm(false);
      setFormData({ nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo' });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('❌ Error al guardar el cliente');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;

  return (
    <div className="marketing-view">
      <div className="view-header">
        <h2>👥 Gestión de Clientes</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <input name="nombre" placeholder="Nombre de la Empresa *" required value={formData.nombre} onChange={handleInputChange} />
          <input name="contacto" placeholder="Persona de Contacto *" required value={formData.contacto} onChange={handleInputChange} />
          <input name="email" type="email" placeholder="Email *" required value={formData.email} onChange={handleInputChange} />
          <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} />
          <input name="industria" placeholder="Industria" value={formData.industria} onChange={handleInputChange} />
          <select id ="estado" name="estado" value={formData.estado} onChange={handleInputChange}>
            <option value="Activo" color='black'>Activo</option>
            <option value="Inactivo" color='black'>Inactivo</option>
          </select>
          <button type="submit" className="btn-primary">Guardar Cliente</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Industria</th>
              <th>Proyectos</th>
              <th>Monto Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id}>
                <td className="cell-bold">{cliente.nombre}</td>
                <td>{cliente.contacto}</td>
                <td><a href={`mailto:${cliente.email}`}>{cliente.email}</a></td>
                <td>{cliente.industria || '—'}</td>
                <td><span className="badge badge-blue">{cliente.proyectosCount || 0}</span></td>
                <td><strong>${cliente.montoTotal?.toLocaleString() || 0}</strong></td>
                <td>
                  <span className={`badge ${cliente.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                    {cliente.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesView;