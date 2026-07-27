import DataTable from '../../components/DataTable';
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

      <DataTable
        data={inventarioLogistica}
        searchKeys={['nombre', 'tipo', 'marca', 'modelo', 'ubicacion', 'estado']}
        searchPlaceholder="Buscar por nombre, tipo, marca, ubicación o estado..."
        pageSize={10}
        columns={['Equipo', 'Tipo', 'Marca / Modelo', 'Ubicacion', 'Costo', 'Stock', 'Estado']}
        renderRow={(a) => (
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
        )}
      />
    </div>
  );
};

export default InventarioView;
