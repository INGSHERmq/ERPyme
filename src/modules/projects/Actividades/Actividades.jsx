import { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import useRRHH from '../../../hooks/useRRHH';
import useTareas from '../../../hooks/useTareas';
import { formatDateOnlyInAppTimeZone, getTodayInAppTimeZone } from '../../../lib/dates';
import TareaModal from '../TareaModal/TareaModal';
import { useNotification } from '../../../context/NotificationContext';
import './Actividades.css';

const TareaCard = ({ tarea, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(tarea.id),
    data: { estado: tarea.estado }
  });

  const prioridadColors = {
    Alta: 'badge-red',
    Media: 'badge-yellow',
    Baja: 'badge-green'
  };

  const isCompletada = tarea.estado === 'Completado';
  const todayStr = getTodayInAppTimeZone();
  const isAtrasada = !isCompletada && tarea.fecha_fin && (tarea.fecha_fin.slice(0, 10) < todayStr);

  const retrasoDays = useMemo(() => {
    if (!isAtrasada || !tarea.fecha_fin) return 0;
    const diffTime = Math.abs(new Date(todayStr) - new Date(tarea.fecha_fin.slice(0, 10)));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [isAtrasada, tarea.fecha_fin, todayStr]);

  const cardStyle = {
    borderLeft: `5px solid ${tarea.color || '#ff4d8b'}`,
    opacity: isCompletada ? 0.7 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
  };

  return (
    <article
      ref={setNodeRef}
      className={`tarea-card ${isDragging ? 'dragging' : ''} ${isCompletada ? 'completada' : ''} ${isAtrasada ? 'atrasada' : ''}`}
      style={cardStyle}
      onDoubleClick={() => onEdit(tarea)}
      {...listeners}
      {...attributes}
    >
      <div className="card-header">
        <div className="header-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`badge ${prioridadColors[tarea.prioridad] || 'badge-gray'}`}>
            {tarea.prioridad}
          </span>
          {isAtrasada && (
            <span className="badge badge-delayed">
              ⚠️ Retrasada: {retrasoDays}d
            </span>
          )}
        </div>
        <div className="card-actions">
          <button type="button" className="btn-icon" onClick={() => onEdit(tarea)} aria-label="Editar tarea">
            Editar
          </button>
          <button type="button" className="btn-icon" onClick={() => onDelete(tarea.id)} aria-label="Eliminar tarea">
            Eliminar
          </button>
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

      {isAtrasada && (
        <div className="ai-recommendation-badge">
          <span>🧠 Sugerencia IA: Reasignar apoyo o contactar a {tarea.empleado_nombre || 'el responsable'} para asistirle con esta tarea.</span>
        </div>
      )}

      <div className="card-footer">
        {tarea.fecha_inicio && (
          <span className="fecha">Inicio: {formatDateOnlyInAppTimeZone(tarea.fecha_inicio)}</span>
        )}
        {tarea.fecha_fin && (
          <span className={`fecha ${isAtrasada ? 'fecha-danger' : ''}`}>Fin: {formatDateOnlyInAppTimeZone(tarea.fecha_fin)}</span>
        )}
        {tarea.duracion_horas !== null && tarea.duracion_horas !== undefined && tarea.duracion_horas !== '' && (
          <span className={`fecha ${isAtrasada ? 'fecha-danger' : ''}`}>Duración: {Number(tarea.duracion_horas).toLocaleString('es-PE')} h</span>
        )}
      </div>
    </article>
  );
};

const Columna = ({ titulo, estado, tareas, onEditTarea, onDeleteTarea }) => {
  const { isOver, setNodeRef } = useDroppable({ id: estado });

  return (
    <section ref={setNodeRef} className={`columna columna-${estado.toLowerCase().replace(/\s+/g, '-')} ${isOver ? 'active' : ''}`} aria-label={titulo}>
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
    </section>
  );
};

const Actividades = ({ proyectoId }) => {
  const { asignaciones, empleados } = useRRHH();
  const { tareas, createTarea, updateTarea, deleteTarea, loading, refetch } = useTareas(proyectoId);
  const { showConfirm } = useNotification();

  const [vista, setVista] = useState('scrum');
  const [modalShow, setModalShow] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const empleadosProyecto = useMemo(() => {
    if (!asignaciones || !empleados) return [];

    return asignaciones
      .filter(a => Number(a.proyecto_id) === Number(proyectoId) && a.estado === 'Activo')
      .map(asignacion => {
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
      alert('No se pudo mover la tarea');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const currentState = active.data.current?.estado;
    const nextState = over.id;
    if (!nextState || currentState === nextState) return;

    handleMoveTarea(Number(active.id), nextState);
  };

  const handleCreateTarea = async (tareaData) => {
    try {
      await createTarea(tareaData);
      await refetch();
      alert('Tarea creada correctamente');
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('No se pudo crear la tarea');
    }
  };

  const handleUpdateTarea = async (tareaData) => {
    try {
      await updateTarea(tareaEditando.id, tareaData);
      setTareaEditando(null);
      await refetch();
      alert('Tarea actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert('No se pudo actualizar la tarea');
    }
  };

  const handleDeleteTarea = async (id) => {
    const confirmed = await showConfirm('¿Eliminar esta tarea?', 'Confirmar Eliminación');
    if (confirmed) {
      try {
        await deleteTarea(id);
        alert('Tarea eliminada correctamente');
      } catch (error) {
        console.error('Error eliminando tarea:', error);
        alert('No se pudo eliminar la tarea');
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="actividades-container">
        <div className="vista-selector">
          <button type="button" className={vista === 'scrum' ? 'active' : ''} onClick={() => setVista('scrum')}>
            Tablero
          </button>
          <button type="button" className={vista === 'lista' ? 'active' : ''} onClick={() => setVista('lista')}>
            Lista
          </button>
          <button type="button" className="btn-primary" onClick={() => openModal()}>
            + Nueva Tarea
          </button>
        </div>

        {vista === 'scrum' ? (
          <div className="scrum-board">
            <Columna
              titulo="Pendiente"
              estado="Pendiente"
              tareas={columnas.Pendiente}
              onEditTarea={openModal}
              onDeleteTarea={handleDeleteTarea}
            />
            <Columna
              titulo="En Progreso"
              estado="En Progreso"
              tareas={columnas['En Progreso']}
              onEditTarea={openModal}
              onDeleteTarea={handleDeleteTarea}
            />
            <Columna
              titulo="Completado"
              estado="Completado"
              tareas={columnas.Completado}
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
                  <th>Duración</th>
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
                    <td>{t.fecha_fin ? formatDateOnlyInAppTimeZone(t.fecha_fin) : '-'}</td>
                    <td>{t.duracion_horas ? `${Number(t.duracion_horas).toLocaleString('es-PE')} h` : '-'}</td>
                    <td>
                      <button type="button" className="btn-action" onClick={() => openModal(t)}>Editar</button>
                      <button type="button" className="btn-action" onClick={() => handleDeleteTarea(t.id)}>Eliminar</button>
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
    </DndContext>
  );
};

export default Actividades;
