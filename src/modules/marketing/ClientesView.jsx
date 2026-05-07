import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './ClientesView.css';

const ClientesView = () => {
  const { clientes, addCliente, updateClienteEstado, loading, refetch } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Usamos el hook de Supabase en lugar de axios
      await addCliente(formData);
      refetch();
      setShowForm(false);
      setFormData({ nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo' });
      alert('✅ Cliente guardado correctamente');
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo guardar el cliente'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEstado = async (cliente) => {
    const nextEstado = cliente.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await updateClienteEstado(cliente.id, nextEstado);
      alert(`✅ Cliente actualizado a ${nextEstado}`);
    } catch (error) {
      console.error('Error al actualizar estado del cliente:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo actualizar estado del cliente'));
    }
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
          <input name="nombre" placeholder="Nombre *" required value={formData.nombre} onChange={handleInputChange} />
          <input name="contacto" placeholder="Contacto *" required value={formData.contacto} onChange={handleInputChange} />
          <input name="email" type="email" placeholder="Email *" required value={formData.email} onChange={handleInputChange} />
          <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} />
          <input name="industria" placeholder="Industria" value={formData.industria} onChange={handleInputChange} />
          <select name="estado" value={formData.estado} onChange={handleInputChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button type="submit" className="btn-primary">Guardar Cliente</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Industria</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id}>
                <td className="cell-bold">{cliente.nombre}</td>
                <td>{cliente.contacto}</td>
                <td><a href={`mailto:${cliente.email}`}>{cliente.email}</a></td>
                <td>{cliente.industria || '—'}</td>
                <td>
                  <span className={`badge ${cliente.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                    {cliente.estado}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-action"
                    onClick={() => handleToggleEstado(cliente)}
                  >
                    {cliente.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                  </button>
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