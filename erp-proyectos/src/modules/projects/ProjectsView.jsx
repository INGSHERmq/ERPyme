import { useState } from 'react';
import useProjects from '../../hooks/useProjects';
import '../../App.css';

// Componentes de las vistas
import VistaScrum from './scrum/VistaScrum';
import VistaTabla from './table/VistaTabla';
import VistaGantt from './gantt/VistaGantt';
import VistaCalendario from './calendar/VistaCalendario';
import VistaGrafico from './charts/VistaGrafico';

const ProjectsView = ({ onBack }) => {
  const [vistaActiva, setVistaActiva] = useState('scrum');
  const { proyectos, loading, error } = useProjects();

  const renderizarVista = () => {
    if (loading) return <div className="loading">Cargando proyectos...</div>;
    if (error) return <div className="error">{error}</div>;

    switch (vistaActiva) {
      case 'grafico': return <VistaGrafico proyectos={proyectos} />;
      case 'scrum': return <VistaScrum proyectos={proyectos} />;
      case 'tabla': return <VistaTabla proyectos={proyectos} />;
      case 'gantt': return <VistaGantt proyectos={proyectos} />;
      case 'calendario': return <VistaCalendario proyectos={proyectos} />;
      default: return <VistaScrum proyectos={proyectos} />;
    }
  };

  return (
    <div className="erp-container">
      {/* Botón para volver al Home */}
      <div className="module-header">
        <button onClick={onBack} className="btn-volver">
          <span className="icon">←</span>
          <span>Volver al Inicio</span>
        </button>
      </div>

      <nav className="tabs-nav">
        <button 
          className={vistaActiva === 'grafico' ? 'active' : ''} 
          onClick={() => setVistaActiva('grafico')}
          type="button"
        >
          📊 Gráfico
        </button>
        
        <button 
          className={vistaActiva === 'scrum' ? 'active' : ''} 
          onClick={() => setVistaActiva('scrum')}
          type="button"
        >
          📋 Tabla Scrum
        </button>
        
        <button 
          className={vistaActiva === 'tabla' ? 'active' : ''} 
          onClick={() => setVistaActiva('tabla')}
          type="button"
        >
          📑 Tabla
        </button>
        
        <button 
          className={vistaActiva === 'gantt' ? 'active' : ''} 
          onClick={() => setVistaActiva('gantt')}
          type="button"
        >
          📅 Diagrama de Gantt
        </button>
        
        <button 
          className={vistaActiva === 'calendario' ? 'active' : ''} 
          onClick={() => setVistaActiva('calendario')}
          type="button"
        >
          🗓️ Calendario
        </button>
      </nav>

      <main className="content-area">
        {renderizarVista()}
      </main>
    </div>
  );
};

export default ProjectsView;