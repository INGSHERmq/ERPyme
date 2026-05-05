import { useMemo } from 'react';
import useLogistica from '../../../hooks/useLogistica';
import './Herramientas.css';

const Herramientas = ({ proyectoId }) => {
  const { activos, asignaciones, loading } = useLogistica();

  const herramientas = useMemo(() => {
    if (!asignaciones || !activos || !proyectoId) return [];
    
    // Filtramos asignaciones de tipo 'Proyecto' y este ID específico
    return asignaciones
      .filter(a => a.tipo_asignacion === 'Proyecto' && Number(a.ref_id) === Number(proyectoId))
      .map(a => {
        const act = activos.find(act => Number(act.id) === Number(a.activo_id));
        return { 
          ...a, 
          activo_nombre: act?.nombre || 'No disponible',
          activo_tipo: act?.tipo || 'Sin tipo'
        };
      });
  }, [asignaciones, activos, proyectoId]);

  if (loading) return <div className="loading">Cargando inventario...</div>;

  return (
    <div className="vista-herramientas">
      <h3>🛠️ Herramientas y Equipos</h3>
      
      {herramientas.length === 0 ? (
        <div className="empty-msg">
          <p>No hay herramientas asignadas a este proyecto.</p>
          <p className="text-muted">Asigna activos desde Logística → Asignaciones</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="tools-table">
            <thead>
              <tr><th>Activo</th><th>Tipo</th><th>Fecha Asignación</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {herramientas.map(h => (
                <tr key={h.id}>
                  <td className="bold">{h.activo_nombre}</td>
                  <td>{h.activo_tipo}</td>
                  <td>{h.fecha_asignacion}</td>
                  <td><span className={`badge badge-${h.estado === 'Activa' ? 'green' : 'gray'}`}>{h.estado}</span></td>
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