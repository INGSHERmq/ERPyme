export const ERP_MODULES = [
  { id: 'projects', title: 'Proyectos', desc: 'Tareas, calendario, avances y cronogramas', color: '#ff4d8b', status: 'Activo' },
  { id: 'ventas', title: 'Ventas', desc: 'Clientes, cotizaciones y conversión a proyecto', color: '#1a3a3a', status: 'Activo' },
  { id: 'logistica', title: 'Logística', desc: 'Equipos desde inventario, préstamos y mantenimiento', color: '#ff4d8b', status: 'Activo' },
  { id: 'rrhh', title: 'RRHH', desc: 'Empleados, documentos, asignaciones y registro de accidentes', color: '#b8a4ed', status: 'Activo' },
  { id: 'contabilidad', title: 'Contabilidad', desc: 'Facturas de compra/venta y analítica financiera por proyecto', color: '#a4d4c5', status: 'Activo' },
  { id: 'assistant', title: 'Habla con tu asistente', desc: 'Chat interno para consultar información de tu empresa', color: '#1a3a3a', status: 'Nuevo' }
];

export const ERP_MODULE_KEYS = ERP_MODULES.map((module) => module.id);
