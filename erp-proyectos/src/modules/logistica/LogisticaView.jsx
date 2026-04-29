import { useState } from 'react';
import DashboardLogistica from './DashboardLogistica';
import InventarioView from './InventarioView';
import AsignacionesView from './AsignacionesView';
import MantenimientoView from './MantenimientoView';
import GuiasView from './GuiasView';
import './LogisticaView.css';

const LogisticaView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardLogistica />;
      case 'inventario': return <InventarioView />;
      case 'asignaciones': return <AsignacionesView />;
      case 'mantenimiento': return <MantenimientoView />;
      case 'guias': return <GuiasView />;
      default: return <DashboardLogistica />;
    }
  };

  return (
    <div className="module-container">
      <button onClick={onBack} className="btn-back">← Volver al Inicio</button>
      <nav className="tabs-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>📊 Dashboard</button>
        <button className={tab === 'inventario' ? 'active' : ''} onClick={() => setTab('inventario')}>📦 Inventario</button>
        <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setTab('asignaciones')}>🔗 Asignaciones</button>
        <button className={tab === 'mantenimiento' ? 'active' : ''} onClick={() => setTab('mantenimiento')}>🛠️ Mantenimiento</button>
        <button className={tab === 'guias' ? 'active' : ''} onClick={() => setTab('guias')}>🚚 Guías de Salida</button>
      </nav>
      <main className="content-area">{renderTab()}</main>
    </div>
  );
};

export default LogisticaView;