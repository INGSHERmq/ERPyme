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

const modules = [
  'Proyectos',
  'Ventas y CRM',
  'Finanzas',
  'Logística',
  'RRHH',
  'Asistente IA'
];

const benefits = [
  {
    title: 'Decisiones antes del problema',
    copy: 'El briefing ejecutivo detecta cobranzas, riesgos de proyecto y oportunidades prioritarias sin esperar una consulta manual.'
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

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);

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
                <strong>Briefing matutino</strong>
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
            <button type="button" onClick={() => setShowLogin(true)}>Abrir briefing</button>
          </div>
        </section>

        <section id="modulos" className="landing-section modules-section">
          <div className="section-heading">
            <span className="landing-eyebrow">Todo conectado</span>
            <h2>Módulos listos para operar desde el primer día.</h2>
          </div>
          <div className="module-marquee" aria-label="Módulos de ERPyme">
            <div className="module-strip">
              {[...modules, ...modules].map((module, index) => (
                <span key={`${module}-${index}`}>{module}</span>
              ))}
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
