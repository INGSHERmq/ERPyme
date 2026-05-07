import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useFinanzas from '../../hooks/useFinanzas';
import './DashboardFinanzas.css';

const CATEGORY_COLORS = {
  Infraestructura: '#ff4d8b',
  Licencias: '#e8b94a',
  Servicios: '#1a3a3a',
  Otros: '#b8a4ed'
};

const DashboardFinanzas = () => {
  const { dashboardData, loading } = useFinanzas();

  const chartData = useMemo(() => {
    if (!dashboardData) return null;

    const expenseDist = (dashboardData.egresosPorCategoria || []).map(item => ({
      ...item,
      fill: CATEGORY_COLORS[item.name] || '#ccc'
    }));

    return {
      flowData: (dashboardData.ingresosPorMes || []).map(m => ({
        name: m.mes?.slice(5) || 'N/A',
        Ingresos: m.ingresos || 0,
        Gastos: m.egresos || 0
      })),
      expenseDist
    };
  }, [dashboardData]);

  if (loading) return <div className="loading">Cargando resumen de dinero...</div>;
  if (!dashboardData) return <div className="empty-state">No hay datos de dinero disponibles</div>;

  const formatCurrency = (value) => `S/ ${(value || 0).toLocaleString()}`;

  return (
    <div className="finanzas-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Dinero cobrado</span>
          <span className="kpi-value">{formatCurrency(dashboardData.ingresosCobrados)}</span>
        </div>
        <div className="kpi-card kpi-red">
          <span className="kpi-label">Gastos</span>
          <span className="kpi-value">{formatCurrency(dashboardData.totalEgresos)}</span>
        </div>
        <div className={`kpi-card ${dashboardData.balance >= 0 ? 'kpi-blue' : 'kpi-orange'}`}>
          <span className="kpi-label">Saldo</span>
          <span className="kpi-value">{formatCurrency(dashboardData.balance)}</span>
        </div>
        <div className="kpi-card kpi-yellow">
          <span className="kpi-label">Pendiente de cobrar</span>
          <span className="kpi-value">{formatCurrency(dashboardData.totalPorCobrar)}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Caja de los ultimos 6 meses</h3>
          {chartData?.flowData && chartData.flowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.flowData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `S/ ${v / 1000}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="Ingresos" fill="#1a3a3a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ff4d8b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No hay datos de caja disponibles</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Gastos por tipo</h3>
          {chartData?.expenseDist && chartData.expenseDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.expenseDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.expenseDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No hay datos de gastos por tipo</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFinanzas;
