import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { ERP_MODULES, ERP_MODULE_KEYS } from '../../config/modules';
import './AdminView.css';

const EMPTY_FORM = {
  nombre_completo: '',
  email: '',
  password: '',
  rol: 'user'
};

const AdminView = ({ onBack, signOut }) => {
  const {
    appRole,
    canCreateAdmins,
    createManagedUser,
    listManagedUsers,
    updateManagedUserStatus,
    updateManagedUserModules
  } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedModules, setSelectedModules] = useState(ERP_MODULE_KEYS);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
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

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listManagedUsers();
      setUsers(data);
      if (!selectedUserId && data.length > 0) setSelectedUserId(data[0].user_id);
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await createManagedUser({
        ...formData,
        enabledModuleKeys: selectedModules
      });
      setFormData(EMPTY_FORM);
      setSelectedModules(ERP_MODULE_KEYS);
      setMessage('Usuario creado correctamente y vinculado a Supabase Auth.');
      await loadUsers();
    } catch (createError) {
      setError(createError.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((item) => item.user_id === selectedUserId);

  const selectedUserModules = useMemo(() => {
    if (!selectedUser) return {};
    return selectedUser.modules || {};
  }, [selectedUser]);

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
      setError(statusError.message || 'No se pudo actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserModule = async (moduleKey) => {
    if (!selectedUser) return;

    const enabledKeys = ERP_MODULE_KEYS.filter((key) => (
      key === moduleKey ? !selectedUserModules[key] : !!selectedUserModules[key]
    ));

    setError('');
    setMessage('');
    setLoading(true);
    try {
      await updateManagedUserModules(selectedUser.user_id, enabledKeys);
      setMessage('Permisos de modulos actualizados.');
      await loadUsers();
    } catch (moduleError) {
      setError(moduleError.message || 'No se pudo actualizar modulos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-view">
      <header className="admin-hero">
        <div className="admin-hero-actions">
          {onBack && <button type="button" className="admin-back" onClick={onBack}>Volver</button>}
          {signOut && <button type="button" className="admin-back" onClick={signOut}>Salir</button>}
        </div>
        <div>
          <p className="admin-eyebrow">Panel de control interno</p>
          <h1>Administracion de usuarios y modulos</h1>
          <p>
            Rol actual: <strong>{appRole}</strong>. Los administradores gestionan usuarios y modulos.
            El super administrador ademas puede crear administradores.
          </p>
        </div>
      </header>

      <main className="admin-grid">
        <section className="admin-card admin-card-form">
          <h2>Crear nuevo usuario</h2>
          <form onSubmit={handleCreateUser} className="admin-form">
            <label>
              Nombre completo
              <input
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleFormChange}
                required
                disabled={loading}
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                disabled={loading}
              />
            </label>
            <label>
              Password temporal
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                minLength={8}
                required
                disabled={loading}
              />
            </label>
            <label>
              Rol
              <select
                name="rol"
                value={formData.rol}
                onChange={handleFormChange}
                disabled={loading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="admin-modules-palette">
              {ERP_MODULES.map((module) => (
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
              >
                <button type="button" onClick={() => setSelectedUserId(entry.user_id)}>
                  <span>{entry.profile?.nombre_completo || 'Usuario sin nombre'}</span>
                  <small>{entry.profile?.email || 'Sin email'}</small>
                </button>
                <div className="user-row-meta">
                  <span className={`badge badge-${entry.rol}`}>{entry.rol}</span>
                  <span className={`badge badge-${entry.estado === 'Activo' ? 'ok' : 'off'}`}>{entry.estado}</span>
                  <button type="button" className="admin-secondary" onClick={() => handleToggleUserStatus(entry)}>
                    {entry.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </article>
            ))}
            {!users.length && <p className="admin-empty">No hay usuarios registrados para esta empresa.</p>}
          </div>
        </section>
      </main>

      <section className="admin-card admin-card-modules">
        <h2>Modulos habilitados por usuario</h2>
        {!selectedUser && <p className="admin-empty">Selecciona un usuario para administrar sus modulos.</p>}
        {selectedUser && (
          <div className="module-permissions-grid">
            {ERP_MODULES.map((module) => (
              <label key={module.id} className="permission-item">
                <input
                  type="checkbox"
                  checked={!!selectedUserModules[module.id]}
                  onChange={() => handleToggleUserModule(module.id)}
                  disabled={loading}
                />
                <span>{module.title}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {(message || error) && (
        <div className={`admin-feedback ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}
    </div>
  );
};

export default AdminView;
