import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useRRHH from '../../hooks/useRRHH';
import './DashboardRRHH.css';

const DEPT_COLORS = { Tecnología: '#0052cc', Diseño: '#ffc107', Gestión: '#28a745', Seguridad: '#dc3545', Ventas: '#6c757d' };

const DashboardRRHH = () => {
  const { dashboardData, loading } = useRRHH();

  const chartData = useMemo(() => {
    if (!dashboardData) return null;
    return dashboardData.empleadosPorDepartamento.map(d => ({
      ...d,
      fill: DEPT_COLORS[d.name] || '#ccc'
    }));
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando métricas de RRHH...</div>;
  if (!dashboardData) return <div className="empty-state">Sin datos disponibles</div>;

  const formatCurrency = (v) => `$${v.toLocaleString()}`;

  return (
    <div className="rrhh-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue"><span className="kpi-label">Empleados Activos</span><span className="kpi-value">{dashboardData.totalEmpleados}</span></div>
        <div className="kpi-card kpi-green"><span className="kpi-label">Presentes Hoy</span><span className="kpi-value">{dashboardData.presentesHoy}</span></div>
        <div className="kpi-card kpi-yellow"><span className="kpi-label">Planilla Mensual</span><span className="kpi-value">{formatCurrency(dashboardData.planillaMensual)}</span></div>
        <div className="kpi-card kpi-red"><span className="kpi-label">Incidentes Mes</span><span className="kpi-value">{dashboardData.incidentesMes}</span></div>
      </div>

      <div className="chart-wrapper">
        <h3>🏢 Distribución por Departamento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
              {chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v} empleados`, 'Cantidad']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardRRHH;