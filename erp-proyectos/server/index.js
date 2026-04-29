// ============================================
// 🚀 SERVER - ERPyme Backend (Node.js + Express)
// ============================================
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// 🗄️ MODELO DE DATOS RELACIONAL - ERPyme
// ============================================

// --- CLIENTES (CRM) ---
let clientes = [
  { id: 1, nombre: 'TechCorp SA', contacto: 'Juan Pérez', email: 'juan@techcorp.com', telefono: '+51 999 123 456', estado: 'Activo', industria: 'Tecnología', creado: '2026-01-15' },
  { id: 2, nombre: 'Innovatech', contacto: 'Ana García', email: 'ana@innovatech.com', telefono: '+51 987 654 321', estado: 'Activo', industria: 'Consultoría', creado: '2026-02-20' },
  { id: 3, nombre: 'LogiTrans', contacto: 'Carlos López', email: 'carlos@logitrans.com', telefono: '+51 912 345 678', estado: 'Inactivo', industria: 'Logística', creado: '2026-03-10' }
];

// --- COTIZACIONES (Marketing) ---
let cotizaciones = [
  { id: 1, clienteId: 1, proyectoId: 1, titulo: 'Desarrollo ERP - Módulo Pagos', monto: 15000, estado: 'Aceptada', fecha: '2026-04-10', descripcion: 'Implementación de pasarela de pagos integrada', validez: '30 días' },
  { id: 2, clienteId: 1, proyectoId: 2, titulo: 'Mantenimiento API - Mensual', monto: 2000, estado: 'Pendiente', fecha: '2026-04-25', descripcion: 'Soporte y mantenimiento de endpoints de autenticación', validez: '15 días' },
  { id: 3, clienteId: 2, proyectoId: 3, titulo: 'Diseño UI/UX Dashboard', monto: 8500, estado: 'Aceptada', fecha: '2026-03-01', descripcion: 'Diseño de interfaz principal y componentes reutilizables', validez: '45 días' },
  { id: 4, clienteId: 3, proyectoId: null, titulo: 'Sistema de Rutas Logísticas', monto: 12000, estado: 'Rechazada', fecha: '2026-04-01', descripcion: 'Optimización de rutas de distribución con IA', validez: '30 días' }
];

// --- PROYECTOS (Gestión) ---
let proyectos = [
  { id: 1, nombre: 'Módulo de Pagos', clienteId: 1, cotizacionId: 1, estado: 'En Progreso', prioridad: 'Alta', inicio: '2026-04-01', fin: '2026-05-15', descripcion: 'Implementar pasarela de pagos', monto: 15000, progreso: 65 },
  { id: 2, nombre: 'API de Usuarios', clienteId: 1, cotizacionId: 2, estado: 'Pendiente', prioridad: 'Media', inicio: '2026-04-10', fin: '2026-04-20', descripcion: 'Crear endpoints de autenticación', monto: 2000, progreso: 0 },
  { id: 3, nombre: 'Diseño Dashboard', clienteId: 2, cotizacionId: 3, estado: 'Completado', prioridad: 'Baja', inicio: '2026-03-15', fin: '2026-04-01', descripcion: 'Diseñar interfaz principal', monto: 8500, progreso: 100 },
  { id: 4, nombre: 'Base de Datos', clienteId: 2, cotizacionId: null, estado: 'En Progreso', prioridad: 'Alta', inicio: '2026-04-05', fin: '2026-04-25', descripcion: 'Configurar PostgreSQL y optimizar queries', monto: 5000, progreso: 40 }
];

