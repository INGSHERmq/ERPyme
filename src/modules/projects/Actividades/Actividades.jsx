import { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useRRHH from '../../../hooks/useRRHH';
import useTareas from '../../../hooks/useTareas';
import TareaModal from '../TareaModal/TareaModal';
import './Actividades.css';

const ItemTypes = { TAREA: 'tarea' };

const TareaCard = ({ tarea, onEdit, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TAREA,
    item: { id: tarea.id, estado: tarea.estado },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const prioridadColors = {
    Alta: 'badge-red',
    Media: 'badge-yellow',
    Baja: 'badge-green'
  };

  const isCompletada = tarea.estado === 'Completado';
  const cardStyle = {
    borderLeft: `4px solid ${tarea.color || '#0052cc'}`,
    opacity: isCompletada ? 0.7 : 1,
    backgroundColor: isCompletada ? '#f8f9fa' : 'white'
  };

  return (
    <div 
      ref={drag} 
      className={`tarea-card ${isDragging ? 'dragging' : ''} ${isCompletada ? 'completada' : ''}`}
      style={cardStyle}
      onDoubleClick={() => onEdit(tarea)}
    >
      <div className="card-header">
        <span className={`badge ${prioridadColors[tarea.prioridad] || 'badge-gray'}`}>
          {tarea.prioridad}
        </span>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => onEdit(tarea)}>✏️</button>
          <button className="btn-icon" onClick={() => onDelete(tarea.id)}>🗑️</button>
        </div>
      </div>
      <h4 className={isCompletada ? 'tachado' : ''}>{tarea.titulo}</h4>
      <p className="descripcion">{tarea.descripcion || 'Sin descripción'}</p>
      
      {tarea.empleado_nombre && (
        <div className="asignado">
          <span className="avatar-small">{tarea.empleado_nombre.charAt(0)}</span>
          <span>{tarea.empleado_nombre}</span>
        </div>
      )}
      
      <div className="card-footer">
        {tarea.fecha_fin && (
          <span className="fecha">📅 {new Date(tarea.fecha_fin).toLocaleDateString('es-ES')}</span>
        )}
      </div>
    </div>
  );
};

const Columna = ({ titulo, estado, tareas, onDrop, onEditTarea, onDeleteTarea }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TAREA,
    drop: (item) => onDrop(item.id, estado),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div ref={drop} className={`columna ${isOver ? 'active' : ''}`}>
      <h3>{titulo} <span className="count">{tareas.length}</span></h3>
      <div className="tareas-list">
        {tareas.map(t => (
          <TareaCard 
            key={t.id} 
            tarea={t} 
            onEdit={onEditTarea}
            onDelete={onDeleteTarea}
          />
        ))}
      </div>
    </div>
  );
};

