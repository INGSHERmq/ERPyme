import { useState } from 'react';
import DashboardFinanzas from './DashboardFinanzas';
import IngresosView from './IngresosView';
import EgresosView from './EgresosView';
import CuentasPorCobrarView from './CuentasPorCobrarView';
import './FinanzasView.css';

const FinanzasView = ({ onBack }) => {
  const [tab, setTab] = useState('dashboard');

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardFinanzas />;
      case 'ingresos': return <IngresosView />;
      case 'egresos': return <EgresosView />;
      case 'cuentas': return <CuentasPorCobrarView />;
      default: return <DashboardFinanzas />;
    }
  };

  return (
    <div className="module-container">
      <button onClick={onBack} className="btn-back" aria-label="Volver al inicio">
        Volver al inicio
      </button>

      <nav className="tabs-nav" role="tablist">
        <button role="tab" aria-selected={tab === 'dashboard'} className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Resumen</button>
        <button role="tab" aria-selected={tab === 'ingresos'} className={tab === 'ingresos' ? 'active' : ''} onClick={() => setTab('ingresos')}>Ingresos</button>
        <button role="tab" aria-selected={tab === 'egresos'} className={tab === 'egresos' ? 'active' : ''} onClick={() => setTab('egresos')}>Gastos</button>
        <button role="tab" aria-selected={tab === 'cuentas'} className={tab === 'cuentas' ? 'active' : ''} onClick={() => setTab('cuentas')}>Por cobrar</button>
      </nav>

      <main className="content-area" role="tabpanel">
        {renderTab()}
      </main>
    </div>
  );
};

export default FinanzasView;
