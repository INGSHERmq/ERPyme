import { useState, useMemo } from 'react';
import useProjects from '../../../hooks/useProjects';
import './VistaTabla.css';

// ✅ Componente auxiliar fuera del main para evitar re-creación en render
const SortIcon = ({ isActive, direction }) => {
  if (!isActive) return <span className="sort-icon"></span>;
  return <span className="sort-icon">{direction === 'asc' ? '↑' : '↓'}</span>;
};

const VistaTabla = () => {
  const { proyectos, deleteProyecto, updateProyecto } = useProjects();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterPrioridad, setFilterPrioridad] = useState('Todas');

  // Procesamiento optimizado con useMemo
  const processedProjects = useMemo(() => {
    let result = [...proyectos];

    // Búsqueda por nombre de proyecto O nombre de cliente
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        p.clienteNombre?.toLowerCase().includes(term)
      );
    }

    if (filterEstado !== 'Todos') {
      result = result.filter(p => p.estado === filterEstado);
    }

    if (filterPrioridad !== 'Todas') {
      result = result.filter(p => p.prioridad === filterPrioridad);
    }

    // Ordenamiento
    result.sort((a, b) => {
      const valA = a[sortKey] ?? '';
      const valB = b[sortKey] ?? '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [proyectos, search, filterEstado, filterPrioridad, sortKey, sortDir]);

  const handleSort = (key) => {
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      await deleteProyecto(id);
    }
  };

  const handleEdit = async (id) => {
    const nuevoNombre = window.prompt('Nuevo nombre del proyecto:');
    if (nuevoNombre && nuevoNombre.trim()) {
      await updateProyecto(id, { nombre: nuevoNombre.trim() });
    }
  };

  // Mapas de colores (usados en el JSX)
  const prioridadColors = { Alta: '#dc3545', Media: '#ffc107', Baja: '#28a745' };
  const estadoColors = { Pendiente: '#6c757d', 'En Progreso': '#0d6efd', Completado: '#198754' };

  return (
    <div className="vista-tabla">
      <div className="tabla-header">
        <h2>📑 Tabla de Proyectos</h2>
        <span className="contador">{processedProjects.length} registros</span>
      </div>

      <div className="tabla-controles">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-busqueda"
          aria-label="Buscar proyectos"
        />
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="input-filtro" aria-label="Filtrar por estado">
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Progreso">En Progreso</option>
          <option value="Completado">Completado</option>
        </select>
        <select value={filterPrioridad} onChange={(e) => setFilterPrioridad(e.target.value)} className="input-filtro" aria-label="Filtrar por prioridad">
          <option value="Todas">Todas las prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
      </div>

      <div className="tabla-wrapper">
        <table className="tabla-proyectos">
          <thead>
            <tr>
              <th onClick={() => handleSort('nombre')}>Nombre <SortIcon isActive={sortKey === 'nombre'} direction={sortDir} /></th>
              <th onClick={() => handleSort('clienteNombre')}>Cliente <SortIcon isActive={sortKey === 'clienteNombre'} direction={sortDir} /></th>
              <th onClick={() => handleSort('estado')}>Estado <SortIcon isActive={sortKey === 'estado'} direction={sortDir} /></th>
              <th onClick={() => handleSort('prioridad')}>Prioridad <SortIcon isActive={sortKey === 'prioridad'} direction={sortDir} /></th>
              <th onClick={() => handleSort('inicio')}>Inicio <SortIcon isActive={sortKey === 'inicio'} direction={sortDir} /></th>
              <th onClick={() => handleSort('fin')}>Fin <SortIcon isActive={sortKey === 'fin'} direction={sortDir} /></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {processedProjects.length > 0 ? (
              processedProjects.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td className="celda-nombre">{proyecto.nombre}</td>
                  <td className="celda-cliente">{proyecto.clienteNombre || '—'}</td>
                  <td><span className="badge" style={{ backgroundColor: estadoColors[proyecto.estado] }}>{proyecto.estado}</span></td>
                  <td><span className="badge" style={{ backgroundColor: prioridadColors[proyecto.prioridad] }}>{proyecto.prioridad}</span></td>
                  <td>{proyecto.inicio}</td>
                  <td>{proyecto.fin}</td>
                  <td className="celda-acciones">
                    <button className="btn-accion btn-editar" onClick={() => handleEdit(proyecto.id)} aria-label={`Editar ${proyecto.nombre}`}>✏️</button>
                    <button className="btn-accion btn-eliminar" onClick={() => handleDelete(proyecto.id)} aria-label={`Eliminar ${proyecto.nombre}`}>🗑️</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="celda-vacia">No se encontraron proyectos con los filtros actuales.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VistaTabla;