const Actividades = ({ proyectoId }) => {
  const { asignaciones, empleados } = useRRHH();
  const { tareas, createTarea, updateTarea, deleteTarea, loading, refetch } = useTareas(proyectoId);
  
  const [vista, setVista] = useState('scrum');
  const [modalShow, setModalShow] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);

  // ✅ Obtener personal asignado al proyecto con NOMBRE COMPLETO
  const empleadosProyecto = useMemo(() => {
    if (!asignaciones || !empleados) return [];
    
    return asignaciones
      .filter(a => Number(a.proyecto_id) === Number(proyectoId) && a.estado === 'Activo')
      .map(asignacion => {
        // Buscar el empleado completo desde la lista de empleados
        const empleado = empleados.find(e => Number(e.id) === Number(asignacion.empleado_id));
        return {
          id: asignacion.empleado_id,
          empleado_nombre: empleado?.nombre || 'Sin nombre',
          rol: asignacion.rol
        };
      });
  }, [asignaciones, empleados, proyectoId]);

  const handleMoveTarea = async (id, nuevoEstado) => {
    try {
      await updateTarea(id, { estado: nuevoEstado });
      await refetch();
    } catch (error) {
      console.error('Error moviendo tarea:', error);
      alert('❌ Error al mover la tarea');
    }
  };

  const handleCreateTarea = async (tareaData) => {
    try {
      await createTarea(tareaData);
      await refetch();
      alert('✅ Tarea creada correctamente');
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('❌ Error al crear la tarea');
    }
  };

  const handleUpdateTarea = async (tareaData) => {
    try {
      await updateTarea(tareaEditando.id, tareaData);
      setTareaEditando(null);
      await refetch();
      alert('✅ Tarea actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert('❌ Error al actualizar la tarea');
    }
  };

  const handleDeleteTarea = async (id) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      try {
        await deleteTarea(id);
        alert('✅ Tarea eliminada correctamente');
      } catch (error) {
        console.error('Error eliminando tarea:', error);
        alert('❌ Error al eliminar la tarea');
      }
    }
  };

  const openModal = (tarea = null) => {
    setTareaEditando(tarea);
    setModalShow(true);
  };

  if (loading) return <div className="loading">Cargando tareas...</div>;

  const columnas = {
    Pendiente: tareas.filter(t => t.estado === 'Pendiente'),
    'En Progreso': tareas.filter(t => t.estado === 'En Progreso'),
    Completado: tareas.filter(t => t.estado === 'Completado')
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="actividades-container">
        <div className="vista-selector">
          <button className={vista === 'scrum' ? 'active' : ''} onClick={() => setVista('scrum')}>
            📋 Tablero
          </button>
          <button className={vista === 'lista' ? 'active' : ''} onClick={() => setVista('lista')}>
            📄 Lista
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            + Nueva Tarea
          </button>
        </div>

        {vista === 'scrum' ? (
          <div className="scrum-board">
            <Columna 
              titulo="Pendiente" 
              estado="Pendiente" 
              tareas={columnas.Pendiente} 
              onDrop={handleMoveTarea}
              onEditTarea={openModal}
              onDeleteTarea={handleDeleteTarea}
            />
            <Columna 
              titulo="En Progreso" 
              estado="En Progreso" 
              tareas={columnas['En Progreso']} 
              onDrop={handleMoveTarea}
              onEditTarea={openModal}
              onDeleteTarea={handleDeleteTarea}
            />
            <Columna 
              titulo="Completado" 
              estado="Completado" 
              tareas={columnas.Completado} 
              onDrop={handleMoveTarea}
              onEditTarea={openModal}
              onDeleteTarea={handleDeleteTarea}
            />
          </div>
        ) : (
          <div className="lista-vista">
            <table className="tareas-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Asignado a</th>
                  <th>Fecha Fin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map(t => (
                  <tr key={t.id}>
                    <td className="bold">{t.titulo}</td>
                    <td><span className={`badge badge-${t.estado === 'En Progreso' ? 'blue' : t.estado === 'Completado' ? 'green' : 'gray'}`}>{t.estado}</span></td>
                    <td><span className={`badge badge-${t.prioridad === 'Alta' ? 'red' : t.prioridad === 'Media' ? 'yellow' : 'green'}`}>{t.prioridad}</span></td>
                    <td>{t.empleado_nombre || 'Sin asignar'}</td>
                    <td>{t.fecha_fin ? new Date(t.fecha_fin).toLocaleDateString('es-ES') : '—'}</td>
                    <td>
                      <button className="btn-action" onClick={() => openModal(t)}>✏️</button>
                      <button className="btn-action" onClick={() => handleDeleteTarea(t.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TareaModal
          show={modalShow}
          onClose={() => {
            setModalShow(false);
            setTareaEditando(null);
          }}
          onSave={tareaEditando ? handleUpdateTarea : handleCreateTarea}
          tarea={tareaEditando}
          empleadosProyecto={empleadosProyecto}
        />
      </div>
    </DndProvider>
  );
};

export default Actividades;