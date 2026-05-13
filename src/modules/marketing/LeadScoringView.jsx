import { useMemo } from 'react';
import useMarketing from '../../hooks/useMarketing';
import { classifyOpportunity, scoreOpportunity } from '../assistant/executiveBriefing';
import './LeadScoringView.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
});

const stageLabel = {
  Prospeccion: 'Prospeccion',
  Calificacion: 'Calificacion',
  Propuesta: 'Propuesta',
  Negociacion: 'Negociacion',
  Ganada: 'Ganada',
  Perdida: 'Perdida'
};

const explainScore = (opportunity, lead, score) => {
  const reasons = [];
  if (['Negociacion', 'Ganada'].includes(opportunity.etapa)) reasons.push('etapa avanzada');
  if (['Calificado', 'Contactado'].includes(lead?.estado)) reasons.push('lead con seguimiento');
  if ((opportunity.tiempo_respuesta_horas ?? lead?.tiempo_respuesta_horas) <= 4) reasons.push('respuesta rapida');
  if ((lead?.origen || '').toLowerCase().includes('refer')) reasons.push('origen referido');
  if (score < 45) reasons.push('requiere mas senales comerciales');
  return reasons.slice(0, 3).join(', ') || 'modelo base por monto, etapa y fecha';
};

const LeadScoringView = () => {
  const { clientes, leads, oportunidades, loading, error } = useMarketing();

  const rows = useMemo(() => {
    const leadsById = Object.fromEntries((leads || []).map(lead => [lead.id, lead]));
    return (oportunidades || [])
      .map((opportunity) => {
        const lead = leadsById[opportunity.lead_id] || {};
        const score = Number(opportunity.probabilidad_cierre ?? scoreOpportunity(opportunity, lead));
        return {
          ...opportunity,
          lead,
          score,
          label: classifyOpportunity(score),
          explanation: explainScore(opportunity, lead, score)
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [leads, oportunidades]);

  const metrics = useMemo(() => {
    const hot = rows.filter(row => row.score >= 75);
    const weightedPipeline = rows.reduce((sum, row) => (
      sum + (Number(row.monto_estimado || 0) * row.score / 100)
    ), 0);
    return {
      total: rows.length,
      hot: hot.length,
      average: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0,
      weightedPipeline
    };
  }, [rows]);

  if (loading) return <div className="loading">Calculando scoring...</div>;
  if (error) return <div className="empty-state">No se pudo cargar el scoring: {error}</div>;

  return (
    <div className="lead-scoring-view">
      <section className="scoring-summary">
        <article>
          <span>Oportunidades</span>
          <strong>{metrics.total}</strong>
        </article>
        <article>
          <span>Alta probabilidad</span>
          <strong>{metrics.hot}</strong>
        </article>
        <article>
          <span>Score promedio</span>
          <strong>{metrics.average}%</strong>
        </article>
        <article>
          <span>Pipeline ponderado</span>
          <strong>{currencyFormatter.format(metrics.weightedPipeline)}</strong>
        </article>
      </section>

      <section className="scoring-panel">
        <div className="view-header">
          <h2>Lead Scoring Predictivo</h2>
          <span className="model-pill">Regresion logistica base</span>
        </div>

        {rows.length === 0 ? (
          <div className="scoring-empty">
            <h3>No hay oportunidades para puntuar todavia</h3>
            <p>
              Tus clientes no aparecen aqui automaticamente porque el scoring mide ventas posibles, no el directorio de clientes.
              Crea una oportunidad en la pestana CRM asociada a un cliente existente y se calculara su probabilidad.
            </p>
            <div className="scoring-empty-grid">
              <article>
                <strong>{clientes.length}</strong>
                <span>Clientes disponibles para convertir en oportunidad</span>
              </article>
              <article>
                <strong>{leads.length}</strong>
                <span>Leads capturados</span>
              </article>
            </div>
            {clientes.length > 0 && (
              <div className="client-candidates">
                <strong>Clientes que puedes asociar desde CRM</strong>
                <div>
                  {clientes.slice(0, 6).map(cliente => (
                    <span key={cliente.id}>{cliente.nombre}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table scoring-table">
              <thead>
                <tr>
                  <th>Oportunidad</th>
                  <th>Cliente / Lead</th>
                  <th>Monto</th>
                  <th>Etapa</th>
                  <th>Probabilidad</th>
                  <th>Senales</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="cell-bold">{row.titulo}</td>
                    <td>{row.cliente_potencial || row.lead?.nombre || 'Sin cliente'}</td>
                    <td>{currencyFormatter.format(Number(row.monto_estimado || 0))}</td>
                    <td>{stageLabel[row.etapa] || row.etapa}</td>
                    <td>
                      <div className="score-cell">
                        <span className={`score-badge score-${row.label.toLowerCase()}`}>{row.score}%</span>
                        <div className="score-track" aria-hidden="true">
                          <span style={{ width: `${row.score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>{row.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default LeadScoringView;
