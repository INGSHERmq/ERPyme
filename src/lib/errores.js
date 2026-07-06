const NOMBRES_CAMPOS = {
  fecha: 'fecha',
  fecha_inicio: 'fecha de inicio',
  fecha_fin: 'fecha de fin',
  fecha_ingreso: 'fecha de ingreso',
  fecha_nacimiento: 'fecha de nacimiento',
  fecha_emision: 'fecha de emisión',
  fecha_vencimiento: 'fecha de vencimiento',
  fecha_compra: 'fecha de compra',
  fecha_asignacion: 'fecha de asignación',
  fecha_devolucion: 'fecha de devolución',
  fecha_salida: 'fecha de salida',
  fecha_regreso: 'fecha de regreso',
  fecha_reporte: 'fecha de reporte',
  fecha_limite: 'fecha límite',
  nombre: 'nombre',
  descripcion: 'descripción',
  monto: 'monto',
  total: 'total',
  subtotal: 'subtotal',
  email: 'correo electrónico',
  telefono: 'teléfono',
  direccion: 'dirección',
  concepto: 'concepto',
  cantidad: 'cantidad',
  costo_unitario: 'costo unitario',
  precio_total: 'precio total',
  estado: 'estado',
  tipo: 'tipo',
  serie: 'serie',
  correlativo: 'correlativo',
  numero: 'número',
  proveedor_id: 'proveedor',
  cliente_id: 'cliente',
  proyecto_id: 'proyecto',
  empleado_id: 'empleado',
  activo_id: 'activo',
  user_id: 'usuario',
  empresa_id: 'empresa',
  rol: 'rol',
  horas_semanales: 'horas semanales',
  prioridad: 'prioridad',
  progreso: 'progreso',
  destino: 'destino',
  responsable: 'responsable',
};

const ERRORES_POR_CODIGO = {
  '22P02': 'El formato de un campo no es válido. Revisa que las fechas y números estén correctos.',
  '22007': 'El formato de la fecha no es válido.',
  '23505': 'Este registro ya existe. No pueden haber duplicados.',
  '23503': 'El valor seleccionado no es válido o el registro relacionado no existe.',
  '23502': 'Un campo obligatorio está vacío. Completa todos los campos requeridos.',
  '42P01': 'Error interno del sistema. Contacta al soporte técnico.',
  '42703': 'Error interno del sistema. Contacta al soporte técnico.',
  '42501': 'No tienes permisos para realizar esta acción.',
};

const PATRONES_ERROR = [
  {
    patron: /invalid input syntax for type date:\s*"([^"]*)"/i,
    mensaje: (match) => {
      const valor = match[1];
      if (valor === '') {
        return 'Una fecha obligatoria no fue ingresada. Revisa que todas las fechas estén llenas.';
      }
      return `"${valor}" no es una fecha válida. Usa el formato AAAA-MM-DD.`;
    }
  },
  {
    patron: /invalid input syntax for type date/i,
    mensaje: 'Una o más fechas no son válidas. Asegúrate de llenar todos los campos de fecha correctamente.'
  },
  {
    patron: /invalid input syntax for type timestamp/i,
    mensaje: 'Una o más fechas no son válidas. Asegúrate de llenar todos los campos de fecha correctamente.'
  },
  {
    patron: /invalid input syntax for type numeric/i,
    mensaje: 'El valor ingresado no es un número válido.'
  },
  {
    patron: /invalid input syntax for type/i,
    mensaje: 'El valor ingresado no es válido para este campo.'
  },
  {
    patron: /null value in column "(\w+)".*not-null/i,
    mensaje: (match) => {
      const campo = match[1];
      const nombreCampo = NOMBRES_CAMPOS[campo] || campo.replace(/_/g, ' ');
      return `El campo "${nombreCampo}" es obligatorio. Complétalo para continuar.`;
    }
  },
  {
    patron: /duplicate key value violates unique constraint/i,
    mensaje: 'Este valor ya existe en el sistema. Debe ser único.'
  },
  {
    patron: /insert or update on table "(\w+)" violates foreign key constraint/i,
    mensaje: 'El valor seleccionado no es válido o el registro relacionado no existe.'
  },
  {
    patron: /violates check constraint/i,
    mensaje: 'El valor ingresado no cumple con las reglas del sistema.'
  },
  {
    patron: /value too long for type/i,
    mensaje: 'El texto ingresado es demasiado largo. Redúcelo por favor.'
  },
  {
    patron: /new row violates row-level security/i,
    mensaje: 'No tienes permiso para realizar esta operación.'
  },
  {
    patron: /network error/i,
    mensaje: 'Error de conexión. Verifica tu internet e intenta de nuevo.'
  },
  {
    patron: /failed to fetch/i,
    mensaje: 'Error de conexión. Verifica tu internet e intenta de nuevo.'
  },
  {
    patron: /timeout/i,
    mensaje: 'La operación tardó demasiado. Intenta de nuevo.'
  },
  {
    patron: /auth/i,
    mensaje: 'Error de autenticación. Inicia sesión nuevamente.'
  },
  {
    patron: /JWT/i,
    mensaje: 'Tu sesión expiró. Inicia sesión nuevamente.'
  },
  {
    patron: /excepción/i,
    mensaje: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
  },
  {
    patron: /no se pudo/i,
    mensaje: null,
  },
];

export const traducirError = (error) => {
  if (!error) return 'Ocurrió un error inesperado.';

  const mensaje = typeof error === 'string' ? error : (error.message || error.error || error.description || String(error));
  if (!mensaje || typeof mensaje !== 'string') return 'Ocurrió un error inesperado.';

  // Si ya está en español y es un mensaje amigable, devolverlo tal cual
  const yaEsAmigable = /[áéíóúñ¿¡]/i.test(mensaje) && mensaje.length < 200;
  if (yaEsAmigable) return mensaje;

  // Intentar traducir por código PostgreSQL
  const codigo = error.code;
  if (codigo && ERRORES_POR_CODIGO[codigo]) {
    return ERRORES_POR_CODIGO[codigo];
  }

  // Intentar traducir por patrón de mensaje
  for (const { patron, mensaje: traduccion } of PATRONES_ERROR) {
    const match = mensaje.match(patron);
    if (match) {
      if (typeof traduccion === 'function') {
        return traduccion(match);
      }
      if (traduccion !== null) {
        return traduccion;
      }
      // Si la traducción es null, significa que el mensaje ya está en español
      return mensaje;
    }
  }

  // Si el mensaje está en inglés, devolver un mensaje genérico en español
  const tienePalabrasIngles = /\b(invalid|error|failed|cannot|violates|syntax|null|duplicate|constraint|input)\b/i.test(mensaje);
  if (tienePalabrasIngles) {
    return 'Ocurrió un error al guardar los datos. Verifica que todos los campos estén correctos e intenta de nuevo.';
  }

  return mensaje;
};

export const validarYCrearError = (data, campos) => {
  const errores = [];
  for (const campo of campos) {
    const { nombre, etiqueta, alias, tipo } = campo;
    const valor = data[nombre] ?? data[alias];
    if (valor === undefined || valor === null || valor === '') {
      errores.push(`El campo "${etiqueta || nombre}" es obligatorio.`);
    } else if (tipo === 'date' && typeof valor === 'string' && valor !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      errores.push(`La fecha en "${etiqueta || nombre}" no es válida.`);
    }
  }
  return errores;
};
