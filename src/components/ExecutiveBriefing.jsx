import { useState, useEffect } from 'react';
import { generateExecutiveBriefing } from '../modules/assistant/executiveBriefing';
import './ExecutiveBriefing.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
});

const ExecutiveBriefing = ({ userId, compact = false }) => {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBriefing = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const data = await generateExecutiveBriefing(userId);
        setBriefing(data);
      } catch (err) {
        console.error('Error fetching briefing:', err);
        setError(err.message || 'No se pudo cargar el briefing.');
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [userId]);

  if (loading) return <div className={`briefing-skeleton ${compact ? 'compact' : ''}`}>{compact ? '...' : 'Analizando datos...'}</div>;
  if (error || !briefing) return null;

  if (compact) {
    return (
      <div className="briefing-compact-row">
        <article className="briefing-card compact">
          <div className="card-inner">
            <strong>{briefing.dueToday.length}</strong>
            <span>Facturas hoy</span>
          </div>
          {briefing.dueToday.length > 0 && <div className="card-accent" />}
        </article>
        
        <article className="briefing-card compact">
          <div className="card-inner">
            <strong>{briefing.overdue.length}</strong>
            <span>Facturas vencidas</span>
          </div>
          {briefing.overdue.length > 0 && <div className="card-accent danger" />}
        </article>

        <article className="briefing-card compact">
          <div className="card-inner">
            <strong>{briefing.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {briefing.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="briefing-card compact">
          <div className="card-inner">
            <strong>{briefing.topOpportunities[0]?.probabilidad || 0}%</strong>
            <span>Mejor cotización</span>
          </div>
          <div className="card-accent success" />
        </article>
      </div>
    );
  }

  return (
    <section className="briefing-panel-home" aria-label="Briefing ejecutivo">
      <header className="briefing-header">
        <div>
          <span className="briefing-kicker">PROACTIVE EXECUTIVE BRIEFING</span>
          <h2>Prioridades de hoy</h2>
        </div>
        <span className="briefing-date">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </header>

      <div className="briefing-grid">
        <article className="briefing-card">
          <div className="card-inner">
            <strong>{briefing.dueToday.length}</strong>
            <span>Facturas hoy</span>
          </div>
          {briefing.dueToday.length > 0 && <div className="card-accent" />}
        </article>
        
        <article className="briefing-card">
          <div className="card-inner">
            <strong>{briefing.overdue.length}</strong>
            <span>Facturas vencidas</span>
          </div>
          {briefing.overdue.length > 0 && <div className="card-accent danger" />}
        </article>

        <article className="briefing-card">
          <div className="card-inner">
            <strong>{briefing.projectRisks.length}</strong>
            <span>Riesgos proyecto</span>
          </div>
          {briefing.projectRisks.length > 0 && <div className="card-accent warning" />}
        </article>

        <article className="briefing-card">
          <div className="card-inner">
            <strong>{briefing.topOpportunities[0]?.probabilidad || 0}%</strong>
            <span>Mejor cotización</span>
          </div>
          <div className="card-accent success" />
        </article>
      </div>

      <div className="briefing-footer">
        <ul className="briefing-actions">
          {briefing.actions.slice(0, 3).map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ExecutiveBriefing;
