import { useState } from 'react';
import DataTable from '../../components/DataTable';
import useRRHH from '../../hooks/useRRHH';
import './SSOMAView.css';

const SSOMAView = () => {
  const { empleados, incidentes, addIncidente, refetch, loading } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    empleadoId: '',
    tipo: 'Accidente Leve',
    gravedad: 'Baja',
    descripcion: '',
    accionesTomadas: '',
    estado: 'Abierto'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addIncidente({ ...formData, empleadoId: Number(formData.empleadoId), fecha: new Date().toISOString().split('T')[0] });
    setShowForm(false);
    setFormData({ empleadoId: '', tipo: 'Accidente Leve', gravedad: 'Baja', descripcion: '', accionesTomadas: '', estado: 'Abierto' });
    refetch();
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando seguridad...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>Registro de seguridad</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo reporte'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="empleadoId" required value={formData.empleadoId} onChange={handleChange}>
            <option value="">Empleado afectado *</option>
            {empleados.filter(e => e.estado === 'Activo').map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select name="tipo" value={formData.tipo} onChange={handleChange}>
            <option>Accidente Leve</option><option>Accidente Grave</option><option>Enfermedad Ocupacional</option><option>Casi Accidente</option>
          </select>
          <select name="gravedad" value={formData.gravedad} onChange={handleChange}>
            <option>Baja</option><option>Media</option><option>Alta</option>
          </select>
          <input name="descripcion" placeholder="Descripción del caso *" required value={formData.descripcion} onChange={handleChange} />
          <input name="accionesTomadas" placeholder="Acciones tomadas" value={formData.accionesTomadas} onChange={handleChange} />
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option>Abierto</option><option>En Seguimiento</option><option>Cerrado</option>
          </select>
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      )}

      <DataTable
        data={incidentes}
        searchKeys={['empleadoNombre', 'tipo', 'gravedad', 'estado']}
        searchPlaceholder="Buscar por empleado, tipo, gravedad o estado..."
        pageSize={10}
        columns={['Empleado', 'Tipo', 'Gravedad', 'Fecha', 'Estado', 'Acciones']}
        renderRow={(i) => (
          <tr key={i.id}>
            <td className="cell-bold">{i.empleadoNombre}</td>
            <td>{i.tipo}</td>
            <td><span className={`badge ${i.gravedad === 'Alta' ? 'badge-red' : i.gravedad === 'Media' ? 'badge-yellow' : 'badge-green'}`}>{i.gravedad}</span></td>
            <td>{i.fecha}</td>
            <td><span className={`badge ${i.estado === 'Cerrado' ? 'badge-green' : 'badge-blue'}`}>{i.estado}</span></td>
            <td className="text-muted">{i.accionesTomadas || '-'}</td>
          </tr>
        )}
      />
    </div>
  );
};

export default SSOMAView;
