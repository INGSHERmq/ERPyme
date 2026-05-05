import { useState } from 'react';
import DashboardMarketing from './DashboardMarketing';
import ClientesView from './ClientesView';
import CotizacionesView from './CotizacionesView';
import './MarketingView.css';

const MarketingView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardMarketing />;
      case 'clientes': return <ClientesView />;
      case 'cotizaciones': return <CotizacionesView />;
      default: return <DashboardMarketing />;
    }
  };

  return (
    <div className="module-container">
      <button onClick={onBack} className="btn-back" aria-label="Volver al inicio">
        ← Volver al Inicio
      </button>

      <nav className="tabs-nav" role="tablist">
        <button 
          role="tab"
          aria-selected={tab === 'dashboard'}
          className={tab === 'dashboard' ? 'active' : ''} 
          onClick={() => setTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          role="tab"
          aria-selected={tab === 'clientes'}
          className={tab === 'clientes' ? 'active' : ''} 
          onClick={() => setTab('clientes')}
        >
          👥 Clientes
        </button>
        <button 
          role="tab"
          aria-selected={tab === 'cotizaciones'}
          className={tab === 'cotizaciones' ? 'active' : ''} 
          onClick={() => setTab('cotizaciones')}
        >
          📄 Cotizaciones
        </button>
      </nav>

      <main className="content-area" role="tabpanel">
        {renderTab()}
      </main>
    </div>
  );
};

export default MarketingView;