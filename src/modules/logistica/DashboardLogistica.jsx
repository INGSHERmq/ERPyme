import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useLogistica from '../../hooks/useLogistica';
import './DashboardLogistica.css';

const TYPE_COLORS = {
  Laptop: '#0052cc',
  Monitor: '#28a745',
  Herramienta: '#ffc107',
  Infraestructura: '#dc3545',
  Periférico: '#6c757d',
  Otros: '#adb5bd'
};

const DashboardLogistica = () => {
  const { dashboardData, loading } = useLogistica();

  const chartData = useMemo(() => {
    if (!dashboardData?.por_tipo || !Array.isArray(dashboardData.por_tipo)) return [];
    return dashboardData.por_tipo.map(t => ({
      ...t,
      fill: TYPE_COLORS[t.name] || '#cbd5e1'
    }));
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando métricas logísticas...</div>;
  if (!dashboardData) return <div className="empty-state">No hay datos disponibles</div>;

  const formatCurrency = (value) => `$${(value || 0).toLocaleString()}`;

  return (
    <div className="logistica-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Total Activos</span>
          <span className="kpi-value">{dashboardData.total || 0}</span>
        </div>
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Disponibles</span>
          <span className="kpi-value">{dashboardData.disponibles || 0}</span>
        </div>
        <div className="kpi-card kpi-yellow">
          <span className="kpi-label">En Uso</span>
          <span className="kpi-value">{dashboardData.en_uso || 0}</span>
        </div>
        <div className="kpi-card kpi-red">
          <span className="kpi-label">En Mantenimiento</span>
          <span className="kpi-value">{dashboardData.en_mantenimiento || 0}</span>
        </div>
        <div className="kpi-card kpi-purple">
          <span className="kpi-label">Valor Inventario</span>
          <span className="kpi-value">{formatCurrency(dashboardData.valor_total)}</span>
        </div>
        <div className="kpi-card kpi-orange">
          <span className="kpi-label">Mant. Pendientes</span>
          <span className="kpi-value">{dashboardData.mantenimientos_pendientes || 0}</span>
        </div>
      </div>

      <div className="chart-wrapper">
        <h3>📦 Distribución por Tipo de Activo</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} unidades`, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">No hay datos de distribución para mostrar</div>
        )}
      </div>
    </div>
  );
};

export default DashboardLogistica;