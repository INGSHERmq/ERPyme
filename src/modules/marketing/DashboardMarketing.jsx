import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useMarketing from '../../hooks/useMarketing';
import './DashboardMarketing.css';

const STATUS_COLORS = {
  Aceptada: '#0ecb81', // Trading Up
  Pendiente: '#fcd535', // Binance Yellow
  Rechazada: '#f6465d'  // Trading Down
};

const DashboardMarketing = () => {
  const { clientes, cotizaciones, proyectos, loading } = useMarketing();

  const stats = useMemo(() => {
    const cotizacionesData = cotizaciones || [];
    const proyectosData = proyectos || [];
    const clientesData = clientes || [];

    const aceptadas = cotizacionesData.filter(c => c.estado === 'Aceptada');
    const montoAceptado = aceptadas.reduce((sum, c) => sum + (c.monto || 0), 0);

    const statusDist = Object.entries(
      cotizacionesData.reduce((acc, c) => {
        acc[c.estado] = (acc[c.estado] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || '#ccc'
    }));

    const projectsByClient = clientesData
      .map(cliente => ({
        name: cliente.nombre,
        value: proyectosData.filter(p => p.cliente_id === cliente.id).length
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      totalCotizaciones: cotizacionesData.length,
      tasaConversion: cotizacionesData.length > 0
        ? Math.round((aceptadas.length / cotizacionesData.length) * 100)
        : 0,
      montoAceptado,
      proyectosActivos: proyectosData.filter(p => p.estado === 'En Progreso').length,
      statusDist,
      projectsByClient
    };
  }, [cotizaciones, proyectos, clientes]);

  if (loading) return <div className="loading">Cargando resumen...</div>;
  if (!stats) return <div className="empty-state">No hay datos para mostrar</div>;

  return (
    <div className="marketing-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Cotizaciones</span>
          <span className="kpi-value">{stats.totalCotizaciones}</span>
        </div>
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Aceptadas</span>
          <span className="kpi-value">{stats.tasaConversion}%</span>
        </div>
        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Monto aceptado</span>
          <span className="kpi-value">S/ {stats.montoAceptado.toLocaleString()}</span>
        </div>
        <div className="kpi-card kpi-orange">
          <span className="kpi-label">Proyectos activos</span>
          <span className="kpi-value">{stats.proyectosActivos}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Cotizaciones por estado</h3>
          {stats.statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.statusDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.statusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">Sin datos</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Proyectos por cliente</h3>
          {stats.projectsByClient.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.projectsByClient} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#fcd535" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">Sin datos</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMarketing;
