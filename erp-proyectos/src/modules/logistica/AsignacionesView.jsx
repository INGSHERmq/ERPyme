import { useState } from 'react';
import useLogistica from '../../hooks/useLogistica';
import './AsignacionesView.css';

const AsignacionesView = () => {
  const { activos, asignaciones, addAsignacion, devolverAsignacion, refetch, loading } = useLogistica();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ activoId: '', tipoAsignacion: 'Empleado', refId: '', observaciones: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addAsignacion({ ...formData, activoId: Number(formData.activoId), refId: Number(formData.refId) });
    setShowForm(false);
    setFormData({ activoId: '', tipoAsignacion: 'Empleado', refId: '', observaciones: '' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando asignaciones...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>🔗 Asignaciones de Activos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nueva Asignación'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="activoId" required value={formData.activoId} onChange={handleChange}>
            <option value="">Seleccionar Activo *</option>
            {activos.filter(a => a.estado === 'Disponible').map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select name="tipoAsignacion" value={formData.tipoAsignacion} onChange={handleChange}>
            <option>Empleado</option><option>Proyecto</option>
          </select>
          <input name="refId" type="number" placeholder="ID Empleado/Proyecto *" required value={formData.refId} onChange={handleChange} />
          <input name="observaciones" placeholder="Observaciones" value={formData.observaciones} onChange={handleChange} />
          <button type="submit" className="btn-primary">Asignar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Activo</th><th>Asignado A</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {asignaciones.map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.activoNombre}</td>
                <td>{a.refNombre}</td>
                <td><span className="badge badge-blue">{a.tipoAsignacion}</span></td>
                <td>{a.fechaAsignacion}</td>
                <td><span className={`badge ${a.estado === 'Activa' ? 'badge-green' : 'badge-gray'}`}>{a.estado}</span></td>
                <td>
                  {a.estado === 'Activa' && (
                    <button className="btn-action btn-cobrar" onClick={() => devolverAsignacion(a.id)}>↩️ Devolver</button>
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

export default AsignacionesView;