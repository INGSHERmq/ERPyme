import React from 'react';
import ExecutiveSummary from './ExecutiveSummary';

const SearchSection = ({ searchTerm, setSearchTerm, visibleModules, filteredModules, canAccessFeature, profile, onNavigate }) => {
  return (
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
  );
};

export default SearchSection;