import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable, // <--- Importamos esto para las columnas
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useProjects from '../../../hooks/useProjects';
import './VistaScrum.css';

// Definimos las columnas
const COLUMNAS = {
  Pendiente: { title: ' Pendiente', color: '#e0e0e0' },
  'En Progreso': { title: '🔄 En Progreso', color: '#fff3cd' },
  Completado: { title: '✅ Completado', color: '#d4edda' },
};

// Componente de Tarjeta (Draggable)
const TarjetaProyecto = ({ proyecto }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proyecto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Se aclara al arrastrar
    cursor: 'grab',
  };

  const prioridadColors = {
    Alta: '#dc3545',
    Media: '#ffc107',
    Baja: '#28a745',
  };

  return (
    <div ref={setNodeRef} style={style} className="tarjeta-proyecto" {...attributes} {...listeners}>
      <div className="tarjeta-header">
        <h4>{proyecto.nombre}</h4>
        <span className="prioridad-badge" style={{ backgroundColor: prioridadColors[proyecto.prioridad] || '#6c757d' }}>
          {proyecto.prioridad}
        </span>
      </div>
      <p className="tarjeta-descripcion">{proyecto.descripcion}</p>
      <div className="tarjeta-fechas">
        <small>📅 {proyecto.inicio} - {proyecto.fin}</small>
      </div>
      <div className="tarjeta-cliente">
        <small>👤 {proyecto.clienteNombre}</small>
      </div>
    </div>
  );
};

// Componente de Columna (Droppable)
const Columna = ({ id, proyectos }) => {
  // Hacemos que la columna sea un destino de drop
  const { setNodeRef, isOver } = useDroppable({ id: id });

  const columna = COLUMNAS[id];

  return (
    <div 
      ref={setNodeRef} 
      className={`columna ${isOver ? 'columna-destacada' : ''}`} 
      style={{ backgroundColor: isOver ? '#e8f0fe' : columna.color }} // Cambia color al pasar por encima
    >
      <h3 className="columna-titulo">{columna.title}</h3>
      <div className="columna-contenido">
        {proyectos.map((proyecto) => (
          <TarjetaProyecto key={proyecto.id} proyecto={proyecto} />
        ))}
        {proyectos.length === 0 && <div className="columna-vacia"><p>Soltar aquí</p></div>}
      </div>
    </div>
  );
};

const VistaScrum = () => {
  const { proyectos, updateProyecto } = useProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Sensibilidad del mouse
    })
  );

  // Agrupar por estado
  const proyectosPorColumna = {
    Pendiente: proyectos.filter(p => p.estado === 'Pendiente'),
    'En Progreso': proyectos.filter(p => p.estado === 'En Progreso'),
    Completado: proyectos.filter(p => p.estado === 'Completado'),
  };

  // Lógica principal al soltar
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over) {
      const proyectoId = active.id;
      const nuevaColumna = over.id; // El ID del destino (es el ID de la columna)

      // Verificar si se soltó en una columna válida y si cambió de estado
      if (COLUMNAS[nuevaColumna]) {
        const proyecto = proyectos.find(p => p.id === proyectoId);
        
        if (proyecto && proyecto.estado !== nuevaColumna) {
          try {
            // Actualizamos en el backend y en el contexto
            await updateProyecto(proyectoId, { estado: nuevaColumna });
          } catch (error) {
            console.error('Error al actualizar:', error);
          }
        }
      }
    }
  };

  return (
    <div className="vista-scrum">
      <div className="scrum-header">
        <h2>📋 Tabla Scrum</h2>
        <span className="total-proyectos">Total: {proyectos.length} proyectos</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="scrum-board">
          {Object.keys(COLUMNAS).map((colId) => (
            <Columna key={colId} id={colId} proyectos={proyectosPorColumna[colId]} />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default VistaScrum;