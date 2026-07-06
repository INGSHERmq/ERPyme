import { useState } from 'react';
import './Home.css';
import './styles/theme.css';
import { ERP_MODULES } from './config/modules';
import { useModuleFilter } from './hooks/useModuleFilter';
import SearchSection from './components/SearchSection';
import ModuleCard from './components/ModuleCard';
import SubscriptionLock from './components/SubscriptionLock';

const Home = ({ onNavigate, enabledModules = [], profile = {}, canAccessFeature = () => false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lockedModule, setLockedModule] = useState(null);

  const visibleModules = ERP_MODULES;
  const filteredModules = useModuleFilter(visibleModules, searchTerm);

  return (
    <div className="home-container">
      <SearchSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visibleModules={visibleModules}
        filteredModules={filteredModules}
        canAccessFeature={canAccessFeature}
        profile={profile}
        onNavigate={onNavigate}
      />

      {lockedModule && (
        <div className="home-lock-panel">
          <SubscriptionLock
            title={`${lockedModule.title} está disponible en un plan superior`}
            message="Para disfrutar de este módulo, mejora tu suscripción."
          />
        </div>
      )}

      <main className="modules-grid">
        {filteredModules.map((mod) => {
          const isLocked = !enabledModules?.includes(mod.id);

          return (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isLocked={isLocked}
              onClick={() => {
                if (isLocked) {
                  setLockedModule(mod);
                  return;
                }
                setLockedModule(null);
                onNavigate(mod.id);
              }}
            />
          );
        })}
        {filteredModules.length === 0 && (
          <div className="modules-empty">
            <span className="empty-icon">?</span>
            <p>No se encontraron módulos con ese criterio.</p>
            <p className="empty-hint">Intenta con otros terminos de busqueda.</p>
          </div>
        )}
      </main>

      <footer className="home-footer">
        <p>© 2026 ERPyme - Sistema de gestión empresarial</p>
      </footer>
    </div>
  );
};

export default Home;
