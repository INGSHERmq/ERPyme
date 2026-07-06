import useLogistica from '../../hooks/useLogistica';
import './InventarioView.css';

const InventarioView = () => {
  const { inventarioLogistica, loading } = useLogistica();

  if (loading) return <div className="loading">Cargando equipos...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Equipos</h2>
        <span className="view-hint">Se actualiza automáticamente desde Productos e inventario.</span>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Tipo</th>
              <th>Marca / Modelo</th>
              <th>Ubicacion</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {inventarioLogistica.map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.nombre}</td>
                <td>{a.tipo}</td>
                <td>
                  <div>{a.marca || '-'}</div>
                  <small className="text-muted">{a.modelo || ''}</small>
                </td>
                <td>{a.ubicacion || '-'}</td>
                <td>S/ {a.costo?.toLocaleString('en-US') || 0}</td>
                <td>{a.stockActual ?? 0} {a.unidad || ''}</td>
                <td>
                  <span className={`badge badge-${
                    a.estado === 'Activo' ? 'green' :
                    a.estado === 'Disponible' ? 'green' :
                    a.estado === 'En uso' ? 'blue' :
                    a.estado === 'En mantenimiento' ? 'yellow' :
                    a.estado === 'En transito' ? 'purple' : 'gray'
                  }`}>
                    {a.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inventarioLogistica.length === 0 && (
          <p className="empty-state">Aun no hay productos registrados en inventario.</p>
        )}
      </div>
    </div>
  );
};

export default InventarioView;
