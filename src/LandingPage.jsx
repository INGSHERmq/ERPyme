import { useState } from 'react';
import Login from './components/Login/Login';
import { useAuth } from './context/auth/useAuth';
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
    copy: 'La evaluación de cotizaciones ordena las propuestas según su probabilidad de aceptación, permitiendo que tu equipo atienda primero aquellas con mayor potencial de convertirse en ventas.'
  },
  {
    title: 'Operación conectada',
    copy: 'Clientes, cotizaciones, proyectos, Contabilidad, Logística y RRHH trabajan sobre la misma fuente de verdad.'
  }
];

const moduleDetails = {
  ia: {
    tag: 'Ecosistema de IA',
    title: 'Inteligencia en tres niveles',
    description: '1. Machine Learning: Scoring de probabilidad para tus ventas. 2. Resumen Ejecutivo: Análisis proactivo de riesgos y cobranzas. 3. Agente Operativo: Creación de registros (clientes, proveedores, tareas) mediante comandos naturales.',
    action: 'Explorar IA'
  },
  contabilidad: {
    tag: 'Contabilidad',
    title: 'Control de facturas y márgenes',
    description: 'Registra facturas de compra y venta, gestiona su estado (pendiente / pagada / anulada) y visualiza el análisis de resultados por proyecto.',
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
    description: 'Administra tu cartera de clientes y prospectos, emite cotizaciones y utiliza la evaluación de cotizaciones (IA) para priorizar las oportunidades con mayor potencial de convertirse en ventas.',
    action: 'Ver ventas y CRM'
  }
};

const LandingPage = () => {
  const { startDemoAccount, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [activeModule, setActiveModule] = useState('ia');
  const [demoData, setDemoData] = useState({ email: '', telefono: '' });
  const [demoError, setDemoError] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const openAccess = () => {
    setAuthMode('login');
    setShowDemo(false);
    setShowLogin(true);
  };

  const openDemo = () => {
    setShowLogin(false);
    setShowDemo(true);
    setDemoError('');
  };

  const handleDemoChange = (event) => {
    const { name, value } = event.target;
    setDemoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDemoSubmit = async (event) => {
    event.preventDefault();
    setDemoError('');

    try {
      setDemoSubmitting(true);
      await startDemoAccount(demoData);
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      setDemoError(
        message.includes('already') || message.includes('registered') || message.includes('exists')
          ? 'Ese correo ya esta registrado. Usa otro correo para la demo o ingresa con tu cuenta.'
          : error.message || 'No se pudo iniciar la demo.'
      );
    } finally {
      setDemoSubmitting(false);
    }
  };

  if (showLogin) {
    return (
      <div className="landing-login-shell">
        <button type="button" className="landing-back" onClick={() => setShowLogin(false)}>
          Volver al inicio
        </button>
        <Login initialMode={authMode} />
      </div>
    );
  }

  if (showDemo) {
    const isBusy = loading || demoSubmitting;

    return (
      <div className="landing-login-shell demo-access-shell">
        <button type="button" className="landing-back" onClick={() => setShowDemo(false)} disabled={isBusy}>
          Volver al inicio
        </button>
        <section className="demo-access-card">
          <span className="landing-eyebrow">Demo gratuita</span>
          <h1>Entra a ERPyme en segundos.</h1>
          <p>Solo necesitamos tu correo y numero para activar una empresa demo con todos los modulos por 14 dias.</p>
          <form className="demo-access-form" onSubmit={handleDemoSubmit}>
            {demoError && <div className="demo-access-error">{demoError}</div>}
            <label>
              Correo
              <input
                name="email"
                type="email"
                value={demoData.email}
                onChange={handleDemoChange}
                placeholder="tu@email.com"
                required
                disabled={isBusy}
              />
            </label>
            <label>
              Numero
              <input
                name="telefono"
                type="tel"
                value={demoData.telefono}
                onChange={handleDemoChange}
                placeholder="+51 999 999 999"
                required
                disabled={isBusy}
              />
            </label>
            <button type="submit" className="primary-cta" disabled={isBusy}>
              {isBusy ? 'Abriendo demo...' : 'Entrar a la demo'}
            </button>
          </form>
        </section>
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
        <button type="button" className="landing-login-button" onClick={openAccess}>
          Ingresar
        </button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-eyebrow">ERP con IA para pymes que quieren control real</span>
            <h1>Tu negocio no necesita más hojas sueltas. Necesita un centro de&nbsp;mando.</h1>
            <p>
              ERPyme integra ventas, proyectos, Contabilidad, logística, RRHH y un asistente inteligente, garantizando que cada decisión se fundamente en información actualizada y en tiempo real, en lugar de reportes obsoletos.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-cta" onClick={openDemo}>
                Probar ERPyme
              </button>
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
            <span className="landing-eyebrow">¿Por qué cambia la operación?</span>
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
            <span className="landing-eyebrow">Tres pilares de inteligencia</span>
            <h2>IA que entiende, predice y opera por ti.</h2>
            <p>
              ERPyme no solo guarda datos, los analiza y los pone en marcha mediante tres capas de inteligencia artificial integradas en tu flujo de trabajo diario.
            </p>
          </div>
          <div className="ai-features-grid">
            <article className="ai-feature-card">
              <span className="ai-badge">Machine Learning</span>
              <h3>Evaluación de ventas</h3>
              <p>ML avanzado para predecir la probabilidad de cierre de tus cotizaciones.</p>
            </article>
            <article className="ai-feature-card">
              <span className="ai-badge">Proactividad</span>
              <h3>Resumen Ejecutivo</h3>
              <p>Análisis matutino de cobranzas, riesgos de proyecto y oportunidades.</p>
            </article>
            <article className="ai-feature-card">
              <span className="ai-badge">Agente Operativo</span>
              <h3>Acciones Naturales</h3>
              <p>Crea clientes, tareas y proveedores mediante comandos de voz o chat.</p>
            </article>
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
                <div className="vc-support">
                  <span className="vc-label">Áreas de soporte / staff</span>
                  <button type="button" className={`vc-row ${activeModule === 'ia' ? 'active' : ''}`} onClick={() => setActiveModule('ia')}>
                    <div className="vc-row-content">
                      <span>Asistente IA</span>
                    </div>
                  </button>
                  <button type="button" className={`vc-row ${activeModule === 'contabilidad' ? 'active' : ''}`} onClick={() => setActiveModule('contabilidad')}>
                    <div className="vc-row-content">
                      <span>Contabilidad</span>
                    </div>
                  </button>
                  <button type="button" className={`vc-row ${activeModule === 'rrhh' ? 'active' : ''}`} onClick={() => setActiveModule('rrhh')}>
                    <div className="vc-row-content">
                      <span>RRHH</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div className="vc-info-panel">
              <div className="ai-card vc-detail-card" key={activeModule}>
                <span>{moduleDetails[activeModule].tag}</span>
                <h3>{moduleDetails[activeModule].title}</h3>
                <p>{moduleDetails[activeModule].description}</p>
                <button type="button" onClick={openDemo}>{moduleDetails[activeModule].action}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final">
          <h2>Convierte tu ERP en un consultor activo para tu negocio.</h2>
          <button type="button" className="primary-cta" onClick={openAccess}>
            Entrar a ERPyme
          </button>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