// --- FINANZAS ---
let ingresos = [
  { id: 1, tipo: 'Proyecto', concepto: 'Pago inicial - Módulo de Pagos', monto: 7500, fecha: '2026-04-01', proyectoId: 1, clienteId: 1, estado: 'Cobrado', metodo: 'Transferencia' },
  { id: 2, tipo: 'Proyecto', concepto: 'Pago final - Diseño Dashboard', monto: 8500, fecha: '2026-04-01', proyectoId: 3, clienteId: 2, estado: 'Cobrado', metodo: 'Transferencia' },
  { id: 3, tipo: 'Servicio', concepto: 'Mantenimiento mensual', monto: 2000, fecha: '2026-04-25', proyectoId: 2, clienteId: 1, estado: 'Pendiente', metodo: 'Pendiente' }
];

let egresos = [
  { id: 1, categoria: 'Infraestructura', concepto: 'Servidor Cloud AWS', monto: 450, fecha: '2026-04-05', proyectoId: null, tipo: 'Operativo', metodo: 'Tarjeta' },
  { id: 2, categoria: 'Licencias', concepto: 'Licencia Figma Team', monto: 150, fecha: '2026-04-10', proyectoId: 3, tipo: 'Proyecto', metodo: 'Tarjeta' },
  { id: 3, categoria: 'Servicios', concepto: 'Consultoría PostgreSQL', monto: 800, fecha: '2026-04-15', proyectoId: 4, tipo: 'Proyecto', metodo: 'Transferencia' },
  { id: 4, categoria: 'Infraestructura', concepto: 'Dominio y SSL', monto: 120, fecha: '2026-04-20', proyectoId: null, tipo: 'Operativo', metodo: 'Tarjeta' }
];

let cuentasPorCobrar = [
  { id: 1, clienteId: 1, proyectoId: 1, concepto: 'Segundo pago - Módulo Pagos', monto: 7500, fechaEmision: '2026-04-15', fechaVencimiento: '2026-05-15', estado: 'Pendiente' },
  { id: 2, clienteId: 1, proyectoId: 2, concepto: 'Mantenimiento API', monto: 2000, fechaEmision: '2026-04-25', fechaVencimiento: '2026-05-10', estado: 'Pendiente' }
];

// --- RRHH ---
let empleados = [
  { id: 1, nombre: 'María Rodríguez', email: 'maria.rodriguez@erpyme.com', telefono: '+51 999 111 222', cargo: 'Desarrolladora Senior', departamento: 'Tecnología', salario: 4500, fechaIngreso: '2024-03-15', estado: 'Activo', tipoContrato: 'Indefinido' },
  { id: 2, nombre: 'Carlos Mendoza', email: 'carlos.mendoza@erpyme.com', telefono: '+51 988 222 333', cargo: 'Diseñador UX/UI', departamento: 'Diseño', salario: 3800, fechaIngreso: '2024-06-01', estado: 'Activo', tipoContrato: 'Indefinido' },
  { id: 3, nombre: 'Ana Torres', email: 'ana.torres@erpyme.com', telefono: '+51 977 333 444', cargo: 'Project Manager', departamento: 'Gestión', salario: 5200, fechaIngreso: '2023-11-20', estado: 'Activo', tipoContrato: 'Indefinido' },
  { id: 4, nombre: 'Luis Ramírez', email: 'luis.ramirez@erpyme.com', telefono: '+51 966 444 555', cargo: 'Desarrollador Backend', departamento: 'Tecnología', salario: 4000, fechaIngreso: '2025-01-10', estado: 'Activo', tipoContrato: 'Indefinido' },
  { id: 5, nombre: 'Sofía Vargas', email: 'sofia.vargas@erpyme.com', telefono: '+51 955 555 666', cargo: 'Especialista SSOMA', departamento: 'Seguridad', salario: 3500, fechaIngreso: '2024-08-15', estado: 'Activo', tipoContrato: 'Indefinido' },
  { id: 6, nombre: 'Pedro Sánchez', email: 'pedro.sanchez@erpyme.com', telefono: '+51 944 666 777', cargo: 'Desarrollador Junior', departamento: 'Tecnología', salario: 2800, fechaIngreso: '2025-03-01', estado: 'Inactivo', tipoContrato: 'Temporal' }
];

