export const validarCamposRequeridos = (data, campos) => {
  const errores = [];
  for (const campo of campos) {
    const valor = data[campo.nombre] ?? data[campo.alias];
    if (valor === undefined || valor === null || valor === '') {
      errores.push(campo.mensaje || `El campo "${campo.etiqueta || campo.nombre}" es obligatorio.`);
    }
  }
  return errores;
};

export const validarFechas = (data, campos) => {
  const errores = [];
  for (const campo of campos) {
    const valor = data[campo.nombre] ?? data[campo.alias];
    if (valor === undefined || valor === null || valor === '') {
      errores.push(campo.mensaje || `La fecha "${campo.etiqueta || campo.nombre}" es obligatoria.`);
    } else if (typeof valor === 'string' && valor !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      try {
        const d = new Date(valor);
        if (Number.isNaN(d.getTime())) {
          errores.push(`La fecha en "${campo.etiqueta || campo.nombre}" no es válida.`);
        }
      } catch {
        errores.push(`La fecha en "${campo.etiqueta || campo.nombre}" no es válida.`);
      }
    }
  }
  return errores;
};

export const validarNumeros = (data, campos) => {
  const errores = [];
  for (const campo of campos) {
    const valor = data[campo.nombre] ?? data[campo.alias];
    if (valor !== undefined && valor !== null && valor !== '') {
      const num = Number(valor);
      if (Number.isNaN(num)) {
        errores.push(`El campo "${campo.etiqueta || campo.nombre}" debe ser un número válido.`);
      } else if (campo.min !== undefined && num < campo.min) {
        errores.push(`El campo "${campo.etiqueta || campo.nombre}" debe ser mayor o igual a ${campo.min}.`);
      } else if (campo.max !== undefined && num > campo.max) {
        errores.push(`El campo "${campo.etiqueta || campo.nombre}" debe ser menor o igual a ${campo.max}.`);
      }
    }
  }
  return errores;
};

export const RUC_LENGTH = 11;
export const DNI_LENGTH = 8;

export const validarRuc = (valor) => {
  if (!valor) return 'El RUC es obligatorio.';
  const limpio = String(valor).replace(/\D/g, '');
  if (limpio.length !== RUC_LENGTH) return `El RUC debe tener exactamente ${RUC_LENGTH} dígitos.`;
  if (!/^\d{11}$/.test(limpio)) return 'El RUC solo debe contener números.';
  return null;
};

export const validarDniRuc = (valor, tipo) => {
  if (!valor) return `El ${tipo} es obligatorio.`;
  const limpio = String(valor).replace(/\D/g, '');
  const esperado = tipo === 'RUC' ? RUC_LENGTH : DNI_LENGTH;
  if (limpio.length !== esperado) return `El ${tipo} debe tener exactamente ${esperado} dígitos.`;
  if (!/^\d+$/.test(limpio)) return `El ${tipo} solo debe contener números.`;
  return null;
};

export const limpiarNumero = (valor, maxLength) => {
  return String(valor).replace(/\D/g, '').slice(0, maxLength);
};

export const validarSeleccion = (data, campos, opciones) => {
  const errores = [];
  for (const campo of campos) {
    const valor = data[campo.nombre] ?? data[campo.alias];
    if (valor !== undefined && valor !== null && valor !== '' && !opciones.includes(valor)) {
      errores.push(`El valor seleccionado en "${campo.etiqueta || campo.nombre}" no es válido.`);
    }
  }
  return errores;
};
