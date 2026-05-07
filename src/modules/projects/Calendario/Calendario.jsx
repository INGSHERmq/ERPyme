import { useMemo, useState } from 'react';
import useProjects from '../../../hooks/useProjects';
import useTareas from '../../../hooks/useTareas';
import './Calendario.css';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const Calendario = ({ proyectoId }) => {
  const { proyectos } = useProjects();
  const { tareas, loading: tareasLoading } = useTareas(proyectoId);
  const [viewDate, setViewDate] = useState(new Date());

  const proyecto = useMemo(() => {
    return proyectos.find(p => Number(p.id) === Number(proyectoId));
  }, [proyectos, proyectoId]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const events = useMemo(() => {
    if (!proyecto) return [];

    const projectStart = parseDate(proyecto.inicio);
    const projectEnd = parseDate(proyecto.fin);
    const projectEvent = projectStart && projectEnd
      ? [{
          id: `project-${proyecto.id}`,
          type: 'project',
          title: proyecto.nombre,
          badge: proyecto.estado || 'Proyecto',
          start: projectStart,
          end: endOfDay(projectEnd),
          color: '#1a3a3a'
        }]
      : [];

    const taskEvents = tareas
      .map((tarea) => {
        const start = parseDate(tarea.fecha_inicio || tarea.fecha_fin);
        const end = parseDate(tarea.fecha_fin || tarea.fecha_inicio);
        if (!start || !end) return null;

        return {
          id: `task-${tarea.id}`,
          type: 'task',
          title: tarea.titulo,
          badge: tarea.estado,
          start,
          end: endOfDay(end),
          color: tarea.color || '#ff4d8b'
        };
      })
      .filter(Boolean);

    return [...projectEvent, ...taskEvents];
  }, [proyecto, tareas]);

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const dias = Array.from({ length: startDayOfWeek }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      dias.push(new Date(currentYear, currentMonth, d));
    }
    return dias;
  }, [currentYear, currentMonth]);

  const getEventsForDay = (date) => {
    if (!date) return [];
    const day = parseDate(date);
    return events.filter(event => day >= event.start && day <= event.end);
  };

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setViewDate(new Date());

  if (tareasLoading) return <div className="loading">Cargando calendario...</div>;
  if (!proyecto) return <div className="empty-state">No hay calendario para este proyecto</div>;

  return (
    <div className="calendario-proyecto">
      <div className="calendario-header">
        <div className="nav-buttons">
          <button type="button" onClick={handlePrevMonth}>Anterior</button>
          <button type="button" onClick={handleToday}>Hoy</button>
          <button type="button" onClick={handleNextMonth}>Siguiente</button>
        </div>
        <h3>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
      </div>

      <div className="calendario-grid">
        {DAY_NAMES.map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}

        {calendarData.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday = date && new Date().toDateString() === date.toDateString();

          return (
            <div
              key={date?.toISOString() || `empty-${index}`}
              className={`calendar-cell ${!date ? 'empty' : ''} ${isToday ? 'today' : ''}`}
            >
              {date && (
                <>
                  <span className="cell-number">{date.getDate()}</span>
                  <div className="calendar-events">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`calendar-event ${event.type}`}
                        style={{ borderLeftColor: event.color }}
                      >
                        <span className="event-title">{event.title}</span>
                        <span className="event-badge">{event.badge}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="proyecto-legend">
        <div className="legend-item">
          <span className="legend-color project"></span>
          <span>{proyecto.nombre} ({proyecto.inicio} - {proyecto.fin})</span>
        </div>
        <div className="legend-item">
          <span className="legend-color task"></span>
          <span>Tareas programadas ({events.filter(event => event.type === 'task').length})</span>
        </div>
      </div>
    </div>
  );
};

export default Calendario;
