import { useMemo, useState } from 'react';
import './Home.css';

const MODULES = [
  {
    id: 'projects',
    title: 'Proyectos',
    desc: 'Tareas, calendario, avances y cronogramas',
    color: '#0052cc',
    status: 'Activo'
  },
  {
    id: 'marketing',
    title: 'Clientes y cotizaciones',
    desc: 'Clientes, oportunidades y cotizaciones',
    color: '#ff5722',
    status: 'Activo'
  },
  {
    id: 'ventas',
    title: 'Ventas y cobranza',
    desc: 'Contactos nuevos, pedidos, facturas e historial comercial',
    color: '#7c3aed',
    status: 'Nuevo'
  },
  {
    id: 'compras',
    title: 'Compras y proveedores',
    desc: 'Proveedores, compras solicitadas y gastos de compra',
    color: '#0f766e',
    status: 'Nuevo'
  },
  {
    id: 'facturacion',
    title: 'Facturas y comprobantes',
    desc: 'Facturas, boletas, recibos y documentos de venta',
    color: '#b45309',
    status: 'Nuevo'
  },
  {
    id: 'finanzas',
    title: 'Dinero',
    desc: 'Ingresos, egresos y cuentas por cobrar',
    color: '#ca8a04',
    status: 'Activo'
  },
  {
    id: 'caja-bancos',
    title: 'Caja y bancos',
    desc: 'Cuentas bancarias, caja chica y saldos iniciales',
    color: '#15803d',
    status: 'Nuevo'
  },
  {
    id: 'logistica',
    title: 'Logistica',
    desc: 'Equipos desde inventario, prestamos y mantenimiento',
    color: '#607d8b',
    status: 'Activo'
  },
  {
    id: 'inventario-operativo',
    title: 'Productos e inventario',
    desc: 'Productos, existencias, almacenes y alertas',
    color: '#0891b2',
    status: 'Nuevo'
  },
  {
    id: 'rrhh',
    title: 'Recursos Humanos',
    desc: 'Empleados, asistencias, asignaciones y seguridad',
    color: '#4caf50',
    status: 'Activo'
  },
  {
    id: 'reportes',
    title: 'Reportes',
    desc: 'Resumen de ventas, gastos, caja y proyectos',
    color: '#1d4ed8',
    status: 'Nuevo'
  },
  {
    id: 'permisos-auditoria',
    title: 'Usuarios y permisos',
    desc: 'Usuarios, permisos, accesos e historial de cambios',
    color: '#be123c',
    status: 'Nuevo'
  },
  {
    id: 'documentos',
    title: 'Archivos',
    desc: 'Contratos, comprobantes, fotos, certificados y documentos',
    color: '#9333ea',
    status: 'Nuevo'
  },
  {
    id: 'notificaciones',
    title: 'Alertas',
    desc: 'Vencimientos, tareas atrasadas y avisos importantes',
    color: '#dc2626',
    status: 'Nuevo'
  },
  {
    id: 'importacion',
    title: 'Importar y exportar',
    desc: 'Cargar o descargar informacion en Excel o CSV',
    color: '#475569',
    status: 'Nuevo'
  },
  {
    id: 'assistant',
    title: 'Habla con tu asistente',
    desc: 'Chat interno para consultar informacion de tu empresa',
    color: '#0ea5e9',
    status: 'Nuevo'
  }
];

const Home = ({ onNavigate, profile, signOut }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return MODULES;

    return MODULES.filter((mod) => {
      const searchableText = `${mod.title} ${mod.desc} ${mod.status}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [searchTerm]);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>ERPyme</h1>
          <p>Sistema integral de gestion empresarial</p>
        </div>
        <div className="home-actions">
          <span>{profile?.nombre_completo || 'Usuario'}</span>
          <button type="button" className="btn-logout" onClick={signOut}>Salir</button>
        </div>
      </header>

      <section className="home-toolbar" aria-label="Busqueda de modulos">
        <label className="module-search">
          <span>Buscar modulo</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, area o funcion..."
          />
        </label>
        <span className="module-count">
          {filteredModules.length} de {MODULES.length}
        </span>
      </section>

      <main className="modules-grid">
        {filteredModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            className="module-card"
            onClick={() => onNavigate(mod.id)}
            aria-label={`Abrir ${mod.title}`}
          >
            <div className="card-top">
              <span
                className="module-icon"
                style={{
                  backgroundColor: `${mod.color}18`,
                  color: mod.color
                }}
              >
                {mod.title.charAt(0)}
              </span>
              <span className={`status-badge ${mod.status === 'Activo' ? 'active' : 'new'}`}>
                {mod.status}
              </span>
            </div>
            <span className="module-title">{mod.title}</span>
            <span className="module-desc">{mod.desc}</span>
          </button>
        ))}
        {filteredModules.length === 0 && (
          <div className="modules-empty">
            No se encontraron modulos con ese criterio.
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
