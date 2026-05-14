import { useMemo, useState } from 'react';
import './Home.css';
import './styles/theme.css';
import { ERP_MODULES } from './config/modules';

const Home = ({ onNavigate, enabledModules }) => {
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
      {/* El título y estadísticas ahora residen en la cabecera (App.jsx) */}

      {/* Toolbar de búsqueda */}
      <section className="home-toolbar">
        <div className="search-container">
          <span className="search-label">BUSCAR MÓDULO</span>
          <div className="search-input-wrapper">
            <input
              type="search"
              className="text-input module-search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, área o función..."
            />
            <span className="module-count">
              {filteredModules.length} de {visibleModules.length}
            </span>
          </div>
        </div>
      </section>

      {/* Grid de módulos */}
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
                  color: mod.color,
                  border: `2px solid ${mod.color}33`
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
            <div className="card-footer">
              <span className="module-action">Abrir →</span>
            </div>
          </button>
        ))}
        {filteredModules.length === 0 && (
          <div className="modules-empty">
            <span className="empty-icon">🔍</span>
            <p>No se encontraron módulos con ese criterio.</p>
            <p className="empty-hint">Intenta con otros términos de búsqueda.</p>
          </div>
        )}
      </main>

      {/* Footer simplificado */}
      <footer className="home-footer">
        <p>© 2024 ERPyme - Sistema de gestión empresarial</p>
      </footer>
    </div>
  );
};

export default Home;
