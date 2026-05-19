import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { datePickerDateToInputDate, parseDateInAppTimeZone } from '../../../lib/dates';
import './TareaModal.css';

const COLORS = [
  { name: 'Azul', value: '#0052cc' },
  { name: 'Verde', value: '#28a745' },
  { name: 'Rojo', value: '#dc3545' },
  { name: 'Amarillo', value: '#ffc107' },
  { name: 'Morado', value: '#6f42c1' },
  { name: 'Naranja', value: '#fd7e14' }
];

const getInitialFormData = (t) => ({
  titulo: t?.titulo || '',
  descripcion: t?.descripcion || '',
  estado: t?.estado || 'Pendiente',
  prioridad: t?.prioridad || 'Media',
  fecha_inicio: t?.fecha_inicio ? parseDateInAppTimeZone(t.fecha_inicio) : null,
  fecha_fin: t?.fecha_fin ? parseDateInAppTimeZone(t.fecha_fin) : null,
  duracion_horas: t?.duracion_horas ?? '',
  color: t?.color || '#0052cc',
  asignado_a: t?.asignado_a ? String(t.asignado_a) : ''
});

const TareaModal = ({ show, onClose, onSave, tarea, empleadosProyecto }) => {
  const [formData, setFormData] = useState(() => getInitialFormData(tarea));
  const [prevTarea, setPrevTarea] = useState(tarea);
  const [prevShow, setPrevShow] = useState(show);

  if (tarea !== prevTarea || show !== prevShow) {
    setPrevTarea(tarea);
    setPrevShow(show);
    setFormData(getInitialFormData(tarea));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      fecha_inicio: datePickerDateToInputDate(formData.fecha_inicio),
      fecha_fin: datePickerDateToInputDate(formData.fecha_fin),
      duracion_horas: formData.duracion_horas === '' ? null : Number(formData.duracion_horas),
      asignado_a: formData.asignado_a ? Number(formData.asignado_a) : null
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tarea ? '✏️ Editar Tarea' : '✅ Nueva Tarea'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="tarea-form">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Nombre de la tarea"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la tarea"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado</label>
              <select
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad</label>
              <select
                value={formData.prioridad}
                onChange={e => setFormData({ ...formData, prioridad: e.target.value })}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <DatePicker
                selected={formData.fecha_inicio}
                onChange={date => setFormData({ ...formData, fecha_inicio: date })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha"
                className="date-input"
                isClearable
              />
            </div>

            <div className="form-group">
              <label>Fecha Fin</label>
              <DatePicker
                selected={formData.fecha_fin}
                onChange={date => setFormData({ ...formData, fecha_fin: date })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha"
                className="date-input"
                isClearable
                minDate={formData.fecha_inicio}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Asignar a</label>
            <select
              value={formData.asignado_a}
              onChange={e => setFormData({ ...formData, asignado_a: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {empleadosProyecto.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.empleado_nombre} {emp.rol ? `- ${emp.rol}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Duracion estimada (horas)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.duracion_horas}
              onChange={e => setFormData({ ...formData, duracion_horas: e.target.value })}
              placeholder="Ej: 8"
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {tarea ? 'Actualizar' : 'Crear'} Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TareaModal;
