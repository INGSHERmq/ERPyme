import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import FacturasCompraView from './FacturasCompraView';
import FacturasVentaView from './FacturasVentaView';
import AnaliticaProyectoView from './AnaliticaProyectoView';
import SubscriptionLock from '../../components/SubscriptionLock';
import './FinanzasView.css';

const FinanzasView = ({ onBack, initialTab }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState(initialTab || 'facturas-compra');
  const tabs = [
    { id: 'facturas-compra', feature: 'contabilidad.purchases', label: 'Facturas compra' },
    { id: 'facturas-venta', feature: 'contabilidad.sales', label: 'Facturas venta' },
    { id: 'analitica', feature: 'contabilidad.analytics', label: 'Analítica proyecto' }
  ].map((item) => ({ ...item, locked: !canAccessFeature(item.feature) }));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;
  const activeTabConfig = tabs.find((item) => item.id === activeTab);

  const renderTab = () => {
    if (activeTabConfig?.locked) {
      return <SubscriptionLock title={`${activeTabConfig.label} está bloqueado`} />;
    }

    switch (activeTab) {
      case 'facturas-compra':
        return <FacturasCompraView />;
      case 'facturas-venta':
        return <FacturasVentaView />;
      case 'analitica':
        return <AnaliticaProyectoView />;
      default:
        return null;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-finanzas">
        <button onClick={onBack} className="module-hero-back" aria-label="Volver al inicio">
          Volver al inicio
        </button>
        <h1>Contabilidad</h1>
        <p>Facturas de compra, facturas de venta y analítica de ganancia/pérdida por proyecto.</p>
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

export default FinanzasView;
