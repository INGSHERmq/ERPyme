import { useState } from 'react';
import useProjects from "../../hooks/useProjects";
import ListaProyectos from './Lista/ListaProyectos';
import ProyectoDetalle from './Detalle/ProyectoDetalle';
import LoadingScreen from '../../components/LoadingScreen';

const ProjectsView = ({ onBack }) => {
  const { proyectos, loading, updateProyecto } = useProjects();
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  if (loading) return <LoadingScreen message="Cargando proyectos..." />;

  return (
    <div className="module-container">
      {/* Botón para volver al Home siempre visible */}
      {!proyectoSeleccionado && (
        <button onClick={onBack} className="btn-back">← Volver al Inicio</button>
      )}

      {proyectoSeleccionado ? (
        <ProyectoDetalle 
          proyecto={proyectoSeleccionado} 
          onBack={() => setProyectoSeleccionado(null)} 
        />
      ) : (
        <ListaProyectos 
          proyectos={proyectos} 
          onSelect={setProyectoSeleccionado} 
          onComplete={async (proyecto) => {
            const ok = await updateProyecto(proyecto.id, { estado: 'Completado', progreso: 100 });
            if (ok) setProyectoSeleccionado(null);
            return ok;
          }}
        />
      )}
    </div>
  );
};

export default ProjectsView;
