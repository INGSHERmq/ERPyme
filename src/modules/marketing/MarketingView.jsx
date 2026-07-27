import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import DashboardMarketing from './DashboardMarketing';
import CotizacionesView from './CotizacionesView';
import CRMView from './CRMView';
import LeadScoringView from './LeadScoringView';
import SubscriptionLock from '../../components/SubscriptionLock';
import './MarketingView.css';

const MarketingView = ({ onBack, initialTab }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState(initialTab || 'dashboard');
  const tabs = [
    { id: 'dashboard', feature: 'ventas.summary', label: 'Resumen' },
    { id: 'crm', feature: 'ventas.leads', label: 'Clientes' },
    { id: 'cotizaciones', feature: 'ventas.quotes', label: 'Cotizaciones' },
    { id: 'scoring', feature: 'ventas.scoring', label: 'Scoring cotizaciones' }
  ].map((item) => ({ ...item, locked: !canAccessFeature(item.feature) }));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;
  const activeTabConfig = tabs.find((item) => item.id === activeTab);

  const renderTab = () => {
    if (activeTabConfig?.locked) {
      return <SubscriptionLock title={`${activeTabConfig.label} está bloqueado`} />;
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardMarketing />;
      case 'cotizaciones': return <CotizacionesView />;
      case 'crm': return <CRMView />;
      case 'scoring': return <LeadScoringView />;
      default: return <DashboardMarketing />;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-marketing">
        <button onClick={onBack} className="module-hero-back" aria-label="Volver al inicio">
          Volver al inicio
        </button>
        <h1>Ventas</h1>
        <p>Gestiona tus clientes, cotizaciones y su conversión automática a proyectos aprobados.</p>
      </section>

      <nav className="tabs-nav" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-disabled={item.locked}
            className={`${activeTab === item.id ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="content-area" role="tabpanel">
        {renderTab()}
      </main>
    </div>
  );
};

export default MarketingView;
