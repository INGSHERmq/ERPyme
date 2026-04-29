import { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import useProjects from '../../../hooks/useProjects';
import './VistaGrafico.css';

const STATUS_COLORS = { 
  Pendiente: '#6c757d', 
  'En Progreso': '#0052cc', 
  Completado: '#28a745' 
};

const PRIORITY_COLORS = { 
  Alta: '#dc3545', 
  Media: '#ffc107', 
  Baja: '#28a745' 
};

const VistaGrafico = () => {
  const { proyectos, loading } = useProjects();

  const dashboardData = useMemo(() => {
    if (!proyectos.length) return null;

    const statusCounts = proyectos.reduce((acc, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = proyectos.reduce((acc, p) => {
      acc[p.prioridad] = (acc[p.prioridad] || 0) + 1;
      return acc;
    }, {});

    return {
      kpis: {
        total: proyectos.length,
        completed: statusCounts['Completado'] || 0,
        active: statusCounts['En Progreso'] || 0,
        highPriority: priorityCounts['Alta'] || 0,
      },
      statusChart: Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        fill: STATUS_COLORS[name] || '#ccc'
      })),
      priorityChart: Object.entries(priorityCounts).map(([name, value]) => ({
        name,
        value,
        fill: PRIORITY_COLORS[name] || '#ccc'
      }))
    };
  }, [proyectos]);

  if (loading) return <div className="grafico-loading">Cargando métricas...</div>;
  if (!dashboardData) return <div className="grafico-empty">No hay datos para mostrar.</div>;

  const { kpis, statusChart, priorityChart } = dashboardData;

  return (
    <div className="vista-grafico">
      <h2 className="grafico-title">📊 Dashboard de Métricas</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Proyectos</span>
          <span className="kpi-value">{kpis.total}</span>
        </div>
        <div className="kpi-card kpi-active">
          <span className="kpi-label">En Progreso</span>
          <span className="kpi-value">{kpis.active}</span>
        </div>
        <div className="kpi-card kpi-completed">
          <span className="kpi-label">Completados</span>
          <span className="kpi-value">{kpis.completed}</span>
        </div>
        <div className="kpi-card kpi-high">
          <span className="kpi-label">Prioridad Alta</span>
          <span className="kpi-value">{kpis.highPriority}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={statusChart} 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                dataKey="value"
                nameKey="name"
              >
                {statusChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Distribución por Prioridad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityChart}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VistaGrafico;