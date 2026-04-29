//import React from 'react';
import './Home.css';

const MODULES = [
  {
    id: 'projects',
    title: 'Proyectos',
    desc: 'Gestión de tareas, Scrum, Gantt y Cronogramas',
    icon: '📂',
    color: '#0052cc',
    status: 'Activo'
  },
  {
    id: 'marketing',
    title: 'Marketing & CRM',
    desc: 'Gestión de clientes, leads y cotizaciones',
    icon: '📢',
    color: '#ff5722',
    status: 'Activo' // ✅ CAMBIADO: De 'Próximamente' a 'Activo'
  },
  {
    id: 'rrhh',
    title: 'Recursos Humanos',
    desc: 'Legajos, control de asistencia y SSOMA',
    icon: '👥',
    color: '#4caf50',
    status: 'Activo'
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    desc: 'Ingresos, egresos y cuentas por cobrar',
    icon: '💰',
    color: '#ffc107',
    status: 'Activo'
  },
  {
    id: 'logistica',
    title: 'Logística',
    desc: 'Inventario de equipos y guías de salida',
    icon: '🚚',
    color: '#607d8b',
    status: 'Activo'
  }
];

const Home = ({ onNavigate }) => {
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>ERPyme</h1>
          <p>Sistema Integral de Gestión Empresarial</p>
        </div>
        <div className="user-profile">
          <span> Admin</span>
        </div>
      </header>

      <main className="modules-grid">
        {MODULES.map((mod) => (
          <div 
            key={mod.id} 
            className={`module-card ${mod.status !== 'Activo' ? 'disabled' : ''}`}
            onClick={() => mod.status === 'Activo' && onNavigate(mod.id)}
            role={mod.status === 'Activo' ? 'button' : undefined}
            tabIndex={mod.status === 'Activo' ? 0 : undefined}
            onKeyDown={(e) => {
              if (mod.status === 'Activo' && (e.key === 'Enter' || e.key === ' ')) {
                onNavigate(mod.id);
              }
            }}
            aria-label={mod.status === 'Activo' ? `Abrir ${mod.title}` : `${mod.title} - Próximamente`}
          >
            <div className="card-top">
              <span 
                className="module-icon" 
                style={{ 
                  backgroundColor: mod.status === 'Activo' ? mod.color + '20' : '#e9ecef',
                  color: mod.status === 'Activo' ? mod.color : '#adb5bd'
                }}
              >
                {mod.icon}
              </span>
              <span className={`status-badge ${mod.status === 'Activo' ? 'active' : 'pending'}`}>
                {mod.status}
              </span>
            </div>
            <h2 style={{ color: mod.status === 'Activo' ? '#333' : '#adb5bd' }}>
              {mod.title}
            </h2>
            <p style={{ color: mod.status === 'Activo' ? '#6c757d' : '#adb5bd' }}>
              {mod.desc}
            </p>
          </div>
        ))}
      </main>

      <footer className="home-footer">
        <p>© 2026 ERPyme - Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default Home;