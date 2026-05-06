import { Suspense, lazy, useState } from 'react';
import { useAuth } from './context/auth/useAuth';
import Login from './components/Login/Login';
import Home from './Home';

const ProjectsView = lazy(() => import('./modules/projects/ProjectsView'));
const MarketingView = lazy(() => import('./modules/marketing/MarketingView'));
const FinanzasView = lazy(() => import('./modules/finanzas/FinanzasView'));
const RRHHView = lazy(() => import('./modules/rrhh/RRHHView'));
const LogisticaView = lazy(() => import('./modules/logistica/LogisticaView'));
const VentasView = lazy(() => import('./modules/erpExtras/views/VentasView'));
const ComprasView = lazy(() => import('./modules/erpExtras/views/ComprasView'));
const FacturacionView = lazy(() => import('./modules/erpExtras/views/FacturacionView'));
const InventarioOperativoView = lazy(() => import('./modules/erpExtras/views/InventarioOperativoView'));
const CajaBancosView = lazy(() => import('./modules/erpExtras/views/CajaBancosView'));
const ReportesGerencialesView = lazy(() => import('./modules/erpExtras/views/ReportesGerencialesView'));
const PermisosAuditoriaView = lazy(() => import('./modules/erpExtras/views/PermisosAuditoriaView'));
const DocumentosAdjuntosView = lazy(() => import('./modules/erpExtras/views/DocumentosAdjuntosView'));
const NotificacionesView = lazy(() => import('./modules/erpExtras/views/NotificacionesView'));
const ImportacionExportacionView = lazy(() => import('./modules/erpExtras/views/ImportacionExportacionView'));
const AssistantView = lazy(() => import('./modules/assistant/AssistantView'));

function App() {
  const { isAuthenticated, loading: authLoading, profile, signOut } = useAuth();
  const [module, setModule] = useState('home');

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Cargando ERPyme...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  const back = () => setModule('home');

  return (
    <div className="app">
      <main className="app-content">
        <Suspense fallback={<div className="loading">Cargando area...</div>}>
          {module === 'home' && <Home onNavigate={setModule} profile={profile} signOut={signOut} />}
          {module === 'projects' && <ProjectsView onBack={back} />}
          {module === 'marketing' && <MarketingView onBack={back} />}
          {module === 'finanzas' && <FinanzasView onBack={back} />}
          {module === 'rrhh' && <RRHHView onBack={back} />}
          {module === 'logistica' && <LogisticaView onBack={back} />}
          {module === 'ventas' && <VentasView onBack={back} />}
          {module === 'compras' && <ComprasView onBack={back} />}
          {module === 'facturacion' && <FacturacionView onBack={back} />}
          {module === 'inventario-operativo' && <InventarioOperativoView onBack={back} />}
          {module === 'caja-bancos' && <CajaBancosView onBack={back} />}
          {module === 'reportes' && <ReportesGerencialesView onBack={back} />}
          {module === 'permisos-auditoria' && <PermisosAuditoriaView onBack={back} />}
          {module === 'documentos' && <DocumentosAdjuntosView onBack={back} />}
          {module === 'notificaciones' && <NotificacionesView onBack={back} />}
          {module === 'importacion' && <ImportacionExportacionView onBack={back} />}
          {module === 'assistant' && <AssistantView onBack={back} />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
