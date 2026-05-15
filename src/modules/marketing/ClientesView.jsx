import useMarketing from '../../hooks/useMarketing';
import './ClientesView.css';

const ClientesView = () => {
  const { clientes, updateClienteEstado, loading } = useMarketing();

  const handleToggleEstado = async (cliente) => {
    const nextEstado = cliente.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await updateClienteEstado(cliente.id, nextEstado);
      alert(`Cliente actualizado a ${nextEstado}`);
    } catch (error) {
      console.error('Error al actualizar estado del cliente:', error);
      alert('Error: ' + (error.message || 'No se pudo actualizar estado del cliente'));
    }
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;

  return (
    <div className="clientes-view">
      <div className="view-header">
        <div>
          <h2>Tabla de clientes</h2>
          <p className="view-subtitle">Directorio de clientes inscritos desde la sección de Clientes y cotizaciones aprobadas.</p>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>DNI / RUC</th>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Industria</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  Aún no hay clientes. Registra primero un prospecto en la sección de "Clientes" para inscribirlo automáticamente.
                </td>
              </tr>
            ) : (
              clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td>
                    <span className={`badge ${cliente.tipo_identificacion === 'DNI' ? 'badge-pink' : 'badge-teal'}`}>
                      {cliente.tipo_identificacion || '-'}
                    </span>
                  </td>
                  <td>{cliente.dni_ruc || '-'}</td>
                  <td className="cell-bold">{cliente.nombre}</td>
                  <td>{cliente.contacto || '-'}</td>
                  <td>{cliente.email ? <a href={`mailto:${cliente.email}`}>{cliente.email}</a> : '-'}</td>
                  <td>{cliente.industria || '-'}</td>
                  <td>
                    <span className={`badge ${cliente.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                      {cliente.estado || 'Activo'}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesView;
