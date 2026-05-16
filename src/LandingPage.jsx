import { useState } from 'react';
import Login from './components/Login/Login';
import heroImage from './assets/hero.png';
import './LandingPage.css';

const kpis = [
  { value: '30%', label: 'menos tiempo administrativo' },
  { value: '24/7', label: 'alertas y análisis proactivo' },
  { value: '6+', label: 'áreas conectadas en un solo ERP' },
  { value: '100%', label: 'datos operativos centralizados' }
];

/* Removed modules array since we use the value chain now */
const benefits = [
  {
    title: 'Decisiones antes del problema',
    copy: 'El resumen ejecutivo detecta cobranzas, riesgos de proyecto y oportunidades prioritarias sin esperar una consulta manual.'
  },
  {
    title: 'Ventas con foco real',
    copy: 'Scoring de cotizaciones ordena propuestas por probabilidad de aceptación para que tu equipo atienda primero lo que más puede convertirse.'
  },
  {
    title: 'Operación conectada',
    copy: 'Clientes, cotizaciones, proyectos, finanzas, inventario y RRHH trabajan sobre la misma fuente de verdad.'
  }
];

const moduleDetails = {
  ia: {
    tag: 'Asistente IA',
    title: 'Tu copiloto operativo',
    description: 'Chat con IA (Groq) conectado a tu ERP: genera el resumen ejecutivo del día, detecta facturas por cobrar y crea registros de proveedores, cotizaciones, clientes y tareas por voz de mando.',
    action: 'Abrir asistente'
  },
  contabilidad: {
    tag: 'Contabilidad',
    title: 'Control de facturas y márgenes',
    description: 'Registra facturas de compra y venta, gestiona su estado (pendiente / pagada / anulada) y consulta la analítica de ganancia y pérdida por cada proyecto.',
    action: 'Ver contabilidad'
  },
  rrhh: {
    tag: 'RRHH',
    title: 'Personas y seguridad laboral',
    description: 'Ficha de empleados, gestión de documentos del equipo, asignación de personal a proyectos y registro de accidentes e incidentes SSOMA, todo en un solo lugar.',
    action: 'Ver módulo RRHH'
  },
  logistica: {
    tag: 'Logística',
    title: 'Cadena de suministro completa',
    description: 'Gestiona proveedores, órdenes de compra, materiales y stock con tipos de inventario (consumibles, herramientas, activos, equipos serializados), asignaciones, mantenimiento y kardex de movimientos.',
    action: 'Ver logística'
  },
  proyectos: {
    tag: 'Proyectos',
    title: 'Ejecución con visibilidad total',
    description: 'Organiza actividades y tareas, visualiza el cronograma y el calendario del proyecto, asigna personal y controla las herramientas en uso para cada obra o contrato.',
    action: 'Ver proyectos'
  },
  ventas: {
    tag: 'Ventas y CRM',
    title: 'Del cliente al contrato',
    description: 'Administra tu cartera de clientes y prospectos, emite cotizaciones y usa el scoring de IA para priorizar las oportunidades con mayor probabilidad de conversión.',
    action: 'Ver ventas y CRM'
  }
};

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [activeModule, setActiveModule] = useState('ia');

  if (showLogin) {
    return (
      <div className="landing-login-shell">
        <button type="button" className="landing-back" onClick={() => setShowLogin(false)}>
          Volver a la landing
        </button>
        <Login />
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <button type="button" className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span>ERP</span>yme
        </button>
        <nav aria-label="Navegación principal">
          <a href="#ventajas">Ventajas</a>
          <a href="#ia">IA ejecutiva</a>
          <a href="#modulos">Módulos</a>
        </nav>
        <button type="button" className="landing-login-button" onClick={() => setShowLogin(true)}>
          Ingresar
        </button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-eyebrow">ERP con IA para pymes que quieren control real</span>
            <h1>Tu negocio no necesita más hojas sueltas. Necesita un centro de mando.</h1>
            <p>
              ERPyme une ventas, proyectos, finanzas, logística, RRHH y asistente inteligente para que cada decisión nazca de datos vivos, no de reportes atrasados.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-cta" onClick={() => setShowLogin(true)}>
                Probar ERPyme
              </button>
              <a className="secondary-cta" href="#ia">Ver IA agéntica</a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Vista del producto ERPyme">
            <img src={heroImage} alt="Panel visual de ERPyme" />
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <span></span>
                <strong>Resumen matutino</strong>
              </div>
              <div className="brief-line active">3 cobranzas vencen hoy</div>
              <div className="brief-line">Proyecto Pagos en riesgo</div>
              <div className="brief-line">Oportunidad alta: 82%</div>
            </div>
          </div>
        </section>

        <section className="landing-kpis" aria-label="Indicadores de impacto">
          {kpis.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section id="ventajas" className="landing-section split-section">
          <div>
            <span className="landing-eyebrow">Por qué cambia la operación</span>
            <h2>De registrar datos a dirigir con señales.</h2>
          </div>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <article key={benefit.title}>
                <h3>{benefit.title}</h3>
                <p>{benefit.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ia" className="ai-band">
          <div className="ai-copy">
            <span className="landing-eyebrow">IA agéntica proactiva</span>
            <h2>Mientras descansas, ERPyme revisa lo urgente.</h2>
            <p>
              El asistente genera un resumen ejecutivo con cobros por vencer, proyectos desviados y oportunidades calientes. También puede preparar acciones como recordatorios o seguimiento comercial.
            </p>
          </div>
          <div className="ai-card">
            <span>Hoy, 7:30 a.m.</span>
            <p>Detecté 3 facturas por cobrar que vencen hoy y una cotización comercial con 82% de probabilidad de aceptación.</p>
            <button type="button" onClick={() => setShowLogin(true)}>Abrir resumen</button>
          </div>
        </section>

        <section id="modulos" className="landing-section modules-section">
          <div className="section-heading">
            <span className="landing-eyebrow">Todo conectado</span>
            <h2>Módulos listos para operar desde el primer día.</h2>
          </div>
          
          <div className="vc-interactive-container">
            <div className="value-chain-shadow">
              <div className="value-chain-wrapper" aria-label="Cadena de valor de ERPyme">
                <div className="vc-support">
                  <span className="vc-label">Áreas de soporte / staff</span>
                  <button type="button" className={`vc-row ${activeModule === 'ia' ? 'active' : ''}`} onClick={() => setActiveModule('ia')}>
                    <span>Asistente IA</span>
                  </button>
                  <button type="button" className={`vc-row ${activeModule === 'contabilidad' ? 'active' : ''}`} onClick={() => setActiveModule('contabilidad')}>
                    <span>Contabilidad</span>
                  </button>
                  <button type="button" className={`vc-row ${activeModule === 'rrhh' ? 'active' : ''}`} onClick={() => setActiveModule('rrhh')}>
                    <span>RRHH</span>
                  </button>
                </div>
                <div className="vc-primary">
                  <span className="vc-label">Áreas operativas / de negocio</span>
                  <div className="vc-cols">
                    <button type="button" className={`vc-col ${activeModule === 'logistica' ? 'active' : ''}`} onClick={() => setActiveModule('logistica')}>
                      <span>Logística</span>
                    </button>
                    <button type="button" className={`vc-col ${activeModule === 'proyectos' ? 'active' : ''}`} onClick={() => setActiveModule('proyectos')}>
                      <span>Proyectos</span>
                    </button>
                    <button type="button" className={`vc-col ${activeModule === 'ventas' ? 'active' : ''}`} onClick={() => setActiveModule('ventas')}>
                      <span>Ventas</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="vc-info-panel">
              <div className="ai-card vc-detail-card" key={activeModule}>
                <span>{moduleDetails[activeModule].tag}</span>
                <h3>{moduleDetails[activeModule].title}</h3>
                <p>{moduleDetails[activeModule].description}</p>
                <button type="button" onClick={() => setShowLogin(true)}>{moduleDetails[activeModule].action}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final">
          <h2>Convierte tu ERP en un consultor activo para tu negocio.</h2>
          <button type="button" className="primary-cta" onClick={() => setShowLogin(true)}>
            Entrar a ERPyme
          </button>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
