import { useState } from 'react';
import useLogistica from '../../hooks/useLogistica';
import './MantenimientoView.css';

const MantenimientoView = () => {
  const { activos, mantenimientos, addMantenimiento, completarMantenimiento, refetch, loading } = useLogistica();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ activoId: '', tipo: 'Preventivo', descripcion: '', costo: '', tecnico: '', estado: 'Pendiente' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addMantenimiento({ ...formData, activoId: Number(formData.activoId), costo: Number(formData.costo) });
    setShowForm(false);
    setFormData({ activoId: '', tipo: 'Preventivo', descripcion: '', costo: '', tecnico: '', estado: 'Pendiente' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando mantenimientos...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>🛠️ Control de Mantenimiento</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Programar'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="activoId" required value={formData.activoId} onChange={handleChange}>
            <option value="">Seleccionar Activo *</option>
            {activos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select name="tipo" value={formData.tipo} onChange={handleChange}>
            <option>Preventivo</option><option>Correctivo</option><option>Inspección</option>
          </select>
          <input name="descripcion" placeholder="Descripción del trabajo *" required value={formData.descripcion} onChange={handleChange} />
          <input name="costo" type="number" placeholder="Costo ($)" required value={formData.costo} onChange={handleChange} />
          <input name="tecnico" placeholder="Técnico/Proveedor" value={formData.tecnico} onChange={handleChange} />
          <button type="submit" className="btn-primary">Programar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Activo</th><th>Tipo</th><th>Descripción</th><th>Costo</th><th>Técnico</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {mantenimientos.map(m => (
              <tr key={m.id}>
                <td className="cell-bold">{m.activoNombre}</td>
                <td>{m.tipo}</td>
                <td>{m.descripcion}</td>
                <td>${m.costo.toLocaleString()}</td>
                <td>{m.tecnico || '—'}</td>
                <td><span className={`badge ${m.estado === 'Completado' ? 'badge-green' : 'badge-yellow'}`}>{m.estado}</span></td>
                <td>
                  {m.estado === 'Pendiente' && (
                    <button className="btn-action btn-cobrar" onClick={() => completarMantenimiento(m.id)}>✅ Completar</button>
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

export default MantenimientoView;