import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useRRHH from '../../hooks/useRRHH';
import useProjects from '../../hooks/useProjects';
import './AsignacionesView.css';

const AsignacionesView = () => {
  const { empleados, asignaciones, asignarAProyecto, loading, refetch } = useRRHH();
  const { proyectos } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    empleado_id: '',
    proyecto_id: '',
    rol: '',
    fecha_inicio: null,
    fecha_fin: null,
    horas_semanales: 40,
    estado: 'Activo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await asignarAProyecto({
        empleado_id: Number(formData.empleado_id),
        proyecto_id: Number(formData.proyecto_id),
        rol: formData.rol,
        fecha_inicio: formData.fecha_inicio?.toISOString().split('T')[0] || null,
        fecha_fin: formData.fecha_fin?.toISOString().split('T')[0] || null,
        horas_semanales: Number(formData.horas_semanales),
        estado: formData.estado
      });
      setShowForm(false);
      setFormData({
        empleado_id: '',
        proyecto_id: '',
        rol: '',
        fecha_inicio: null,
        fecha_fin: null,
        horas_semanales: 40,
        estado: 'Activo'
      });
      refetch();
      alert('✅ Asignación guardada correctamente');
    } catch (error) {
      console.error('Error al asignar:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo asignar el empleado'));
    }
  };

  const asignacionesConNombres = useMemo(() => {
    if (!asignaciones || !empleados || !proyectos) return [];
    return asignaciones.map(asig => {
      const emp = empleados.find(e => Number(e.id) === Number(asig.empleado_id));
      const proj = proyectos.find(p => Number(p.id) === Number(asig.proyecto_id));
      return {
        ...asig,
        empleado_nombre: emp?.nombre || 'No disponible',
        proyecto_nombre: proj?.nombre || 'No disponible'
      };
    });
  }, [asignaciones, empleados, proyectos]);

  if (loading) return <div className="loading">Cargando asignaciones...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>🏗️ Asignaciones a Proyectos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Asignación'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select 
            required 
            value={formData.empleado_id} 
            onChange={e => setFormData({...formData, empleado_id: e.target.value})}
          >
            <option value="">Empleado *</option>
            {empleados.filter(e => e.estado === 'Activo').map(e => (
              <option key={e.id} value={e.id}>{e.nombre} ({e.cargo})</option>
            ))}
          </select>
          
          <select 
            required 
            value={formData.proyecto_id} 
            onChange={e => setFormData({...formData, proyecto_id: e.target.value})}
          >
            <option value="">Proyecto *</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>#{p.id} - {p.nombre}</option>
            ))}
          </select>
          
          <input 
            required 
            placeholder="Rol en el proyecto *" 
            value={formData.rol} 
            onChange={e => setFormData({...formData, rol: e.target.value})} 
          />
          
          {/* ✅ Calendario libre con selectores de mes/año */}
          <DatePicker
            selected={formData.fecha_inicio}
            onChange={(date) => setFormData({...formData, fecha_inicio: date})}
            dateFormat="dd/MM/yyyy"
            placeholderText="Fecha de inicio *"
            className="date-picker-input"
            required
            isClearable
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearRange="2020:2030"
          />
          
          <DatePicker
            selected={formData.fecha_fin}
            onChange={(date) => setFormData({...formData, fecha_fin: date})}
            dateFormat="dd/MM/yyyy"
            placeholderText="Fecha fin (opcional)"
            className="date-picker-input"
            isClearable
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearRange="2020:2030"
          />
          
          <input 
            type="number" 
            placeholder="Horas/Semana" 
            value={formData.horas_semanales} 
            onChange={e => setFormData({...formData, horas_semanales: Number(e.target.value)})}
            min="1"
            max="80"
          />
          
          <button type="submit" className="btn-primary">Asignar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Proyecto</th>
              <th>Rol</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas/Sem</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asignacionesConNombres.map(a => (
              <tr key={a.id}>
                <td className="cell-bold">{a.empleado_nombre}</td>
                <td>{a.proyecto_nombre}</td>
                <td>{a.rol}</td>
                <td>{a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>
                <td>{a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}</td>
                <td>{a.horas_semanales}h</td>
                <td><span className={`badge badge-${a.estado === 'Activo' ? 'green' : 'gray'}`}>{a.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AsignacionesView;