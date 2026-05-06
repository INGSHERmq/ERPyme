import { useState } from 'react';
import useFinanzas from '../../hooks/useFinanzas';
import './IngresosView.css';

const initialForm = () => ({
  tipo: 'Proyecto',
  concepto: '',
  monto: '',
  fecha: new Date().toISOString().split('T')[0],
  proyectoId: '',
  clienteId: '',
  estado: 'Pendiente',
  metodo: 'Transferencia'
});

const IngresosView = () => {
  const { ingresos, addIngreso, refetch, loading } = useFinanzas();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addIngreso({
        ...formData,
        monto: Number(formData.monto),
        proyectoId: formData.proyectoId || null,
        clienteId: formData.clienteId || null
      });
      setShowForm(false);
      setFormData(initialForm());
      refetch();
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo guardar el ingreso');
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando ingresos...</div>;

  return (
    <div className="ingresos-view">
      <div className="view-header">
        <h2>Ingresos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo ingreso'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="tipo" value={formData.tipo} onChange={handleChange}><option>Proyecto</option><option>Servicio</option><option>Otro</option></select>
          <input name="concepto" placeholder="Concepto *" required value={formData.concepto} onChange={handleChange} />
          <input name="monto" type="number" placeholder="Monto (S/)" required value={formData.monto} onChange={handleChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <select name="estado" value={formData.estado} onChange={handleChange}><option>Pendiente</option><option>Cobrado</option></select>
          <select name="metodo" value={formData.metodo} onChange={handleChange}><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option><option>Pendiente</option></select>
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Concepto</th><th>Tipo</th><th>Monto</th><th>Fecha</th><th>Estado</th><th>Metodo</th></tr></thead>
          <tbody>
            {ingresos.map(i => (
              <tr key={i.id}>
                <td className="cell-bold">{i.concepto}</td>
                <td>{i.tipo}</td>
                <td><strong>S/ {Number(i.monto || 0).toLocaleString()}</strong></td>
                <td>{i.fecha}</td>
                <td><span className={`badge ${i.estado === 'Cobrado' ? 'badge-green' : 'badge-yellow'}`}>{i.estado}</span></td>
                <td>{i.metodo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IngresosView;
