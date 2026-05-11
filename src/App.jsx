import { Suspense, lazy, useState } from 'react';
import { useAuth } from './context/auth/useAuth';
import Login from './components/Login/Login';
import Home from './Home';

const ProjectsView = lazy(() => import('./modules/projects/ProjectsView'));
const MarketingView = lazy(() => import('./modules/marketing/MarketingView'));
const FinanzasView = lazy(() => import('./modules/finanzas/FinanzasView'));
const RRHHView = lazy(() => import('./modules/rrhh/RRHHView'));
const LogisticaView = lazy(() => import('./modules/logistica/LogisticaView'));
const AssistantView = lazy(() => import('./modules/assistant/AssistantView'));
const AdminView = lazy(() => import('./modules/admin/AdminView'));

function App() {
  const {
    isAuthenticated,
    loading: authLoading,
    profile,
    signOut,
    enabledModules,
    canAccessAdminPanel
  } = useAuth();
  const [module, setModule] = useState('home');

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-logo">E</div>
        <div className="loading-bar-container">
          <div className="loading-bar-progress"></div>
        </div>
        <p>Cargando ERPyme...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  if (canAccessAdminPanel) {
    return (
      <div className="app">
        <main className="app-content">
          <Suspense fallback={<div className="loading">Cargando área...</div>}>
            <AdminView signOut={signOut} />
          </Suspense>
        </main>
      </div>
    );
  }

  const back = () => setModule('home');

  return (
    <div className="app">
      <main className="app-content">
        <Suspense fallback={<div className="loading">Cargando área...</div>}>
          {module === 'home' && (
            <Home
              onNavigate={setModule}
              profile={profile}
              signOut={signOut}
              enabledModules={enabledModules}
            />
          )}
          {module === 'projects' && <ProjectsView onBack={back} />}
          {module === 'ventas' && <MarketingView onBack={back} />}
          {module === 'contabilidad' && <FinanzasView onBack={back} />}
          {module === 'rrhh' && <RRHHView onBack={back} />}
          {module === 'logistica' && <LogisticaView onBack={back} />}
          {module === 'assistant' && <AssistantView onBack={back} />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
