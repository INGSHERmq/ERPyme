import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './ClientesView.css';

const ClientesView = () => {
  const { clientes, addCliente, updateClienteEstado, loading, refetch } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo_identificacion: 'DNI', dni_ruc: '', nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dniRuc = formData.dni_ruc?.trim();
      const dniLength = 8;
      const rucLength = 10;

      if (formData.tipo_identificacion === 'DNI') {
        if (!dniRuc || dniRuc.length !== dniLength) {
          alert(`❌ El DNI debe tener exactamente ${dniLength} dígitos`);
          return;
        }
        if (!/^\d+$/.test(dniRuc)) {
          alert('❌ El DNI solo puede contener números');
          return;
        }
      } else if (formData.tipo_identificacion === 'RUC') {
        if (!dniRuc || dniRuc.length !== rucLength) {
          alert(`❌ El RUC debe tener exactamente ${rucLength} dígitos`);
          return;
        }
        if (!/^\d+$/.test(dniRuc)) {
          alert('❌ El RUC solo puede contener números');
          return;
        }
      }

      // ✅ Usamos el hook de Supabase en lugar de axios
      await addCliente(formData);
      refetch();
      setShowForm(false);
      setFormData({ tipo_identificacion: 'DNI', dni_ruc: '', nombre: '', contacto: '', email: '', telefono: '', industria: '', estado: 'Activo' });
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
          <div className="form-group">
            <label>Tipo de Identificación</label>
            <select
              name="tipo_identificacion"
              value={formData.tipo_identificacion}
              onChange={handleInputChange}
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
            </select>
          </div>
          <input
            name="dni_ruc"
            placeholder={`${formData.tipo_identificacion === 'DNI' ? 'DNI' : 'RUC'} *`}
            required
            maxLength={formData.tipo_identificacion === 'DNI' ? 8 : 10}
            value={formData.dni_ruc}
            onChange={handleInputChange}
          />
          <input name="nombre" placeholder="Nombre de la empresa" required value={formData.nombre} onChange={handleInputChange} />
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
              <th>Tipo</th>
              <th>{formData.tipo_identificacion === 'DNI' ? 'DNI' : 'RUC'}</th>
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
                <td><span className={`badge ${cliente.tipo_identificacion === 'DNI' ? 'badge-pink' : 'badge-teal'}`}>{cliente.tipo_identificacion || '—'}</span></td>
                <td>{cliente.dni_ruc || '—'}</td>
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