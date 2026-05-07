import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import './Login.css';

const Login = () => {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(formData.email, formData.password);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesion');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ERPyme</h1>
          <p>Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="login-footer">
          <p>No tienes cuenta? <a href="#register">Registrate</a></p>
          <p className="demo-credentials">
            <small>Demo: admin@erpyme.com / Admin123!</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
