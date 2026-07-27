import { useMemo, useState, useEffect } from 'react';
import useProjects from '../../../hooks/useProjects';
import useTareas from '../../../hooks/useTareas';
import { getTodayInAppTimeZone } from '../../../lib/dates';
import { supabase } from '../../../lib/supabase';
import './Cronograma.css';

const parseDate = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const parts = String(str).slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getDaysDiff = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(end) - startOfDay(start)) / msPerDay);
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

const taskFallbackEnd = (taskStart, taskEnd) => taskEnd || taskStart;

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

const Cronograma = ({ proyectoId }) => {
  const { proyectos } = useProjects();
  const { tareas, loading: tareasLoading } = useTareas(proyectoId);
  const [zoom, setZoom] = useState(1);
  const [quote, setQuote] = useState(null);

  const proyectoData = useMemo(() => {
    return proyectos.find(p => Number(p.id) === Number(proyectoId));
  }, [proyectos, proyectoId]);

  useEffect(() => {
    const fetchQuote = async () => {
      const cotizacionId = proyectoData?.cotizacion_id || Number(proyectoData?.nombre?.match(/Proyecto cotizacion #(\d+)/)?.[1]);
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
          console.error('Error fetching quote for project in timeline:', err);
        }
      }
    };
    if (proyectoData) {
      fetchQuote();
    }
  }, [proyectoData]);

  const timelineData = useMemo(() => {
    if (!proyectoData) return null;

    const todayStr = getTodayInAppTimeZone();

    const taskItems = tareas
      .map((tarea) => {
        const start = parseDate(tarea.fecha_inicio || tarea.fecha_fin);
        const end = taskFallbackEnd(start, parseDate(tarea.fecha_fin));
        if (!start || !end) return null;

        return {
          id: `task-${tarea.id}`,
          type: 'task',
          label: tarea.titulo,
          meta: tarea.estado,
          start,
          end,
          color: getTaskColor(tarea, todayStr),
          progress: tarea.estado === 'Completado' ? 100 : tarea.estado === 'En Progreso' ? 50 : 0
        };
      })
      .filter(Boolean);

    const taskMinStart = taskItems.length
      ? taskItems.reduce((min, item) => (item.start < min ? item.start : min), taskItems[0].start)
      : null;
    const taskMaxEnd = taskItems.length
      ? taskItems.reduce((max, item) => (item.end > max ? item.end : max), taskItems[0].end)
      : null;

    let projectStart = null;
    let projectEnd = null;

    const rawStart = proyectoData?.inicio || proyectoData?.fecha_inicio || proyectoData?.fecha_inicio_plan;
    const rawEnd = proyectoData?.fin || proyectoData?.fecha_fin || proyectoData?.fecha_fin_plan;

    if (rawStart) {
      projectStart = parseDate(rawStart);
    }
    if (rawEnd) {
      projectEnd = parseDate(rawEnd);
    }

    if (quote && (quote.fecha_inicio || quote.fecha)) {
      projectStart = parseDate(quote.fecha_inicio || quote.fecha);
      if (quote.fecha_fin) {
        projectEnd = parseDate(quote.fecha_fin);
      } else {
        const days = Number.parseInt(String(quote.validez || '').match(/\d+/)?.[0] || '30', 10);
        projectEnd = addProjectDuration(projectStart, days);
      }
    }

    if (!projectStart) {
      projectStart = parseDate(proyectoData?.created_at) || taskMinStart;
    }
    if (!projectEnd) {
      projectEnd = taskMaxEnd || projectStart;
    }

    if (!projectStart || !projectEnd) return null;

    const projectItem = {
      id: `project-${proyectoData.id}`,
      type: 'project',
      label: proyectoData.nombre,
      meta: 'Proyecto',
      start: projectStart,
      end: projectEnd,
      color: '#1a3a3a',
      progress: Math.min(100, Math.max(0, Number(proyectoData.progreso || 0)))
    };

    const items = [projectItem, ...taskItems];
    const minStart = items.reduce((min, item) => item.start < min ? item.start : min, projectStart);
    const maxEnd = items.reduce((max, item) => item.end > max ? item.end : max, projectEnd);
    const margenInicio = addDays(minStart, -3);
    const margenFin = addDays(maxEnd, 3);

    const dias = [];
    let actual = new Date(margenInicio);
    while (actual <= margenFin) {
      dias.push(new Date(actual));
      actual = addDays(actual, 1);
    }

    return { dias, items, proyecto: proyectoData, projectStart, projectEnd };
  }, [proyectoData, tareas, quote]);

  if (tareasLoading) return <div className="loading">Cargando cronograma...</div>;
  if (!timelineData) return <div className="empty-state">No hay datos de cronograma</div>;

  const { dias, items, proyecto, projectStart, projectEnd } = timelineData;
  const dayWidth = 40 * zoom;

  return (
    <div className="cronograma-container">
      <div className="cronograma-header">
        <h3>Cronograma del proyecto</h3>
        <div className="zoom-controls">
          <button type="button" onClick={() => setZoom(1)} className={zoom === 1 ? 'active' : ''}>Dias</button>
          <button type="button" onClick={() => setZoom(3)} className={zoom === 3 ? 'active' : ''}>Semanas</button>
        </div>
      </div>

      <div className="gantt-wrapper">
        <div className="gantt-sidebar">
          <div className="sidebar-header">Elemento</div>
          {items.map(item => (
            <div key={item.id} className={`sidebar-row ${item.type}`}>
              <strong>{item.label}</strong>
              <span>{item.meta}</span>
            </div>
          ))}
        </div>

        <div className="gantt-timeline">
          <div className="timeline-header" style={{ gridTemplateColumns: `repeat(${dias.length}, ${dayWidth}px)` }}>
            {dias.map((dia) => (
              <div key={dia.toISOString()} className="day-cell">
                <span className="day-num">{dia.getDate()}</span>
                <span className="day-name">{dia.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2)}</span>
              </div>
            ))}
          </div>

          <div className="timeline-grid">
            {items.map(item => {
              const start = getDaysDiff(dias[0], item.start) + 1;
              const duration = Math.max(1, getDaysDiff(item.start, item.end) + 1);

              return (
                <div
                  key={item.id}
                  className={`gantt-bar-row ${item.type}`}
                  style={{ gridTemplateColumns: `repeat(${dias.length}, ${dayWidth}px)` }}
                >
                  {dias.map((dia) => <div key={dia.toISOString()} className="grid-line" />)}
                  <div
                    className="gantt-bar"
                    style={{
                      gridColumn: `${start} / ${start + duration}`,
                      backgroundColor: item.color
                    }}
                  >
                    <span className="bar-label">{item.label}</span>
                    <span className="bar-progress">{item.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="proyecto-info-bar">
        <div className="info-item"><strong>Proyecto:</strong> {proyecto.nombre}</div>
        <div className="info-item"><strong>Tareas con fecha:</strong> {items.length - 1}</div>
        <div className="info-item"><strong>Inicio:</strong> {formatLocalCleanDate(projectStart)}</div>
        <div className="info-item"><strong>Fin:</strong> {formatLocalCleanDate(projectEnd)}</div>
      </div>
    </div>
  );
};

export default Cronograma;
