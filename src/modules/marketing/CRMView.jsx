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
    updateCliente,
    updateClienteEstado,
    refetch,
    loading,
    error
  } = useMarketing();
  const [leadForm, setLeadForm] = useState(initialLead);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const documentLimit = leadForm.tipo_identificacion === 'RUC' ? 11 : 8;

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    if (name === 'tipo_identificacion') {
      setLeadForm(prev => ({
        ...prev,
        tipo_identificacion: value,
        dni_ruc: prev.dni_ruc.slice(0, value === 'RUC' ? 11 : 8)
      }));
      return;
    }
    if (name === 'dni_ruc') {
      setLeadForm(prev => ({
        ...prev,
        dni_ruc: value.replace(/\D/g, '').slice(0, prev.tipo_identificacion === 'RUC' ? 11 : 8)
      }));
      return;
    }
    setLeadForm(prev => ({ ...prev, [name]: value }));
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCliente(editingId, leadForm);
      } else {
        await addLead(leadForm);
      }
      setLeadForm(initialLead);
      setEditingId(null);
      await refetch();
      alert('Cliente guardado. Tambien queda disponible para crear cotizaciones.');
    } catch (submitError) {
      console.error('Error al guardar cliente:', submitError);
      alert(submitError.message || 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lead) => {
    setEditingId(lead.id);
    setLeadForm({
      nombre: lead.nombre || '',
      contacto: lead.contacto || '',
      email: lead.email || '',
      telefono: lead.telefono || '',
      tipo_identificacion: lead.tipo_identificacion || 'DNI',
      dni_ruc: lead.dni_ruc || '',
      industria: lead.industria || '',
      estado: lead.estado || 'Activo'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setLeadForm(initialLead);
  };

  const handleToggleEstado = async (lead) => {
    const nextEstado = lead.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await updateClienteEstado(lead.id, nextEstado);
      await refetch();
    } catch (toggleError) {
      console.error('Error al actualizar estado:', toggleError);
      alert(toggleError.message || 'No se pudo actualizar el cliente');
    }
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;
  if (error) return <div className="empty-state">No se pudo cargar clientes: {error}</div>;

  return (
    <div className="crm-view">
      <section className="crm-panel">
        <div className="panel-heading">
          <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <span>Inscripcion comercial</span>
        </div>
        <p className="crm-hint">
          Registra aqui al prospecto. Al guardar, quedara inscrito para que puedas crear su cotizacion.
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
          <input
            name="dni_ruc"
            inputMode="numeric"
            maxLength={documentLimit}
            placeholder={leadForm.tipo_identificacion === 'RUC' ? 'RUC (11 digitos)' : 'DNI (8 digitos)'}
            value={leadForm.dni_ruc}
            onChange={handleLeadChange}
          />
          <input name="industria" placeholder="Industria" value={leadForm.industria} onChange={handleLeadChange} />
          <select name="estado" value={leadForm.estado} onChange={handleLeadChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : editingId ? 'Actualizar cliente' : 'Guardar cliente'}
          </button>
          {editingId && (
            <button className="btn-secondary" type="button" onClick={handleCancelEdit}>
              Cancelar edicion
            </button>
          )}
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
                <th>Tipo</th>
                <th>DNI / RUC</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Industria</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">Aun no hay clientes registrados.</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <span className={`badge ${lead.tipo_identificacion === 'RUC' ? 'badge-teal' : 'badge-blue'}`}>
                        {lead.tipo_identificacion || '-'}
                      </span>
                    </td>
                    <td>{lead.dni_ruc || '-'}</td>
                    <td className="cell-bold">{lead.nombre}</td>
                    <td>{lead.contacto || '-'}</td>
                    <td>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '-'}</td>
                    <td>{lead.industria || '-'}</td>
                    <td>
                      <span className={`badge ${lead.estado === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                        {lead.estado || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="btn-action" onClick={() => handleEdit(lead)}>Editar</button>
                        <button type="button" className="btn-action" onClick={() => handleToggleEstado(lead)}>
                          {lead.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
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
