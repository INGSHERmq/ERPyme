import { useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import { supabase } from '../../lib/supabase';
import { uploadPrivateFile } from '../../lib/storage';
import { useAuth } from '../../context/auth/useAuth';
import './EmpleadosView.css';

const EmpleadosView = () => {
  const { user } = useAuth();
  const { empleados, addEmpleado, loading, refetch } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [solicitudEmpleadoId, setSolicitudEmpleadoId] = useState(null);
  const [fechaLimite, setFechaLimite] = useState('');
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', cargo: '',
    departamento: 'Tecnología', salario: '', estado: 'Activo', estado_laboral: 'Activo', tipo_contrato: 'Indefinido', puede_subir_documentos: false
  });
  const [archivosIniciales, setArchivosIniciales] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevoEmpleado = await addEmpleado({ ...formData, salario: Number(formData.salario) });

      if (formData.puede_subir_documentos && archivosIniciales.length > 0) {
        for (const file of archivosIniciales) {
          const upload = await uploadPrivateFile({
            file,
            folder: 'rrhh-documentos',
            userId: user?.id
          });

          const { error: documentoError } = await supabase.from('rrhh_documentos').insert([{
            empleado_id: nuevoEmpleado.id,
            nombre: file.name,
            tipo: file.type || 'archivo',
            storage_path: upload.publicUrl,
            mime_type: file.type,
            size_bytes: file.size
          }]);

          if (documentoError) throw documentoError;
        }
      }

      setShowForm(false);
      setFormData({ 
        nombre: '', email: '', telefono: '', cargo: '', 
        departamento: 'Tecnología', salario: '', estado: 'Activo', estado_laboral: 'Activo', tipo_contrato: 'Indefinido', puede_subir_documentos: false
      });
      setArchivosIniciales([]);
      refetch();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      alert('❌ Error al registrar el empleado');
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Cargando empleados...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>👥 Gestión de Empleados</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <div className="form-field">
            <label htmlFor="emp-nombre">Nombre completo *</label>
            <input id="emp-nombre" name="nombre" placeholder="Nombre completo *" required value={formData.nombre} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-email">Email corporativo *</label>
            <input id="emp-email" name="email" type="email" placeholder="Email corporativo *" required value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-telefono">Teléfono</label>
            <input id="emp-telefono" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-cargo">Cargo *</label>
            <input id="emp-cargo" name="cargo" placeholder="Cargo *" required value={formData.cargo} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-departamento">Departamento</label>
            <select id="emp-departamento" name="departamento" value={formData.departamento} onChange={handleChange}>
              <option>Tecnología</option><option>Diseño</option><option>Gestión</option><option>Seguridad</option><option>Ventas</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="emp-salario">Salario mensual ($)</label>
            <input id="emp-salario" name="salario" type="number" placeholder="Salario mensual ($)" required value={formData.salario} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-estado-laboral">Estado laboral</label>
            <select id="emp-estado-laboral" name="estado_laboral" value={formData.estado_laboral} onChange={handleChange}>
              <option>Activo</option><option>Inactivo</option><option>Suspendido</option><option>Cesado</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="emp-puede-subir-documentos">Habilitar subida de documentos</label>
            <select
              id="emp-puede-subir-documentos"
              value={formData.puede_subir_documentos ? 'si' : 'no'}
              onChange={(event) => setFormData((prev) => ({ ...prev, puede_subir_documentos: event.target.value === 'si' }))}
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </div>
          {formData.puede_subir_documentos && (
            <div className="form-field">
              <label htmlFor="emp-archivos">Archivos iniciales (opcional)</label>
              <input
                id="emp-archivos"
                type="file"
                multiple
                onChange={(event) => setArchivosIniciales(Array.from(event.target.files || []))}
              />
            </div>
          )}
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      )}

      {solicitudEmpleadoId && (
        <form
          className="simple-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!fechaLimite) return;
            const { error } = await supabase.from('rrhh_solicitudes_documentos').insert([{
              empleado_id: solicitudEmpleadoId,
              fecha_limite: fechaLimite,
              user_id: user?.id
            }]);
            if (error) {
              alert(error.message || 'No se pudo crear la solicitud');
              return;
            }
            alert('Solicitud creada. Se alertará por vencimiento.');
            setSolicitudEmpleadoId(null);
            setFechaLimite('');
          }}
        >
          <label>Fecha máxima para entregar documentos</label>
          <input type="date" required value={fechaLimite} onChange={(event) => setFechaLimite(event.target.value)} />
          <button type="submit" className="btn-primary">Guardar fecha límite</button>
          <button type="button" className="btn-primary" onClick={() => { setSolicitudEmpleadoId(null); setFechaLimite(''); }}>Cancelar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Salario</th>
              <th>Proyectos Asignados</th>
              <th>Estado laboral</th>
              <th>Documentos</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(e => (
              <tr key={e.id}>
                <td className="cell-bold">{e.nombre}</td>
                <td>{e.cargo || '—'}</td>
                <td>{e.departamento || '—'}</td>
                <td>${e.salario?.toLocaleString() || 0}</td>
                <td><span className="badge badge-blue">{e.proyectos_asignados || 0}</span></td>
                <td><span className={`badge ${e.estado_laboral === 'Activo' ? 'badge-green' : 'badge-gray'}`}>{e.estado_laboral || e.estado}</span></td>
                <td>
                  {e.puede_subir_documentos ? (
                    <button type="button" className="btn-action" onClick={() => setSolicitudEmpleadoId(e.id)}>
                      Solicitar documentos
                    </button>
                  ) : 'No habilitado'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmpleadosView;