import { useState } from 'react';
import useFinanzas from '../../hooks/useFinanzas';
import { useNotification } from '../../context/NotificationContext';
import './CuentasPorCobrarView.css';

const initialFormData = () => ({
  clienteId: '',
  proyectoId: '',
  concepto: '',
  monto: '',
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaVencimiento: '',
  estado: 'Pendiente'
});

const CuentasPorCobrarView = () => {
  const {
    clientes,
    cuentasPorCobrar,
    addCuentaPorCobrar,
    marcarCuentaComoCobrada,
    refetch,
    loading
  } = useFinanzas();
  const { showConfirm } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCuentaPorCobrar({
        ...formData,
        clienteId: Number(formData.clienteId),
        proyectoId: formData.proyectoId ? Number(formData.proyectoId) : null,
        monto: Number(formData.monto)
      });
      setShowForm(false);
      setFormData(initialFormData());
      refetch();
    } catch (error) {
      console.error('Error registrando cuenta por cobrar:', error);
      alert('No se pudo registrar la cuenta por cobrar');
    }
  };

  const handleCobrar = async (id) => {
    const confirmed = await showConfirm('¿Marcar como cobrada?', 'Confirmar Cobro');
    if (!confirmed) return;
    await marcarCuentaComoCobrada(id);
    refetch();
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="cuentas-view">
      <div className="view-header">
        <h2>Cuentas por Cobrar</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Cuenta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="clienteId" required value={formData.clienteId} onChange={handleChange}>
            <option value="">Cliente *</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="concepto" placeholder="Concepto *" required value={formData.concepto} onChange={handleChange} />
          <input name="monto" type="number" min="0" step="0.01" placeholder="Monto" required value={formData.monto} onChange={handleChange} />
          <input name="fechaEmision" type="date" required value={formData.fechaEmision} onChange={handleChange} />
          <input name="fechaVencimiento" type="date" required value={formData.fechaVencimiento} onChange={handleChange} />
          <button type="submit" className="btn-primary">Crear</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {cuentasPorCobrar.map(c => (
              <tr key={c.id}>
                <td className="cell-bold">{c.clienteNombre}</td>
                <td>{c.concepto}</td>
                <td><strong>S/ {Number(c.monto || 0).toLocaleString('en-US')}</strong></td>
                <td>{c.fechaVencimiento}</td>
                <td><span className={`badge ${c.estado === 'Cobrada' ? 'badge-green' : 'badge-yellow'}`}>{c.estado}</span></td>
                <td>
                  {c.estado === 'Pendiente' && (
                    <button className="btn-action btn-cobrar" onClick={() => handleCobrar(c.id)}>Cobrar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CuentasPorCobrarView;