let asistencias = [
  { id: 1, empleadoId: 1, fecha: '2026-04-29', horaEntrada: '08:55', horaSalida: '18:05', estado: 'Presente', observaciones: '' },
  { id: 2, empleadoId: 2, fecha: '2026-04-29', horaEntrada: '09:15', horaSalida: '18:15', estado: 'Tarde', observaciones: 'Tráfico' },
  { id: 3, empleadoId: 3, fecha: '2026-04-29', horaEntrada: '08:50', horaSalida: '18:00', estado: 'Presente', observaciones: '' },
  { id: 4, empleadoId: 4, fecha: '2026-04-29', horaEntrada: '08:45', horaSalida: '17:50', estado: 'Presente', observaciones: '' },
  { id: 5, empleadoId: 1, fecha: '2026-04-28', horaEntrada: '09:00', horaSalida: '18:00', estado: 'Presente', observaciones: '' }
];

let asignacionesProyecto = [
  { id: 1, empleadoId: 1, proyectoId: 1, rol: 'Desarrolladora Principal', fechaInicio: '2026-04-01', fechaFin: '2026-05-15', estado: 'Activo', horasSemanales: 40 },
  { id: 2, empleadoId: 4, proyectoId: 1, rol: 'Desarrollador Backend', fechaInicio: '2026-04-01', fechaFin: '2026-05-15', estado: 'Activo', horasSemanales: 40 },
  { id: 3, empleadoId: 2, proyectoId: 3, rol: 'Diseñador UX/UI', fechaInicio: '2026-03-15', fechaFin: '2026-04-01', estado: 'Completado', horasSemanales: 30 },
  { id: 4, empleadoId: 3, proyectoId: 1, rol: 'Project Manager', fechaInicio: '2026-04-01', fechaFin: '2026-05-15', estado: 'Activo', horasSemanales: 20 },
  { id: 5, empleadoId: 4, proyectoId: 4, rol: 'Administrador BD', fechaInicio: '2026-04-05', fechaFin: '2026-04-25', estado: 'Activo', horasSemanales: 40 },
  { id: 6, empleadoId: 1, proyectoId: 2, rol: 'Desarrolladora API', fechaInicio: '2026-04-10', fechaFin: '2026-04-20', estado: 'Pendiente', horasSemanales: 40 }
];

let incidentesSSOMA = [
  { id: 1, empleadoId: 2, tipo: 'Accidente Leve', descripcion: 'Caída menor en oficina, golpe en rodilla', fecha: '2026-04-15', gravedad: 'Baja', estado: 'Cerrado', accionesTomadas: 'Primeros auxilios aplicados, revisión de área', fechaReporte: '2026-04-15' },
  { id: 2, empleadoId: 4, tipo: 'Enfermedad Ocupacional', descripcion: 'Molestias en vista por uso prolongado de pantalla', fecha: '2026-04-20', gravedad: 'Media', estado: 'En Seguimiento', accionesTomadas: 'Examen oftalmológico programado, descanso programado', fechaReporte: '2026-04-20' },
  { id: 3, empleadoId: 1, tipo: 'Casi Accidente', descripcion: 'Cable suelto en pasillo, riesgo de tropiezo', fecha: '2026-04-25', gravedad: 'Baja', estado: 'Cerrado', accionesTomadas: 'Cable organizado, señalización colocada', fechaReporte: '2026-04-25' }
];

let examenesMedicos = [
  { id: 1, empleadoId: 1, tipo: 'Examen Pre-ocupacional', fecha: '2024-03-10', resultado: 'Apto', observaciones: 'Sin observaciones', proximoExamen: '2025-03-10' },
  { id: 2, empleadoId: 2, tipo: 'Examen Periódico', fecha: '2026-04-22', resultado: 'Apto con observaciones', observaciones: 'Revisión oftalmológica recomendada', proximoExamen: '2027-04-22' },
  { id: 3, empleadoId: 3, tipo: 'Examen Periódico', fecha: '2025-11-15', resultado: 'Apto', observaciones: 'Sin observaciones', proximoExamen: '2026-11-15' }
];

