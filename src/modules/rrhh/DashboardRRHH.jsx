import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useRRHH from '../../hooks/useRRHH';
import './DashboardRRHH.css';

const DEPT_COLORS = {
  Tecnología: '#ff4d8b',
  Diseño: '#b8a4ed',
  Gestión: '#1a3a3a',
  Seguridad: '#ff6b5a',
  Ventas: '#e8b94a'
};

const DashboardRRHH = () => {
  const { dashboardData, loading, error } = useRRHH();

  const chartData = useMemo(() => {
    if (!dashboardData?.empleadosPorDepartamento) return [];
    return dashboardData.empleadosPorDepartamento.map(d => ({
      ...d,
      fill: DEPT_COLORS[d.name] || '#cbd5e1'
    }));
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando resumen de personal...</div>;
  if (error) return <div className="empty-state">Error: {error}</div>;
  if (!dashboardData) return <div className="empty-state">No hay datos disponibles</div>;

  const formatCurrency = (value) => `S/ ${(value || 0).toLocaleString()}`;

  return (
    <div className="rrhh-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Empleados activos</span>
          <span className="kpi-value">{dashboardData.totalEmpleados || 0}</span>
        </div>
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Presentes hoy</span>
          <span className="kpi-value">{dashboardData.presentesHoy || 0}</span>
        </div>
        <div className="kpi-card kpi-yellow">
          <span className="kpi-label">Pago mensual</span>
          <span className="kpi-value">{formatCurrency(dashboardData.planillaMensual)}</span>
        </div>
        <div className="kpi-card kpi-red">
          <span className="kpi-label">Reportes de seguridad</span>
          <span className="kpi-value">{dashboardData.incidentesMes || 0}</span>
        </div>
      </div>

      <div className="chart-wrapper">
        <h3>Empleados por área</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} empleados`, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">No hay datos de áreas para mostrar</div>
        )}
      </div>
    </div>
  );
};

export default DashboardRRHH;
