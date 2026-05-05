import { useState, useMemo } from 'react';
import useProjects from '../../../hooks/useProjects';
import './Cronograma.css';

const parseDate = (dateStr) => new Date(dateStr);
const getDaysDiff = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end - start) / msPerDay);
};
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const Cronograma = ({ proyectoId }) => {
  const { proyectos } = useProjects();
  const [zoom, setZoom] = useState(1);

  // Filtrar solo ESTE proyecto
  const proyectoData = useMemo(() => {
    return proyectos.find(p => p.id === proyectoId);
  }, [proyectos, proyectoId]);

  const timelineData = useMemo(() => {
    if (!proyectoData) return null;

    const inicio = parseDate(proyectoData.inicio);
    const fin = parseDate(proyectoData.fin);
    const margenInicio = addDays(inicio, -3);
    const margenFin = addDays(fin, 3);

    const dias = [];
    let actual = new Date(margenInicio);
    while (actual <= margenFin) {
      dias.push(new Date(actual));
      actual = addDays(actual, 1);
    }

    const diffInicio = getDaysDiff(margenInicio, inicio);
    const duracion = getDaysDiff(inicio, fin) + 1;

    return {
      dias,
      posicionInicio: diffInicio + 1,
      duracion,
      proyecto: proyectoData
    };
  }, [proyectoData]);

  if (!timelineData) {
    return <div className="empty-state">No hay datos de cronograma</div>;
  }

  const { dias, posicionInicio, duracion, proyecto } = timelineData;
  const dayWidth = 40 * zoom;

  const prioridadColors = {
    Alta: '#dc3545',
    Media: '#ffc107',
    Baja: '#28a745'
  };

  return (
    <div className="cronograma-container">
      <div className="cronograma-header">
        <h3>📅 Cronograma del Proyecto</h3>
        <div className="zoom-controls">
          <button onClick={() => setZoom(1)} className={zoom === 1 ? 'active' : ''}>Días</button>
          <button onClick={() => setZoom(3)} className={zoom === 3 ? 'active' : ''}>Semanas</button>
        </div>
      </div>

      <div className="gantt-wrapper">
        <div className="gantt-sidebar">
          <div className="sidebar-header">Proyecto</div>
          <div className="sidebar-row">{proyecto.nombre}</div>
        </div>

        <div className="gantt-timeline">
          <div className="timeline-header" style={{ gridTemplateColumns: `repeat(${dias.length}, ${dayWidth}px)` }}>
            {dias.map((dia, i) => (
              <div key={i} className="day-cell">
                <span className="day-num">{dia.getDate()}</span>
                <span className="day-name">{dia.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2)}</span>
              </div>
            ))}
          </div>

          <div className="timeline-grid" style={{ gridTemplateColumns: `repeat(${dias.length}, ${dayWidth}px)` }}>
            {dias.map((_, i) => (
              <div key={i} className="grid-line"></div>
            ))}

            <div 
              className="gantt-bar-row"
              style={{ gridTemplateColumns: `repeat(${dias.length}, ${dayWidth}px)` }}
            >
              <div 
                className="gantt-bar"
                style={{ 
                  gridColumn: `${posicionInicio} / ${posicionInicio + duracion}`,
                  backgroundColor: prioridadColors[proyecto.prioridad] || '#0052cc'
                }}
              >
                <span className="bar-label">{proyecto.nombre}</span>
                <span className="bar-progress">{proyecto.progreso}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="proyecto-info-bar">
        <div className="info-item">
          <strong>Duración:</strong> {duracion} días
        </div>
        <div className="info-item">
          <strong>Progreso:</strong> {proyecto.progreso}%
        </div>
        <div className="info-item">
          <strong>Inicio:</strong> {proyecto.inicio}
        </div>
        <div className="info-item">
          <strong>Fin:</strong> {proyecto.fin}
        </div>
      </div>
    </div>
  );
};

export default Cronograma;