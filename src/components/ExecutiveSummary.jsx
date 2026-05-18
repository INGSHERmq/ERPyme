import { useState, useEffect } from 'react';
import { generateExecutiveSummary } from '../modules/assistant/executiveSummary';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({ userId, compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        <article className="summary-card compact">
          <div className="card-inner">
            <strong>{summary.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {summary.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="summary-card compact">
          <div className="card-inner">
            <strong>{summary.topOpportunities[0]?.probabilidad || 0}%</strong>
            <span>Mejor cotización</span>
          </div>
          <div className="card-accent success" />
        </article>
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

        <article className="summary-card">
          <div className="card-inner">
            <strong>{summary.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {summary.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="summary-card">
          <div className="card-inner">
            <strong>{summary.topOpportunities[0]?.probabilidad || 0}%</strong>
            <span>Mejor cotización</span>
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
    </section>
  );
};

export default ExecutiveSummary;
