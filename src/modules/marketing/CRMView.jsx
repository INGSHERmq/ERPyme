import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './CRMView.css';

const initialLead = {
  nombre: '',
  contacto: '',
  email: '',
  telefono: '',
  origen: 'Web',
  industria: '',
  tiempo_respuesta_horas: '',
  estado: 'Nuevo'
};

const initialOpportunity = {
  lead_id: '',
  cliente_id: '',
  titulo: '',
  cliente_potencial: '',
  monto_estimado: '',
  etapa: 'Prospeccion',
  origen: '',
  industria: '',
  tiempo_respuesta_horas: '',
  fecha_cierre_estimada: ''
};

const CRMView = () => {
  const {
    clientes,
    leads,
    oportunidades,
    addLead,
    addOportunidad,
    refetch,
    loading,
    error
  } = useMarketing();
  const [leadForm, setLeadForm] = useState(initialLead);
  const [opportunityForm, setOpportunityForm] = useState(initialOpportunity);
  const [saving, setSaving] = useState(false);

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpportunityChange = (event) => {
    const { name, value } = event.target;
    setOpportunityForm(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'cliente_id') {
        const cliente = clientes.find(item => Number(item.id) === Number(value));
        if (cliente) {
          next.cliente_potencial = next.cliente_potencial || cliente.nombre;
          next.industria = next.industria || cliente.industria || '';
        }
      }

      if (name === 'lead_id') {
        const lead = leads.find(item => Number(item.id) === Number(value));
        if (lead) {
          next.cliente_potencial = next.cliente_potencial || lead.nombre;
          next.origen = next.origen || lead.origen || '';
          next.industria = next.industria || lead.industria || '';
          next.tiempo_respuesta_horas = next.tiempo_respuesta_horas || lead.tiempo_respuesta_horas || '';
        }
      }

      return next;
    });
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addLead({
        ...leadForm,
        tiempo_respuesta_horas: leadForm.tiempo_respuesta_horas === '' ? null : Number(leadForm.tiempo_respuesta_horas)
      });
      setLeadForm(initialLead);
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  const submitOpportunity = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const lead = leads.find(item => Number(item.id) === Number(opportunityForm.lead_id));
      await addOportunidad({
        ...opportunityForm,
        lead_id: opportunityForm.lead_id ? Number(opportunityForm.lead_id) : null,
        cliente_id: opportunityForm.cliente_id ? Number(opportunityForm.cliente_id) : null,
        origen: opportunityForm.origen || lead?.origen || null,
        industria: opportunityForm.industria || lead?.industria || null,
        tiempo_respuesta_horas: opportunityForm.tiempo_respuesta_horas || lead?.tiempo_respuesta_horas || null
      });
      setOpportunityForm(initialOpportunity);
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Cargando CRM...</div>;
  if (error) return <div className="empty-state">No se pudo cargar CRM: {error}</div>;

  return (
    <div className="crm-view">
      <section className="crm-grid">
        <article className="crm-panel">
          <div className="panel-heading">
            <h2>Nuevo lead</h2>
            <span>Senales para scoring</span>
          </div>
          <form className="crm-form" onSubmit={submitLead}>
            <input name="nombre" placeholder="Empresa o persona *" required value={leadForm.nombre} onChange={handleLeadChange} />
            <input name="contacto" placeholder="Contacto" value={leadForm.contacto} onChange={handleLeadChange} />
            <input name="email" type="email" placeholder="Email" value={leadForm.email} onChange={handleLeadChange} />
            <input name="telefono" placeholder="Telefono" value={leadForm.telefono} onChange={handleLeadChange} />
            <select name="origen" value={leadForm.origen} onChange={handleLeadChange}>
              <option value="Web">Web</option>
              <option value="Referido">Referido</option>
              <option value="Campana">Campana</option>
              <option value="Redes">Redes</option>
              <option value="Outbound">Outbound</option>
            </select>
            <input name="industria" placeholder="Industria" value={leadForm.industria} onChange={handleLeadChange} />
            <input name="tiempo_respuesta_horas" type="number" min="0" step="0.5" placeholder="Tiempo respuesta horas" value={leadForm.tiempo_respuesta_horas} onChange={handleLeadChange} />
            <select name="estado" value={leadForm.estado} onChange={handleLeadChange}>
              <option value="Nuevo">Nuevo</option>
              <option value="Contactado">Contactado</option>
              <option value="Calificado">Calificado</option>
              <option value="Perdido">Perdido</option>
            </select>
            <button className="btn-primary" type="submit" disabled={saving}>Guardar lead</button>
          </form>
        </article>

        <article className="crm-panel">
          <div className="panel-heading">
            <h2>Nueva oportunidad</h2>
            <span>Probabilidad automatica</span>
          </div>
          <p className="crm-hint">
            Usa esta ficha cuando un cliente o lead tiene una venta posible. Al guardarla, Lead scoring calcula la prioridad.
          </p>
          <form className="crm-form" onSubmit={submitOpportunity}>
            <select name="lead_id" value={opportunityForm.lead_id} onChange={handleOpportunityChange}>
              <option value="">Lead asociado</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.nombre}</option>)}
            </select>
            <select name="cliente_id" value={opportunityForm.cliente_id} onChange={handleOpportunityChange}>
              <option value="">Cliente existente</option>
              {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
            </select>
            <input name="titulo" placeholder="Oportunidad *" required value={opportunityForm.titulo} onChange={handleOpportunityChange} />
            <input name="cliente_potencial" placeholder="Cliente potencial" value={opportunityForm.cliente_potencial} onChange={handleOpportunityChange} />
            <input name="monto_estimado" type="number" min="0" step="0.01" placeholder="Monto estimado" value={opportunityForm.monto_estimado} onChange={handleOpportunityChange} />
            <select name="etapa" value={opportunityForm.etapa} onChange={handleOpportunityChange}>
              <option value="Prospeccion">Prospeccion</option>
              <option value="Calificacion">Calificacion</option>
              <option value="Propuesta">Propuesta</option>
              <option value="Negociacion">Negociacion</option>
              <option value="Ganada">Ganada</option>
              <option value="Perdida">Perdida</option>
            </select>
            <input name="fecha_cierre_estimada" type="date" value={opportunityForm.fecha_cierre_estimada} onChange={handleOpportunityChange} />
            <input name="origen" placeholder="Origen" value={opportunityForm.origen} onChange={handleOpportunityChange} />
            <input name="industria" placeholder="Industria" value={opportunityForm.industria} onChange={handleOpportunityChange} />
            <input name="tiempo_respuesta_horas" type="number" min="0" step="0.5" placeholder="Tiempo respuesta horas" value={opportunityForm.tiempo_respuesta_horas} onChange={handleOpportunityChange} />
            <button className="btn-primary" type="submit" disabled={saving}>Guardar oportunidad</button>
          </form>
        </article>
      </section>

      <section className="crm-panel">
        <div className="panel-heading">
          <h2>Pipeline comercial</h2>
          <span>{oportunidades.length} oportunidades</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Oportunidad</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Etapa</th>
                <th>Probabilidad</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map(opportunity => (
                <tr key={opportunity.id}>
                  <td className="cell-bold">{opportunity.titulo}</td>
                  <td>{opportunity.cliente_potencial || '-'}</td>
                  <td>S/ {Number(opportunity.monto_estimado || 0).toLocaleString()}</td>
                  <td>{opportunity.etapa}</td>
                  <td>{opportunity.probabilidad_cierre ?? '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CRMView;
