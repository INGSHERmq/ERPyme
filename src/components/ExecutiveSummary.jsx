import { useState, useEffect } from 'react';
import { generateExecutiveSummary } from '../modules/assistant/executiveSummary';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({ userId, compact = false, onNavigate }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRisksPopover, setShowRisksPopover] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const data = await generateExecutiveSummary(userId);
        setSummary(data);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError(err.message || 'No se pudo cargar el resumen.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    const handleFocus = () => fetchSummary();
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchSummary();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  if (loading) return <div className={`summary-skeleton ${compact ? 'compact' : ''}`}>{compact ? '...' : 'Analizando datos...'}</div>;
  if (error || !summary) return null;

  const renderPopover = () => {
    if (!showRisksPopover || summary.projectRisks.length === 0) return null;
    return (
      <div className="risks-popover-backdrop" onClick={() => setShowRisksPopover(false)}>
        <div className="risks-popover-card" onClick={(e) => e.stopPropagation()}>
          <header className="risks-popover-header">
            <div>
              <span className="popover-badge-danger">CRÍTICO</span>
              <h5>⚠️ Diagnóstico de Riesgos de Proyectos (IA)</h5>
            </div>
            <button className="btn-close-popover" onClick={() => setShowRisksPopover(false)}>×</button>
          </header>
          <div className="risks-popover-body">
            <p className="popover-intro">Se han detectado <strong>{summary.projectRisks.length}</strong> proyecto(s) con retrasos en tareas:</p>
            <div className="popover-projects-list">
              {summary.projectRisks.map((p) => (
                <div key={p.id} className="popover-project-item">
                  <div className="popover-project-header-row">
                    <span className="popover-project-name">📁 {p.nombre}</span>
                    <span className="popover-project-progress">Avance: {p.progreso}%</span>
                  </div>
                  
                  {p.delayedTasks && p.delayedTasks.length > 0 ? (
                    <div className="popover-delayed-tasks">
                      {p.delayedTasks.map((t) => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const finStr = t.fecha_fin ? t.fecha_fin.slice(0, 10) : '';
                        let daysOverdue = 1;
                        if (finStr && finStr < todayStr) {
                          daysOverdue = Math.ceil(Math.abs(new Date(todayStr) - new Date(finStr)) / (1000 * 60 * 60 * 24));
                        }
                        return (
                          <div key={t.id} className="popover-task-item">
                            <span className="popover-task-title">🔥 {t.titulo}</span>
                            <span className="popover-task-info">
                              Responsable: <strong>{t.empleado_nombre || 'Sin asignar'}</strong> | Retraso: {daysOverdue} día{daysOverdue > 1 ? 's' : ''} ({t.duracion_horas || '0'}h planificadas)
                            </span>
                            <div className="popover-ai-tip">
                              <strong>IA:</strong> {t.prioridad === 'Alta' 
                                ? 'Prioridad ALTA. Reasignar apoyo o contactar de inmediato.' 
                                : `Contactar a ${t.empleado_nombre || 'el responsable'} para asistirle.`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="popover-no-tasks">
                      Riesgo por atraso general o prioridad alta del proyecto.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <footer className="risks-popover-footer">
            {onNavigate && (
              <button 
                className="btn-popover-action" 
                onClick={() => {
                  setShowRisksPopover(false);
                  onNavigate('projects');
                }}
              >
                Ir a Módulo de Proyectos →
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="summary-compact-row">
        <article className="summary-card compact">
          <div className="card-inner">
            <strong>{summary.dueToday.length}</strong>
            <span>Facturas hoy</span>
          </div>
          {summary.dueToday.length > 0 && <div className="card-accent" />}
        </article>
        
        <article className="summary-card compact">
          <div className="card-inner">
            <strong>{summary.overdue.length}</strong>
            <span>Facturas vencidas</span>
          </div>
          {summary.overdue.length > 0 && <div className="card-accent danger" />}
        </article>

        <article 
          className={`summary-card compact ${summary.projectRisks.length > 0 ? 'interactive-risk-card' : ''}`}
          onClick={() => {
            if (summary.projectRisks.length > 0) setShowRisksPopover(true);
          }}
          title={summary.projectRisks.length > 0 ? 'Ver detalles de riesgos' : undefined}
        >
          <div className="card-inner">
            <strong>{summary.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {summary.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="summary-card compact">
          <div className="card-inner">
            <strong>
              {summary.topOpportunities && summary.topOpportunities.length > 0
                ? `${summary.topOpportunities[0].probabilidad}%`
                : summary.quotesMeta?.wonCount > 0
                  ? '100%'
                  : '0%'}
            </strong>
            <span>
              {summary.topOpportunities && summary.topOpportunities.length > 0
                ? 'Mejor cotización'
                : summary.quotesMeta?.wonCount > 0
                  ? `${summary.quotesMeta.wonCount} ganada(s) / 0 activas`
                  : 'Mejor cotización'}
            </span>
          </div>
          <div className="card-accent success" />
        </article>

        {renderPopover()}
      </div>
    );
  }

  return (
    <section className="summary-panel-home" aria-label="Resumen ejecutivo">
      <header className="summary-header">
        <div>
          <span className="summary-kicker">RESUMEN EJECUTIVO PROACTIVO</span>
          <h2>Prioridades de hoy</h2>
        </div>
        <span className="summary-date">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </header>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="card-inner">
            <strong>{summary.dueToday.length}</strong>
            <span>Facturas hoy</span>
          </div>
          {summary.dueToday.length > 0 && <div className="card-accent" />}
        </article>
        
        <article className="summary-card">
          <div className="card-inner">
            <strong>{summary.overdue.length}</strong>
            <span>Facturas vencidas</span>
          </div>
          {summary.overdue.length > 0 && <div className="card-accent danger" />}
        </article>

        <article 
          className={`summary-card ${summary.projectRisks.length > 0 ? 'interactive-risk-card' : ''}`}
          onClick={() => {
            if (summary.projectRisks.length > 0) setShowRisksPopover(true);
          }}
          title={summary.projectRisks.length > 0 ? 'Ver detalles de riesgos' : undefined}
        >
          <div className="card-inner">
            <strong>{summary.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {summary.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="summary-card">
          <div className="card-inner">
            <strong>
              {summary.topOpportunities && summary.topOpportunities.length > 0
                ? `${summary.topOpportunities[0].probabilidad}%`
                : summary.quotesMeta?.wonCount > 0
                  ? '100%'
                  : '0%'}
            </strong>
            <span>
              {summary.topOpportunities && summary.topOpportunities.length > 0
                ? `Mejor cotización ("${summary.topOpportunities[0].titulo.slice(0, 16)}")`
                : summary.quotesMeta?.wonCount > 0
                  ? `${summary.quotesMeta.wonCount} ganada(s) / 0 activas`
                  : 'Mejor cotización'}
            </span>
          </div>
          <div className="card-accent success" />
        </article>
      </div>

      <div className="summary-footer">
        <ul className="summary-actions">
          {summary.actions.slice(0, 3).map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>

      {renderPopover()}
    </section>
  );
};

export default ExecutiveSummary;
