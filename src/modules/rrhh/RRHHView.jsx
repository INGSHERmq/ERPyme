import { useState } from 'react';
import DashboardRRHH from './DashboardRRHH';
import EmpleadosView from './EmpleadosView';
import AsistenciasView from './AsistenciasView';
import AsignacionesView from './AsignacionesView';
import SSOMAView from './SSOMAView';
import './RRHHView.css';

const RRHHView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardRRHH />;
      case 'empleados': return <EmpleadosView />;
      case 'asistencias': return <AsistenciasView />;
      case 'asignaciones': return <AsignacionesView />;
      case 'ssoma': return <SSOMAView />;
      default: return <DashboardRRHH />;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-rrhh">
        <button onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>Recursos Humanos</h1>
        <p>Organiza empleados, asistencias, asignaciones a proyectos y seguridad ocupacional.</p>
      </section>
      <nav className="tabs-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Resumen</button>
        <button className={tab === 'empleados' ? 'active' : ''} onClick={() => setTab('empleados')}>Empleados</button>
        <button className={tab === 'asistencias' ? 'active' : ''} onClick={() => setTab('asistencias')}>Asistencias</button>
        <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setTab('asignaciones')}>Personal en proyectos</button>
        <button className={tab === 'ssoma' ? 'active' : ''} onClick={() => setTab('ssoma')}>Seguridad</button>
      </nav>
      <main className="content-area">{renderTab()}</main>
    </div>
  );
};

export default RRHHView;
