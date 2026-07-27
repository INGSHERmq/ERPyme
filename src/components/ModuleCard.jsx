import React from 'react';
import './ModuleCard.css';

const ModuleCard = ({ mod, isLocked, onClick }) => {
  return (
    <button
      key={mod.id}
      type="button"
      className={`module-card ${isLocked ? 'locked' : ''}`}
      onClick={onClick}
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
      {isLocked && <span className="module-lock-copy">Mejora tu suscripción para activar este módulo.</span>}
      <div className="card-footer">
        <span className="module-action">{isLocked ? 'Ver requisito' : 'Abrir ->'}</span>
      </div>
    </button>
  );
};

export default ModuleCard;