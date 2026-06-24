import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/auth/useAuth';
import './ListaProyectos.css';

const parseDate = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const parts = String(str).slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
};

const toDateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addProjectDuration = (startDate, days) => {
  const result = new Date(startDate);
  if (days > 0 && days % 30 === 0) {
    const months = Math.round(days / 30);
    result.setMonth(result.getMonth() + months);
  } else {
    result.setDate(result.getDate() + days);
  }
  return result;
};

const getProjectDates = (proyecto, quotes) => {
  let startStr = proyecto.inicio || proyecto.fecha_inicio || proyecto.fecha_inicio_plan;
  let endStr = proyecto.fin || proyecto.fecha_fin || proyecto.fecha_fin_plan;

  if (!startStr) {
    startStr = proyecto.created_at;
  }

  const cotizacionId = proyecto.cotizacion_id || Number(proyecto.nombre?.match(/Proyecto cotizacion #(\d+)/)?.[1]);
  const quote = cotizacionId && quotes ? quotes.find(q => Number(q.id) === Number(cotizacionId)) : null;

  if (quote && (quote.fecha_inicio || quote.fecha)) {
    startStr = quote.fecha_inicio || quote.fecha;
    const start = parseDate(startStr);
    if (quote.fecha_fin) {
      endStr = quote.fecha_fin;
    } else {
      const days = Number.parseInt(String(quote.validez || '').match(/\d+/)?.[0] || '30', 10);
      const end = addProjectDuration(start, days);
      endStr = toDateString(end);
    }
  }

  if (!endStr) {
    endStr = startStr;
  }

  const format = (val) => {
    if (!val) return '-';
    return String(val).slice(0, 10);
  };

  return {
    start: format(startStr),
    end: format(endStr)
  };
};

const ListaProyectos = ({ proyectos, onSelect }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const { data, error } = await supabase
          .from('cotizaciones')
          .select('id, fecha, fecha_inicio, fecha_fin, validez')
          .eq('user_id', user?.id);
        if (!error && data) {
          setQuotes(data);
        }
      } catch (err) {
        console.error('Error fetching quotes in project list:', err);
      }
    };
    fetchQuotes();
  }, [user?.id]);

  const filteredProjects = useMemo(() => {
    return proyectos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          p.cliente_nombre?.toLowerCase().includes(search.toLowerCase());
      const matchEstado = filterEstado === 'Todos' || p.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [proyectos, search, filterEstado]);

  return (
    <div className="lista-proyectos">
      <div className="lista-header">
        <h2>Lista de Proyectos</h2>
        <div className="lista-filtros">
          <input 
            type="text" 
            placeholder="🔍 Buscar proyecto o cliente..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completado">Completado</option>
          </select>
        </div>
      </div>

      <div className="tabla-scroll">
        <table className="proyectos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Fechas</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => {
                const dates = getProjectDates(p, quotes);
                return (
                  <tr key={p.id}>
                    <td className="text-muted">#{index + 1}</td>
                    <td className="cell-bold">{p.nombre}</td>
                    <td>{p.cliente_nombre || '—'}</td>
                    <td>
                      <span className={`badge badge-${p.estado === 'En Progreso' ? 'blue' : p.estado === 'Completado' ? 'green' : 'gray'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${p.prioridad === 'Alta' ? 'red' : p.prioridad === 'Media' ? 'yellow' : 'green'}`}>
                        {p.prioridad}
                      </span>
                    </td>
                    <td className="text-small">
                      {dates.start} al {dates.end}
                    </td>
                    <td>
                      <button className="btn-ver" onClick={() => onSelect(p)}>
                        Ver 👁️
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                  No se encontraron proyectos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaProyectos;
