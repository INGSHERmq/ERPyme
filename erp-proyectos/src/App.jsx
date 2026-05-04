import { useState } from 'react';
import { useAuth } from './context/auth/useAuth'; 
import Login from './components/Login/Login';
import Home from './Home';
import ProjectsView from './modules/projects/ProjectsView';
import MarketingView from './modules/marketing/MarketingView';
import FinanzasView from './modules/finanzas/FinanzasView';
import RRHHView from './modules/rrhh/RRHHView';
import LogisticaView from './modules/logistica/LogisticaView';

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

  if (!isAuthenticated) {
    return <Login />;
  }

  const back = () => setModule('home');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 ERPyme</h1>
        <div className="user-area">
          {profile && (
            <>
              <span className="user-name">👤 {profile.nombre_completo}</span>
              <span className="user-rol">{profile.rol}</span>
            </>
          )}
          {/* Botón de Salir */}
          <button onClick={signOut} className="btn-logout">🚪 Salir</button>
        </div>
      </header>

      <nav className="app-nav">
        <button onClick={() => setModule('home')}>🏠 Inicio</button>
        <button onClick={() => setModule('projects')}>📋 Proyectos</button>
        <button onClick={() => setModule('marketing')}>📈 Marketing</button>
        <button onClick={() => setModule('finanzas')}>💰 Finanzas</button>
        <button onClick={() => setModule('rrhh')}>👥 RRHH</button>
        <button onClick={() => setModule('logistica')}>🚚 Logística</button>
      </nav>

      <main className="app-content">
        {module === 'home' && <Home onNavigate={setModule} />}
        {module === 'projects' && <ProjectsView onBack={back} />}
        {module === 'marketing' && <MarketingView onBack={back} />}
        {module === 'finanzas' && <FinanzasView onBack={back} />}
        {module === 'rrhh' && <RRHHView onBack={back} />}
        {module === 'logistica' && <LogisticaView onBack={back} />}
      </main>
    </div>
  );
}

export default App;