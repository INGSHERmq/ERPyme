export const MODULE_CONFIG = {
  ventas: {
    title: 'Ventas y cobranza',
    eyebrow: 'Seguimiento comercial',
    summary: 'Da seguimiento desde el primer contacto hasta el pedido, la factura y el cobro. Las cotizaciones se crean en Clientes y cotizaciones.',
    primaryAction: 'Nuevo contacto',
    secondaryAction: 'Ver oportunidades',
    metrics: [
      { label: 'Contactos activos', value: '0' },
      { label: 'Oportunidades', value: '0' },
      { label: 'Ventas logradas', value: '0%' },
      { label: 'Cobranza pendiente', value: 'S/ 0' }
    ],
    workflow: [
      'Contacto registrado',
      'Oportunidad calificada',
      'Pedido o proyecto confirmado',
      'Factura y cobranza'
    ],
    tables: [
      'leads',
      'oportunidades',
      'pedidos_venta',
      'facturas',
      'historial_cliente'
    ],
    primaryResource: 'leads',
    secondaryResource: 'oportunidades',
    tutorial: [
      'Registra primero un contacto con nombre, datos de contacto y origen.',
      'Convierte el contacto en oportunidad cuando exista interes real.',
      'Cuando una cotizacion sea aceptada, continua aqui con el pedido, factura y cobro.',
      'Revisa el historial del cliente antes de hacer seguimiento.'
    ],
    resources: {
      leads: {
        title: 'Contactos nuevos',
        table: 'leads',
        description: 'Personas o empresas que aun estas conociendo.',
        titleField: 'nombre',
        fields: [
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'contacto', label: 'Contacto' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'telefono', label: 'Telefono' },
          { name: 'origen', label: 'Origen' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Nuevo', 'Contactado', 'Calificado', 'Perdido'] }
        ]
      },
      oportunidades: {
        title: 'Oportunidades',
        table: 'oportunidades',
        description: 'Ventas posibles ordenadas por avance.',
        titleField: 'titulo',
        fields: [
          { name: 'titulo', label: 'Titulo', required: true },
          { name: 'cliente_potencial', label: 'Cliente potencial' },
          { name: 'monto_estimado', label: 'Monto estimado', type: 'number' },
          { name: 'etapa', label: 'Avance', type: 'select', options: ['Nuevo contacto', 'Interesado', 'Propuesta', 'Negociando', 'Ganada', 'Perdida'] },
          { name: 'fecha_cierre_estimada', label: 'Cierre estimado', type: 'date' }
        ]
      }
    }
  },
  compras: {
    title: 'Compras y proveedores',
    eyebrow: 'Compras',
    summary: 'Organiza proveedores, compras solicitadas, recepcion de productos o servicios y gastos de compra.',
    primaryAction: 'Nuevo proveedor',
    secondaryAction: 'Ver compras',
    metrics: [
      { label: 'Proveedores activos', value: '0' },
      { label: 'Compras abiertas', value: '0' },
      { label: 'Pendientes de recibir', value: '0' },
      { label: 'Gasto del mes', value: 'S/ 0' }
    ],
    workflow: [
      'Proveedor registrado',
      'Compra solicitada',
      'Producto o servicio recibido',
      'Gasto registrado',
      'Historial actualizado'
    ],
    tables: [
      'proveedores',
      'ordenes_compra',
      'orden_compra_items',
      'egresos',
      'productos_servicios'
    ],
    primaryResource: 'proveedores',
    secondaryResource: 'ordenes',
    tutorial: [
      'Crea tus proveedores con datos de contacto y RUC.',
      'Registra una compra cuando necesites adquirir productos o servicios.',
      'Cuando recibas la compra, cambia el estado y registra el gasto relacionado.',
      'Consulta el historial antes de volver a comprar.'
    ],
    resources: {
      proveedores: {
        title: 'Proveedores',
        table: 'proveedores',
        description: 'Directorio de proveedores activos.',
        titleField: 'nombre',
        fields: [
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'ruc', label: 'RUC' },
          { name: 'contacto', label: 'Contacto' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'telefono', label: 'Telefono' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] }
        ]
      },
      ordenes: {
        title: 'Compras',
        table: 'ordenes_compra',
        description: 'Compras solicitadas y pendientes de recibir.',
        titleField: 'nombre_compra',
        fields: [
          { name: 'nombre_compra', label: 'Producto o servicio comprado', required: true },
          { name: 'numero', label: 'Numero', required: true },
          { name: 'fecha', label: 'Fecha', type: 'date' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Borrador', 'Enviada', 'Recibida', 'Cancelada'] },
          { name: 'total', label: 'Total', type: 'number' },
          { name: 'observaciones', label: 'Observaciones' }
        ]
      }
    }
  },
  facturacion: {
    title: 'Facturas y comprobantes',
    eyebrow: 'Documentos de venta',
    summary: 'Prepara facturas, boletas y recibos. El seguimiento de cobro se revisa en Dinero y Caja y bancos.',
    primaryAction: 'Nueva factura',
    secondaryAction: 'Ver comprobantes',
    metrics: [
      { label: 'Facturas emitidas', value: '0' },
      { label: 'Pendientes de pago', value: '0' },
      { label: 'Total facturado', value: 'S/ 0' },
      { label: 'Anuladas', value: '0' }
    ],
    workflow: [
      'Documento borrador',
      'Detalle y cliente',
      'Numero asignado',
      'Comprobante listo',
      'Cobro enviado a dinero'
    ],
    tables: [
      'facturas',
      'factura_items',
      'cuentas_por_cobrar',
      'clientes',
      'empresas'
    ],
    primaryResource: 'facturas',
    secondaryResource: 'facturas',
    tutorial: [
      'Crea el comprobante con serie, numero, cliente y monto.',
      'Usa el estado Borrador mientras preparas el documento.',
      'Al emitirlo, revisa el cobro pendiente en Dinero.',
      'Descarga o imprime el comprobante cuando conectemos documentos.'
    ],
    resources: {
      facturas: {
        title: 'Comprobantes',
        table: 'facturas',
        description: 'Facturas, boletas, recibos y notas.',
        titleField: 'asunto',
        fields: [
          { name: 'asunto', label: 'Asunto de la factura', required: true },
          { name: 'serie', label: 'Serie', required: true },
          { name: 'numero', label: 'Numero', required: true },
          { name: 'tipo_comprobante', label: 'Documento', type: 'select', options: ['Factura', 'Boleta', 'Nota de credito', 'Recibo'] },
          { name: 'fecha_emision', label: 'Fecha', type: 'date' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Borrador', 'Emitida', 'Pagada', 'Anulada', 'Vencida'] },
          { name: 'total', label: 'Total', type: 'number' }
        ]
      }
    }
  },
  inventario: {
    title: 'Productos e inventario',
    eyebrow: 'Productos y almacenes',
    summary: 'Controla productos, existencias, entradas, salidas, alertas y valor del inventario. Los equipos de trabajo se controlan en Logistica.',
    primaryAction: 'Nuevo producto',
    secondaryAction: 'Registrar movimiento',
    metrics: [
      { label: 'Productos', value: '0' },
      { label: 'Existencias bajas', value: '0' },
      { label: 'Valor inventario', value: 'S/ 0' },
      { label: 'Movimientos hoy', value: '0' }
    ],
    workflow: [
      'Producto registrado',
      'Ingreso al almacen',
      'Salida por venta/proyecto',
      'Movimiento registrado',
      'Alerta si queda poco'
    ],
    tables: [
      'productos_servicios',
      'almacenes',
      'movimientos_inventario',
      'orden_compra_items',
      'factura_items'
    ],
    primaryResource: 'productos',
    secondaryResource: 'movimientos',
    tutorial: [
      'Registra productos o servicios con precio, costo y unidad.',
      'Define una cantidad minima para activar alertas.',
      'Registra entradas y salidas para saber que hay en almacen.',
      'Revisa el valor del inventario antes de comprar mas stock.'
    ],
    resources: {
      productos: {
        title: 'Productos y servicios',
        table: 'productos_servicios',
        description: 'Lista de productos y servicios que vendes o usas.',
        titleField: 'nombre',
        fields: [
          { name: 'codigo', label: 'Codigo' },
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['Producto', 'Servicio'] },
          { name: 'unidad', label: 'Unidad' },
          { name: 'precio_venta', label: 'Precio venta', type: 'number' },
          { name: 'costo', label: 'Costo', type: 'number' },
          { name: 'stock_actual', label: 'Cantidad actual', type: 'number' },
          { name: 'stock_minimo', label: 'Cantidad minima', type: 'number' }
        ]
      },
      movimientos: {
        title: 'Entradas y salidas',
        table: 'movimientos_inventario',
        description: 'Cambios de cantidad en almacen.',
        titleField: 'concepto',
        fields: [
          { name: 'concepto', label: 'Concepto', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['Entrada', 'Salida', 'Ajuste'] },
          { name: 'cantidad', label: 'Cantidad', type: 'number' },
          { name: 'fecha', label: 'Fecha', type: 'date' }
        ]
      }
    }
  },
  caja: {
    title: 'Caja y bancos',
    eyebrow: 'Caja y bancos',
    summary: 'Administra cuentas bancarias, caja chica y saldos iniciales. Los ingresos, egresos y cobros se registran en Dinero.',
    primaryAction: 'Nueva cuenta',
    secondaryAction: 'Ver cuentas',
    metrics: [
      { label: 'Saldo caja', value: 'S/ 0' },
      { label: 'Bancos', value: '0' },
      { label: 'Por revisar', value: '0' },
      { label: 'Vencido', value: 'S/ 0' }
    ],
    workflow: [
      'Cuenta bancaria',
      'Caja chica',
      'Saldo inicial',
      'Revision con banco',
      'Conciliacion desde Dinero'
    ],
    tables: [
      'cuentas_bancarias',
      'ingresos',
      'egresos',
      'cuentas_por_cobrar'
    ],
    primaryResource: 'cuentas',
    secondaryResource: 'cuentas',
    tutorial: [
      'Registra tus cuentas bancarias o caja chica.',
      'Define moneda y saldo inicial para tener una base de control.',
      'Registra ingresos, egresos y cuentas por cobrar desde Dinero.',
      'Usa esta pantalla para revisar las cuentas donde se mueve el dinero.'
    ],
    resources: {
      cuentas: {
        title: 'Cuentas bancarias',
        table: 'cuentas_bancarias',
        description: 'Cuentas y caja chica para organizar donde se recibe o paga dinero.',
        titleField: 'nombre',
        fields: [
          { name: 'banco', label: 'Banco', required: true },
          { name: 'nombre', label: 'Nombre de cuenta', required: true },
          { name: 'numero', label: 'Numero' },
          { name: 'moneda', label: 'Moneda' },
          { name: 'saldo_inicial', label: 'Saldo inicial', type: 'number' }
        ]
      }
    }
  },
  reportes: {
    title: 'Reportes',
    eyebrow: 'Resumen del negocio',
    summary: 'Muestra en un solo lugar como van las ventas, gastos, caja y proyectos. Los permisos se revisan en Usuarios y permisos.',
    primaryAction: 'Actualizar reporte',
    secondaryAction: 'Exportar PDF',
    metrics: [
      { label: 'Ventas mes', value: 'S/ 0' },
      { label: 'Ganancia estimada', value: '0%' },
      { label: 'Caja disponible', value: 'S/ 0' },
      { label: 'Proyectos atrasados', value: '0' }
    ],
    workflow: [
      'Datos por area',
      'Resumen claro',
      'Filtros por fecha',
      'Ganancia',
      'Exportacion'
    ],
    tables: [
      'v_finanzas_resumen',
      'facturas',
      'proyectos',
      'movimientos_caja',
      'cuentas_por_cobrar'
    ],
    primaryResource: 'resumen',
    secondaryResource: 'resumen',
    tutorial: [
      'Usa esta pantalla para revisar como va el negocio.',
      'Filtra por fechas cuando conectemos reportes avanzados.',
      'Cruza ventas, egresos, cobranza y proyectos.',
      'Exporta los resultados para reuniones.'
    ],
    resources: {
      resumen: {
        title: 'Resumen financiero',
        table: 'v_finanzas_resumen',
        description: 'Resumen general de dinero, ventas y proyectos.',
        readOnly: true,
        titleField: 'empresa_id',
        fields: []
      }
    }
  },
  auditoria: {
    title: 'Usuarios y permisos',
    eyebrow: 'Accesos',
    summary: 'Define quienes usan el sistema, que puede hacer cada persona y revisa cambios importantes.',
    primaryAction: 'Invitar usuario',
    secondaryAction: 'Ver cambios',
    metrics: [
      { label: 'Usuarios', value: '0' },
      { label: 'Permisos activos', value: '0' },
      { label: 'Cambios revisados', value: '0' },
      { label: 'Alertas de acceso', value: '0' }
    ],
    workflow: [
      'Empresa',
      'Usuario invitado',
      'Permiso asignado',
      'Acceso por area',
      'Cambio registrado'
    ],
    tables: [
      'empresas',
      'empresa_usuarios',
      'profiles',
      'auditoria_eventos',
      'notificaciones'
    ],
    primaryResource: 'usuarios',
    secondaryResource: 'auditoria',
    tutorial: [
      'Invita usuarios y asignales permisos segun su responsabilidad.',
      'Los permisos limitan lo que cada persona puede consultar o modificar.',
      'Revisa cambios para saber quien modifico informacion importante.',
      'Desactiva usuarios que ya no trabajen en la empresa.'
    ],
    resources: {
      usuarios: {
        title: 'Usuarios de empresa',
        table: 'empresa_usuarios',
        description: 'Personas con acceso y sus permisos.',
        titleField: 'rol',
        fields: [
          { name: 'user_id', label: 'Codigo de usuario', required: true },
          { name: 'empresa_id', label: 'Codigo de empresa', required: true },
          { name: 'rol', label: 'Permiso', type: 'select', options: ['owner', 'admin', 'manager', 'ventas', 'finanzas', 'rrhh', 'logistica', 'user'] },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Invitado', 'Inactivo'] }
        ]
      },
      auditoria: {
        title: 'Cambios recientes',
        table: 'auditoria_eventos',
        description: 'Historial de cambios importantes.',
        readOnly: true,
        titleField: 'tabla',
        fields: []
      }
    }
  },
  documentos: {
    title: 'Archivos',
    eyebrow: 'Documentos guardados',
    summary: 'Guarda contratos, comprobantes, cotizaciones firmadas, guias, fotos de equipos y certificados.',
    primaryAction: 'Subir archivo',
    secondaryAction: 'Ver archivos',
    metrics: [
      { label: 'Archivos', value: '0' },
      { label: 'Contratos', value: '0' },
      { label: 'Comprobantes', value: '0' },
      { label: 'Pendientes', value: '0' }
    ],
    workflow: [
      'Archivo cargado',
      'Relacionado con un registro',
      'Datos del archivo revisados',
      'Permisos aplicados',
      'Busqueda rapida'
    ],
    tables: [
      'adjuntos',
      'facturas',
      'guias_salida',
      'activos',
      'empleados'
    ],
    primaryResource: 'adjuntos',
    secondaryResource: 'adjuntos',
    tutorial: [
      'Sube o registra documentos importantes por cada area.',
      'Relaciona cada archivo con cliente, factura, equipo o empleado.',
      'Usa nombres claros para encontrar documentos rapido.',
      'Luego conectaremos la subida de archivos reales.'
    ],
    resources: {
      adjuntos: {
        title: 'Archivos',
        table: 'adjuntos',
        description: 'Documentos guardados y relacionados.',
        titleField: 'nombre_archivo',
        fields: [
          { name: 'entidad_tipo', label: 'Relacionado con', required: true },
          { name: 'entidad_id', label: 'Codigo relacionado', type: 'number', required: true },
          { name: 'nombre_archivo', label: 'Nombre del archivo', required: true },
          { name: 'storage_path', label: 'Ubicacion del archivo', required: true },
          { name: 'mime_type', label: 'Tipo de archivo' }
        ]
      }
    }
  },
  notificaciones: {
    title: 'Alertas',
    eyebrow: 'Avisos importantes',
    summary: 'Centraliza cuentas vencidas, mantenimientos pendientes, tareas atrasadas, contratos por vencer y stock bajo.',
    primaryAction: 'Crear alerta',
    secondaryAction: 'Ver alertas',
    metrics: [
      { label: 'No leidas', value: '0' },
      { label: 'Vencimientos', value: '0' },
      { label: 'Stock bajo', value: '0' },
      { label: 'Seguimientos', value: '0' }
    ],
    workflow: [
      'Alerta creada',
      'Situacion detectada',
      'Aviso enviado',
      'Usuario responsable',
      'Seguimiento cerrado'
    ],
    tables: [
      'notificaciones',
      'cuentas_por_cobrar',
      'mantenimientos',
      'tareas',
      'productos_servicios'
    ],
    primaryResource: 'notificaciones',
    secondaryResource: 'notificaciones',
    tutorial: [
      'Crea alertas para vencimientos o tareas importantes.',
      'Asigna cada alerta a un usuario responsable.',
      'Marca como leida cuando el seguimiento termine.',
      'Usa tipos para diferenciar vencimientos, sistema e informacion.'
    ],
    resources: {
      notificaciones: {
        title: 'Lista de alertas',
        table: 'notificaciones',
        description: 'Alertas y seguimientos.',
        titleField: 'titulo',
        fields: [
          { name: 'titulo', label: 'Titulo', required: true },
          { name: 'mensaje', label: 'Mensaje' },
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['Info', 'Alerta', 'Vencimiento', 'Sistema'] },
          { name: 'entidad_tipo', label: 'Relacionado con' },
          { name: 'entidad_id', label: 'Codigo relacionado', type: 'number' }
        ]
      }
    }
  },
  importacion: {
    title: 'Importar y exportar',
    eyebrow: 'Excel y CSV',
    summary: 'Carga o descarga informacion de clientes, productos, empleados, ingresos, gastos y plantillas.',
    primaryAction: 'Importar archivo',
    secondaryAction: 'Descargar plantilla',
    metrics: [
      { label: 'Plantillas', value: '6' },
      { label: 'Cargas realizadas', value: '0' },
      { label: 'Errores', value: '0' },
      { label: 'Descargas', value: '0' }
    ],
    workflow: [
      'Plantilla descargada',
      'Archivo cargado',
      'Revision',
      'Vista previa',
      'Informacion cargada'
    ],
    tables: [
      'clientes',
      'productos_servicios',
      'empleados',
      'ingresos',
      'egresos'
    ],
    primaryResource: 'importar',
    secondaryResource: 'plantillas',
    tutorial: [
      'Descarga la plantilla del area que quieres cargar.',
      'Llena las columnas obligatorias sin cambiar los encabezados.',
      'Sube el archivo y revisa la vista previa.',
      'Corrige errores antes de confirmar la carga.'
    ],
    resources: {
      importar: {
        title: 'Importaciones',
        table: 'adjuntos',
        description: 'Archivos cargados al sistema.',
        titleField: 'nombre_archivo',
        fields: [
          { name: 'entidad_tipo', label: 'Area', required: true },
          { name: 'entidad_id', label: 'Codigo de carga', type: 'number', required: true },
          { name: 'nombre_archivo', label: 'Archivo', required: true },
          { name: 'storage_path', label: 'Ubicacion temporal', required: true },
          { name: 'mime_type', label: 'Tipo de archivo' }
        ]
      },
      plantillas: {
        title: 'Plantillas disponibles',
        table: 'adjuntos',
        description: 'Plantillas listas para descargar.',
        titleField: 'nombre_archivo',
        fields: [
          { name: 'entidad_tipo', label: 'Area', required: true },
          { name: 'entidad_id', label: 'Codigo de referencia', type: 'number', required: true },
          { name: 'nombre_archivo', label: 'Nombre plantilla', required: true },
          { name: 'storage_path', label: 'Ubicacion de plantilla', required: true }
        ]
      }
    }
  }
};
