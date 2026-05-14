import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import FacturasCompraView from './FacturasCompraView';
import FacturasVentaView from './FacturasVentaView';
import AnaliticaProyectoView from './AnaliticaProyectoView';
import './FinanzasView.css';

const FinanzasView = ({ onBack }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState('facturas-compra');
  const tabs = [
    { id: 'facturas-compra', feature: 'contabilidad.purchases', label: 'Facturas compra' },
    { id: 'facturas-venta', feature: 'contabilidad.sales', label: 'Facturas venta' },
    { id: 'analitica', feature: 'contabilidad.analytics', label: 'Analitica proyecto' }
  ].filter((item) => canAccessFeature(item.feature));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;

  const renderTab = () => {
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
        <p>Facturas de compra, facturas de venta y analitica de ganancia/perdida por proyecto.</p>
      </section>

      <nav className="tabs-nav" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} role="tab" aria-selected={activeTab === item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>

      <main className="content-area" role="tabpanel">
        {tabs.length ? renderTab() : <div className="empty-state">No tienes apartados habilitados en contabilidad.</div>}
      </main>
    </div>
  );
};

export default FinanzasView;
