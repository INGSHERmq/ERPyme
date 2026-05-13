import { Suspense, lazy, useState } from 'react';
import { useAuth } from './context/auth/useAuth';
import ThemeToggleButton from './components/ThemeToggleButton';
import Home from './Home';
import LandingPage from './LandingPage';
import './styles/theme.css';

const ProjectsView = lazy(() => import('./modules/projects/ProjectsView'));
const MarketingView = lazy(() => import('./modules/marketing/MarketingView'));
const FinanzasView = lazy(() => import('./modules/finanzas/FinanzasView'));
const RRHHView = lazy(() => import('./modules/rrhh/RRHHView'));
const LogisticaView = lazy(() => import('./modules/logistica/LogisticaView'));
const AssistantView = lazy(() => import('./modules/assistant/AssistantView'));

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

  if (!isAuthenticated) return <LandingPage />;

  const back = () => setModule('home');

  const appContent = (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-logo" onClick={() => setModule('home')}>
            <span className="logo-text">ERPyme</span>
          </div>
          <div className="header-divider"></div>
          <div className="header-stats">
            <div className="header-stat-item">
              <span className="stat-value">{enabledModules?.length || 0}</span>
              <span className="stat-desc">Módulos</span>
            </div>
            <div className="header-stat-item">
              <span className="stat-value">{profile?.nombre_completo ? '1' : '0'}</span>
              <span className="stat-desc">Usuario</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="header-user">
            <span className="user-name">{profile?.nombre_completo || 'Usuario'}</span>
            <button className="logout-link" onClick={signOut}>Salir</button>
          </div>
          <ThemeToggleButton />
        </div>
      </header>
      
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
    </>
  );

  if (canAccessAdminPanel) {
    return (
      <div className="app">
        {appContent}
      </div>
    );
  }

  return (
    <div className="app">
      {appContent}
    </div>
  );
}

export default App;
