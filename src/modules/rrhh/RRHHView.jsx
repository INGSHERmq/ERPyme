import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import DashboardRRHH from './DashboardRRHH';
import DocumentosView from './DocumentosView';
import EmpleadosView from './EmpleadosView';
import AsignacionesView from './AsignacionesView';
import SSOMAView from './SSOMAView';
import './RRHHView.css';

const RRHHView = ({ onBack }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard', feature: 'rrhh.summary', label: 'Resumen' },
    { id: 'documentos', feature: 'rrhh.documents', label: 'Documentos' },
    { id: 'empleados', feature: 'rrhh.employees', label: 'Empleados' },
    { id: 'asignaciones', feature: 'rrhh.assignments', label: 'Personal en proyectos' },
    { id: 'accidentes', feature: 'rrhh.accidents', label: 'Registro de accidentes' }
  ].filter((item) => canAccessFeature(item.feature));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardRRHH />;
      case 'documentos': return <DocumentosView />;
      case 'empleados': return <EmpleadosView />;
      case 'asignaciones': return <AsignacionesView />;
      case 'accidentes': return <SSOMAView />;
      default: return null;
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
        {tabs.map((item) => (
          <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>
        ))}
      </nav>
      <main className="content-area">
        {tabs.length ? renderTab() : <div className="empty-state">No tienes apartados habilitados en RRHH.</div>}
      </main>
    </div>
  );
};

export default RRHHView;
