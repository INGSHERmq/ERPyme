import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Resumen.css';

const Resumen = ({ proyecto }) => {
  const data = [
    { name: 'Avance', value: proyecto.progreso || 0 },
    { name: 'Pendiente', value: 100 - (proyecto.progreso || 0) }
  ];

  return (
    <div className="vista-resumen">
      <div className="kpi-row">
        <div className="kpi-box">
          <span>Presupuesto</span>
          <strong>${proyecto.monto?.toLocaleString() || 0}</strong>
        </div>
        <div className="kpi-box">
          <span>Progreso</span>
          <strong>{proyecto.progreso}%</strong>
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
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
              <Cell fill="#0052cc" />
              <Cell fill="#e9ecef" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Resumen;