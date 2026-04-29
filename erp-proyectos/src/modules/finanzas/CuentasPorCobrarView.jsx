import { useState } from 'react';
import useFinanzas from '../../hooks/useFinanzas';
import './CuentasPorCobrarView.css';

const CuentasPorCobrarView = () => {
  const { cuentasPorCobrar, addCuentaPorCobrar, marcarCuentaComoCobrada, refetch, loading } = useFinanzas();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ clienteId: '', proyectoId: '', concepto: '', monto: '', fechaEmision: new Date().toISOString().split('T')[0], fechaVencimiento: '', estado: 'Pendiente' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCuentaPorCobrar({ ...formData, monto: Number(formData.monto) });
      setShowForm(false);
      setFormData({ clienteId: '', proyectoId: '', concepto: '', monto: '', fechaEmision: new Date().toISOString().split('T')[0], fechaVencimiento: '', estado: 'Pendiente' });
      refetch();
    } catch (error) { console.error('Error:', error); alert('❌ Error'); }
  };

  const handleCobrar = async (id) => {
    if (window.confirm('¿Marcar como cobrada?')) {
      await marcarCuentaComoCobrada(id);
      refetch();
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="cuentas-view">
      <div className="view-header">
        <h2>📋 Cuentas por Cobrar</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nueva Cuenta'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <input name="concepto" placeholder="Concepto *" required value={formData.concepto} onChange={handleChange} />
          <input name="monto" type="number" placeholder="Monto ($)" required value={formData.monto} onChange={handleChange} />
          <input name="fechaEmision" type="date" required value={formData.fechaEmision} onChange={handleChange} />
          <input name="fechaVencimiento" type="date" required value={formData.fechaVencimiento} onChange={handleChange} />
          <button type="submit" className="btn-primary">Crear</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Cliente</th><th>Concepto</th><th>Monto</th><th>Vencimiento</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {cuentasPorCobrar.map(c => (
              <tr key={c.id}>
                <td className="cell-bold">{c.clienteNombre}</td>
                <td>{c.concepto}</td>
                <td><strong>${c.monto.toLocaleString()}</strong></td>
                <td>{c.fechaVencimiento}</td>
                <td><span className={`badge ${c.estado === 'Cobrada' ? 'badge-green' : 'badge-yellow'}`}>{c.estado}</span></td>
                <td>
                  {c.estado === 'Pendiente' && (
                    <button className="btn-action btn-cobrar" onClick={() => handleCobrar(c.id)}>✅ Cobrar</button>
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