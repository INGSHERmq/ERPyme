import { useMemo } from 'react';
import useRRHH from '../../../hooks/useRRHH';
import './Personal.css';

const Personal = ({ proyectoId }) => {
  const { empleados, asignaciones, loading } = useRRHH();

  const equipo = useMemo(() => {
    if (!asignaciones || !empleados || !proyectoId) return [];
    
    // Filtramos asignaciones de ESTE proyecto específico
    return asignaciones
      .filter(a => Number(a.proyecto_id) === Number(proyectoId) && a.estado === 'Activo')
      .map(a => {
        const emp = empleados.find(e => Number(e.id) === Number(a.empleado_id));
        return { 
          ...a, 
          empleado_nombre: emp?.nombre || 'No disponible',
          empleado_cargo: emp?.cargo || 'Sin cargo'
        };
      });
  }, [asignaciones, empleados, proyectoId]);

  if (loading) return <div className="loading">Cargando equipo...</div>;

  return (
    <div className="vista-personal">
      <h3>👥 Equipo Asignado</h3>
      
      {equipo.length === 0 ? (
        <div className="empty-msg">
          <p>No hay personal asignado a este proyecto.</p>
          <p className="text-muted">Asigna personal desde RRHH → Asignaciones</p>
        </div>
      ) : (
        <div className="cards-grid">
          {equipo.map(m => (
            <div key={m.id} className="card-miembro">
              <div className="avatar">{m.empleado_nombre.charAt(0)}</div>
              <div className="info">
                <strong>{m.empleado_nombre}</strong>
                <span>{m.empleado_cargo}</span>
              </div>
              <div className="rol-badge">{m.rol}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Personal;