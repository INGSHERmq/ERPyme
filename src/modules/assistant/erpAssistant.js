import { supabase } from '../../lib/supabase';
import { generateExecutiveSummary, scoreOpportunity } from './executiveSummary';

const DEFAULT_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

const MODULE_TABLES = {
  marketing: ['clientes', 'cotizaciones'],
  proyectos: ['proyectos', 'tareas'],
  finanzas: ['ingresos', 'egresos', 'cuentas_por_cobrar'],
  rrhh: ['empleados', 'asistencias', 'asignaciones_proyecto'],
  logistica: ['productos_servicios', 'asignaciones_activos', 'mantenimientos', 'almacenes'],
  compras: ['proveedores', 'ordenes_compra'],
  facturacion: ['facturas'],
  caja: ['cuentas_bancarias'],
  ventas: ['leads', 'oportunidades', 'pedidos_venta'],
  sistema: ['notificaciones', 'adjuntos']
};

const TABLES_WITHOUT_USER_FILTER = new Set(['cuentas_bancarias', 'almacenes', 'facturas_compra', 'facturas_venta']);

const READ_TARGETS = [
  { table: 'clientes', label: 'clientes', patterns: ['cliente', 'clientes'] },
  { table: 'cotizaciones', label: 'cotizaciones', patterns: ['cotizacion', 'cotizaciones', 'cotización'] },
  { table: 'proveedores', label: 'proveedores', patterns: ['proveedor', 'proveedores'] },
  { table: 'ordenes_compra', label: 'compras', patterns: ['compra', 'compras', 'orden de compra', 'ordenes de compra'] },
  { table: 'facturas', label: 'facturas', patterns: ['factura', 'facturas', 'comprobante', 'comprobantes'] },
  { table: 'productos_servicios', label: 'productos y servicios', patterns: ['producto', 'productos', 'inventario', 'servicio', 'servicios'] },
  { table: 'ingresos', label: 'ingresos', patterns: ['ingreso', 'ingresos'] },
  { table: 'egresos', label: 'egresos', patterns: ['egreso', 'egresos', 'gasto', 'gastos'] },
  { table: 'cuentas_por_cobrar', label: 'cuentas por cobrar', patterns: ['cuenta por cobrar', 'cuentas por cobrar', 'por cobrar'] },
  { table: 'cuentas_bancarias', label: 'cuentas bancarias', patterns: ['cuenta bancaria', 'cuentas bancarias', 'banco', 'bancos', 'caja'] },
  { table: 'proyectos', label: 'proyectos', patterns: ['proyecto', 'proyectos'] },
  { table: 'tareas', label: 'tareas', patterns: ['tarea', 'tareas', 'actividad', 'actividades'] },
  { table: 'empleados', label: 'empleados', patterns: ['empleado', 'empleados', 'personal', 'trabajador', 'trabajadores'] },
  { table: 'asistencias', label: 'asistencias', patterns: ['asistencia', 'asistencias'] },
  { table: 'asignaciones_proyecto', label: 'asignaciones de proyecto', patterns: ['asignacion de proyecto', 'asignaciones de proyecto'] },
  { table: 'leads', label: 'contactos de venta', patterns: ['lead', 'leads', 'contacto de venta', 'contactos de venta'] },
  { table: 'oportunidades', label: 'oportunidades', patterns: ['oportunidad', 'oportunidades'] },
  { table: 'pedidos_venta', label: 'pedidos de venta', patterns: ['pedido de venta', 'pedidos de venta', 'pedido', 'pedidos'] },
  { table: 'mantenimientos', label: 'mantenimientos', patterns: ['mantenimiento', 'mantenimientos'] },
  { table: 'asignaciones_activos', label: 'prestamos de equipos', patterns: ['prestamo', 'prestamos', 'préstamo', 'préstamos', 'asignacion de activo'] },
  { table: 'notificaciones', label: 'alertas', patterns: ['alerta', 'alertas', 'notificacion', 'notificaciones'] }
];

