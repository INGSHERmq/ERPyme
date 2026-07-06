import { useState } from 'react';
import { useAuth } from '../../../context/auth/useAuth';
import Resumen from '../resumen/Resumen';
import Actividades from '../Actividades/Actividades';
import Cronograma from '../Cronograma/Cronograma';
import Calendario from '../Calendario/Calendario';
import Personal from '../Personal/Personal';
import Herramientas from '../Herramientas/Herramientas';
import SubscriptionLock from '../../../components/SubscriptionLock';
import './ProyectoDetalle.css';

const ProyectoDetalle = ({ proyecto, onBack }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState('resumen');
  const tabs = [
    { id: 'resumen', feature: 'projects.summary', label: 'Resumen' },
    { id: 'actividades', feature: 'projects.activities', label: 'Actividades' },
    { id: 'cronograma', feature: 'projects.schedule', label: 'Cronograma' },
    { id: 'calendario', feature: 'projects.calendar', label: 'Calendario' },
    { id: 'personal', feature: 'projects.people', label: 'Personal' },
    { id: 'herramientas', feature: 'projects.tools', label: 'Herramientas' }
  ].map((item) => ({ ...item, locked: !canAccessFeature(item.feature) }));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;
  const activeTabConfig = tabs.find((item) => item.id === activeTab);

  const renderContent = () => {
    if (activeTabConfig?.locked) {
      return <SubscriptionLock title={`${activeTabConfig.label} está bloqueado`} />;
    }

    switch (activeTab) {
      case 'resumen': return <Resumen proyecto={proyecto} />;
      case 'actividades': return <Actividades proyectoId={proyecto.id} />;
      case 'cronograma': return <Cronograma proyectoId={proyecto.id} />;
      case 'calendario': return <Calendario proyectoId={proyecto.id} />;
      case 'personal': return <Personal proyectoId={proyecto.id} />;
      case 'herramientas': return <Herramientas proyectoId={proyecto.id} />;
      default: return <Resumen proyecto={proyecto} />;
    }
  };

  return (
    <div className="proyecto-detalle">
      <div className="detalle-header">
        <button onClick={onBack} className="btn-volver-lista">Volver a la lista</button>
        <div className="proyecto-info">
          <h1>{proyecto.nombre}</h1>
          <p>{proyecto.descripcion}</p>
        </div>
      </div>

      <nav className="detalle-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`${activeTab === item.id ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
            aria-disabled={item.locked}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="detalle-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProyectoDetalle;
