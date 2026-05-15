import { useState } from 'react';
import useMarketing from '../../hooks/useMarketing';
import './CRMView.css';

const initialLead = {
  nombre: '',
  contacto: '',
  email: '',
  telefono: '',
  tipo_identificacion: 'DNI',
  dni_ruc: '',
  industria: '',
  estado: 'Activo'
};

const CRMView = () => {
  const {
    leads,
    addLead,
    refetch,
    loading,
    error
  } = useMarketing();
  const [leadForm, setLeadForm] = useState(initialLead);
  const [saving, setSaving] = useState(false);

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm(prev => ({ ...prev, [name]: value }));
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addLead(leadForm);
      setLeadForm(initialLead);
      await refetch();
      alert('Cliente guardado. También queda disponible para crear cotizaciones.');
    } catch (submitError) {
      console.error('Error al guardar cliente:', submitError);
      alert(submitError.message || 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;
  if (error) return <div className="empty-state">No se pudo cargar clientes: {error}</div>;

  return (
    <div className="crm-view">
      <section className="crm-panel">
        <div className="panel-heading">
          <h2>Nuevo cliente</h2>
          <span>Inscripción comercial</span>
        </div>
        <p className="crm-hint">
          Registra aquí al prospecto. Al guardar, quedará inscrito para que puedas crear su cotización.
        </p>
        <form className="crm-form" onSubmit={submitLead}>
          <input name="nombre" placeholder="Empresa o persona *" required value={leadForm.nombre} onChange={handleLeadChange} />
          <input name="contacto" placeholder="Contacto" value={leadForm.contacto} onChange={handleLeadChange} />
          <input name="email" type="email" placeholder="Email" value={leadForm.email} onChange={handleLeadChange} />
          <input name="telefono" placeholder="Telefono" value={leadForm.telefono} onChange={handleLeadChange} />
          <select name="tipo_identificacion" value={leadForm.tipo_identificacion} onChange={handleLeadChange}>
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
          </select>
          <input name="dni_ruc" placeholder="DNI / RUC" value={leadForm.dni_ruc} onChange={handleLeadChange} />
          <input name="industria" placeholder="Industria" value={leadForm.industria} onChange={handleLeadChange} />
          <select name="estado" value={leadForm.estado} onChange={handleLeadChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </form>
      </section>

      <section className="crm-panel">
        <div className="panel-heading">
          <h2>Clientes registrados</h2>
          <span>{leads.length} clientes</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>DNI / RUC</th>
                <th>Industria</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-cell">Aún no hay clientes registrados.</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id}>
                    <td className="cell-bold">{lead.nombre}</td>
                    <td>{lead.contacto || '-'}</td>
                    <td>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '-'}</td>
                    <td>{lead.dni_ruc || '-'}</td>
                    <td>{lead.industria || '-'}</td>
                    <td><span className="badge badge-blue">{lead.estado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CRMView;
