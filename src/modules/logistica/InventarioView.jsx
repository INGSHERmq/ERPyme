import { useState } from 'react';
import useLogistica from '../../hooks/useLogistica';
import './InventarioView.css';

const InventarioView = () => {
  const { activos, addActivo, loading, refetch } = useLogistica();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', tipo: 'Laptop', marca: '', modelo: '',
    serie: '', ubicacion: '', costo: '', estado: 'Disponible'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addActivo({ ...formData, costo: Number(formData.costo) });
      setShowForm(false);
      setFormData({ 
        nombre: '', tipo: 'Laptop', marca: '', modelo: '', 
        serie: '', ubicacion: '', costo: '', estado: 'Disponible' 
      });
      refetch();
    } catch (error) {
      console.error('Error al guardar activo:', error);
      alert('❌ Error al registrar el activo');
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando inventario...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>📦 Inventario de Activos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Activo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <input name="nombre" placeholder="Nombre del activo *" required value={formData.nombre} onChange={handleChange} />
          <select name="tipo" value={formData.tipo} onChange={handleChange}>
            <option>Laptop</option><option>Monitor</option><option>Herramienta</option><option>Infraestructura</option><option>Periférico</option><option>Otros</option>
          </select>
          <input name="marca" placeholder="Marca *" required value={formData.marca} onChange={handleChange} />
          <input name="modelo" placeholder="Modelo" value={formData.modelo} onChange={handleChange} />
          <input name="serie" placeholder="N° Serie" value={formData.serie} onChange={handleChange} />
          <input name="ubicacion" placeholder="Ubicación *" required value={formData.ubicacion} onChange={handleChange} />
          <input name="costo" type="number" placeholder="Costo ($)" required value={formData.costo} onChange={handleChange} />
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Tipo</th>
              <th>Marca / Modelo</th>
              <th>Ubicación</th>
              <th>Costo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {activos.map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.nombre}</td>
                <td>{a.tipo}</td>
                <td>
                  <div>{a.marca || '—'}</div>
                  <small className="text-muted">{a.modelo || ''}</small>
                </td>
                <td>{a.ubicacion || '—'}</td>
                <td>${a.costo?.toLocaleString() || 0}</td>
                <td>
                  <span className={`badge badge-${
                    a.estado === 'Disponible' ? 'green' :
                    a.estado === 'En uso' ? 'blue' :
                    a.estado === 'En mantenimiento' ? 'yellow' :
                    a.estado === 'En tránsito' ? 'purple' : 'gray'
                  }`}>
                    {a.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventarioView;