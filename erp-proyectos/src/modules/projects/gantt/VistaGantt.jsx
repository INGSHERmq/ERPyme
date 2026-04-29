import { useState, useMemo } from 'react';
import useProjects from '../../../hooks/useProjects';
import './VistaGantt.css';

// --- CORRECCIÓN DE FECHAS ---
// Parseamos manualmente para evitar el problema de UTC vs Local
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  // month - 1 porque en JS los meses van de 0 a 11
  return new Date(year, month - 1, day); 
};

const getDaysDiff = (start, end) => {
  // Usamos UTC para el cálculo de diferencia para evitar problemas con el cambio de hora (DST)
  // O simplemente redondeamos, que suele funcionar bien para demos
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end - start) / msPerDay);
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const VistaGantt = () => {
  const { proyectos } = useProjects();
  const [zoom, setZoom] = useState(1); 

  const timelineData = useMemo(() => {
    if (proyectos.length === 0) return null;

    const validProjects = proyectos.filter(p => p.inicio && p.fin);
    if (validProjects.length === 0) return null;

    // Ahora parseDate devuelve fechas locales correctas
    const fechas = validProjects.flatMap(p => [parseDate(p.inicio), parseDate(p.fin)]);
    let minDate = new Date(Math.min(...fechas));
    let maxDate = new Date(Math.max(...fechas));

    // Margen de 3 días
    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 3);

    const days = [];
    let current = new Date(minDate);
    while (current <= maxDate) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }

    return { minDate, maxDate, days, validProjects };
  }, [proyectos]);

  if (!timelineData) {
    return <div className="gantt-empty">No hay proyectos con fechas válidas.</div>;
  }

  const { minDate, days, validProjects } = timelineData;
  const dayWidth = 40 * zoom;

  const getBarPosition = (inicio, fin, index) => {
    // Usamos las fechas locales parseadas
    const startDiff = getDaysDiff(minDate, parseDate(inicio));
    const duration = getDaysDiff(parseDate(inicio), parseDate(fin)) + 1; 
    
    const row = index + 1;
    const colStart = startDiff + 1;
    const colEnd = colStart + duration;

    return {
      gridRow: `${row} / ${row + 1}`, 
      gridColumn: `${colStart} / ${colEnd}`,
    };
  };

  return (
    <div className="vista-gantt">
      <div className="gantt-header">
        <h2>📅 Diagrama de Gantt</h2>
        <div className="gantt-controls">
          <button onClick={() => setZoom(1)} className={zoom === 1 ? 'active' : ''}>Días</button>
          <button onClick={() => setZoom(7)} className={zoom === 7 ? 'active' : ''}>Semanas</button>
        </div>
      </div>

      <div className="gantt-container">
        <div className="gantt-sidebar">
          <div className="sidebar-header">Proyecto</div>
          {validProjects.map(p => (
            <div key={`side-${p.id}`} className="sidebar-row" title={p.nombre}>
              {p.nombre}
            </div>
          ))}
        </div>

        <div className="gantt-timeline-wrapper">
          <div className="timeline-header" style={{ 
            gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` 
          }}>
            {days.map((day, i) => (
              <div key={i} className="timeline-day">
                {/* Al ser fechas locales, getDate() devolverá el día correcto (15 en vez de 14) */}
                <span className="day-num">{day.getDate()}</span>
                <span className="day-name">{day.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2)}</span>
              </div>
            ))}
          </div>

          <div className="timeline-grid" style={{ 
            gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)`,
            gridTemplateRows: `repeat(${validProjects.length}, 50px)` 
          }}>
            
            <div className="grid-background-lines" style={{
              gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)`,
              gridTemplateRows: `repeat(${validProjects.length}, 50px)`
            }}>
               {days.map((_, i) => (
                 <div key={`line-${i}`} className="grid-line"></div>
               ))}
            </div>

            {validProjects.map((p, index) => {
              const pos = getBarPosition(p.inicio, p.fin, index);
              return (
                <div 
                  key={`bar-${p.id}`}
                  className={`gantt-bar priority-${p.prioridad.toLowerCase()}`}
                  style={{ ...pos, zIndex: 2 }}
                >
                  <span className="bar-label">{p.nombre}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaGantt;