import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AnaliticaProyectoView = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('v_finanzas_proyecto').select('*').order('proyecto_id');
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading">Cargando analitica...</div>;

  return (
    <div className="finanzas-view">
      <div className="view-header">
        <h2>Analitica por proyecto</h2>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Ingresos cobrados</th>
              <th>Egresos</th>
              <th>Utilidad/Perdida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.proyecto_id}>
                <td className="cell-bold">{r.proyecto_nombre}</td>
                <td>S/ {Number(r.ingresos_cobrados || 0).toLocaleString()}</td>
                <td>S/ {Number(r.egresos || 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${Number(r.utilidad || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>
                    S/ {Number(r.utilidad || 0).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnaliticaProyectoView;
