export const ERP_MODULES = [
  { id: 'projects', title: 'Proyectos', desc: 'Tareas, calendario, avances y cronogramas', color: '#ff4d8b', status: 'Activo' },
  { id: 'ventas', title: 'Ventas', desc: 'Leads, cotizaciones y conversion a proyecto', color: '#1a3a3a', status: 'Activo' },
  { id: 'logistica', title: 'Logistica', desc: 'Equipos desde inventario, prestamos y mantenimiento', color: '#ff4d8b', status: 'Activo' },
  { id: 'rrhh', title: 'RRHH', desc: 'Empleados, documentos, asignaciones y registro de accidentes', color: '#b8a4ed', status: 'Activo' },
  { id: 'contabilidad', title: 'Contabilidad', desc: 'Facturas de compra/venta y analitica financiera por proyecto', color: '#a4d4c5', status: 'Activo' },
  { id: 'assistant', title: 'Habla con tu asistente', desc: 'Chat interno para consultar informacion de tu empresa', color: '#1a3a3a', status: 'Nuevo' },
  { id: 'admin', title: 'Mis usuarios', desc: 'Usuarios, permisos, accesos y plan de la empresa', color: '#fcd535', status: 'Admin', adminOnly: true }
];

export const ERP_MODULE_KEYS = ERP_MODULES.map((module) => module.id);

export const PLAN_KEYS = {
  BASIC: 'basic_free',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const APP_FEATURES = [
  { id: 'projects.summary', moduleId: 'projects', title: 'Resumen de proyectos' },
  { id: 'projects.activities', moduleId: 'projects', title: 'Actividades de proyectos' },
  { id: 'projects.schedule', moduleId: 'projects', title: 'Cronograma de proyectos' },
  { id: 'projects.calendar', moduleId: 'projects', title: 'Calendario de proyectos' },
  { id: 'projects.people', moduleId: 'projects', title: 'Personal en proyectos' },
  { id: 'projects.tools', moduleId: 'projects', title: 'Herramientas en proyectos' },
  { id: 'ventas.summary', moduleId: 'ventas', title: 'Resumen de ventas' },
  { id: 'ventas.leads', moduleId: 'ventas', title: 'Leads y CRM' },
  { id: 'ventas.quotes', moduleId: 'ventas', title: 'Cotizaciones' },
  { id: 'ventas.clients', moduleId: 'ventas', title: 'Clientes' },
  { id: 'ventas.scoring', moduleId: 'ventas', title: 'Scoring cotizaciones', advancedOnly: true },
  { id: 'assistant.chat', moduleId: 'assistant', title: 'Chat con asistente', advancedOnly: true },
  { id: 'assistant.briefing', moduleId: 'assistant', title: 'Briefing ejecutivo', advancedOnly: true },
  { id: 'contabilidad.purchases', moduleId: 'contabilidad', title: 'Facturas compra' },
  { id: 'contabilidad.sales', moduleId: 'contabilidad', title: 'Facturas venta' },
  { id: 'contabilidad.analytics', moduleId: 'contabilidad', title: 'Analitica proyecto' },
  { id: 'logistica.suppliers', moduleId: 'logistica', title: 'Proveedores' },
  { id: 'logistica.purchaseOrders', moduleId: 'logistica', title: 'Ordenes de compra' },
  { id: 'logistica.materials', moduleId: 'logistica', title: 'Materiales' },
  { id: 'logistica.inventory', moduleId: 'logistica', title: 'Inventario' },
  { id: 'logistica.assignments', moduleId: 'logistica', title: 'Asignaciones' },
  { id: 'logistica.maintenance', moduleId: 'logistica', title: 'Mantenimiento' },
  { id: 'logistica.kardex', moduleId: 'logistica', title: 'Kardex' },
  { id: 'rrhh.summary', moduleId: 'rrhh', title: 'Resumen RRHH' },
  { id: 'rrhh.documents', moduleId: 'rrhh', title: 'Documentos RRHH' },
  { id: 'rrhh.employees', moduleId: 'rrhh', title: 'Empleados' },
  { id: 'rrhh.assignments', moduleId: 'rrhh', title: 'Personal en proyectos' },
  { id: 'rrhh.accidents', moduleId: 'rrhh', title: 'Registro de accidentes' }
];

export const APP_FEATURE_KEYS = APP_FEATURES.map((feature) => feature.id);

export const PLAN_CONFIG = {
  [PLAN_KEYS.BASIC]: {
    id: PLAN_KEYS.BASIC,
    name: 'Plan Basico Gratuito',
    shortName: 'Basico',
    userLimit: 1,
    modules: ERP_MODULE_KEYS.filter((key) => key !== 'assistant'),
    features: APP_FEATURE_KEYS.filter((key) => !['ventas.scoring', 'assistant.chat', 'assistant.briefing'].includes(key))
  },
  [PLAN_KEYS.INTERMEDIATE]: {
    id: PLAN_KEYS.INTERMEDIATE,
    name: 'Plan Intermedio',
    shortName: 'Intermedio',
    userLimit: 10,
    modules: ERP_MODULE_KEYS.filter((key) => key !== 'assistant'),
    features: APP_FEATURE_KEYS.filter((key) => !['ventas.scoring', 'assistant.chat', 'assistant.briefing'].includes(key))
  },
  [PLAN_KEYS.ADVANCED]: {
    id: PLAN_KEYS.ADVANCED,
    name: 'Plan Avanzado',
    shortName: 'Avanzado',
    userLimit: null,
    modules: ERP_MODULE_KEYS,
    features: APP_FEATURE_KEYS
  }
};

export const PLAN_OPTIONS = [
  {
    id: PLAN_KEYS.BASIC,
    title: 'Plan Basico Gratuito',
    badge: 'Gratis',
    description: 'Modulos esenciales para empezar a ordenar la operacion.',
    users: '1 usuario',
    includes: ['Proyectos, ventas, finanzas, logistica y RRHH', 'Sin asistente IA', 'Sin scoring ni briefing ejecutivo']
  },
  {
    id: PLAN_KEYS.INTERMEDIATE,
    title: 'Plan Intermedio',
    badge: 'Equipo',
    description: 'Mas capacidad para operar con tu equipo actual.',
    users: '10 usuarios',
    includes: ['Todos los modulos operativos actuales', 'Sin asistente IA', 'Sin scoring ni briefing ejecutivo']
  },
  {
    id: PLAN_KEYS.ADVANCED,
    title: 'Plan Avanzado',
    badge: 'IA',
    description: 'IA analitica, consultoria inteligente y agente proactivo.',
    users: 'Usuarios ilimitados',
    includes: ['Todos los modulos y apartados', 'Habla con tu asistente', 'Scoring cotizaciones y briefing ejecutivo']
  }
];

export const getPlanConfig = (planKey) => PLAN_CONFIG[planKey] || PLAN_CONFIG[PLAN_KEYS.BASIC];
