import { useState } from 'react';
import DashboardLogistica from './DashboardLogistica';
import InventarioView from './InventarioView';
import AsignacionesView from './AsignacionesView';
import MantenimientoView from './MantenimientoView';
import './LogisticaView.css';

const LogisticaView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardLogistica />;
      case 'inventario': return <InventarioView />;
      case 'asignaciones': return <AsignacionesView />;
      case 'mantenimiento': return <MantenimientoView />;
      default: return <DashboardLogistica />;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-logistica">
        <button onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>Logistica</h1>
        <p>Administra equipos, inventario operativo, prestamos, guias y mantenimientos.</p>
      </section>
      <nav className="tabs-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Resumen</button>
        <button className={tab === 'inventario' ? 'active' : ''} onClick={() => setTab('inventario')}>Equipos</button>
        <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setTab('asignaciones')}>Prestamos</button>
        <button className={tab === 'mantenimiento' ? 'active' : ''} onClick={() => setTab('mantenimiento')}>Mantenimiento</button>
      </nav>
      <main className="content-area">{renderTab()}</main>
    </div>
  );
};

export default LogisticaView;
