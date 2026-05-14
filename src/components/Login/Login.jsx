import { useState } from 'react';
import { PLAN_KEYS, PLAN_OPTIONS } from '../../config/modules';
import { useAuth } from '../../context/auth/useAuth';
import './Login.css';

const EMPTY_REGISTER = {
  nombre: '',
  dni_ruc: '',
  empresa: '',
  direccion: '',
  email: '',
  password: '',
  confirmPassword: '',
  plan: PLAN_KEYS.BASIC
};

const Login = () => {
  const { signIn, registerCompanyAccount, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [registerStep, setRegisterStep] = useState('data');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const isBusy = loading || submitting;

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      setLoadingMessage('Validando credenciales y preparando tu espacio...');
      setSubmitting(true);
      await signIn(loginData.email, loginData.password);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setSubmitting(false);
      setLoadingMessage('');
    }
  };

  const handleRegisterDataSubmit = (event) => {
    event.preventDefault();
    setError(null);

    if (registerData.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setRegisterStep('plan');
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      setLoadingMessage('Creando empresa, perfil y permisos del plan...');
      setSubmitting(true);
      await registerCompanyAccount(registerData);
    } catch (err) {
      console.error('Register error:', err);
      setError(err.message || 'No se pudo registrar la cuenta');
    } finally {
      setSubmitting(false);
      setLoadingMessage('');
    }
  };

  const updateLogin = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const updateRegister = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedPlan = PLAN_OPTIONS.find((plan) => plan.id === registerData.plan);

  return (
    <div className="login-container">
      {isBusy && loadingMessage && (
        <div className="auth-loading-overlay" role="status" aria-live="polite">
          <div className="auth-loading-card">
            <div className="auth-loading-mark">E</div>
            <strong>{mode === 'register' ? 'Configurando tu empresa' : 'Ingresando a ERPyme'}</strong>
            <p>{loadingMessage}</p>
            <div className="auth-loading-bar">
              <span />
            </div>
          </div>
        </div>
      )}
      <section className="auth-shell">
        <aside className="auth-brand-panel">
          <span className="auth-eyebrow">ERP con IA para pymes</span>
          <h1>ERPyme</h1>
          <p>
            Entra con una cuenta limpia, elige un plan y controla que ve cada persona de tu equipo.
          </p>
          <div className="auth-signal-grid">
            <article>
              <strong>6+</strong>
              <span>areas conectadas</span>
            </article>
            <article>
              <strong>3</strong>
              <span>planes escalables</span>
            </article>
            <article>
              <strong>IA</strong>
              <span>en plan avanzado</span>
            </article>
          </div>
        </aside>

        <div className="login-card">
          <div className="auth-tabs" role="tablist" aria-label="Acceso ERPyme">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
            >
              Crear cuenta
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <div className="login-header">
                <span className="auth-step">Acceso seguro</span>
                <h2>Bienvenido de vuelta</h2>
                <p>Inicia sesion para continuar con tu ERP.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="login-form">
                {error && <div className="error-message">{error}</div>}

                <label className="form-group" htmlFor="email">
                  Email
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={loginData.email}
                    onChange={updateLogin}
                    placeholder="tu@email.com"
                    disabled={isBusy}
                  />
                </label>

                <label className="form-group" htmlFor="password">
                  Contrasena
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={loginData.password}
                    onChange={updateLogin}
                    placeholder="********"
                    disabled={isBusy}
                  />
                </label>

                <button type="submit" className="btn-login" disabled={isBusy}>
                  {isBusy ? 'Cargando...' : 'Iniciar sesion'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="login-header">
                <span className="auth-step">{registerStep === 'data' ? 'Paso 1 de 2' : 'Paso 2 de 2'}</span>
                <h2>{registerStep === 'data' ? 'Crea tu empresa' : 'Elige el plan'}</h2>
                <p>
                  {registerStep === 'data'
                    ? 'Sin verificacion de email por ahora. El primer usuario sera super admin.'
                    : 'El ERP se abrira con las capacidades del plan seleccionado.'}
                </p>
              </div>

              {registerStep === 'data' ? (
                <form onSubmit={handleRegisterDataSubmit} className="login-form register-form">
                  {error && <div className="error-message">{error}</div>}

                  <label className="form-group">
                    Nombre de la persona
                    <input name="nombre" value={registerData.nombre} onChange={updateRegister} required disabled={isBusy} />
                  </label>

                  <label className="form-group">
                    DNI o RUC
                    <input name="dni_ruc" value={registerData.dni_ruc} onChange={updateRegister} required disabled={isBusy} />
                  </label>

                  <label className="form-group">
                    Empresa
                    <input name="empresa" value={registerData.empresa} onChange={updateRegister} required disabled={isBusy} />
                  </label>

                  <label className="form-group">
                    Direccion
                    <input name="direccion" value={registerData.direccion} onChange={updateRegister} required disabled={isBusy} />
                  </label>

                  <label className="form-group">
                    Email
                    <input name="email" type="email" value={registerData.email} onChange={updateRegister} required disabled={isBusy} />
                  </label>

                  <div className="form-row">
                    <label className="form-group">
                      Contrasena
                      <input name="password" type="password" value={registerData.password} onChange={updateRegister} minLength={8} required disabled={isBusy} />
                    </label>
                    <label className="form-group">
                      Confirmar
                      <input name="confirmPassword" type="password" value={registerData.confirmPassword} onChange={updateRegister} minLength={8} required disabled={isBusy} />
                    </label>
                  </div>

                  <button type="submit" className="btn-login" disabled={isBusy}>
                    Continuar a planes
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="login-form plan-form">
                  {error && <div className="error-message">{error}</div>}

                  <div className="plan-grid" role="radiogroup" aria-label="Planes ERPyme">
                    {PLAN_OPTIONS.map((plan) => (
                      <label key={plan.id} className={`plan-option ${registerData.plan === plan.id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={registerData.plan === plan.id}
                          onChange={updateRegister}
                          disabled={isBusy}
                        />
                        <span className="plan-badge">{plan.badge}</span>
                        <strong>{plan.title}</strong>
                        <small>{plan.users}</small>
                        <p>{plan.description}</p>
                        <ul>
                          {plan.includes.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </label>
                    ))}
                  </div>

                  <div className="plan-confirm">
                    <span>Seleccionado: <strong>{selectedPlan?.title}</strong></span>
                    <div>
                      <button type="button" className="btn-secondary" onClick={() => setRegisterStep('data')} disabled={isBusy}>
                        Volver
                      </button>
                      <button type="submit" className="btn-login" disabled={isBusy}>
                        {isBusy ? 'Creando...' : 'Crear cuenta'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Login;
