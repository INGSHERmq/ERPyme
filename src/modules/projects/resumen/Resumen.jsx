import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Resumen.css';

const Resumen = ({ proyecto }) => {
  const progreso = Math.min(100, Math.max(0, Number(proyecto.progreso || 0)));
  const data = [
    { name: 'Avance', value: progreso },
    { name: 'Pendiente', value: 100 - progreso }
  ];
  const renderLabel = ({ name, value }) => (value > 0 ? `${name}: ${value}%` : '');

  return (
    <div className="vista-resumen">
      <div className="kpi-row">
        <div className="kpi-box">
          <span>Presupuesto</span>
          <strong>${proyecto.monto?.toLocaleString() || 0}</strong>
        </div>
        <div className="kpi-box">
          <span>Progreso</span>
          <strong>{progreso}%</strong>
        </div>
        <div className="kpi-box">
          <span>Cliente</span>
          <strong>{proyecto.clienteNombre || '—'}</strong>
        </div>
      </div>

      <div className="chart-container">
        <h4>Distribución del Estado</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={86}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              <Cell fill="#ff4d8b" />
              <Cell fill="#1a3a3a" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Resumen;
