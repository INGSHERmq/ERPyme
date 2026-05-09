import { useMemo, useState } from 'react';
import './Home.css';
import { ERP_MODULES } from './config/modules';

const Home = ({ onNavigate, profile, signOut, enabledModules }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const visibleModules = useMemo(() => {
    if (!enabledModules?.length) return [];
    return ERP_MODULES.filter((module) => enabledModules.includes(module.id));
  }, [enabledModules]);

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
      <header className="home-header">
        <div className="header-content">
          <h1>ERPyme</h1>
          <p>Sistema integral de gestion empresarial</p>
        </div>
        <div className="home-actions">
          <span>{profile?.nombre_completo || 'Usuario'}</span>
          <button type="button" className="btn-logout" onClick={signOut}>Salir</button>
        </div>
      </header>

      <section className="home-toolbar" aria-label="Busqueda de modulos">
        <label className="module-search">
          <span>Buscar modulo</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, area o funcion..."
          />
        </label>
        <span className="module-count">
          {filteredModules.length} de {visibleModules.length}
        </span>
      </section>

      <main className="modules-grid">
        {filteredModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            className="module-card"
            onClick={() => onNavigate(mod.id)}
            aria-label={`Abrir ${mod.title}`}
          >
            <div className="card-top">
              <span
                className="module-icon"
                style={{
                  backgroundColor: `${mod.color}18`,
                  color: mod.color
                }}
              >
                {mod.title.charAt(0)}
              </span>
              <span className={`status-badge ${mod.status === 'Activo' ? 'active' : 'new'}`}>
                {mod.status}
              </span>
            </div>
            <span className="module-title">{mod.title}</span>
            <span className="module-desc">{mod.desc}</span>
          </button>
        ))}
        {filteredModules.length === 0 && (
          <div className="modules-empty">
            No se encontraron modulos con ese criterio.
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
