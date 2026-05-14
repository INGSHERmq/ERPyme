import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import DashboardMarketing from './DashboardMarketing';
import ClientesView from './ClientesView';
import CotizacionesView from './CotizacionesView';
import CRMView from './CRMView';
import LeadScoringView from './LeadScoringView';
import './MarketingView.css';

const MarketingView = ({ onBack }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard', feature: 'ventas.summary', label: 'Resumen' },
    { id: 'crm', feature: 'ventas.leads', label: 'Leads' },
    { id: 'cotizaciones', feature: 'ventas.quotes', label: 'Cotizaciones' },
    { id: 'clientes', feature: 'ventas.clients', label: 'Clientes' },
    { id: 'scoring', feature: 'ventas.scoring', label: 'Scoring cotizaciones' }
  ].filter((item) => canAccessFeature(item.feature));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardMarketing />;
      case 'clientes': return <ClientesView />;
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
        <p>Gestiona leads, cotizaciones y su conversion automatica a proyectos aprobados.</p>
      </section>

      <nav className="tabs-nav" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} role="tab" aria-selected={activeTab === item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>

      <main className="content-area" role="tabpanel">
        {tabs.length ? renderTab() : <div className="empty-state">No tienes apartados habilitados en ventas.</div>}
      </main>
    </div>
  );
};

export default MarketingView;