// ============================================
//  NUEVO: DATOS DE LOGÍSTICA
// ============================================

let activos = [
  { id: 1, nombre: 'MacBook Pro 14"', tipo: 'Laptop', marca: 'Apple', modelo: 'M3 Pro', serie: 'SN-APL-001', estado: 'En uso', fechaCompra: '2025-01-15', ubicacion: 'Oficina Principal', costo: 2500 },
  { id: 2, nombre: 'Monitor Dell 27" 4K', tipo: 'Monitor', marca: 'Dell', modelo: 'U2723QE', serie: 'SN-DLL-042', estado: 'Disponible', fechaCompra: '2024-11-20', ubicacion: 'Almacén TI', costo: 480 },
  { id: 3, nombre: 'Taladro Industrial Bosch', tipo: 'Herramienta', marca: 'Bosch', modelo: 'GBM 340', serie: 'SN-BSH-112', estado: 'En mantenimiento', fechaCompra: '2023-06-10', ubicacion: 'Taller', costo: 185 },
  { id: 4, nombre: 'Servidor Rack HP', tipo: 'Infraestructura', marca: 'HP', modelo: 'ProLiant DL380', serie: 'SN-HP-889', estado: 'En uso', fechaCompra: '2024-03-05', ubicacion: 'Data Center', costo: 4200 },
  { id: 5, nombre: 'Impresora Multifuncional', tipo: 'Periférico', marca: 'Brother', modelo: 'MFC-L2750DW', serie: 'SN-BRT-331', estado: 'Disponible', fechaCompra: '2025-02-18', ubicacion: 'Almacén TI', costo: 320 }
];

let asignacionesActivos = [
  { id: 1, activoId: 1, tipoAsignacion: 'Empleado', refId: 1, fechaAsignacion: '2026-04-01', fechaDevolucion: null, estado: 'Activa', observaciones: 'Desarrollo Módulo Pagos' },
  { id: 2, activoId: 4, tipoAsignacion: 'Proyecto', refId: 1, fechaAsignacion: '2026-04-05', fechaDevolucion: null, estado: 'Activa', observaciones: 'Hosting temporal pruebas' }
];

let mantenimientos = [
  { id: 1, activoId: 3, tipo: 'Preventivo', descripcion: 'Cambio de carbones y lubricación general', fecha: '2026-04-10', costo: 35, tecnico: 'Servicio Técnico Oficial', estado: 'Completado' },
  { id: 2, activoId: 1, tipo: 'Correctivo', descripcion: 'Reemplazo de teclado y limpieza interna', fecha: '2026-04-20', costo: 120, tecnico: 'Apple Authorized', estado: 'Pendiente' }
];

let guiasSalida = [
  { id: 1, activoId: 2, destino: 'Cliente Innovatech - Demo', fechaSalida: '2026-04-15', fechaRegreso: '2026-04-22', estado: 'En tránsito', responsable: 'Carlos Mendoza' }
];

// ============================================
// 🔄 RUTAS DE LA API
// ============================================

// --- PROYECTOS ---
app.get('/api/proyectos', (req, res) => {
  res.json(proyectos.map(p => ({ ...p, clienteNombre: clientes.find(c => c.id === p.clienteId)?.nombre || 'N/A' })));
});
app.post('/api/proyectos', (req, res) => {
  const { clienteId, cotizacionId, ...rest } = req.body;
  if (clienteId && !clientes.find(c => c.id === clienteId)) return res.status(400).json({ error: 'Cliente no encontrado' });
  const nuevo = { id: Date.now(), clienteId: clienteId || null, cotizacionId: cotizacionId || null, progreso: 0, ...rest };
  proyectos.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/proyectos/:id', (req, res) => {
  const idx = proyectos.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrado' });
  proyectos[idx] = { ...proyectos[idx], ...req.body };
  res.json(proyectos[idx]);
});
app.delete('/api/proyectos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const proj = proyectos.find(p => p.id === id);
  if (proj?.cotizacionId) {
    const cot = cotizaciones.find(c => c.id === proj.cotizacionId);
    if (cot) cot.proyectoId = null;
  }
  proyectos = proyectos.filter(p => p.id !== id);
  res.json({ message: 'Eliminado' });
});

