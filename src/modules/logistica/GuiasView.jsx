import { useState } from 'react';
import useLogistica from '../../hooks/useLogistica';
import './GuiasView.css';

const GuiasView = () => {
  const { activos, guias, addGuia, refetch, loading } = useLogistica();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ activoId: '', destino: '', fechaSalida: new Date().toISOString().split('T')[0], fechaRegreso: '', responsable: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addGuia({ ...formData, activoId: Number(formData.activoId) });
    setShowForm(false);
    setFormData({ activoId: '', destino: '', fechaSalida: new Date().toISOString().split('T')[0], fechaRegreso: '', responsable: '' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando guías...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Guías de Salida</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nueva Guía'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="activoId" required value={formData.activoId} onChange={handleChange}>
            <option value="">Seleccionar Activo *</option>
            {activos.filter(a => a.estado === 'Disponible' || a.estado === 'En uso').map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <input name="destino" placeholder="Destino / Cliente *" required value={formData.destino} onChange={handleChange} />
          <input name="fechaSalida" type="date" required value={formData.fechaSalida} onChange={handleChange} />
          <input name="fechaRegreso" type="date" placeholder="Fecha Regreso (opcional)" value={formData.fechaRegreso} onChange={handleChange} />
          <input name="responsable" placeholder="Responsable *" required value={formData.responsable} onChange={handleChange} />
          <button type="submit" className="btn-primary">Emitir Guía</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Activo</th><th>Destino</th><th>Salida</th><th>Regreso</th><th>Responsable</th><th>Estado</th></tr></thead>
          <tbody>
            {guias.map(g => (
              <tr key={g.id}>
                <td className="cell-bold">{g.activoNombre}</td>
                <td>{g.destino}</td>
                <td>{g.fechaSalida}</td>
                <td>{g.fechaRegreso || 'Pendiente'}</td>
                <td>{g.responsable}</td>
                <td><span className={`badge ${g.estado === 'En tránsito' ? 'badge-blue' : 'badge-green'}`}>{g.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuiasView;