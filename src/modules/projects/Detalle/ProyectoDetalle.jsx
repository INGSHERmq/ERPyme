import { useState } from 'react';
import Resumen from '../resumen/Resumen';
import Actividades from '../Actividades/Actividades';
import Cronograma from '../Cronograma/Cronograma';
import Calendario from '../Calendario/Calendario';
import Personal from '../Personal/Personal';
import Herramientas from '../Herramientas/Herramientas';
import './ProyectoDetalle.css';

const ProyectoDetalle = ({ proyecto, onBack }) => {
  const [tab, setTab] = useState('resumen');

  const renderContent = () => {
    switch (tab) {
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
        <button className={tab === 'resumen' ? 'active' : ''} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'actividades' ? 'active' : ''} onClick={() => setTab('actividades')}>Actividades</button>
        <button className={tab === 'cronograma' ? 'active' : ''} onClick={() => setTab('cronograma')}>Cronograma</button>
        <button className={tab === 'calendario' ? 'active' : ''} onClick={() => setTab('calendario')}>Calendario</button>
        <button className={tab === 'personal' ? 'active' : ''} onClick={() => setTab('personal')}>Personal</button>
        <button className={tab === 'herramientas' ? 'active' : ''} onClick={() => setTab('herramientas')}>Herramientas</button>
      </nav>

      <main className="detalle-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProyectoDetalle;