// --- CLIENTES ---
app.get('/api/clientes', (req, res) => {
  res.json(clientes.map(c => ({
    ...c,
    proyectosCount: proyectos.filter(p => p.clienteId === c.id).length,
    cotizacionesCount: cotizaciones.filter(q => q.clienteId === c.id).length,
    montoTotal: cotizaciones.filter(q => q.clienteId === c.id && q.estado === 'Aceptada').reduce((s, q) => s + q.monto, 0)
  })));
});
app.post('/api/clientes', (req, res) => {
  const nuevo = { id: Date.now(), creado: new Date().toISOString().split('T')[0], ...req.body };
  clientes.push(nuevo);
  res.status(201).json(nuevo);
});

// --- COTIZACIONES ---
app.get('/api/cotizaciones', (req, res) => {
  res.json(cotizaciones.map(q => ({
    ...q,
    clienteNombre: clientes.find(c => c.id === q.clienteId)?.nombre || 'N/A',
    proyectoNombre: q.proyectoId ? proyectos.find(p => p.id === q.proyectoId)?.nombre : null
  })));
});
app.post('/api/cotizaciones', (req, res) => {
  const { clienteId, ...rest } = req.body;
  if (clienteId && !clientes.find(c => c.id === clienteId)) return res.status(400).json({ error: 'Cliente no encontrado' });
  const nueva = { id: Date.now(), clienteId: clienteId || null, proyectoId: null, ...rest };
  cotizaciones.push(nueva);
  res.status(201).json(nueva);
});
app.post('/api/cotizaciones/:id/convertir', (req, res) => {
  const cot = cotizaciones.find(c => c.id === parseInt(req.params.id));
  if (!cot) return res.status(404).json({ error: 'No encontrada' });
  const nuevoProyecto = {
    id: Date.now(), nombre: cot.titulo, clienteId: cot.clienteId, cotizacionId: cot.id,
    estado: 'Pendiente', prioridad: 'Media', inicio: new Date().toISOString().split('T')[0],
    fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    descripcion: cot.descripcion, monto: cot.monto, progreso: 0
  };
  proyectos.push(nuevoProyecto);
  cot.estado = 'Aceptada';
  cot.proyectoId = nuevoProyecto.id;
  res.status(201).json({ proyecto: nuevoProyecto, cotizacion: cot });
});

