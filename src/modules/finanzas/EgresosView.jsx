import { useState } from 'react';
import useFinanzas from '../../hooks/useFinanzas';
import './EgresosView.css';

const EgresosView = () => {
  const { egresos, addEgreso, refetch, loading } = useFinanzas();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ categoria: 'Infraestructura', concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], proyectoId: '', tipo: 'Operativo', metodo: 'Tarjeta' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addEgreso({ ...formData, monto: Number(formData.monto), proyectoId: formData.proyectoId || null });
      setShowForm(false);
      setFormData({ categoria: 'Infraestructura', concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], proyectoId: '', tipo: 'Operativo', metodo: 'Tarjeta' });
      refetch();
    } catch (error) { console.error('Error:', error); alert('Error al guardar'); }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="egresos-view">
      <div className="view-header">
        <h2>Gestión de Egresos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Egreso'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="categoria" value={formData.categoria} onChange={handleChange}><option>Infraestructura</option><option>Licencias</option><option>Servicios</option><option>Otros</option></select>
          <input name="concepto" placeholder="Concepto *" required value={formData.concepto} onChange={handleChange} />
          <input name="monto" type="number" placeholder="Monto (S/)" required value={formData.monto} onChange={handleChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <select name="tipo" value={formData.tipo} onChange={handleChange}><option>Operativo</option><option>Proyecto</option></select>
          <select name="metodo" value={formData.metodo} onChange={handleChange}><option>Tarjeta</option><option>Transferencia</option><option>Efectivo</option></select>
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Fecha</th><th>Tipo</th><th>Método</th></tr></thead>
          <tbody>
            {egresos.map(e => (
              <tr key={e.id}>
                <td className="cell-bold">{e.concepto}</td>
                <td>{e.categoria}</td>
                <td><strong className="text-red">-S/ {e.monto.toLocaleString()}</strong></td>
                <td>{e.fecha}</td>
                <td>{e.tipo}</td>
                <td>{e.metodo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EgresosView;