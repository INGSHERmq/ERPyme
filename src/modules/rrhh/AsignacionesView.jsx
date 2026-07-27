import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DataTable from '../../components/DataTable';
import useRRHH from '../../hooks/useRRHH';
import useProjects from '../../hooks/useProjects';
import './AsignacionesView.css';

const emptyForm = () => ({
  empleado_id: '',
  proyecto_id: '',
  rol: '',
  fecha_inicio: null,
  fecha_fin: null,
  tipo_asignacion: 'horas_semana',
  horas_semanales: 40,
  estado: 'Activo'
});

const parseDateValue = (value) => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null);

const AsignacionesView = () => {
  const {
    empleados,
    asignaciones,
    asignarAProyecto,
    updateAsignacionProyecto,
    desactivarAsignacionProyecto,
    loading,
    refetch
  } = useRRHH();
  const { proyectos } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        empleado_id: Number(formData.empleado_id),
        proyecto_id: Number(formData.proyecto_id),
        rol: formData.rol,
        fecha_inicio: formData.fecha_inicio?.toISOString().split('T')[0] || null,
        fecha_fin: formData.fecha_fin?.toISOString().split('T')[0] || null,
        tipo_asignacion: formData.tipo_asignacion,
        horas_semanales: Number(formData.horas_semanales),
        estado: formData.estado
      };

      if (editingId) {
        await updateAsignacionProyecto(editingId, payload);
      } else {
        await asignarAProyecto(payload);
      }
      resetForm();
      await refetch();
      alert('Asignacion guardada correctamente');
    } catch (error) {
      console.error('Error al asignar:', error);
      alert('Error: ' + (error.message || 'No se pudo asignar el empleado'));
    }
  };

  const asignacionesConNombres = useMemo(() => {
    if (!asignaciones || !empleados || !proyectos) return [];
    return asignaciones.map(asig => {
      const emp = empleados.find(e => Number(e.id) === Number(asig.empleado_id));
      const proj = proyectos.find(p => Number(p.id) === Number(asig.proyecto_id));
      return {
        ...asig,
        empleado_nombre: emp ? [emp.nombre, emp.apellidos].filter(Boolean).join(' ') : 'No disponible',
        proyecto_nombre: proj?.nombre_mostrar || proj?.nombre || 'No disponible'
      };
    });
  }, [asignaciones, empleados, proyectos]);

  const handleEdit = (asignacion) => {
    setEditingId(asignacion.id);
    setShowForm(true);
    setFormData({
      empleado_id: asignacion.empleado_id ? String(asignacion.empleado_id) : '',
      proyecto_id: asignacion.proyecto_id ? String(asignacion.proyecto_id) : '',
      rol: asignacion.rol || '',
      fecha_inicio: parseDateValue(asignacion.fecha_inicio),
      fecha_fin: parseDateValue(asignacion.fecha_fin),
      tipo_asignacion: asignacion.tipo_asignacion || 'horas_semana',
      horas_semanales: asignacion.horas_semanales || 40,
      estado: asignacion.estado || 'Activo'
    });
  };

  const handleDesactivar = async (asignacion) => {
    try {
      await desactivarAsignacionProyecto(asignacion.id);
      await refetch();
    } catch (error) {
      alert(error.message || 'No se pudo desactivar la asignación');
    }
  };

  if (loading) return <div className="loading">Cargando asignaciones...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>Asignaciones a Proyectos</h2>
        <button className="btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancelar' : '+ Nueva Asignacion'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <div className="form-field">
            <label>Empleado</label>
            <select
              required
              value={formData.empleado_id}
              onChange={e => setFormData({ ...formData, empleado_id: e.target.value })}
            >
              <option value="">Seleccionar empleado *</option>
              {empleados.filter(e => e.estado === 'Activo').map(e => (
                <option key={e.id} value={e.id}>{[e.nombre, e.apellidos].filter(Boolean).join(' ')} ({e.cargo})</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Proyecto</label>
            <select
              required
              value={formData.proyecto_id}
              onChange={e => setFormData({ ...formData, proyecto_id: e.target.value })}
            >
              <option value="">Seleccionar proyecto *</option>
              {proyectos.map((p, index) => (
                <option key={p.id} value={p.id}>#{index + 1} - {p.nombre_mostrar || p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Rol en el proyecto</label>
            <input
              required
              placeholder="Ej. Tecnico, supervisor, analista"
              value={formData.rol}
              onChange={e => setFormData({ ...formData, rol: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Fecha de inicio</label>
            <DatePicker
              selected={formData.fecha_inicio}
              onChange={(date) => setFormData({ ...formData, fecha_inicio: date })}
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
          </div>

          <div className="form-field">
            <label>Fecha de fin</label>
            <DatePicker
              selected={formData.fecha_fin}
              onChange={(date) => setFormData({ ...formData, fecha_fin: date })}
              dateFormat="dd/MM/yyyy"
              placeholderText="Fecha fin (opcional)"
              className="date-picker-input"
              isClearable
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearRange="2020:2030"
            />
          </div>

          <div className="form-field">
            <label>Tipo de horas</label>
            <select value={formData.tipo_asignacion} onChange={e => setFormData({ ...formData, tipo_asignacion: e.target.value })}>
              <option value="horas_día">Horas por día</option>
              <option value="horas_semana">Horas por semana</option>
            </select>
          </div>

          <div className="form-field">
            <label>{formData.tipo_asignacion === 'horas_día' ? 'Horas por día' : 'Horas por semana'}</label>
            <input
              type="number"
              placeholder={formData.tipo_asignacion === 'horas_día' ? 'Ej. 8' : 'Ej. 40'}
              value={formData.horas_semanales}
              onChange={e => setFormData({ ...formData, horas_semanales: Number(e.target.value) })}
              min="1"
              max={formData.tipo_asignacion === 'horas_día' ? '24' : '80'}
            />
          </div>

          <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Asignar'}</button>
        </form>
      )}

      <DataTable
        data={asignacionesConNombres}
        searchKeys={['empleado_nombre', 'proyecto_nombre', 'rol', 'estado']}
        searchPlaceholder="Buscar por empleado, proyecto, rol o estado..."
        pageSize={10}
        columns={['Empleado', 'Proyecto', 'Rol', 'Inicio', 'Fin', 'Horas', 'Estado', 'Acciones']}
        renderRow={(a) => (
          <tr key={a.id}>
            <td className="cell-bold">{a.empleado_nombre}</td>
            <td>{a.proyecto_nombre}</td>
            <td>{a.rol}</td>
            <td>{a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleDateString('es-ES') : '-'}</td>
            <td>{a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}</td>
            <td>{a.horas_semanales}h {a.tipo_asignacion === 'horas_día' ? '/ día' : '/ sem'}</td>
            <td><span className={`badge badge-${a.estado === 'Activo' ? 'green' : 'gray'}`}>{a.estado}</span></td>
            <td>
              <div className="document-status">
                <button type="button" className="btn-action" onClick={() => handleEdit(a)}>Editar</button>
                {a.estado === 'Activo' && (
                  <button type="button" className="btn-action" onClick={() => handleDesactivar(a)}>Desactivar</button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default AsignacionesView;