// --- FINANZAS ---
app.get('/api/finanzas/ingresos', (req, res) => {
  res.json(ingresos.map(i => ({ ...i, clienteNombre: i.clienteId ? clientes.find(c => c.id === i.clienteId)?.nombre : null, proyectoNombre: i.proyectoId ? proyectos.find(p => p.id === i.proyectoId)?.nombre : null })));
});
app.post('/api/finanzas/ingresos', (req, res) => {
  const { clienteId, proyectoId, ...rest } = req.body;
  const nuevo = { id: Date.now(), clienteId: clienteId || null, proyectoId: proyectoId || null, ...rest };
  ingresos.push(nuevo);
  res.status(201).json(nuevo);
});
app.get('/api/finanzas/egresos', (req, res) => {
  res.json(egresos.map(e => ({ ...e, proyectoNombre: e.proyectoId ? proyectos.find(p => p.id === e.proyectoId)?.nombre : null })));
});
app.post('/api/finanzas/egresos', (req, res) => {
  const { proyectoId, ...rest } = req.body;
  const nuevo = { id: Date.now(), proyectoId: proyectoId || null, ...rest };
  egresos.push(nuevo);
  res.status(201).json(nuevo);
});
app.get('/api/finanzas/cuentas-por-cobrar', (req, res) => {
  res.json(cuentasPorCobrar.map(c => ({ ...c, clienteNombre: clientes.find(cl => cl.id === c.clienteId)?.nombre || 'N/A', proyectoNombre: c.proyectoId ? proyectos.find(p => p.id === c.proyectoId)?.nombre : null })));
});
app.post('/api/finanzas/cuentas-por-cobrar', (req, res) => {
  const { clienteId, proyectoId, ...rest } = req.body;
  const nuevo = { id: Date.now(), clienteId, proyectoId: proyectoId || null, ...rest };
  cuentasPorCobrar.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/finanzas/cuentas-por-cobrar/:id', (req, res) => {
  const idx = cuentasPorCobrar.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrada' });
  cuentasPorCobrar[idx] = { ...cuentasPorCobrar[idx], ...req.body };
  res.json(cuentasPorCobrar[idx]);
});
app.get('/api/finanzas/dashboard', (req, res) => {
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const ingresosCobrados = ingresos.filter(i => i.estado === 'Cobrado').reduce((s, i) => s + i.monto, 0);
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0);
  const totalPorCobrar = cuentasPorCobrar.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + c.monto, 0);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7);
  }).reverse();
  res.json({
    totalIngresos, ingresosCobrados, totalEgresos, balance: ingresosCobrados - totalEgresos, totalPorCobrar,
    ingresosPorMes: meses.map(m => ({
      mes: m.slice(5),
      ingresos: ingresos.filter(i => i.fecha.startsWith(m) && i.estado === 'Cobrado').reduce((s, i) => s + i.monto, 0),
      egresos: egresos.filter(e => e.fecha.startsWith(m)).reduce((s, e) => s + e.monto, 0)
    })),
    egresosPorCategoria: Object.entries(egresos.reduce((acc, e) => { acc[e.categoria] = (acc[e.categoria] || 0) + e.monto; return acc; }, {})).map(([name, value]) => ({ name, value }))
  });
});

