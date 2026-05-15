import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { assistantConfig, sendAssistantMessage, createErpRecord, getOptions } from './erpAssistant';
import { generateExecutiveBriefing } from './executiveBriefing';
import './AssistantView.css';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: 'Hola, soy tu asistente ERPyme. Puedo consultar datos del ERP y crear registros como proveedores, clientes, cotizaciones, productos, compras, facturas, ingresos, egresos y tareas.'
  }
];

const ChatForm = ({ form, onComplete }) => {
  const [formData, setFormData] = useState(form.initialData || {});
  const [options, setOptions] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchAllOptions = async () => {
      const newOptions = {};
      const fieldsToFetch = form.schema.fields.filter(f => f.endsWith('_id'));
      
      for (const field of fieldsToFetch) {
        let table = '';
        if (field === 'cliente_id') table = 'clientes';
        else if (field === 'proyecto_id') table = 'proyectos';
        else if (field === 'proveedor_id') table = 'proveedores';
        else if (field === 'cotizacion_id') table = 'cotizaciones';
        else if (field === 'activo_id') table = 'activos';
        else if (field === 'empleado_id') table = 'empleados';
        
        if (table) {
          const list = await getOptions(table, user?.id);
          newOptions[field] = list;
        }
      }
      setOptions(newOptions);
    };
    fetchAllOptions();
  }, [form.schema.fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createErpRecord({ table: form.table, data: formData });
      setDone(true);
      onComplete(`He creado el registro en ${form.table} correctamente.`);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) return <div className="chat-form-done">✓ Registro guardado</div>;

  return (
    <form className="chat-inline-form" onSubmit={handleSubmit}>
      <header>
        <strong>{form.title}</strong>
      </header>
      <div className="chat-form-grid">
        {form.schema.fields.map(field => {
          if (field === 'user_id' || field === 'id' || field === 'created_at') return null;
          return (
            <label key={field}>
              {field.replace(/_/g, ' ')}
              {options[field] || options[field === 'clienteId' ? 'cliente_id' : field === 'proyectoId' ? 'proyecto_id' : field === 'proveedorId' ? 'proveedor_id' : field] ? (
                <select name={field} value={formData[field] || ''} onChange={handleChange} required={form.schema.required.includes(field)}>
                  <option value="">Seleccionar...</option>
                  {(options[field] || options[field === 'clienteId' ? 'cliente_id' : field === 'proyectoId' ? 'proyecto_id' : field === 'proveedorId' ? 'proveedor_id' : field]).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              ) : field === 'tipo_identificacion' || field === 'tipoIdentificacion' ? (
                <select name={field} value={formData[field] || 'DNI'} onChange={handleChange}>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
              ) : field === 'estado' ? (
                <select name={field} value={formData[field] || ''} onChange={handleChange}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              ) : field === 'unidad' ? (
                <select name={field} value={formData[field] || 'UND'} onChange={handleChange}>
                  <option value="UND">Unidades (UND)</option>
                  <option value="GLB">Global (GLB)</option>
                  <option value="HOR">Horas (HOR)</option>
                </select>
              ) : field.startsWith('fecha') || field.includes('vencimiento') ? (
                <input 
                  type="date"
                  name={field} 
                  value={formData[field] || ''} 
                  onChange={handleChange}
                  required={form.schema.required.includes(field)}
                />
              ) : ['cantidad', 'precio_unitario', 'costo_unitario', 'monto', 'total', 'precioUnitario', 'costoUnitario'].includes(field) ? (
                <input 
                  type="number"
                  step="0.01"
                  name={field} 
                  value={formData[field] || ''} 
                  onChange={handleChange}
                  required={form.schema.required.includes(field)}
                  placeholder="0.00"
                />
              ) : (
                <input 
                  name={field} 
                  value={formData[field] || ''} 
                  onChange={handleChange}
                  required={form.schema.required.includes(field)}
                  placeholder="..."
                />
              )}
            </label>
          );
        })}
      </div>
      <button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar en ERP'}
      </button>
    </form>
  );
};

const AssistantView = ({ onBack, onNavigate }) => {
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
      const { content, navigation, form } = await sendAssistantMessage(messages, text);
      setMessages(prev => [...prev, { role: 'assistant', content, navigation, form }]);
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
        </div>


        <div className="chat-messages">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              <div className="message-bubble">
                <p>{message.content}</p>
                {message.navigation && (
                  <div className="message-actions">
                    <button 
                      type="button" 
                      className="btn-navigate"
                      onClick={() => onNavigate(message.navigation.module, message.navigation.tab)}
                    >
                      {message.navigation.label || 'Ir a la sección'}
                    </button>
                  </div>
                )}
                {message.form && (
                  <ChatForm 
                    form={message.form} 
                    onComplete={(msg) => setMessages(prev => [...prev, { role: 'assistant', content: msg }])} 
                  />
                )}
              </div>
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
