import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { assistantConfig, sendAssistantMessage, createErpRecord, getOptions } from './erpAssistant';
import { generateExecutiveSummary } from './executiveSummary';
import './AssistantView.css';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: 'Hola, soy tu asistente ERPyme. Puedo consultar datos del ERP y crear registros como proveedores, clientes, cotizaciones, productos, compras, facturas, ingresos, egresos y tareas.'
  }
];

const ASSISTANT_SHORTCUTS = [
  {
    label: 'Consultar módulos',
    prompt: '¿Qué módulos tengo habilitados en mi plan actual y qué puedo realizar en cada uno?'
  },
  {
    label: 'Crear proveedores',
    prompt: 'Quiero registrar un nuevo proveedor llamado Distribuidora Aceros Lima S.A.C. con RUC 20556677889 y correo contacto@aceroslima.pe'
  },
  {
    label: 'Crear cotizaciones',
    prompt: 'Crea una cotización en borrador para el cliente Juan Pérez por un servicio de consultoría de 5 horas a S/ 150 cada hora.'
  },
  {
    label: 'Scoring de cotizaciones',
    prompt: 'Analiza mis cotizaciones pendientes y genera un scoring de prioridad comercial.'
  },
  {
    label: 'Crear tareas y documentos base',
    prompt: 'Crea una tarea llamada "Revisión de base de datos" con prioridad Alta y fecha de vencimiento para este viernes.'
  }
];

const TABLE_NAV_MAP = {
  clientes: { module: 'ventas', tab: 'clientes', label: 'Clientes' },
  proveedores: { module: 'logistica', tab: 'proveedores', label: 'Proveedores' },
  productos: { module: 'logistica', tab: 'inventario', label: 'Inventario de Productos' },
  cotizaciones: { module: 'ventas', tab: 'cotizaciones', label: 'Cotizaciones' },
  tareas: { module: 'projects', tab: 'actividades', label: 'Tablero Scrum / Tareas' },
  compras: { module: 'logistica', tab: 'facturas', label: 'Compras / Facturas' },
  facturas_compra: { module: 'logistica', tab: 'facturas', label: 'Compras / Facturas' },
  facturas: { module: 'ventas', tab: 'facturas', label: 'Facturas de Venta' },
  ingresos: { module: 'contabilidad', tab: 'ingresos', label: 'Ingresos contables' },
  egresos: { module: 'contabilidad', tab: 'egresos', label: 'Egresos contables' }
};

const ChatForm = ({ form, onComplete, userId }) => {
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
          const list = await getOptions(table, userId);
          newOptions[field] = list;
        }
      }
      setOptions(newOptions);
    };
    fetchAllOptions();
  }, [form.schema.fields, userId]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'tipo_identificacion' || name === 'tipoIdentificacion') {
      const newType = value;
      const maxLength = newType === 'RUC' ? 11 : 8;
      setFormData(prev => {
        const prevDniRuc = prev['dni_ruc'] || prev['dniRuc'] || '';
        const cleanedDniRuc = prevDniRuc.replace(/\D/g, '').slice(0, maxLength);
        const updated = { ...prev, [name]: value };
        if (prev['dni_ruc'] !== undefined) updated['dni_ruc'] = cleanedDniRuc;
        if (prev['dniRuc'] !== undefined) updated['dniRuc'] = cleanedDniRuc;
        return updated;
      });
      return;
    }

    if (name === 'dni_ruc' || name === 'dniRuc') {
      value = value.replace(/\D/g, ''); // dígitos únicamente
      const type = formData['tipo_identificacion'] || formData['tipoIdentificacion'] || 'DNI';
      const maxLength = type === 'RUC' ? 11 : 8;
      value = value.slice(0, maxLength);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar longitud exacta para DNI (8) y RUC (11)
    const dniRucKey = formData['dni_ruc'] !== undefined ? 'dni_ruc' : formData['dniRuc'] !== undefined ? 'dniRuc' : null;
    if (dniRucKey) {
      const type = formData['tipo_identificacion'] || formData['tipoIdentificacion'] || 'DNI';
      const val = formData[dniRucKey] || '';
      const expectedLength = type === 'RUC' ? 11 : 8;
      if (val.length !== expectedLength) {
        alert(`Error de validación: El ${type} debe tener exactamente ${expectedLength} dígitos.`);
        return;
      }
    }

    setSaving(true);
    try {
      await createErpRecord({ table: form.table, data: formData });
      setDone(true);
      onComplete(`He creado el registro en ${form.table} correctamente.`, form.table);
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
              ) : field === 'dni_ruc' || field === 'dniRuc' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <input 
                    type="text"
                    inputMode="numeric"
                    name={field} 
                    value={formData[field] || ''} 
                    onChange={handleChange}
                    required={form.schema.required.includes(field)}
                    placeholder={
                      (formData['tipo_identificacion'] || formData['tipoIdentificacion'] || 'DNI') === 'RUC'
                        ? '11 dígitos (RUC)'
                        : '8 dígitos (DNI)'
                    }
                  />
                </div>
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
  const [summary, setSummary] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);

  const handleShortcutClick = (promptText) => {
    setInput(promptText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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

  const handleSummary = async () => {
    if (summaryLoading || !canAccessFeature('assistant.briefing')) return;
    setError('');
    setSummaryLoading(true);

    try {
      const nextSummary = await generateExecutiveSummary(user?.id);
      setSummary(nextSummary);
      setMessages(prev => [...prev, { role: 'assistant', content: nextSummary.summary }]);
    } catch (err) {
      const message = err.message || 'No se pudo generar el resumen ejecutivo.';
      setError(message);
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setSummaryLoading(false);
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
          {ASSISTANT_SHORTCUTS.map((shortcut, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-shortcut"
              onClick={() => handleShortcutClick(shortcut.prompt)}
              title={`Insertar prompt: "${shortcut.prompt}"`}
            >
              <span className="shortcut-icon">⚡</span>
              <span className="shortcut-label">{shortcut.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="assistant-chat" aria-label="Chat del asistente">
        <div className="chat-header">
          <div>
            <strong>Asistente ERPyme</strong>
            <span className="api-status">
              <span className="status-dot pulsing"></span>
              {loading ? 'Procesando solicitud...' : 'Conectado a Groq API'}
            </span>
          </div>
        </div>


        <div className="chat-messages">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              <div className="message-bubble">
                <div className="message-content">{message.content}</div>
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
                    userId={user?.id}
                    onComplete={(msg, table) => {
                      const nav = TABLE_NAV_MAP[table];
                      setMessages(prev => [
                        ...prev, 
                        { 
                          role: 'assistant', 
                          content: msg,
                          navigation: nav ? { module: nav.module, tab: nav.tab, label: `👉 Ir a la tabla de ${nav.label}` } : null
                        }
                      ]);
                    }} 
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
            ref={inputRef}
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
