import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { APP_FEATURES, ERP_MODULES, getPlanConfig } from '../../config/modules';
import { formatTrialDate, getTrialStatus } from '../../lib/trial';
import { traducirError } from '../../lib/errores';
import './AdminView.css';

const COMPANY_OWNER_ROLES = ['owner', 'super_admin'];

const EMPTY_FORM = {
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  documento_identidad: '',
  telefono: '',
  direccion: '',
  cargo: '',
  departamento: '',
  email: '',
  password: '',
  rol: 'user'
};

const AdminView = ({ onBack }) => {
  const {
    appRole,
    canCreateAdmins,
    company,
    createManagedUser,
    listManagedUsers,
    updateManagedUserStatus,
    updateManagedUserModules,
    updateManagedUserFeatures,
    setManagedUserPassword
  } = useAuth();

  const plan = getPlanConfig(company?.plan || company?.plan_key);
  const trialStatus = getTrialStatus(company);
  const trialEndsLabel = formatTrialDate(trialStatus.endsAt);
  const planModules = useMemo(() => ERP_MODULES.filter((module) => plan.modules.includes(module.id)), [plan.modules]);
  const planFeatures = useMemo(() => APP_FEATURES.filter((feature) => plan.features.includes(feature.id)), [plan.features]);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedModules, setSelectedModules] = useState(plan.modules.filter((key) => key !== 'admin'));
  const [selectedFeatures, setSelectedFeatures] = useState(plan.features);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalUserId, setModalUserId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(() => (
    canCreateAdmins
      ? [
          { value: 'user', label: 'Usuario' },
          { value: 'admin', label: 'Administrador' }
        ]
      : [{ value: 'user', label: 'Usuario' }]
  ), [canCreateAdmins]);

  const countedUsers = users.filter((item) => !COMPANY_OWNER_ROLES.includes(item.rol));
  const userLimitLabel = plan.userLimit === null ? 'Ilimitados' : `${countedUsers.length}/${plan.userLimit}`;

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listManagedUsers();
      setUsers(data);
      if (!selectedUserId && data.length > 0) setSelectedUserId(data[0].user_id);
    } catch (loadError) {
      setError(traducirError(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleModuleSelection = (moduleKey) => {
    setSelectedModules((prev) => (
      prev.includes(moduleKey)
        ? prev.filter((item) => item !== moduleKey)
        : [...prev, moduleKey]
    ));
  };

  const toggleFeatureSelection = (featureKey) => {
    setSelectedFeatures((prev) => (
      prev.includes(featureKey)
        ? prev.filter((item) => item !== featureKey)
        : [...prev, featureKey]
    ));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await createManagedUser({
        ...formData,
        enabledModuleKeys: selectedModules,
        enabledFeatureKeys: selectedFeatures
      });
      setFormData(EMPTY_FORM);
      setSelectedModules(plan.modules.filter((key) => key !== 'admin'));
      setSelectedFeatures(plan.features);
      setMessage('Usuario creado correctamente y vinculado a Supabase Auth.');
      await loadUsers();
    } catch (createError) {
      setError(traducirError(createError));
    } finally {
      setLoading(false);
    }
  };

  const modalUser = users.find((item) => item.user_id === modalUserId);
  const selectedUserModules = modalUser?.modules || {};
  const selectedUserFeatures = modalUser?.features || {};
  const canEditModalUserAccess = modalUser?.rol === 'user';

  const handleToggleUserStatus = async (target) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const nextStatus = target.estado === 'Activo' ? 'Inactivo' : 'Activo';
      await updateManagedUserStatus(target.user_id, nextStatus);
      setMessage(`Estado actualizado a ${nextStatus}.`);
      await loadUsers();
    } catch (statusError) {
      setError(traducirError(statusError));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserModule = async (moduleKey) => {
    if (!modalUser) return;

    const enabledKeys = plan.modules.filter((key) => (
      key === moduleKey ? !selectedUserModules[key] : !!selectedUserModules[key]
    ));

    setError('');
    setMessage('');
    setLoading(true);
    try {
      await updateManagedUserModules(modalUser.user_id, enabledKeys);
      setMessage('Permisos de módulos actualizados.');
      await loadUsers();
    } catch (moduleError) {
      setError(traducirError(moduleError));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserFeature = async (featureKey) => {
    if (!modalUser) return;

    const enabledKeys = plan.features.filter((key) => (
      key === featureKey ? !selectedUserFeatures[key] : !!selectedUserFeatures[key]
    ));

    setError('');
    setMessage('');
    setLoading(true);
    try {
      await updateManagedUserFeatures(modalUser.user_id, enabledKeys);
      setMessage('Permisos por apartado actualizados.');
      await loadUsers();
    } catch (featureError) {
      setError(traducirError(featureError));
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (userId) => {
    setModalUserId(userId);
    setSelectedUserId(userId);
    setPasswordForm({ password: '', confirmPassword: '' });
  };

  const closeUserModal = () => {
    setModalUserId(null);
    setPasswordForm({ password: '', confirmPassword: '' });
  };

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!modalUser) return;

    if (passwordForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);
    try {
      await setManagedUserPassword(modalUser.user_id, passwordForm.password);
      setMessage('Contrasena actualizada correctamente.');
      setPasswordForm({ password: '', confirmPassword: '' });
    } catch (passwordError) {
      setError(traducirError(passwordError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-view">
      <header className="admin-hero">
        <div className="admin-hero-actions">
          {onBack && <button type="button" className="admin-back" onClick={onBack}>Volver</button>}
        </div>
        <div>
          <p className="admin-eyebrow">Mis usuarios</p>
          <h1>Usuarios, permisos y plan</h1>
          <p>
            Rol actual: <strong>{appRole}</strong>. Plan activo: <strong>{plan.name}</strong>.
            {trialStatus.isTrial && !trialStatus.isExpired && ` Demo vigente hasta ${trialEndsLabel}.`}
          </p>
        </div>
        <div className="admin-plan-strip">
          <article><span>Empresa</span><strong>{company?.nombre || 'Empresa'}</strong></article>
          <article><span>Usuarios empleados</span><strong>{userLimitLabel}</strong></article>
          <article><span>Modulos del plan</span><strong>{plan.modules.length}</strong></article>
          {trialStatus.isTrial && <article><span>Dias demo</span><strong>{trialStatus.daysLeft}</strong></article>}
        </div>
      </header>

      <main className="admin-grid">
        <section className="admin-card admin-card-form">
          <h2>Crear usuario empleado</h2>
          <form onSubmit={handleCreateUser} className="admin-form">
            <div className="admin-form-row">
              <label>
                Nombres
                <input name="nombres" value={formData.nombres} onChange={handleFormChange} required disabled={loading} />
              </label>
              <label>
                Apellidos
                <input name="apellidos" value={formData.apellidos} onChange={handleFormChange} required disabled={loading} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Fecha de nacimiento
                <input name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleFormChange} disabled={loading} />
              </label>
              <label>
                DNI / documento
                <input name="documento_identidad" value={formData.documento_identidad} onChange={handleFormChange} disabled={loading} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Cargo
                <input name="cargo" value={formData.cargo} onChange={handleFormChange} disabled={loading} />
              </label>
              <label>
                Departamento
                <input name="departamento" value={formData.departamento} onChange={handleFormChange} disabled={loading} />
              </label>
            </div>
            <label>
              Direccion
              <input name="direccion" value={formData.direccion} onChange={handleFormChange} disabled={loading} />
            </label>
            <div className="admin-form-row">
              <label>
                Telefono
                <input name="telefono" value={formData.telefono} onChange={handleFormChange} disabled={loading} />
              </label>
              <label>
                Email
                <input name="email" type="email" value={formData.email} onChange={handleFormChange} required disabled={loading} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Password temporal
                <input name="password" type="password" value={formData.password} onChange={handleFormChange} minLength={8} required disabled={loading} />
              </label>
              <label>
                Rol
                <select name="rol" value={formData.rol} onChange={handleFormChange} disabled={loading}>
                  {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="admin-permission-block">
              <h3>Modulos habilitados</h3>
              <div className="admin-modules-palette">
                {planModules.filter((module) => module.id !== 'admin').map((module) => (
                  <label key={module.id} className="module-chip">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.id)}
                      onChange={() => toggleModuleSelection(module.id)}
                      disabled={loading}
                    />
                    <span>{module.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-permission-block">
              <h3>Apartados habilitados</h3>
              <div className="module-permissions-grid compact">
                {planFeatures.map((feature) => (
                  <label key={feature.id} className="permission-item">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={() => toggleFeatureSelection(feature.id)}
                      disabled={loading || !selectedModules.includes(feature.moduleId)}
                    />
                    <span>{feature.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="admin-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Crear usuario'}
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h2>Usuarios de la empresa</h2>
          <div className="admin-users-list">
            {users.map((entry) => (
              <article
                key={entry.id}
                className={`user-row ${selectedUserId === entry.user_id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => openUserModal(entry.user_id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openUserModal(entry.user_id);
                  }
                }}
              >
                <div className="user-row-main">
                  <span>{entry.profile?.nombre_completo || 'Usuario sin nombre'}</span>
                  <small>{entry.profile?.email || 'Sin email'}</small>
                  {(entry.profile?.cargo || entry.profile?.departamento) && (
                    <small>{[entry.profile?.cargo, entry.profile?.departamento].filter(Boolean).join(' · ')}</small>
                  )}
                </div>
                <div className="user-row-meta">
                  <span className={`badge badge-${entry.rol}`}>{entry.rol}</span>
                  <span className={`badge badge-${entry.estado === 'Activo' ? 'ok' : 'off'}`}>{entry.estado}</span>
                  <button type="button" className="admin-secondary" onClick={(event) => {
                    event.stopPropagation();
                    handleToggleUserStatus(entry);
                  }}>
                    {entry.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" className="admin-secondary" onClick={(event) => {
                    event.stopPropagation();
                    openUserModal(entry.user_id);
                  }}>
                    Permisos y contraseña
                  </button>
                </div>
              </article>
            ))}
            {!users.length && <p className="admin-empty">No hay usuarios registrados para esta empresa.</p>}
          </div>
        </section>
      </main>

      {modalUser && (
        <div className="admin-modal-backdrop" role="presentation" onClick={closeUserModal}>
          <section className="admin-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h2>Permisos del usuario</h2>
              <button type="button" className="admin-secondary" onClick={closeUserModal}>Cerrar</button>
            </header>
            <p className="admin-modal-subtitle">
              {modalUser.profile?.nombre_completo || 'Usuario'} ({modalUser.profile?.email || 'Sin email'})
            </p>
            {!canEditModalUserAccess && (
              <p className="admin-modal-subtitle">
                Este perfil es <strong>{modalUser.rol}</strong>: no aplica gestión granular en esta vista.
              </p>
            )}

            <h3>Modulos</h3>
            <div className="module-permissions-grid">
              {planModules.filter((module) => module.id !== 'admin').map((module) => (
                <label key={module.id} className="permission-item">
                  <input
                    type="checkbox"
                    checked={!!selectedUserModules[module.id]}
                    onChange={() => handleToggleUserModule(module.id)}
                    disabled={loading || !canEditModalUserAccess}
                  />
                  <span>{module.title}</span>
                </label>
              ))}
            </div>

            <h3>Apartados</h3>
            <div className="module-permissions-grid">
              {planFeatures.map((feature) => (
                <label key={feature.id} className="permission-item">
                  <input
                    type="checkbox"
                    checked={!!selectedUserFeatures[feature.id]}
                    onChange={() => handleToggleUserFeature(feature.id)}
                    disabled={loading || !canEditModalUserAccess || !selectedUserModules[feature.moduleId]}
                  />
                  <span>{feature.title}</span>
                </label>
              ))}
            </div>

            <form className="admin-password-form" onSubmit={handleChangePassword}>
              <h3>Cambiar contraseña</h3>
              <div className="admin-form-row">
                <label>
                  Nueva contraseña
                  <input type="password" name="password" value={passwordForm.password} onChange={handlePasswordInput} minLength={8} required disabled={loading} />
                </label>
                <label>
                  Confirmar contraseña
                  <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordInput} minLength={8} required disabled={loading} />
                </label>
              </div>
              <button type="submit" className="admin-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </section>
        </div>
      )}

      {(message || error) && (
        <div className={`admin-feedback ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}
    </div>
  );
};

export default AdminView;
