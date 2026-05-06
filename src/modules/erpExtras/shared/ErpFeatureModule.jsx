import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import './ErpFeatureModule.css';

const buildInitialForm = (fields) => {
  return fields.reduce((acc, field) => {
    if (field.type === 'date') acc[field.name] = new Date().toISOString().split('T')[0];
    else if (field.type === 'select') acc[field.name] = field.options?.[0] || '';
    else acc[field.name] = '';
    return acc;
  }, {});
};

const normalizePayload = (formData, fields) => {
  return fields.reduce((payload, field) => {
    const value = formData[field.name];
    if (value === '') return payload;
    payload[field.name] = field.type === 'number' ? Number(value) : value;
    return payload;
  }, {});
};

const toFriendlyName = (name) => {
  const words = String(name)
    .replace(/^v_/, '')
    .replace(/_/g, ' ')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const ErpFeatureModule = ({ config, onBack }) => {
  const resources = config.resources;
  const initialResource = config.primaryResource || Object.keys(resources)[0];
  const [activeResourceKey, setActiveResourceKey] = useState(initialResource);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(() => buildInitialForm(resources[initialResource]?.fields || []));
  const [showForm, setShowForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeResource = resources[activeResourceKey];
  const resourceKeys = Object.keys(resources);

  const loadRecords = async (resource = activeResource) => {
    if (!resource?.table) return;
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from(resource.table)
      .select('*')
      .limit(25);

    if (queryError) {
      setRecords([]);
      setError(`No se pudo cargar ${resource.title}: ${queryError.message}`);
    } else {
      setRecords(data || []);
    }

    setLoading(false);
  };

  const openResource = (resourceKey, formVisible = false) => {
    if (!resources[resourceKey]) return;
    setActiveResourceKey(resourceKey);
    setFormData(buildInitialForm(resources[resourceKey].fields || []));
    setShowForm(formVisible && !resources[resourceKey].readOnly);
    setShowTutorial(false);
    loadRecords(resources[resourceKey]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeResource || activeResource.readOnly) return;

    setLoading(true);
    setError('');

    const payload = normalizePayload(formData, activeResource.fields);
    const { error: insertError } = await supabase
      .from(activeResource.table)
      .insert([payload]);

    if (insertError) {
      setError(`No se pudo guardar ${activeResource.title}: ${insertError.message}`);
    } else {
      setFormData(buildInitialForm(activeResource.fields));
      setShowForm(false);
      await loadRecords(activeResource);
    }

    setLoading(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="erp-feature-page">
      <div className="erp-feature-header">
        <button type="button" onClick={onBack} className="btn-back">Volver al inicio</button>
        <div>
          <span className="feature-eyebrow">{config.eyebrow}</span>
          <h1>{config.title}</h1>
          <p>{config.summary}</p>
        </div>
        <div className="feature-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openResource(config.secondaryResource || activeResourceKey, false)}
          >
            {config.secondaryAction}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => openResource(config.primaryResource || activeResourceKey, true)}
          >
            {config.primaryAction}
          </button>
        </div>
      </div>

      <section className="feature-kpis" aria-label="Indicadores principales">
        {config.metrics.map((metric) => (
          <article key={metric.label} className="feature-kpi">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="feature-grid">
        <article className="feature-panel">
          <div className="panel-title-row">
            <h2>{activeResource?.title || 'Area'}</h2>
            <button type="button" className="btn-secondary compact" onClick={() => setShowTutorial(prev => !prev)}>
              {showTutorial ? 'Ocultar tutorial' : 'Ver tutorial'}
            </button>
          </div>

          {showTutorial && (
            <div className="tutorial-box">
              <h3>Guia rapida</h3>
              {config.tutorial?.map((step, index) => (
                <div key={step} className="tutorial-step">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          )}

          {resourceKeys.length > 1 && (
            <div className="resource-tabs">
              {resourceKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={activeResourceKey === key ? 'active' : ''}
                  onClick={() => openResource(key)}
                >
                  {resources[key].title}
                </button>
              ))}
            </div>
          )}

          {activeResource?.description && <p className="panel-copy">{activeResource.description}</p>}

          {showForm && activeResource && !activeResource.readOnly && (
            <form className="feature-form" onSubmit={handleSubmit}>
              {activeResource.fields.map((field) => (
                <label key={field.name}>
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required}>
                      {field.options.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      min={field.type === 'number' ? '0' : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                    />
                  )}
                </label>
              ))}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>Guardar</button>
              </div>
            </form>
          )}

          {error && <div className="feature-error">{error}</div>}

          <div className="records-table">
            <div className="records-header">
              <strong>Ultimos registros</strong>
              {!activeResource?.readOnly && (
                <button type="button" className="btn-secondary compact" onClick={() => setShowForm(true)}>
                  Nuevo
                </button>
              )}
              <button type="button" className="btn-secondary compact" onClick={() => loadRecords(activeResource)}>
                Actualizar
              </button>
            </div>
            {loading ? (
              <p className="panel-copy">Cargando...</p>
            ) : records.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Registro</th>
                    <th>Estado / Tipo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id || JSON.stringify(record)}>
                      <td>{record[activeResource.titleField] || record.nombre || record.titulo || record.numero || record.id}</td>
                      <td>{record.estado || record.tipo || record.rol || '-'}</td>
                      <td>{record.fecha || record.fecha_emision || record.created_at?.slice(0, 10) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="panel-copy">Aun no hay registros para mostrar.</p>
            )}
          </div>
        </article>

        <article className="feature-panel">
          <h2>Pasos habituales</h2>
          <div className="workflow-list">
            {config.workflow.map((step, index) => (
              <div key={step} className="workflow-step">
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <h2 className="panel-section-title">Informacion relacionada</h2>
          <div className="table-tags">
            {config.tables.map((table) => (
              <span key={table}>{toFriendlyName(table)}</span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ErpFeatureModule;
