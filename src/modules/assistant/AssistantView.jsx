import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { assistantConfig, sendAssistantMessage } from './erpAssistant';
import { generateExecutiveBriefing } from './executiveBriefing';
import './AssistantView.css';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: 'Hola, soy tu asistente ERPyme. Puedo consultar datos del ERP y crear registros como proveedores, clientes, cotizaciones, productos, compras, facturas, ingresos, egresos y tareas.'
  }
];

const AssistantView = ({ onBack }) => {
  const { user, canAccessFeature } = useAuth();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [briefing, setBriefing] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await sendAssistantMessage(messages, text);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      const message = err.message?.includes('Failed to fetch')
        ? 'No pude conectar con Groq. Verifica la API key en .env.local y reinicia el servidor de Vite.'
        : err.message || 'No se pudo procesar la solicitud.';
      setError(message);
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBriefing = async () => {
    if (briefingLoading || !canAccessFeature('assistant.briefing')) return;
    setError('');
    setBriefingLoading(true);

    try {
      const nextBriefing = await generateExecutiveBriefing(user?.id);
      setBriefing(nextBriefing);
      setMessages(prev => [...prev, { role: 'assistant', content: nextBriefing.summary }]);
    } catch (err) {
      const message = err.message || 'No se pudo generar el briefing ejecutivo.';
      setError(message);
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setBriefingLoading(false);
    }
  };

  return (
    <div className="assistant-page">
      <aside className="assistant-sidebar">
        <button type="button" onClick={onBack} className="btn-back">Volver al inicio</button>
        <h1>Habla con tu asistente</h1>
        <p>
          Conectado a Groq y a Supabase para consultar información y ejecutar altas controladas.
        </p>
        <div className="assistant-status">
          <span>Modelo</span>
          <strong>{assistantConfig.model}</strong>
        </div>
        <div className="assistant-capabilities">
          <span>Consultar módulos</span>
          <span>Crear proveedores</span>
          <span>Crear cotizaciones</span>
          {canAccessFeature('assistant.briefing') && <span>Briefing matutino proactivo</span>}
          <span>Scoring de cotizaciones</span>
          <span>Crear tareas y documentos base</span>
        </div>
      </aside>

      <section className="assistant-chat" aria-label="Chat del asistente">
        <div className="chat-header">
          <div>
            <strong>Asistente ERPyme</strong>
            <span>{loading ? 'Procesando solicitud...' : 'Groq API'}</span>
          </div>
          {canAccessFeature('assistant.briefing') && (
            <button type="button" onClick={handleBriefing} disabled={briefingLoading}>
              {briefingLoading ? 'Analizando...' : 'Briefing ejecutivo'}
            </button>
          )}
        </div>

        {briefing && (
          <section className="briefing-panel" aria-label="Briefing ejecutivo">
            <div>
              <span className="briefing-kicker">Proactive Executive Briefing</span>
              <h2>Prioridades de hoy</h2>
            </div>
            <div className="briefing-grid">
              <article>
                <strong>{briefing.dueToday.length}</strong>
                <span>Vencen hoy</span>
              </article>
              <article>
                <strong>{briefing.overdue.length}</strong>
                <span>Vencidas</span>
              </article>
              <article>
                <strong>{briefing.projectRisks.length}</strong>
                <span>Riesgos proyecto</span>
              </article>
              <article>
                <strong>{briefing.topOpportunities[0]?.probabilidad || 0}%</strong>
                <span>Mejor cotización</span>
              </article>
            </div>
            <ul>
              {briefing.actions.map(action => <li key={action}>{action}</li>)}
            </ul>
          </section>
        )}

        <div className="chat-messages">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              <p>{message.content}</p>
            </article>
          ))}
          {loading && (
            <article className="chat-message assistant">
              <p>Trabajando...</p>
            </article>
          )}
        </div>

        {error && <div className="assistant-error">{error}</div>}

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ej: agrega un proveedor llamado Aceros Lima con RUC..."
            aria-label="Mensaje para el asistente"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
};

export default AssistantView;
