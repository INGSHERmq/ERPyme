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
      <section className="module-hero module-hero-marketing">
        <button onClick={onBack} className="module-hero-back" aria-label="Volver al inicio">
          Volver al inicio
        </button>
        <h1>Clientes y cotizaciones</h1>
        <p>Gestiona clientes, oportunidades comerciales, cotizaciones y conversiones a proyectos.</p>
      </section>

      <nav className="tabs-nav" role="tablist">
        <button role="tab" aria-selected={tab === 'dashboard'} className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          Resumen
        </button>
        <button role="tab" aria-selected={tab === 'clientes'} className={tab === 'clientes' ? 'active' : ''} onClick={() => setTab('clientes')}>
          Clientes
        </button>
        <button role="tab" aria-selected={tab === 'cotizaciones'} className={tab === 'cotizaciones' ? 'active' : ''} onClick={() => setTab('cotizaciones')}>
          Cotizaciones
        </button>
      </nav>

      <main className="content-area" role="tabpanel">
        {renderTab()}
      </main>
    </div>
  );
};

export default MarketingView;
