import { useState } from 'react';
import FacturasCompraView from './FacturasCompraView';
import FacturasVentaView from './FacturasVentaView';
import AnaliticaProyectoView from './AnaliticaProyectoView';
import './FinanzasView.css';

const FinanzasView = ({ onBack }) => {
  const [tab, setTab] = useState('facturas-compra');

  const renderTab = () => {
    switch (tab) {
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
        <button role="tab" aria-selected={tab === 'facturas-compra'} className={tab === 'facturas-compra' ? 'active' : ''} onClick={() => setTab('facturas-compra')}>Facturas compra</button>
        <button role="tab" aria-selected={tab === 'facturas-venta'} className={tab === 'facturas-venta' ? 'active' : ''} onClick={() => setTab('facturas-venta')}>Facturas venta</button>
        <button role="tab" aria-selected={tab === 'analitica'} className={tab === 'analitica' ? 'active' : ''} onClick={() => setTab('analitica')}>Analitica proyecto</button>
      </nav>

      <main className="content-area" role="tabpanel">
        {renderTab()}
      </main>
    </div>
  );
};

export default FinanzasView;
