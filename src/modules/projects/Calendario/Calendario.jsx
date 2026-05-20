import { useMemo, useState, useEffect } from 'react';
import useProjects from '../../../hooks/useProjects';
import useTareas from '../../../hooks/useTareas';
import { formatDateOnlyInAppTimeZone, getTodayInAppTimeZone, parseDateInAppTimeZone, toAppDateKey } from '../../../lib/dates';
import { supabase } from '../../../lib/supabase';
import './Calendario.css';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const parseDate = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const parts = String(str).slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
};

const toDateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatLocalCleanDate = (date) => {
  if (!date) return '-';
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const addProjectDuration = (startDate, days) => {
  const result = new Date(startDate);
  if (days > 0 && days % 30 === 0) {
    const months = Math.round(days / 30);
    result.setMonth(result.getMonth() + months);
  } else {
    result.setDate(result.getDate() + days);
  }
  return result;
};

const getProjectDatesFromQuote = (quote) => {
  if (!quote || !quote.fecha) return { start: null, end: null };
  const start = parseDate(quote.fecha);
  if (!start) return { start: null, end: null };
  const days = Number.parseInt(String(quote.validez || '').match(/\d+/)?.[0] || '30', 10);
  const end = addProjectDuration(start, days);
  return { start, end };
};

const getTaskColor = (tarea, todayStr) => {
  const isCompletada = tarea.estado === 'Completado';
  const isAtrasada = !isCompletada && tarea.fecha_fin && (tarea.fecha_fin.slice(0, 10) < todayStr);

  if (isAtrasada) {
    return '#dc3545'; // Rojo
  }

  switch (tarea.estado) {
    case 'Completado':
      return '#28a745'; // Verde
    case 'En Progreso':
      return '#0052cc'; // Azul
    case 'Pendiente':
    default:
      return '#6c757d'; // Gris
  }
};

const Calendario = ({ proyectoId }) => {
  const { proyectos } = useProjects();
  const { tareas, loading: tareasLoading } = useTareas(proyectoId);
  const [viewDate, setViewDate] = useState(new Date());
  const [quote, setQuote] = useState(null);

  const proyecto = useMemo(() => {
    return proyectos.find(p => Number(p.id) === Number(proyectoId));
  }, [proyectos, proyectoId]);

  useEffect(() => {
    const fetchQuote = async () => {
      const cotizacionId = proyecto?.cotizacion_id || Number(proyecto?.nombre?.match(/Proyecto cotizacion #(\d+)/)?.[1]);
      if (cotizacionId) {
        try {
          const { data, error } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', cotizacionId)
            .single();
          if (!error && data) {
            setQuote(data);
          }
        } catch (err) {
          console.error('Error fetching quote for project in calendar:', err);
        }
      }
    };
    if (proyecto) {
      fetchQuote();
    }
  }, [proyecto]);

  const projectDates = useMemo(() => {
    if (!proyecto) return { start: null, end: null };

    let start = null;
    let end = null;

    const rawStart = proyecto?.inicio || proyecto?.fecha_inicio || proyecto?.fecha_inicio_plan;
    const rawEnd = proyecto?.fin || proyecto?.fecha_fin || proyecto?.fecha_fin_plan;

    if (rawStart) {
      start = parseDate(rawStart);
    }
    if (rawEnd) {
      end = parseDate(rawEnd);
    }

    if (quote && quote.fecha) {
      start = parseDate(quote.fecha);
      const days = Number.parseInt(String(quote.validez || '').match(/\d+/)?.[0] || '30', 10);
      end = addProjectDuration(start, days);
    }

    if (!start) {
      start = parseDate(proyecto?.created_at);
    }
    if (!end) {
      end = start;
    }

    return { start, end };
  }, [proyecto, quote]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const events = useMemo(() => {
    if (!proyecto) return [];

    const todayStr = getTodayInAppTimeZone();
    const { start: projectStart, end: projectEnd } = projectDates;

    const projectEvent = projectStart && projectEnd
      ? [{
          id: `project-${proyecto.id}`,
          type: 'project',
          title: proyecto.nombre,
          badge: proyecto.estado || 'Proyecto',
          startStr: toDateString(projectStart),
          endStr: toDateString(projectEnd),
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
          startStr: toDateString(start),
          endStr: toDateString(end),
          color: getTaskColor(tarea, todayStr)
        };
      })
      .filter(Boolean);

    return [...projectEvent, ...taskEvents];
  }, [proyecto, tareas, projectDates]);

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
    const dayStr = toDateString(date);
    return events.filter(event => dayStr >= event.startStr && dayStr <= event.endStr);
  };

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setViewDate(parseDate(getTodayInAppTimeZone()));

  if (tareasLoading) return <div className="loading">Cargando calendario...</div>;
  if (!proyecto) return <div className="empty-state">No hay calendario para este proyecto</div>;

  return (
    <div className="calendario-proyecto">
      <div className="calendario-inner">
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
            const isToday = date && toAppDateKey(date) === getTodayInAppTimeZone();

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
            <span>{proyecto.nombre} ({formatLocalCleanDate(projectDates.start)} - {formatLocalCleanDate(projectDates.end)})</span>
          </div>
          <div className="legend-item">
            <span className="legend-color task"></span>
            <span>Tareas programadas ({events.filter(event => event.type === 'task').length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;