const CREATE_SCHEMAS = {
  clientes: {
    required: ['nombre'],
    fields: ['nombre', 'contacto', 'email', 'telefono', 'tipo_identificacion', 'dni_ruc', 'estado', 'industria']
  },
  cotizaciones: {
    required: ['titulo'],
    fields: ['cliente_id', 'proyecto_id', 'titulo', 'cantidad', 'unidad', 'precio_unitario', 'monto', 'estado', 'fecha', 'descripcion', 'validez']
  },
  proveedores: {
    required: ['nombre'],
    fields: ['nombre', 'ruc', 'contacto', 'email', 'telefono', 'direccion', 'estado']
  },
  ordenes_compra: {
    required: ['nombre_compra', 'numero'],
    fields: ['proveedor_id', 'proyecto_id', 'nombre_compra', 'numero', 'fecha', 'fecha_vencimiento', 'cantidad', 'costo_unitario', 'total', 'estado', 'observaciones']
  },
  facturas: {
    required: ['numero'],
    fields: ['numero', 'cotizacion_id', 'cliente_id', 'fecha_emision', 'total']
  },
  productos_servicios: {
    required: ['nombre'],
    fields: ['codigo', 'nombre', 'tipo', 'unidad', 'precio_venta', 'costo', 'stock_actual', 'stock_minimo', 'estado']
  },
  movimientos_inventario: {
    required: ['concepto'],
    fields: ['producto_servicio_id', 'almacen_id', 'concepto', 'tipo', 'cantidad', 'fecha', 'referencia_tipo', 'referencia_id']
  },
  proyectos: {
    required: ['nombre'],
    fields: ['cliente_id', 'cotizacion_id', 'nombre', 'estado', 'prioridad', 'inicio', 'fin', 'descripcion', 'monto', 'progreso']
  },
  tareas: {
    required: ['titulo'],
    fields: ['proyecto_id', 'empleado_id', 'titulo', 'descripcion', 'estado', 'prioridad', 'fecha_inicio', 'fecha_fin', 'color']
  },
  ingresos: {
    required: ['concepto', 'monto'],
    fields: ['tipo', 'concepto', 'monto', 'fecha', 'proyecto_id', 'cliente_id', 'estado', 'metodo']
  },
  egresos: {
    required: ['concepto', 'monto'],
    fields: ['categoria', 'concepto', 'monto', 'fecha', 'proyecto_id', 'tipo', 'metodo']
  },
  cuentas_por_cobrar: {
    required: ['concepto', 'monto'],
    fields: ['cliente_id', 'proyecto_id', 'concepto', 'monto', 'fecha_emision', 'fecha_vencimiento', 'estado']
  },
  cuentas_bancarias: {
    required: ['banco', 'nombre'],
    fields: ['banco', 'nombre', 'numero', 'moneda', 'saldo_inicial', 'estado']
  },
  empleados: {
    required: ['nombre'],
    fields: ['nombre', 'email', 'telefono', 'cargo', 'departamento', 'salario', 'fecha_ingreso', 'estado', 'tipo_contrato']
  },
  asistencias: {
    required: ['empleado_id', 'fecha'],
    fields: ['empleado_id', 'fecha', 'hora_entrada', 'hora_salida', 'estado', 'observaciones']
  },
  asignaciones_proyecto: {
    required: ['empleado_id', 'proyecto_id'],
    fields: ['empleado_id', 'proyecto_id', 'rol', 'fecha_inicio', 'fecha_fin', 'estado', 'horas_semanales']
  },
  leads: {
    required: ['nombre'],
    fields: ['nombre', 'contacto', 'email', 'telefono', 'origen', 'industria', 'cargo_contacto', 'empleados_estimados', 'tiempo_respuesta_horas', 'ultimo_contacto', 'estado']
  },
  oportunidades: {
    required: ['titulo'],
    fields: ['lead_id', 'cliente_id', 'titulo', 'cliente_potencial', 'monto_estimado', 'etapa', 'origen', 'industria', 'tiempo_respuesta_horas', 'fecha_cierre_estimada']
  },
  pedidos_venta: {
    required: ['numero'],
    fields: ['cliente_id', 'oportunidad_id', 'numero', 'fecha', 'estado', 'total']
  },
  mantenimientos: {
    required: ['descripcion'],
    fields: ['activo_id', 'tipo', 'descripcion', 'fecha', 'costo', 'tecnico', 'estado']
  },
  asignaciones_activos: {
    required: ['activo_id', 'tipo_asignacion', 'ref_id'],
    fields: ['activo_id', 'tipo_asignacion', 'ref_id', 'fecha_asignacion', 'fecha_devolucion', 'estado', 'observaciones']
  },
  notificaciones: {
    required: ['titulo'],
    fields: ['titulo', 'mensaje', 'tipo', 'leida', 'entidad_tipo', 'entidad_id']
  }
};

const FIELD_ALIASES = {
  empresa: 'nombre',
  nombreEmpresa: 'nombre',
  nombre_empresa: 'nombre',
  razonSocial: 'nombre',
  razon_social: 'nombre',
  personaContacto: 'contacto',
  persona_contacto: 'contacto',
  clienteId: 'cliente_id',
  proyectoId: 'proyecto_id',
  proveedorId: 'proveedor_id',
  productoServicioId: 'producto_servicio_id',
  nombreCompra: 'nombre_compra',
  tipoComprobante: 'tipo_comprobante',
  fechaEmision: 'fecha_emision',
  fechaVencimiento: 'fecha_vencimiento',
  precioVenta: 'precio_venta',
  stockActual: 'stock_actual',
  stockMinimo: 'stock_minimo',
  empleadoId: 'empleado_id',
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  cotizacionId: 'cotizacion_id',
  fechaIngreso: 'fecha_ingreso',
  tipoContrato: 'tipo_contrato',
  horaEntrada: 'hora_entrada',
  horaSalida: 'hora_salida',
  horasSemanales: 'horas_semanales',
  leadId: 'lead_id',
  clientePotencial: 'cliente_potencial',
  montoEstimado: 'monto_estimado',
  fechaCierreEstimada: 'fecha_cierre_estimada',
  oportunidadId: 'oportunidad_id',
  almacenId: 'almacen_id',
  activoId: 'activo_id',
  tipoAsignacion: 'tipo_asignacion',
  refId: 'ref_id',
  fechaAsignacion: 'fecha_asignacion',
  fechaDevolucion: 'fecha_devolucion',
  entidadTipo: 'entidad_tipo',
  entidadId: 'entidad_id',
  referenciaTipo: 'referencia_tipo',
  referenciaId: 'referencia_id',
  saldoInicial: 'saldo_inicial',
  cargoContacto: 'cargo_contacto',
  empleadosEstimados: 'empleados_estimados',
  tiempoRespuestaHoras: 'tiempo_respuesta_horas',
  ultimoContacto: 'ultimo_contacto',
  tipoIdentificacion: 'tipo_identificacion',
  dniRuc: 'dni_ruc',
  precioUnitario: 'precio_unitario',
  costoUnitario: 'costo_unitario'
};

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_erp_context',
      description: 'Lee datos actuales de uno o varios modulos del ERP. Usalo antes de responder sobre informacion existente.',
      parameters: {
        type: 'object',
        properties: {
          module: {
            type: 'string',
            description: 'Modulo a consultar. Valores: marketing, proyectos, finanzas, rrhh, logistica, compras, facturacion, caja, ventas, sistema o all.'
          },
          limit: { type: 'number', description: 'Cantidad maxima de registros por tabla, hasta 50.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_erp_record',
      description: 'Crea un registro en una tabla permitida del ERP. Usalo para altas en cualquier modulo operativo: ventas, marketing, proyectos, dinero, RRHH, logistica, compras, facturacion, caja o alertas.',
      parameters: {
        type: 'object',
        required: ['table', 'data'],
        properties: {
          table: {
            type: 'string',
            description: `Tabla destino. Permitidas: ${Object.keys(CREATE_SCHEMAS).join(', ')}`
          },
          data: {
            type: 'object',
            description: 'Campos del registro en formato JSON. Usa snake_case cuando sea posible.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_executive_briefing',
      description: 'Genera un resumen ejecutivo proactivo con cobranzas, riesgos de proyectos y oportunidades comerciales priorizadas.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_module',
      description: 'Navega a un modulo o pestaña especifica del ERP para mostrarle al usuario donde realizar una accion.',
      parameters: {
        type: 'object',
        required: ['module'],
        properties: {
          module: {
            type: 'string',
            description: 'Modulo destino. Valores: home, projects, ventas, contabilidad, rrhh, logistica, assistant, admin.'
          },
          tab: {
            type: 'string',
            description: 'Pestaña opcional dentro del modulo (ej: crm, clientes, cotizaciones, etc.)'
          },
          label: {
            type: 'string',
            description: 'Texto descriptivo para el boton de navegacion (ej: Ir a Clientes)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_form_filling',
      description: 'Muestra un formulario interactivo en el chat para que el usuario ingrese datos de forma comoda.',
      parameters: {
        type: 'object',
        required: ['table', 'title'],
        properties: {
          table: {
            type: 'string',
            description: 'Tabla del ERP para la que se requiere el formulario.'
          },
          title: {
            type: 'string',
            description: 'Titulo del formulario (ej: Nuevo Cliente)'
          },
          initialData: {
            type: 'object',
            description: 'Datos ya conocidos que deben aparecer pre-llenados.'
          }
        }
      }
    }
  }
];

const systemPrompt = `
Eres el Agente de Operaciones de ERPyme. Tu mision es ayudar al usuario a gestionar su empresa de forma proactiva.
Tienes herramientas para:
1. LEER datos: Consulta el ERP antes de responder sobre informacion existente.
2. CREAR registros: Puedes llenar formularios por el usuario (clientes, proyectos, tareas, facturas, etc.).
3. NAVEGAR: Si el usuario pregunta donde esta algo o como llegar a una seccion, usa 'navigate_to_module' para enviarle un acceso directo.
4. FORMULARIOS: Si el usuario quiere crear un registro nuevo (un cliente, una tarea, una factura, etc.), USA OBLIGATORIAMENTE 'request_form_filling' para mostrarle un formulario limpio en el chat. ESTA PROHIBIDO pedir los datos uno por uno por texto.

Reglas:
- Responde en espanol claro y profesional.
- Para crear cualquier registro, utiliza siempre 'request_form_filling'. 
- Si el usuario te da algunos datos en su mensaje inicial, incluyelos en 'initialData' del formulario.
- No inventes datos.
- Si el usuario te pide "ir a" o "donde esta", USA la herramienta de navegacion ademas de tu respuesta de texto.
- SEGURIDAD: Solo puedes ver y reportar datos del usuario actual (user_id). Nunca respondas con informacion que no este explícitamente en el contexto devuelto por tus herramientas para el ID de usuario activo.
- PRIVACIDAD: Si el usuario pregunta por datos de terceros o de "otros usuarios", responde cortesmente que solo tienes acceso a su propia informacion empresarial.

Mapeo de Navegacion (Usa estos valores exactos en 'navigate_to_module'):
- Ventas > Clientes (antes leads): modulo='ventas', pestaña='crm'
- Ventas > Tabla de clientes: modulo='ventas', pestaña='clientes'
- Ventas > Cotizaciones: modulo='ventas', pestaña='cotizaciones'
- Logistica > Proveedores: modulo='logistica', pestaña='proveedores'
- Logistica > Orden de compra: modulo='logistica', pestaña='orden'
- Logistica > Asignaciones: modulo='logistica', pestaña='asignaciones'
- Finanzas > Facturas venta: modulo='contabilidad', pestaña='facturas-venta'
- Finanzas > Facturas compra: modulo='contabilidad', pestaña='facturas-compra'
- Finanzas > Analitica: modulo='contabilidad', pestaña='analitica'
- RRHH > Empleados: modulo='rrhh', pestaña='empleados'
- RRHH > Documentos: modulo='rrhh', pestaña='documentos'
- RRHH > Personal en proyectos: modulo='rrhh', pestaña='asignaciones'
- Proyectos > Lista: modulo='projects', pestaña=''
- Mi Perfil / Salir: modulo='perfil', pestaña=''
`;

const normalizeData = (data) => {
  const normalizeEstadoValue = (value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toLowerCase();
    const estadoMap = {
      activo: 'Activo',
      inactivo: 'Inactivo',
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
      borrador: 'Borrador',
      nuevo: 'Nuevo',
      leido: 'Leido',
      leída: 'Leida',
      leida: 'Leida'
    };
    return estadoMap[normalized] || value.trim();
  };

  return Object.entries(data || {}).reduce((acc, [key, value]) => {
    const normalizedKey = FIELD_ALIASES[key] || key;
    if (value === '' || value === undefined) return acc;
    acc[normalizedKey] = normalizedKey === 'estado' ? normalizeEstadoValue(value) : value;
    return acc;
  }, {});
};

const pickAllowedFields = (table, data) => {
  const schema = CREATE_SCHEMAS[table];
  const normalized = normalizeData(data);
  return schema.fields.reduce((payload, field) => {
    if (normalized[field] !== undefined) payload[field] = normalized[field];
    return payload;
  }, {});
};

const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Usuario no autenticado');
  return data.user;
};

const fetchTable = async (table, userId, limit) => {
  let query = supabase.from(table).select('*').limit(limit);
  if (!TABLES_WITHOUT_USER_FILTER.has(table)) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) return { table, error: error.message, rows: [] };
  return { table, rows: data || [] };
};

const getErpContext = async ({ module = 'all', limit = 12 }) => {
  const user = await getCurrentUser();
  const normalizedLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const modules = module === 'all' ? Object.keys(MODULE_TABLES) : [module];
  const tables = modules.flatMap(key => MODULE_TABLES[key] || []);
  const uniqueTables = [...new Set(tables)];

  const results = await Promise.all(uniqueTables.map(table => fetchTable(table, user.id, normalizedLimit)));
  return { modules, results };
};

const getExecutiveSummary = async () => {
  const user = await getCurrentUser();
  return generateExecutiveSummary(user.id);
};

const isReadRequest = (content) => {
  const text = content.toLowerCase();
  return /(ver|mostrar|listar|lista|todos|registrados|actualmente|cuales|cuáles|cuantos|cuántos|consultar|dime|revisar)/.test(text);
};

const findReadTarget = (content) => {
  const text = content.toLowerCase();
  if (!isReadRequest(text)) return null;
  return READ_TARGETS.find(target => target.patterns.some(pattern => text.includes(pattern)));
};

const formatRecordTitle = (record) => {
  return record.nombre
    || record.titulo
    || record.asunto
    || record.concepto
    || record.nombre_compra
    || record.numero
    || record.email
    || `ID ${record.id}`;
};

const formatRecord = (record, index) => {
  const hiddenFields = new Set(['id', 'empresa_id', 'user_id', 'created_at', 'updated_at']);
  const titleFields = new Set(['nombre', 'titulo', 'asunto', 'concepto', 'nombre_compra', 'numero']);
  const parts = [`${index + 1}. ${formatRecordTitle(record)}`];

  Object.entries(record).forEach(([key, value]) => {
    if (hiddenFields.has(key) || titleFields.has(key) || value === null || value === undefined || value === '') return;
    if (parts.length >= 7) return;
    parts.push(`${key}: ${value}`);
  });

  return parts.join(' | ');
};

const answerReadTarget = async (target) => {
  const user = await getCurrentUser();
  const result = await fetchTable(target.table, user.id, 50);

  if (result.error) {
    throw new Error(`No pude verificar ${target.label}: ${result.error}`);
  }

  const rows = result.rows || [];
  if (rows.length === 0) {
    return `Verifique la tabla de ${target.label} y no hay registros para tu usuario actual.`;
  }

  return `Tienes ${rows.length} registro${rows.length === 1 ? '' : 's'} en ${target.label}:\n\n${rows.map(formatRecord).join('\n')}`;
};

const addDefaultValues = (table, payload, fields) => {
  const today = new Date().toISOString().split('T')[0];
  if (fields.includes('fecha') && !payload.fecha) payload.fecha = today;
  if (fields.includes('fecha_emision') && !payload.fecha_emision) payload.fecha_emision = today;
  if (fields.includes('fecha_inicio') && !payload.fecha_inicio) payload.fecha_inicio = today;
  if (table === 'cotizaciones' && !payload.estado) payload.estado = 'Pendiente';
  if (table === 'proveedores' && !payload.estado) payload.estado = 'Activo';
  if (table === 'clientes' && !payload.estado) payload.estado = 'Activo';
  if (table === 'clientes' && !payload.tipo_identificacion) payload.tipo_identificacion = 'DNI';
  if (table === 'productos_servicios' && !payload.tipo) payload.tipo = 'Producto';
  if (table === 'productos_servicios' && !payload.unidad) payload.unidad = 'UND';
  if (table === 'facturas' && !payload.serie) payload.serie = 'F001';
  if (table === 'facturas' && !payload.tipo_comprobante) payload.tipo_comprobante = 'Factura';
  if (table === 'facturas' && !payload.estado) payload.estado = 'Borrador';
  if (table === 'facturas' && !payload.moneda) payload.moneda = 'PEN';
  if (table === 'tareas' && !payload.estado) payload.estado = 'Pendiente';
  if (table === 'tareas' && !payload.prioridad) payload.prioridad = 'Media';
  if (table === 'leads' && !payload.estado) payload.estado = 'Nuevo';
  if (table === 'oportunidades' && !payload.etapa) payload.etapa = 'Prospeccion';
  if (table === 'pedidos_venta' && !payload.estado) payload.estado = 'Pendiente';
  if (table === 'movimientos_inventario' && !payload.tipo) payload.tipo = 'Entrada';
  if (table === 'notificaciones' && !payload.tipo) payload.tipo = 'Info';
  if (table === 'notificaciones' && payload.leida === undefined) payload.leida = false;
  return payload;
};

export const getOptions = async (table, userId) => {
  try {
    let query = supabase.from(table).select('id, nombre, titulo, numero').limit(50);
    if (userId && !TABLES_WITHOUT_USER_FILTER.has(table)) query = query.eq('user_id', userId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(item => ({
      id: item.id,
      label: item.nombre || item.titulo || item.numero || item.id
    }));
  } catch (err) {
    console.error(`Error fetching options for ${table}:`, err);
    return [];
  }
};

export const createErpRecord = async ({ table, data }) => {
  const user = await getCurrentUser();
  const schema = CREATE_SCHEMAS[table];
  if (!schema) throw new Error(`No puedo crear registros en ${table}`);

  const providedPayload = pickAllowedFields(table, data);
  const isEmpty = (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  };

  const missing = schema.required.filter(field => isEmpty(providedPayload[field]));
  if (missing.length > 0) {
    return {
      created: false,
      table,
      missing,
      message: `Faltan campos obligatorios para crear en ${table}: ${missing.join(', ')}`
    };
  }

  const payload = addDefaultValues(table, providedPayload, schema.fields);

  const { data: created, error } = await supabase
    .from(table)
    .insert([{ ...payload, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return { created: true, table, record: created };
};

const executeToolCall = async (toolCall) => {
  const { name } = toolCall.function || {};
  const rawArgs = toolCall.function?.arguments || {};
  const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs;
  if (name === 'get_erp_context') return getErpContext(args);
  if (name === 'create_erp_record') return createErpRecord(args);
  if (name === 'get_executive_briefing') return getExecutiveSummary();
  if (name === 'navigate_to_module') return { status: 'ready_to_navigate', ...args };
  if (name === 'request_form_filling') return { status: 'show_form', ...args, fields: CREATE_SCHEMAS[args.table] };
  throw new Error(`Herramienta no soportada: ${name}`);
};

const callGroq = async (messages) => {
  const { data, error } = await supabase.functions.invoke('groq-chat', {
    body: {
      model: DEFAULT_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2
    }
  });

  if (error) {
    console.error('Error invocando la función groq-chat de Supabase:', error);
    let details = error.message || 'No se pudo invocar la Edge Function.';

    if (error.context instanceof Response) {
      try {
        const payload = await error.context.clone().json();
        details = payload.error || payload.message || JSON.stringify(payload);
      } catch {
        try {
          details = await error.context.clone().text();
        } catch {
          details = error.message || details;
        }
      }
    }

    throw new Error(`Error en el asistente (Edge Function): ${details}`);
  }

  return data;
};

export const sendAssistantMessage = async (history, userContent) => {
  const readTarget = findReadTarget(userContent);
  if (readTarget) {
    const content = await answerReadTarget(readTarget);
    return { content };
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(message => ({ role: message.role, content: message.content })),
    { role: 'user', content: userContent }
  ];

  let response = await callGroq(messages);
  let assistantMessage = response.choices?.[0]?.message;
  let lastNavigation = null;
  let lastForm = null;

  for (let round = 0; round < 3 && assistantMessage?.tool_calls?.length; round += 1) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeToolCall(toolCall);
      if (result?.status === 'ready_to_navigate') {
        lastNavigation = { module: result.module, tab: result.tab, label: result.label };
      }
      if (result?.status === 'show_form') {
        lastForm = { table: result.table, title: result.title, initialData: result.initialData, schema: result.fields };
      }
      
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    response = await callGroq(messages);
    assistantMessage = response.choices?.[0]?.message;
  }

  return {
    content: assistantMessage?.content || 'Listo, procese la solicitud.',
    navigation: lastNavigation,
    form: lastForm
  };
};

export const assistantConfig = {
  model: DEFAULT_MODEL,
  tables: MODULE_TABLES,
  scoreOpportunity
};
