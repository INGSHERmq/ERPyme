export const ERP_MODULES = [
  { id: 'projects', title: 'Proyectos', desc: 'Tareas, calendario, avances y cronogramas', color: '#ff4d8b', status: 'Activo' },
  { id: 'marketing', title: 'Clientes y cotizaciones', desc: 'Clientes, oportunidades y cotizaciones', color: '#1a3a3a', status: 'Activo' },
  { id: 'ventas', title: 'Ventas y cobranza', desc: 'Contactos nuevos, pedidos, facturas e historial comercial', color: '#b8a4ed', status: 'Nuevo' },
  { id: 'compras', title: 'Compras y proveedores', desc: 'Proveedores, compras solicitadas y gastos de compra', color: '#ffb084', status: 'Nuevo' },
  { id: 'facturacion', title: 'Facturas y comprobantes', desc: 'Facturas, boletas, recibos y documentos de venta', color: '#e8b94a', status: 'Nuevo' },
  { id: 'finanzas', title: 'Dinero', desc: 'Ingresos, egresos y cuentas por cobrar', color: '#a4d4c5', status: 'Activo' },
  { id: 'caja-bancos', title: 'Caja y bancos', desc: 'Cuentas bancarias, caja chica y saldos iniciales', color: '#ff6b5a', status: 'Nuevo' },
  { id: 'logistica', title: 'Logistica', desc: 'Equipos desde inventario, prestamos y mantenimiento', color: '#ff4d8b', status: 'Activo' },
  { id: 'inventario-operativo', title: 'Productos e inventario', desc: 'Productos, existencias, almacenes y alertas', color: '#1a3a3a', status: 'Nuevo' },
  { id: 'rrhh', title: 'Recursos Humanos', desc: 'Empleados, asistencias, asignaciones y seguridad', color: '#b8a4ed', status: 'Activo' },
  { id: 'reportes', title: 'Reportes', desc: 'Resumen de ventas, gastos, caja y proyectos', color: '#ffb084', status: 'Nuevo' },
  { id: 'permisos-auditoria', title: 'Usuarios y permisos', desc: 'Usuarios, permisos, accesos e historial de cambios', color: '#e8b94a', status: 'Nuevo' },
  { id: 'documentos', title: 'Archivos', desc: 'Contratos, comprobantes, fotos, certificados y documentos', color: '#a4d4c5', status: 'Nuevo' },
  { id: 'notificaciones', title: 'Alertas', desc: 'Vencimientos, tareas atrasadas y avisos importantes', color: '#ff6b5a', status: 'Nuevo' },
  { id: 'importacion', title: 'Importar y exportar', desc: 'Cargar o descargar informacion en Excel o CSV', color: '#ff4d8b', status: 'Nuevo' },
  { id: 'assistant', title: 'Habla con tu asistente', desc: 'Chat interno para consultar informacion de tu empresa', color: '#1a3a3a', status: 'Nuevo' }
];

export const ERP_MODULE_KEYS = ERP_MODULES.map((module) => module.id);