// --- RRHH ---
app.get('/api/rrhh/empleados', (req, res) => {
  res.json(empleados.map(e => ({
    ...e,
    proyectosAsignados: asignacionesProyecto.filter(a => a.empleadoId === e.id && a.estado === 'Activo').length,
    incidentes: incidentesSSOMA.filter(i => i.empleadoId === e.id).length,
    ultimoExamen: examenesMedicos.find(ex => ex.empleadoId === e.id)
  })));
});
app.post('/api/rrhh/empleados', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  empleados.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/rrhh/empleados/:id', (req, res) => {
  const idx = empleados.findIndex(e => e.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrado' });
  empleados[idx] = { ...empleados[idx], ...req.body };
  res.json(empleados[idx]);
});
app.get('/api/rrhh/asistencias', (req, res) => {
  res.json(asistencias.map(a => ({ ...a, empleadoNombre: empleados.find(e => e.id === a.empleadoId)?.nombre || 'N/A' })));
});
app.post('/api/rrhh/asistencias', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  asistencias.push(nuevo);
  res.status(201).json(nuevo);
});
app.get('/api/rrhh/asignaciones', (req, res) => {
  res.json(asignacionesProyecto.map(a => ({
    ...a,
    empleadoNombre: empleados.find(e => e.id === a.empleadoId)?.nombre || 'N/A',
    proyectoNombre: proyectos.find(p => p.id === a.proyectoId)?.nombre || 'N/A'
  })));
});
app.post('/api/rrhh/asignaciones', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  asignacionesProyecto.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/rrhh/asignaciones/:id', (req, res) => {
  const idx = asignacionesProyecto.findIndex(a => a.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrada' });
  asignacionesProyecto[idx] = { ...asignacionesProyecto[idx], ...req.body };
  res.json(asignacionesProyecto[idx]);
});
app.get('/api/rrhh/incidentes', (req, res) => {
  res.json(incidentesSSOMA.map(i => ({ ...i, empleadoNombre: empleados.find(e => e.id === i.empleadoId)?.nombre || 'N/A' })));
});
app.post('/api/rrhh/incidentes', (req, res) => {
  const nuevo = { id: Date.now(), fechaReporte: new Date().toISOString().split('T')[0], ...req.body };
  incidentesSSOMA.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/rrhh/incidentes/:id', (req, res) => {
  const idx = incidentesSSOMA.findIndex(i => i.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrado' });
  incidentesSSOMA[idx] = { ...incidentesSSOMA[idx], ...req.body };
  res.json(incidentesSSOMA[idx]);
});
app.get('/api/rrhh/examenes', (req, res) => {
  res.json(examenesMedicos.map(ex => ({ ...ex, empleadoNombre: empleados.find(e => e.id === ex.empleadoId)?.nombre || 'N/A' })));
});
app.post('/api/rrhh/examenes', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  examenesMedicos.push(nuevo);
  res.status(201).json(nuevo);
});
app.get('/api/rrhh/dashboard', (req, res) => {
  const activosCount = empleados.filter(e => e.estado === 'Activo').length;
  const presentesHoy = asistencias.filter(a => a.fecha === new Date().toISOString().split('T')[0] && a.estado === 'Presente').length;
  const proyectosConPersonal = new Set(asignacionesProyecto.filter(a => a.estado === 'Activo').map(a => a.proyectoId)).size;
  const incidentesMes = incidentesSSOMA.filter(i => i.fecha.startsWith(new Date().toISOString().slice(0, 7))).length;
  res.json({
    totalEmpleados: activosCount, presentesHoy, proyectosConPersonal, incidentesMes,
    empleadosPorDepartamento: Object.entries(empleados.filter(e => e.estado === 'Activo').reduce((acc, e) => { acc[e.departamento] = (acc[e.departamento] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value })),
    planillaMensual: empleados.filter(e => e.estado === 'Activo').reduce((s, e) => s + e.salario, 0)
  });
});

// ============================================
// 📦 NUEVAS: RUTAS DE LOGÍSTICA
// ============================================

app.get('/api/logistica/activos', (req, res) => {
  res.json(activos.map(a => ({
    ...a,
    asignacionesCount: asignacionesActivos.filter(as => as.activoId === a.id && as.estado === 'Activa').length,
    mantenimientosPendientes: mantenimientos.filter(m => m.activoId === a.id && m.estado === 'Pendiente').length
  })));
});

app.post('/api/logistica/activos', (req, res) => {
  const nuevo = { id: Date.now(), estado: 'Disponible', ...req.body };
  activos.push(nuevo);
  res.status(201).json(nuevo);
});

app.get('/api/logistica/asignaciones', (req, res) => {
  res.json(asignacionesActivos.map(as => {
    const activo = activos.find(a => a.id === as.activoId);
    let refNombre = 'N/A';
    if (as.tipoAsignacion === 'Empleado') refNombre = empleados.find(e => e.id === as.refId)?.nombre || 'N/A';
    if (as.tipoAsignacion === 'Proyecto') refNombre = proyectos.find(p => p.id === as.refId)?.nombre || 'N/A';
    return { ...as, activoNombre: activo?.nombre || 'N/A', refNombre };
  }));
});

app.post('/api/logistica/asignaciones', (req, res) => {
  const nuevo = { id: Date.now(), fechaAsignacion: new Date().toISOString().split('T')[0], fechaDevolucion: null, estado: 'Activa', ...req.body };
  asignacionesActivos.push(nuevo);
  // Actualizar estado del activo
  const activo = activos.find(a => a.id === nuevo.activoId);
  if (activo) activo.estado = 'En uso';
  res.status(201).json(nuevo);
});

app.put('/api/logistica/asignaciones/:id', (req, res) => {
  const idx = asignacionesActivos.findIndex(a => a.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrada' });
  asignacionesActivos[idx] = { ...asignacionesActivos[idx], ...req.body };
  if (req.body.estado === 'Devuelta' || req.body.estado === 'Inactiva') {
    const activo = activos.find(a => a.id === asignacionesActivos[idx].activoId);
    if (activo) activo.estado = 'Disponible';
    asignacionesActivos[idx].fechaDevolucion = new Date().toISOString().split('T')[0];
  }
  res.json(asignacionesActivos[idx]);
});

app.get('/api/logistica/mantenimientos', (req, res) => {
  res.json(mantenimientos.map(m => ({ ...m, activoNombre: activos.find(a => a.id === m.activoId)?.nombre || 'N/A' })));
});

app.post('/api/logistica/mantenimientos', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  mantenimientos.push(nuevo);
  const activo = activos.find(a => a.id === nuevo.activoId);
  if (activo && nuevo.estado === 'Pendiente') activo.estado = 'En mantenimiento';
  if (activo && nuevo.estado === 'Completado') activo.estado = 'Disponible';
  res.status(201).json(nuevo);
});

app.put('/api/logistica/mantenimientos/:id', (req, res) => {
  const idx = mantenimientos.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'No encontrado' });
  mantenimientos[idx] = { ...mantenimientos[idx], ...req.body };
  const activo = activos.find(a => a.id === mantenimientos[idx].activoId);
  if (activo) {
    if (req.body.estado === 'Completado') activo.estado = 'Disponible';
    if (req.body.estado === 'Pendiente') activo.estado = 'En mantenimiento';
  }
  res.json(mantenimientos[idx]);
});

