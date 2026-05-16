import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from './context/auth/useAuth';
import ThemeToggleButton from './components/ThemeToggleButton';
import LoadingScreen from './components/LoadingScreen';
import Home from './Home';
import LandingPage from './LandingPage';
import { getPlanConfig } from './config/modules';
import './styles/theme.css';

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
    canAccessAdminPanel,
    updateProfile,
    company,
    canAccessFeature
  } = useAuth();
  const [module, setModule] = useState('home');
  const [moduleTab, setModuleTab] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const planLabel = getPlanConfig(company?.plan || company?.plan_key).shortName;

  useEffect(() => {
    if (module === 'home') return;
    if (!enabledModules?.includes(module)) setModule('home');
  }, [enabledModules, module, profile?.id]);

  if (authLoading) {
    return (
      <div className="app-loading-full">
        <LoadingScreen message="Cargando ERPyme..." />
      </div>
    );
  }

  if (!isAuthenticated) return <LandingPage />;

  const back = () => setModule('home');

  const navigate = (nextModule, tab = null) => {
    if (nextModule !== 'home' && !enabledModules?.includes(nextModule)) {
      setModule('home');
      setModuleTab(null);
      return;
    }
    setModule(nextModule);
    setModuleTab(tab);
  };

  const openProfile = () => {
    setProfileForm({
      nombres: profile?.nombres || '',
      apellidos: profile?.apellidos || '',
      nombre_completo: profile?.nombre_completo || '',
      fecha_nacimiento: profile?.fecha_nacimiento || '',
      telefono: profile?.telefono || '',
      documento_identidad: profile?.documento_identidad || '',
      direccion: profile?.direccion || '',
      cargo: profile?.cargo || '',
      departamento: profile?.departamento || ''
    });
    setProfileMessage('');
    setProfileError('');
    setProfileOpen(true);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');
    try {
      await updateProfile(profileForm);
      setProfileMessage('Datos actualizados correctamente.');
    } catch (error) {
      setProfileError(error.message || 'No se pudo actualizar el perfil.');
    }
  };

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
            <div className="user-identity">
              <span className="user-name">{profile?.nombre_completo || 'Usuario'}</span>
              <span className="user-plan">{company?.plan ? planLabel : 'plan activo'}</span>
            </div>
            <div className="user-actions">
              <button className="logout-link" onClick={openProfile}>Mi perfil</button>
              <button className="logout-link" onClick={signOut}>Cerrar sesión</button>
            </div>
          </div>
          <ThemeToggleButton />
        </div>
      </header>
      
      <main className="app-content">
        <Suspense fallback={<LoadingScreen message="Cargando módulo..." />}>
          {module === 'home' && (
            <Home
              onNavigate={navigate}
              profile={profile}
              signOut={signOut}
              enabledModules={enabledModules}
              canAccessFeature={canAccessFeature}
            />
          )}
          {module === 'projects' && enabledModules?.includes('projects') && <ProjectsView onBack={back} initialTab={moduleTab} />}
          {module === 'ventas' && enabledModules?.includes('ventas') && <MarketingView onBack={back} initialTab={moduleTab} />}
          {module === 'contabilidad' && enabledModules?.includes('contabilidad') && <FinanzasView onBack={back} initialTab={moduleTab} />}
          {module === 'rrhh' && enabledModules?.includes('rrhh') && <RRHHView onBack={back} initialTab={moduleTab} />}
          {module === 'logistica' && enabledModules?.includes('logistica') && <LogisticaView onBack={back} initialTab={moduleTab} />}
          {module === 'assistant' && enabledModules?.includes('assistant') && <AssistantView onBack={back} onNavigate={navigate} />}
          {module === 'admin' && enabledModules?.includes('admin') && <AdminView onBack={back} signOut={signOut} initialTab={moduleTab} />}
        </Suspense>
      </main>
      {profileOpen && (
        <div className="profile-modal-backdrop" role="presentation" onClick={() => setProfileOpen(false)}>
          <section className="profile-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Perfil personal</span>
                <h2>Actualiza tus datos</h2>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)}>Cerrar</button>
            </header>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <label>Nombres<input name="nombres" value={profileForm.nombres || ''} onChange={handleProfileChange} /></label>
              <label>Apellidos<input name="apellidos" value={profileForm.apellidos || ''} onChange={handleProfileChange} /></label>
              <label>Nombre visible<input name="nombre_completo" value={profileForm.nombre_completo || ''} onChange={handleProfileChange} /></label>
              <label>Fecha nacimiento<input name="fecha_nacimiento" type="date" value={profileForm.fecha_nacimiento || ''} onChange={handleProfileChange} /></label>
              <label>Documento<input name="documento_identidad" value={profileForm.documento_identidad || ''} onChange={handleProfileChange} /></label>
              <label>Telefono<input name="telefono" value={profileForm.telefono || ''} onChange={handleProfileChange} /></label>
              <label>Direccion<input name="direccion" value={profileForm.direccion || ''} onChange={handleProfileChange} /></label>
              <label>Cargo<input name="cargo" value={profileForm.cargo || ''} onChange={handleProfileChange} /></label>
              <label>Departamento<input name="departamento" value={profileForm.departamento || ''} onChange={handleProfileChange} /></label>
              {(profileMessage || profileError) && (
                <p className={profileError ? 'profile-error' : 'profile-success'}>{profileError || profileMessage}</p>
              )}
              <button type="submit">Guardar cambios</button>
            </form>
          </section>
        </div>
      )}
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
