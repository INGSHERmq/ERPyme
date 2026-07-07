import { useEffect, useMemo, useState } from 'react';
import useRRHH from '../../hooks/useRRHH';
import { supabase } from '../../lib/supabase';
import { uploadPrivateFile } from '../../lib/storage';
import { useAuth } from '../../context/auth/useAuth';
import './EmpleadosView.css';

const EMPTY_FORM = {
  linked_user_id: '',
  nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  documento_identidad: '',
  direccion: '',
  email: '',
  telefono: '',
  cargo: '',
  departamento: 'Tecnologia',
  salario: '',
  salario_periodo: 'mensual',
  estado: 'Activo',
  estado_laboral: 'Activo',
  tipo_contrato: 'Indefinido',
  puede_subir_documentos: false
};

const EmpleadosView = () => {
  const { user, company, profile, listManagedUsers } = useAuth();
  const { empleados, addEmpleado, updateEmpleado, desactivarEmpleado, loading, refetch } = useRRHH();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [solicitudEmpleadoId, setSolicitudEmpleadoId] = useState(null);
  const [fechaLimite, setFechaLimite] = useState('');
  const [managedUsers, setManagedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [archivosIniciales, setArchivosIniciales] = useState([]);
  const [documentosPorEmpleado, setDocumentosPorEmpleado] = useState({});
  const [solicitudesPorEmpleado, setSolicitudesPorEmpleado] = useState({});
  const empresaId = company?.id || profile?.empresa_actual_id || null;

  const linkedUsersById = useMemo(() => (
    new Map(managedUsers.map((entry) => [entry.user_id, entry]))
  ), [managedUsers]);

  useEffect(() => {
    if (!showForm) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      setUsersLoading(true);
      Promise.resolve(listManagedUsers())
        .then((data) => {
          if (isMounted) setManagedUsers(data || []);
        })
        .catch((error) => {
          console.error('Error cargando usuarios para empleados:', error);
          if (isMounted) setManagedUsers([]);
        })
        .finally(() => {
          if (isMounted) setUsersLoading(false);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [listManagedUsers, showForm]);

  const cargarEstadoDocumentos = async () => {
    if (!empresaId || !empleados.length) {
      setDocumentosPorEmpleado({});
      setSolicitudesPorEmpleado({});
      return;
    }

    const empleadoIds = empleados.map((empleado) => empleado.id);
    const [documentosRes, solicitudesRes] = await Promise.all([
      supabase
        .from('rrhh_documentos')
        .select('id, empleado_id, nombre, storage_path, created_at')
        .eq('empresa_id', empresaId)
        .in('empleado_id', empleadoIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('rrhh_solicitudes_documentos')
        .select('id, empleado_id, estado, fecha_limite, created_at')
        .eq('empresa_id', empresaId)
        .in('empleado_id', empleadoIds)
        .order('created_at', { ascending: false })
    ]);

    if (!documentosRes.error) {
      const agrupados = (documentosRes.data || []).reduce((acc, documento) => {
        const key = documento.empleado_id;
        acc[key] = acc[key] || [];
        acc[key].push(documento);
        return acc;
      }, {});
      setDocumentosPorEmpleado(agrupados);
    }

    if (!solicitudesRes.error) {
      const agrupadas = (solicitudesRes.data || []).reduce((acc, solicitud) => {
        if (!acc[solicitud.empleado_id]) acc[solicitud.empleado_id] = solicitud;
        return acc;
      }, {});
      setSolicitudesPorEmpleado(agrupadas);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEstadoDocumentos();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, empleados]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const empleadoPayload = {
        ...formData,
        linked_user_id: formData.linked_user_id || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        salario: Number(formData.salario || 0)
      };
      const nuevoEmpleado = editingId
        ? await updateEmpleado(editingId, empleadoPayload)
        : await addEmpleado(empleadoPayload);

      if (formData.puede_subir_documentos && archivosIniciales.length > 0) {
        for (const file of archivosIniciales) {
          const upload = await uploadPrivateFile({
            file,
            folder: 'rrhh-documentos',
            userId: user?.id
          });

          const { error: documentoError } = await supabase.from('rrhh_documentos').insert([{
            empresa_id: empresaId,
            empleado_id: nuevoEmpleado.id,
            user_id: user?.id,
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
      setEditingId(null);
      setFormData(EMPTY_FORM);
      setArchivosIniciales([]);
      refetch();
      await cargarEstadoDocumentos();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      if (error?.code === '23505') {
        const match = error.details?.match(/Key\s+\((\w+)\)\s*=\s*\((.+?)\)/);
        if (match) {
          const campo = match[1] === 'email' ? 'correo electrónico' : match[1];
          alert(`El ${campo} "${match[2]}" ya está registrado en otro empleado.`);
        } else {
          alert('Error: el correo o usuario ya está vinculado a otro empleado.');
        }
      } else {
        alert(`Error al registrar el empleado: ${error?.message || 'Error desconocido'}`);
      }
    }
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEdit = (empleado) => {
    setEditingId(empleado.id);
    setShowForm(true);
    setFormData({
      linked_user_id: empleado.linked_user_id || '',
      nombre: empleado.nombre || '',
      apellidos: empleado.apellidos || '',
      fecha_nacimiento: empleado.fecha_nacimiento || '',
      documento_identidad: empleado.documento_identidad || '',
      direccion: empleado.direccion || '',
      email: empleado.email || '',
      telefono: empleado.telefono || '',
      cargo: empleado.cargo || '',
      departamento: empleado.departamento || 'Tecnologia',
      salario: empleado.salario ? String(empleado.salario) : '',
      salario_periodo: empleado.salario_periodo || 'mensual',
      estado: empleado.estado || 'Activo',
      estado_laboral: empleado.estado_laboral || 'Activo',
      tipo_contrato: empleado.tipo_contrato || 'Indefinido',
      puede_subir_documentos: Boolean(empleado.puede_subir_documentos)
    });
  };

  const handleDesactivar = async (empleado) => {
    try {
      await desactivarEmpleado(empleado.id);
      await refetch();
    } catch (error) {
      alert(error.message || 'No se pudo desactivar el empleado');
    }
  };

  const handleLinkedUserChange = (event) => {
    const linkedUserId = event.target.value;
    const selectedUser = linkedUsersById.get(linkedUserId);
    const selectedProfile = selectedUser?.profile || {};
    const fullName = selectedProfile.nombre_completo || [selectedProfile.nombres, selectedProfile.apellidos].filter(Boolean).join(' ');

    setFormData((prev) => ({
      ...prev,
      linked_user_id: linkedUserId,
      nombre: selectedUser ? (selectedProfile.nombres || fullName || prev.nombre) : prev.nombre,
      apellidos: selectedUser ? (selectedProfile.apellidos || prev.apellidos) : prev.apellidos,
      fecha_nacimiento: selectedUser ? (selectedProfile.fecha_nacimiento || prev.fecha_nacimiento) : prev.fecha_nacimiento,
      documento_identidad: selectedUser ? (selectedProfile.documento_identidad || prev.documento_identidad) : prev.documento_identidad,
      direccion: selectedUser ? (selectedProfile.direccion || prev.direccion) : prev.direccion,
      telefono: selectedUser ? (selectedProfile.telefono || prev.telefono) : prev.telefono,
      email: selectedUser ? (selectedProfile.email || prev.email) : prev.email,
      cargo: selectedUser ? (selectedProfile.cargo || prev.cargo) : prev.cargo,
      departamento: selectedUser ? (selectedProfile.departamento || prev.departamento) : prev.departamento
    }));
  };

  if (loading) return <div className="loading">Cargando empleados...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>Gestión de empleados</h2>
        <button className="btn-primary" onClick={() => {
          if (showForm) {
            setEditingId(null);
            setFormData(EMPTY_FORM);
          }
          setShowForm(!showForm);
        }}>
          {showForm ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <div className="form-field form-field-wide">
            <label htmlFor="emp-linked-user">Usuario vinculado (opcional)</label>
            <select id="emp-linked-user" name="linked_user_id" value={formData.linked_user_id} onChange={handleLinkedUserChange} disabled={usersLoading}>
              <option value="">{usersLoading ? 'Cargando usuarios...' : 'Sin usuario vinculado'}</option>
              {managedUsers.map((entry) => (
                <option key={entry.user_id} value={entry.user_id}>
                  {entry.profile?.email || entry.profile?.nombre_completo || entry.user_id}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="emp-nombre">Nombres *</label>
            <input id="emp-nombre" name="nombre" placeholder="Nombres *" required value={formData.nombre} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-apellidos">Apellidos</label>
            <input id="emp-apellidos" name="apellidos" placeholder="Apellidos" value={formData.apellidos} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-fecha-nacimiento">Fecha de nacimiento</label>
            <input id="emp-fecha-nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-documento">DNI / documento</label>
            <input id="emp-documento" name="documento_identidad" placeholder="DNI / documento" value={formData.documento_identidad} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-email">Email corporativo *</label>
            <input id="emp-email" name="email" type="email" placeholder="Email corporativo *" required value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-telefono">Teléfono</label>
            <input id="emp-telefono" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="emp-direccion">Dirección</label>
            <input id="emp-direccion" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-cargo">Cargo *</label>
            <input id="emp-cargo" name="cargo" placeholder="Cargo *" required value={formData.cargo} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-departamento">Departamento</label>
            <select id="emp-departamento" name="departamento" value={formData.departamento} onChange={handleChange}>
              <option>Tecnologia</option><option>Diseno</option><option>Gestion</option><option>Seguridad</option><option>Ventas</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="emp-salario-periodo">Modalidad de pago</label>
            <select id="emp-salario-periodo" name="salario_periodo" value={formData.salario_periodo} onChange={handleChange}>
              <option value="mensual">Mensual</option>
              <option value="diario">Por dia</option>
              <option value="hora">Por hora</option>
              <option value="proyecto">Por proyecto</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="emp-salario">Monto de pago *</label>
            <input id="emp-salario" name="salario" type="number" min="0" step="0.01" placeholder="Monto segun modalidad" required value={formData.salario} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label htmlFor="emp-tipo-contrato">Tipo de contrato</label>
            <select id="emp-tipo-contrato" name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange}>
              <option>Indefinido</option>
              <option>Temporal</option>
              <option>Por Proyecto</option>
            </select>
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
              <option value="si">Si</option>
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
          <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Registrar'}</button>
        </form>
      )}

      {solicitudEmpleadoId && (
        <form
          className="simple-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!fechaLimite) return;
            const { error } = await supabase.from('rrhh_solicitudes_documentos').insert([{
              empresa_id: empresaId,
              empleado_id: solicitudEmpleadoId,
              fecha_limite: fechaLimite,
              user_id: user?.id
            }]);
            if (error) {
              alert(error.message || 'No se pudo crear la solicitud');
              return;
            }
            alert('Solicitud creada. El empleado verá la alerta al iniciar sesión.');
            setSolicitudEmpleadoId(null);
            setFechaLimite('');
            await cargarEstadoDocumentos();
          }}
        >
          <label>Fecha maxima para entregar documentos</label>
          <input type="date" required value={fechaLimite} onChange={(event) => setFechaLimite(event.target.value)} />
          <button type="submit" className="btn-primary">Guardar fecha limite</button>
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
              <th>Modalidad</th>
              <th>Proyectos Asignados</th>
              <th>Estado laboral</th>
              <th>Usuario</th>
              <th>Documentos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado) => {
              const documentosEmpleado = documentosPorEmpleado[empleado.id] || [];
              const ultimaSolicitud = solicitudesPorEmpleado[empleado.id];
              const ultimoDocumento = documentosEmpleado[0];

              return (
                <tr key={empleado.id}>
                  <td className="cell-bold">{[empleado.nombre, empleado.apellidos].filter(Boolean).join(' ')}</td>
                  <td>{empleado.cargo || '-'}</td>
                  <td>{empleado.departamento || '-'}</td>
                  <td>S/ {empleado.salario?.toLocaleString('en-US') || 0}</td>
                  <td>{empleado.salario_periodo || 'mensual'}</td>
                  <td><span className="badge badge-blue">{empleado.proyectos_asignados || 0}</span></td>
                  <td><span className={`badge ${empleado.estado_laboral === 'Activo' ? 'badge-green' : 'badge-gray'}`}>{empleado.estado_laboral || empleado.estado}</span></td>
                  <td>{empleado.linked_user_id ? 'Vinculado' : 'Sin acceso'}</td>
                  <td>
                    {documentosEmpleado.length > 0 ? (
                      <div className="document-status">
                        <span className="badge badge-green">Entregado ({documentosEmpleado.length})</span>
                        {ultimoDocumento?.storage_path && (
                          <a href={ultimoDocumento.storage_path} target="_blank" rel="noreferrer">Ver</a>
                        )}
                      </div>
                    ) : empleado.puede_subir_documentos && empleado.linked_user_id ? (
                      <div className="document-status">
                        {ultimaSolicitud && <span className="badge badge-yellow">{ultimaSolicitud.estado}</span>}
                        <button type="button" className="btn-action" onClick={() => setSolicitudEmpleadoId(empleado.id)}>
                          Solicitar documentos
                        </button>
                      </div>
                    ) : empleado.puede_subir_documentos ? 'Sin usuario vinculado' : 'No habilitado'}
                  </td>
                  <td>
                    <div className="document-status">
                      <button type="button" className="btn-action" onClick={() => handleEdit(empleado)}>Editar</button>
                      {empleado.estado_laboral !== 'Inactivo' && (
                        <button type="button" className="btn-action" onClick={() => handleDesactivar(empleado)}>Desactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmpleadosView;
