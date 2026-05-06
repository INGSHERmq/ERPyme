import { supabase } from '../../lib/supabase';

const DEFAULT_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_CHAT_URL = import.meta.env.VITE_GROQ_URL || '/groq/openai/v1/chat/completions';

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

const TABLES_WITHOUT_USER_FILTER = new Set(['cuentas_bancarias', 'almacenes']);

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
    fields: ['nombre', 'contacto', 'email', 'telefono', 'estado', 'industria']
  },
  cotizaciones: {
    required: ['titulo', 'monto'],
    fields: ['cliente_id', 'proyecto_id', 'titulo', 'monto', 'estado', 'fecha', 'descripcion', 'validez']
  },
  proveedores: {
    required: ['nombre'],
    fields: ['nombre', 'ruc', 'contacto', 'email', 'telefono', 'direccion', 'estado']
  },
  ordenes_compra: {
    required: ['nombre_compra', 'numero'],
    fields: ['proveedor_id', 'nombre_compra', 'numero', 'fecha', 'estado', 'subtotal', 'impuesto', 'total', 'observaciones']
  },
  facturas: {
    required: ['asunto', 'numero'],
    fields: ['cliente_id', 'proyecto_id', 'asunto', 'serie', 'numero', 'tipo_comprobante', 'fecha_emision', 'fecha_vencimiento', 'estado', 'subtotal', 'impuesto', 'total', 'moneda', 'observaciones']
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
    fields: ['nombre', 'contacto', 'email', 'telefono', 'origen', 'estado']
  },
  oportunidades: {
    required: ['titulo'],
    fields: ['lead_id', 'cliente_id', 'titulo', 'cliente_potencial', 'monto_estimado', 'etapa', 'fecha_cierre_estimada']
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
  saldoInicial: 'saldo_inicial'
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
  }
];

const systemPrompt = `
Eres el asistente interno de ERPyme. Responde en espanol claro y breve.
Tienes herramientas para leer datos y crear registros reales en Supabase.
Antes de crear un registro valida que existan los campos requeridos. Si falta informacion importante, pide solo lo faltante.
No inventes datos existentes: consulta el ERP cuando la pregunta dependa de registros.
Si una herramienta devuelve error o no fue llamada, no digas que no existen registros. Informa que no pudiste verificar.
Cuando crees algo, resume que tabla se afecto y los datos principales.
`;

const normalizeData = (data) => {
  return Object.entries(data || {}).reduce((acc, [key, value]) => {
    const normalizedKey = FIELD_ALIASES[key] || key;
    if (value === '' || value === undefined) return acc;
    acc[normalizedKey] = value;
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
  if (table === 'productos_servicios' && !payload.tipo) payload.tipo = 'Producto';
  if (table === 'productos_servicios' && !payload.unidad) payload.unidad = 'UND';
  if (table === 'facturas' && !payload.serie) payload.serie = 'F001';
  if (table === 'facturas' && !payload.tipo_comprobante) payload.tipo_comprobante = 'Factura';
  if (table === 'facturas' && !payload.estado) payload.estado = 'Borrador';
  if (table === 'facturas' && !payload.moneda) payload.moneda = 'PEN';
  if (table === 'tareas' && !payload.estado) payload.estado = 'Pendiente';
  if (table === 'tareas' && !payload.prioridad) payload.prioridad = 'Media';
  if (table === 'leads' && !payload.estado) payload.estado = 'Nuevo';
  if (table === 'pedidos_venta' && !payload.estado) payload.estado = 'Pendiente';
  if (table === 'movimientos_inventario' && !payload.tipo) payload.tipo = 'Entrada';
  if (table === 'notificaciones' && !payload.tipo) payload.tipo = 'Info';
  if (table === 'notificaciones' && payload.leida === undefined) payload.leida = false;
  return payload;
};

const createErpRecord = async ({ table, data }) => {
  const user = await getCurrentUser();
  const schema = CREATE_SCHEMAS[table];
  if (!schema) throw new Error(`No puedo crear registros en ${table}`);

  const payload = addDefaultValues(table, pickAllowedFields(table, data), schema.fields);
  const missing = schema.required.filter(field => payload[field] === undefined || payload[field] === '');
  if (missing.length > 0) {
    return { created: false, table, missing, message: `Faltan campos requeridos: ${missing.join(', ')}` };
  }

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
  throw new Error(`Herramienta no soportada: ${name}`);
};

const callGroq = async (messages) => {
  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq no respondio correctamente: ${errorText || response.status}`);
  }

  return response.json();
};

export const sendAssistantMessage = async (history, userContent) => {
  const readTarget = findReadTarget(userContent);
  if (readTarget) {
    return answerReadTarget(readTarget);
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(message => ({ role: message.role, content: message.content })),
    { role: 'user', content: userContent }
  ];

  let response = await callGroq(messages);
  let assistantMessage = response.choices?.[0]?.message;

  for (let round = 0; round < 3 && assistantMessage?.tool_calls?.length; round += 1) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeToolCall(toolCall);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    response = await callGroq(messages);
    assistantMessage = response.choices?.[0]?.message;
  }

  return assistantMessage?.content || 'Listo, procese la solicitud.';
};

export const assistantConfig = {
  model: DEFAULT_MODEL,
  tables: MODULE_TABLES
};
