import { useMemo, useState } from 'react';
import './Home.css';
import './styles/theme.css';
import { ERP_MODULES } from './config/modules';
import ExecutiveSummary from './components/ExecutiveSummary';
import SubscriptionLock from './components/SubscriptionLock';

const Home = ({ onNavigate, enabledModules, profile, canAccessFeature }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lockedModule, setLockedModule] = useState(null);

  const visibleModules = useMemo(() => ERP_MODULES, []);

  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return visibleModules;

    return visibleModules.filter((mod) => {
      const searchableText = `${mod.title} ${mod.desc} ${mod.status}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [visibleModules, searchTerm]);

  return (
    <div className="home-container">
      <section className="home-toolbar">
        <div className="toolbar-layout">
          <div className="search-container">
            <span className="search-label">BUSCAR MODULO</span>
            <div className="search-input-wrapper">
              <input
                type="search"
                className="text-input module-search-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre..."
              />
              <span className="module-count">
                {filteredModules.length} de {visibleModules.length}
              </span>
            </div>
          </div>

          {canAccessFeature('assistant.briefing') && (
            <div className="summary-container-toolbar">
              <ExecutiveSummary userId={profile?.id} compact onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </section>

      {lockedModule && (
        <div className="home-lock-panel">
          <SubscriptionLock
            title={`${lockedModule.title} esta disponible en un plan superior`}
            message="Para disfrutar de este modulo, mejora tu suscripcion."
          />
        </div>
      )}

      <main className="modules-grid">
        {filteredModules.map((mod) => {
          const isLocked = !enabledModules?.includes(mod.id);

          return (
            <button
              key={mod.id}
              type="button"
              className={`module-card ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (isLocked) {
                  setLockedModule(mod);
                  return;
                }
                setLockedModule(null);
                onNavigate(mod.id);
              }}
              aria-disabled={isLocked}
              aria-label={isLocked ? `${mod.title} bloqueado` : `Abrir ${mod.title}`}
            >
              <div className="card-top">
                <span
                  className="module-icon"
                  style={{
                    backgroundColor: `${mod.color}18`,
                    color: mod.color,
                    border: `2px solid ${mod.color}33`
                  }}
                >
                  {mod.title.charAt(0)}
                </span>
                <span className={`status-badge ${isLocked ? 'locked' : mod.status === 'Activo' ? 'active' : 'new'}`}>
                  {isLocked ? 'Bloqueado' : mod.status}
                </span>
              </div>
              <span className="module-title">{mod.title}</span>
              <span className="module-desc">{mod.desc}</span>
              {isLocked && <span className="module-lock-copy">Mejora tu suscripcion para activar este modulo.</span>}
              <div className="card-footer">
                <span className="module-action">{isLocked ? 'Ver requisito' : 'Abrir ->'}</span>
              </div>
            </button>
          );
        })}
        {filteredModules.length === 0 && (
          <div className="modules-empty">
            <span className="empty-icon">?</span>
            <p>No se encontraron modulos con ese criterio.</p>
            <p className="empty-hint">Intenta con otros terminos de busqueda.</p>
          </div>
        )}
      </main>

      <footer className="home-footer">
        <p>© 2024 ERPyme - Sistema de gestion empresarial</p>
      </footer>
    </div>
  );
};

export default Home;
