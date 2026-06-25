import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useProjectHerramientas from '../../../hooks/useProjectHerramientas';
import useRRHH from '../../../hooks/useRRHH';
import useTareas from '../../../hooks/useTareas';
import { getTodayInAppTimeZone, toAppDateKey } from '../../../lib/dates';
import './Resumen.css';

const STATUS_COLORS = {
  Pendiente: '#fcd535',
  'En Progreso': '#3b82f6',
  Completado: '#0ecb81'
};

const Resumen = ({ proyecto }) => {
  const { tareas, loading: tareasLoading } = useTareas(proyecto.id);
  const { empleados, asignaciones, loading: rrhhLoading } = useRRHH();
  const { herramientas, loading: herramientasLoading } = useProjectHerramientas(proyecto.id);

  const today = getTodayInAppTimeZone();

  const equipo = useMemo(() => {
    if (!asignaciones || !empleados) return [];

    return asignaciones
      .filter(item => Number(item.proyecto_id) === Number(proyecto.id) && item.estado === 'Activo')
      .map(item => {
        const empleado = empleados.find(emp => Number(emp.id) === Number(item.empleado_id));
        return { ...item, empleado_nombre: empleado?.nombre || 'No disponible' };
      });
  }, [asignaciones, empleados, proyecto.id]);

  const stats = useMemo(() => {
    const totalTareas = tareas.length;
    const completadas = tareas.filter(tarea => tarea.estado === 'Completado').length;
    const enProgreso = tareas.filter(tarea => tarea.estado === 'En Progreso').length;
    const pendientes = tareas.filter(tarea => tarea.estado === 'Pendiente').length;
    const programadasHoy = tareas.filter(tarea => {
      const start = toAppDateKey(tarea.fecha_inicio || tarea.fecha_fin);
      const end = toAppDateKey(tarea.fecha_fin || tarea.fecha_inicio);
      if (!start || !end) return false;
      return start <= today && today <= end;
    }).length;
    const horasPlanificadas = tareas.reduce((sum, tarea) => sum + Number(tarea.duracion_horas || 0), 0);
    const avance = totalTareas ? Math.round((completadas / totalTareas) * 100) : 0;

    return {
      totalTareas,
      completadas,
      enProgreso,
      pendientes,
      programadasHoy,
      horasPlanificadas,
      avance
    };
  }, [tareas, today]);

  const delayedTareas = useMemo(() => {
    return tareas.filter(tarea => {
      if (tarea.estado === 'Completado') return false;
      if (!tarea.fecha_fin) return false;
      const finStr = tarea.fecha_fin.slice(0, 10);
      return finStr < today;
    });
  }, [tareas, today]);

  const chartData = [
    { name: 'Pendiente', value: stats.pendientes },
    { name: 'En Progreso', value: stats.enProgreso },
    { name: 'Completado', value: stats.completadas }
  ].filter(item => item.value > 0);

  if (tareasLoading || rrhhLoading || herramientasLoading) {
    return <div className="loading">Cargando resumen del proyecto...</div>;
  }

  return (
    <div className="vista-resumen">
      <div className="kpi-row project-kpis">
        <div className="kpi-box">
          <span>Actividades</span>
          <strong>{stats.totalTareas}</strong>
          <small>{stats.enProgreso} en progreso</small>
        </div>
        <div className="kpi-box">
          <span>Cronograma</span>
          <strong>{stats.avance}%</strong>
          <small>{stats.horasPlanificadas.toLocaleString('es-PE')} h planificadas</small>
        </div>
        <div className="kpi-box">
          <span>Calendario</span>
          <strong>{stats.programadasHoy}</strong>
          <small>actividades para hoy</small>
        </div>
        <div className="kpi-box">
          <span>Personal</span>
          <strong>{equipo.length}</strong>
          <small>trabajadores activos</small>
        </div>
        <div className="kpi-box">
          <span>Herramientas</span>
          <strong>{herramientas.length}</strong>
          <small>equipos asignados</small>
        </div>
      </div>

      <div className="summary-layout">
        <div className="chart-container">
          <h4>Estado de actividades</h4>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={86}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {chartData.map(item => (
                    <Cell key={item.name} fill={STATUS_COLORS[item.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-msg">Aun no hay actividades para graficar.</div>
          )}
        </div>

        <div className="resumen-panel">
          <h4>Lectura operativa</h4>
          <p>
            El proyecto tiene {stats.totalTareas} actividad{stats.totalTareas === 1 ? '' : 'es'},
            {` ${equipo.length}`} persona{equipo.length === 1 ? '' : 's'} asignada{equipo.length === 1 ? '' : 's'}
            y {herramientas.length} herramienta{herramientas.length === 1 ? '' : 's'} vinculada{herramientas.length === 1 ? '' : 's'}.
          </p>
          <p style={{ marginBottom: delayedTareas.length > 0 ? '16px' : '0' }}>
            Para hoy hay {stats.programadasHoy} actividad{stats.programadasHoy === 1 ? '' : 'es'} dentro del calendario del proyecto.
          </p>

          {delayedTareas.length > 0 && (
            <div className="resumen-ai-alerta">
              <div className="alerta-header">
                <span className="alerta-pulsing-dot" />
                <h5>Análisis de Riesgo & Sugerencia IA</h5>
              </div>
              <div className="alerta-body">
                <p style={{ fontSize: '13px', margin: '0 0 12px 0', opacity: 0.85 }}>
                  Se ha detectado <strong>{delayedTareas.length}</strong> actividad{delayedTareas.length > 1 ? 'es' : ''} fuera de plazo en este proyecto. Esto eleva el riesgo del cronograma general.
                </p>
                <div className="alertas-tareas-list">
                  {delayedTareas.map(t => {
                    const diffTime = Math.abs(new Date(today) - new Date(t.fecha_fin.slice(0, 10)));
                    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div key={t.id} className="alerta-tarea-item">
                        <span className="alerta-tarea-titulo">{t.titulo}</span>
                        <span className="alerta-tarea-detalle">
                          Asignado a: <strong>{t.empleado_nombre || 'Sin asignar'}</strong> | Retraso: {daysOverdue} día{daysOverdue > 1 ? 's' : ''} ({t.duracion_horas || '0'}h estimadas).
                        </span>
                        <div className="alerta-ai-recomendacion">
                          <strong>Recomendación IA:</strong> {t.prioridad === 'Alta' 
                            ? 'Esta tarea es de prioridad alta. Se sugiere reasignar recursos inmediatamente o dividir su alcance para evitar demoras en entregas críticas.'
                            : `Se recomienda contactar a ${t.empleado_nombre || 'el responsable'} para asistirle en desbloquear la actividad.`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resumen;
