import useProjectHerramientas from '../../../hooks/useProjectHerramientas';
import './Herramientas.css';

const Herramientas = ({ proyectoId }) => {
  const { herramientas, loading, error, solicitarDevolucion } = useProjectHerramientas(proyectoId);

  if (loading) return <div className="loading">Cargando inventario...</div>;
  if (error) return <div className="empty-msg">{error}</div>;

  return (
    <div className="vista-herramientas">
      <h3>Herramientas y Equipos</h3>

      {herramientas.length === 0 ? (
        <div className="empty-msg">
          <p>No hay herramientas asignadas a este proyecto.</p>
          <p className="text-muted">Asigna activos u objetos desde Logistica - Asignaciones</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="tools-table">
            <thead>
              <tr>
                <th>Objeto</th>
                <th>Origen</th>
                <th>Asignado a</th>
                <th>Cantidad</th>
                <th>Fecha asignación</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {herramientas.map(herramienta => (
                <tr key={herramienta.id}>
                  <td className="bold">{herramienta.nombre}</td>
                  <td>{herramienta.origen} / {herramienta.tipo}</td>
                  <td>{herramienta.destino}</td>
                  <td>{herramienta.cantidad}</td>
                  <td>{herramienta.fechaMostrar}</td>
                  <td>
                    <span className={`badge badge-${['Activa', 'asignado'].includes(herramienta.estado) ? 'green' : 'gray'}`}>
                      {herramienta.estado}
                    </span>
                  </td>
                  <td>
                    {herramienta.origen === 'Inventario' && herramienta.estado === 'asignado' ? (
                      <button className="btn-action" onClick={async () => {
                        try { await solicitarDevolucion(Number(String(herramienta.id).replace('inventario-', ''))); }
                        catch (err) { alert(err.message || 'No se pudo solicitar la devolución'); }
                      }}>Solicitar devolución</button>
                    ) : herramienta.estado === 'devolucion_solicitada' ? 'Pendiente de Logística' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Herramientas;
