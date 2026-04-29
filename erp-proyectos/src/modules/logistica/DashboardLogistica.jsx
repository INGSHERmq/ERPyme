import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useLogistica from '../../hooks/useLogistica';
import './DashboardLogistica.css';

const TYPE_COLORS = { Laptop: '#0052cc', Monitor: '#28a745', Herramienta: '#ffc107', Infraestructura: '#dc3545', Periférico: '#6c757d' };

const DashboardLogistica = () => {
  const { dashboardData, loading } = useLogistica();

  const chartData = useMemo(() => {
    if (!dashboardData) return null;
    return dashboardData.porTipo.map(t => ({ ...t, fill: TYPE_COLORS[t.name] || '#ccc' }));
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando métricas logísticas...</div>;
  if (!dashboardData) return <div className="empty-state">Sin datos disponibles</div>;

  const formatCurrency = (v) => `$${v.toLocaleString()}`;

  return (
    <div className="logistica-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue"><span className="kpi-label">Total Activos</span><span className="kpi-value">{dashboardData.total}</span></div>
        <div className="kpi-card kpi-green"><span className="kpi-label">Disponibles</span><span className="kpi-value">{dashboardData.disponibles}</span></div>
        <div className="kpi-card kpi-yellow"><span className="kpi-label">En Uso</span><span className="kpi-value">{dashboardData.enUso}</span></div>
        <div className="kpi-card kpi-red"><span className="kpi-label">En Mantenimiento</span><span className="kpi-value">{dashboardData.enMantenimiento}</span></div>
        <div className="kpi-card kpi-purple"><span className="kpi-label">Valor Inventario</span><span className="kpi-value">{formatCurrency(dashboardData.valorTotal)}</span></div>
        <div className="kpi-card kpi-orange"><span className="kpi-label">Mant. Pendientes</span><span className="kpi-value">{dashboardData.mantenimientosPendientes}</span></div>
      </div>

      <div className="chart-wrapper">
        <h3>📦 Distribución por Tipo de Activo</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
              {chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v} unidades`, 'Cantidad']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardLogistica;