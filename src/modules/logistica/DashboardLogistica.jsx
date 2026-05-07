import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useLogistica from '../../hooks/useLogistica';
import './DashboardLogistica.css';

const TYPE_COLORS = {
  Producto: '#ff4d8b',
  Servicio: '#1a3a3a',
  Laptop: '#b8a4ed',
  Monitor: '#a4d4c5',
  Herramienta: '#e8b94a',
  Infraestructura: '#ff6b5a',
  Periferico: '#ffb084',
  Otros: '#f5f0e0'
};

const DashboardLogistica = () => {
  const { dashboardData, loading } = useLogistica();

  const chartData = useMemo(() => {
    if (!dashboardData?.porTipo || !Array.isArray(dashboardData.porTipo)) return [];
    return dashboardData.porTipo.map(t => ({
      ...t,
      fill: TYPE_COLORS[t.name] || '#cbd5e1'
    }));
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando resumen de equipos...</div>;
  if (!dashboardData) return <div className="empty-state">No hay datos disponibles</div>;

  const formatCurrency = (value) => `S/ ${(value || 0).toLocaleString()}`;

  return (
    <div className="logistica-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Equipos</span>
          <span className="kpi-value">{dashboardData.total || 0}</span>
        </div>
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Disponibles</span>
          <span className="kpi-value">{dashboardData.disponibles || 0}</span>
        </div>
        <div className="kpi-card kpi-yellow">
          <span className="kpi-label">Prestados</span>
          <span className="kpi-value">{dashboardData.enUso || 0}</span>
        </div>
        <div className="kpi-card kpi-red">
          <span className="kpi-label">En mantenimiento</span>
          <span className="kpi-value">{dashboardData.enMantenimiento || 0}</span>
        </div>
        <div className="kpi-card kpi-purple">
          <span className="kpi-label">Valor de equipos</span>
          <span className="kpi-value">{formatCurrency(dashboardData.valorTotal)}</span>
        </div>
        <div className="kpi-card kpi-orange">
          <span className="kpi-label">Mantenimientos pendientes</span>
          <span className="kpi-value">{dashboardData.mantenimientosPendientes || 0}</span>
        </div>
      </div>

      <div className="chart-wrapper">
        <h3>Equipos por tipo</h3>
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
              <Tooltip formatter={(value) => [`${value} equipos`, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">No hay datos de equipos para mostrar</div>
        )}
      </div>
    </div>
  );
};

export default DashboardLogistica;