app.get('/api/logistica/guias', (req, res) => {
  res.json(guiasSalida.map(g => ({ ...g, activoNombre: activos.find(a => a.id === g.activoId)?.nombre || 'N/A' })));
});

app.post('/api/logistica/guias', (req, res) => {
  const nuevo = { id: Date.now(), estado: 'En tránsito', ...req.body };
  guiasSalida.push(nuevo);
  const activo = activos.find(a => a.id === nuevo.activoId);
  if (activo) activo.estado = 'En tránsito';
  res.status(201).json(nuevo);
});

app.get('/api/logistica/dashboard', (req, res) => {
  const total = activos.length;
  const disponibles = activos.filter(a => a.estado === 'Disponible').length;
  const enUso = activos.filter(a => a.estado === 'En uso').length;
  const enMantenimiento = activos.filter(a => a.estado === 'En mantenimiento').length;
  const valorTotal = activos.reduce((s, a) => s + a.costo, 0);
  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente').length;

  const porTipo = Object.entries(activos.reduce((acc, a) => { acc[a.tipo] = (acc[a.tipo] || 0) + 1; return acc; }, {}))
    .map(([name, value]) => ({ name, value }));

  res.json({ total, disponibles, enUso, enMantenimiento, valorTotal, mantenimientosPendientes, porTipo });
});

// --- MARKETING STATS (Legacy) ---
app.get('/api/marketing/stats', (req, res) => {
  const total = cotizaciones.length;
  const aceptadas = cotizaciones.filter(c => c.estado === 'Aceptada');
  res.json({
    totalCotizaciones: total,
    tasaConversion: total > 0 ? Math.round((aceptadas.length / total) * 100) : 0,
    montoTotalCotizado: cotizaciones.reduce((s, c) => s + c.monto, 0),
    montoAceptado: aceptadas.reduce((s, c) => s + c.monto, 0),
    proyectosActivos: proyectos.filter(p => p.estado === 'En Progreso').length
  });
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Módulos disponibles: Proyectos | Marketing | Finanzas | RRHH | Logística`);
});