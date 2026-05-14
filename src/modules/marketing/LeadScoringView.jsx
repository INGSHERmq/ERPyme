import { useMemo } from 'react';
import useMarketing from '../../hooks/useMarketing';
import { classifyOpportunity, scoreQuotationAcceptance } from '../assistant/executiveBriefing';
import './LeadScoringView.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
});

const statusLabel = {
  borrador: 'Pendiente',
  aprobada: 'Aceptada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida'
};

const explainScore = (quotation, customer, lead, score) => {
  const status = (quotation.estado || '').toLowerCase();
  if (status === 'aprobada' || status === 'aceptada') return 'aceptada por boton Aprobar';
  if (status === 'rechazada') return 'marcada como rechazada';
  if (status === 'vencida') return 'cotizacion vencida';

  const reasons = [];
  const amount = Number(quotation.precio_total || quotation.monto || 0);
  const quoteDate = quotation.fecha ? new Date(`${quotation.fecha}T00:00:00`) : null;
  const ageDays = quoteDate ? Math.max(0, Math.round((Date.now() - quoteDate.getTime()) / 86400000)) : null;

  if (customer?.industria || lead?.industria) reasons.push('industria identificada');
  if (customer?.dni_ruc || lead?.dni_ruc) reasons.push('identificacion registrada');
  if (customer?.email || lead?.email) reasons.push('contacto digital disponible');
  if (ageDays !== null && ageDays <= 3) reasons.push('cotizacion reciente');
  if (amount >= 20000) reasons.push('monto alto');
  if (score < 45) reasons.push('requiere seguimiento comercial');

  return reasons.slice(0, 3).join(', ') || 'modelo base por monto, fecha, cliente y lead';
};

const LeadScoringView = () => {
  const { clientes, leads, cotizaciones, loading, error } = useMarketing();

  const rows = useMemo(() => {
    const clientesById = Object.fromEntries((clientes || []).map(cliente => [cliente.id, cliente]));
    const findLeadForCustomer = (customer = {}) => (leads || []).find(lead => (
      (lead.email && customer.email && lead.email.toLowerCase() === customer.email.toLowerCase())
      || (lead.nombre && customer.nombre && lead.nombre.toLowerCase() === customer.nombre.toLowerCase())
    )) || {};

    return (cotizaciones || [])
      .map((quotation) => {
        const customer = clientesById[quotation.cliente_id] || {};
        const lead = findLeadForCustomer(customer);
        const score = scoreQuotationAcceptance(quotation, customer, lead, cotizaciones);
        return {
          ...quotation,
          customer,
          lead,
          score,
          label: classifyOpportunity(score),
          explanation: explainScore(quotation, customer, lead, score)
        };
      })
      .sort((a, b) => {
        const aClosed = ['aprobada', 'aceptada', 'rechazada', 'vencida'].includes((a.estado || '').toLowerCase());
        const bClosed = ['aprobada', 'aceptada', 'rechazada', 'vencida'].includes((b.estado || '').toLowerCase());
        if (aClosed !== bClosed) return aClosed ? 1 : -1;
        return b.score - a.score;
      });
  }, [clientes, leads, cotizaciones]);

  const metrics = useMemo(() => {
    const pending = rows.filter(row => !['aprobada', 'aceptada', 'rechazada', 'vencida'].includes((row.estado || '').toLowerCase()));
    const hot = pending.filter(row => row.score >= 75);
    const weightedPipeline = pending.reduce((sum, row) => (
      sum + (Number(row.precio_total || row.monto || 0) * row.score / 100)
    ), 0);
    const accepted = rows.filter(row => ['aprobada', 'aceptada'].includes((row.estado || '').toLowerCase()));

    return {
      total: rows.length,
      pending: pending.length,
      hot: hot.length,
      average: pending.length ? Math.round(pending.reduce((sum, row) => sum + row.score, 0) / pending.length) : 0,
      weightedPipeline,
      acceptedRate: rows.length ? Math.round((accepted.length / rows.length) * 100) : 0
    };
  }, [rows]);

  if (loading) return <div className="loading">Calculando scoring...</div>;
  if (error) return <div className="empty-state">No se pudo cargar el scoring: {error}</div>;

  return (
    <div className="lead-scoring-view">
      <section className="scoring-summary">
        <article>
          <span>Cotizaciones</span>
          <strong>{metrics.total}</strong>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>{metrics.pending}</strong>
        </article>
        <article>
          <span>Alta probabilidad</span>
          <strong>{metrics.hot}</strong>
        </article>
        <article>
          <span>Valor esperado pendiente</span>
          <strong>{currencyFormatter.format(metrics.weightedPipeline)}</strong>
        </article>
      </section>

      <section className="scoring-panel">
        <div className="view-header">
          <h2>Scoring de cotizaciones</h2>
          <span className="model-pill">Aceptacion por cotizacion</span>
        </div>

        {rows.length === 0 ? (
          <div className="scoring-empty">
            <h3>No hay cotizaciones para puntuar todavia</h3>
            <p>
              El flujo inicia registrando un lead, luego creando su cotizacion. Cuando el cliente acepta, el boton Aprobar
              marca esa cotizacion como aceptada y se usa como resultado real del analisis.
            </p>
            <div className="scoring-empty-grid">
              <article>
                <strong>{clientes.length}</strong>
                <span>Clientes disponibles desde leads</span>
              </article>
              <article>
                <strong>{leads.length}</strong>
                <span>Leads capturados</span>
              </article>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table scoring-table">
              <thead>
                <tr>
                  <th>Cotizacion</th>
                  <th>Cliente / Lead</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Probabilidad de aceptacion</th>
                  <th>Senales</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="cell-bold">{row.titulo}</td>
                    <td>{row.cliente_nombre || row.customer?.nombre || row.lead?.nombre || 'Sin cliente'}</td>
                    <td>{currencyFormatter.format(Number(row.precio_total || row.monto || 0))}</td>
                    <td>{statusLabel[(row.estado || '').toLowerCase()] || row.estado || 'Pendiente'}</td>
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
