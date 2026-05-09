import { useState } from 'react';
import DashboardRRHH from './DashboardRRHH';
import DocumentosView from './DocumentosView';
import EmpleadosView from './EmpleadosView';
import AsignacionesView from './AsignacionesView';
import SSOMAView from './SSOMAView';
import './RRHHView.css';

const RRHHView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardRRHH />;
      case 'documentos': return <DocumentosView />;
      case 'empleados': return <EmpleadosView />;
      case 'asignaciones': return <AsignacionesView />;
      case 'accidentes': return <SSOMAView />;
      default: return <DashboardRRHH />;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-rrhh">
        <button onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>RRHH</h1>
        <p>Organiza documentos, empleados, asignaciones por tipo y registro de accidentes.</p>
      </section>
      <nav className="tabs-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Resumen</button>
        <button className={tab === 'documentos' ? 'active' : ''} onClick={() => setTab('documentos')}>Documentos</button>
        <button className={tab === 'empleados' ? 'active' : ''} onClick={() => setTab('empleados')}>Empleados</button>
        <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setTab('asignaciones')}>Personal en proyectos</button>
        <button className={tab === 'accidentes' ? 'active' : ''} onClick={() => setTab('accidentes')}>Registro de accidentes</button>
      </nav>
      <main className="content-area">{renderTab()}</main>
    </div>
  );
};

export default RRHHView;
