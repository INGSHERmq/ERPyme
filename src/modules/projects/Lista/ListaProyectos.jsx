import { useState, useMemo } from 'react';
import './ListaProyectos.css';

const ListaProyectos = ({ proyectos, onSelect }) => {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

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
        <h2>📋 Lista de Proyectos</h2>
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
              filteredProjects.map(p => (
                <tr key={p.id}>
                  <td className="text-muted">#{p.id}</td>
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
                  <td className="text-small">{p.inicio} al {p.fin}</td>
                  <td>
                    <button className="btn-ver" onClick={() => onSelect(p)}>
                      Ver 👁️
                    </button>
                  </td>
                </tr>
              ))
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