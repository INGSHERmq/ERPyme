import { useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/auth/useAuth';
import './ImportacionExportacionView.css';

const AREA_CONFIG = {
  clientes: {
    label: 'Clientes',
    table: 'clientes',
    description: 'Empresas, contactos y estado comercial.',
    columns: ['nombre', 'contacto', 'email', 'telefono', 'industria', 'estado'],
    required: ['nombre'],
    defaults: { estado: 'Activo' },
    numeric: []
  },
  productos: {
    label: 'Productos e inventario',
    table: 'productos_servicios',
    description: 'Productos, servicios, costos, precios y stock.',
    columns: ['codigo', 'nombre', 'tipo', 'unidad', 'precio_venta', 'costo', 'stock_actual', 'stock_minimo', 'estado'],
    required: ['nombre'],
    defaults: { tipo: 'Producto', estado: 'Activo', stock_actual: 0, stock_minimo: 0 },
    numeric: ['precio_venta', 'costo', 'stock_actual', 'stock_minimo']
  },
  empleados: {
    label: 'Empleados',
    table: 'empleados',
    description: 'Personal, cargo, departamento y salario.',
    columns: ['nombre', 'email', 'telefono', 'cargo', 'departamento', 'salario', 'estado', 'tipo_contrato'],
    required: ['nombre'],
    defaults: { departamento: 'Gestion', estado: 'Activo', tipo_contrato: 'Indefinido' },
    numeric: ['salario']
  },
  ingresos: {
    label: 'Ingresos',
    table: 'ingresos',
    description: 'Conceptos cobrados o pendientes.',
    columns: ['tipo', 'concepto', 'monto', 'fecha', 'estado', 'metodo'],
    required: ['concepto', 'monto'],
    defaults: { tipo: 'Proyecto', fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente', metodo: 'Transferencia' },
    numeric: ['monto']
  },
  egresos: {
    label: 'Gastos',
    table: 'egresos',
    description: 'Gastos por categoria, tipo y metodo.',
    columns: ['categoria', 'concepto', 'monto', 'fecha', 'tipo', 'metodo'],
    required: ['concepto', 'monto'],
    defaults: { categoria: 'Infraestructura', fecha: new Date().toISOString().split('T')[0], tipo: 'Operativo', metodo: 'Transferencia' },
    numeric: ['monto']
  }
};

const csvEscape = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const detectDelimiter = (line) => {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
};

const splitCsvLine = (line, delimiter = ',') => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseCsv = (text) => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);

  const delimiter = detectDelimiter(lines[0] || '');
  if (lines.length < 2) return { headers: splitCsvLine(lines[0] || '', delimiter), rows: [] };

  const headers = splitCsvLine(lines[0], delimiter).map(header => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });

  return { headers, rows };
};

const buildTemplate = (config) => {
  const example = config.columns.reduce((row, column) => {
    const samples = {
      nombre: 'Empresa Demo',
      contacto: 'Maria Perez',
      email: 'correo@empresa.com',
      telefono: '999999999',
      industria: 'Servicios',
      estado: 'Activo',
      codigo: 'PROD-001',
      tipo: config.table === 'egresos' ? 'Operativo' : 'Producto',
      unidad: 'unidad',
      precio_venta: '120',
      costo: '80',
      stock_actual: '10',
      stock_minimo: '2',
      cargo: 'Analista',
      departamento: 'Gestion',
      salario: '2500',
      tipo_contrato: 'Indefinido',
      concepto: 'Servicio de auditoria',
      monto: '1500',
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Transferencia',
      categoria: 'Servicios'
    };
    row[column] = config.defaults[column] ?? samples[column] ?? '';
    return row;
  }, {});

  return [
    config.columns.join(','),
    config.columns.map(column => csvEscape(example[column])).join(',')
  ].join('\n');
};

const ImportacionExportacionView = ({ onBack }) => {
  const { user } = useAuth();
  const [areaKey, setAreaKey] = useState('clientes');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeArea = AREA_CONFIG[areaKey];
  const areaOptions = useMemo(() => Object.entries(AREA_CONFIG), []);

  const normalizeRows = (rows) => rows.map((row) => {
    const payload = {};

    activeArea.columns.forEach((column) => {
      const raw = row[column] === '' || row[column] == null ? activeArea.defaults[column] : row[column];
      if (raw === '' || raw == null) return;
      payload[column] = activeArea.numeric.includes(column) ? Number(raw || 0) : raw;
    });

    return { ...activeArea.defaults, ...payload, user_id: user.id };
  });

  const validateRows = (rows) => {
    const missingColumns = activeArea.required.filter(column => !activeArea.columns.includes(column));
    if (missingColumns.length) return `La configuracion no contiene columnas requeridas: ${missingColumns.join(', ')}`;

    const invalidRow = rows.find((row) => activeArea.required.some(column => !String(row[column] || '').trim()));
    if (invalidRow) return `Hay filas sin campos obligatorios: ${activeArea.required.join(', ')}`;

    const invalidNumber = rows.find((row) => activeArea.numeric.some(column => row[column] && Number.isNaN(Number(row[column]))));
    if (invalidNumber) return `Hay valores numericos invalidos en: ${activeArea.numeric.join(', ')}`;

    return '';
  };

  const handleAreaChange = (event) => {
    setAreaKey(event.target.value);
    setPreviewRows([]);
    setFileName('');
    setError('');
    setMessage('');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setError('');
    setMessage('');
    setPreviewRows([]);

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por ahora la importacion acepta archivos CSV. Descarga una plantilla para usar el formato correcto.');
      return;
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const unknownHeaders = headers.filter(header => !activeArea.columns.includes(header));
    const missingHeaders = activeArea.required.filter(column => !headers.includes(column));

    setFileName(file.name);

    if (unknownHeaders.length) {
      setError(`El archivo tiene columnas no reconocidas: ${unknownHeaders.join(', ')}`);
      return;
    }

    if (missingHeaders.length) {
      setError(`Faltan columnas obligatorias: ${missingHeaders.join(', ')}`);
      return;
    }

    if (!rows.length) {
      setError('El archivo no contiene filas para importar.');
      return;
    }

    const validationError = validateRows(rows);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewRows(rows);
    setMessage(`${rows.length} fila(s) listas para importar.`);
  };

  const handleDownloadTemplate = () => {
    downloadTextFile(`plantilla-${areaKey}.csv`, buildTemplate(activeArea));
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: exportError } = await supabase
      .from(activeArea.table)
      .select(activeArea.columns.join(','))
      .eq('user_id', user.id)
      .limit(5000);

    setLoading(false);

    if (exportError) {
      setError(`No se pudo exportar: ${exportError.message}`);
      return;
    }

    const rows = data || [];
    const csv = [
      activeArea.columns.join(','),
      ...rows.map(row => activeArea.columns.map(column => csvEscape(row[column])).join(','))
    ].join('\n');

    downloadTextFile(`exportacion-${areaKey}.csv`, csv);
    setMessage(`Exportacion lista: ${rows.length} registro(s).`);
  };

  const handleImport = async () => {
    if (!user?.id) {
      setError('Tu sesion no esta activa. Inicia sesion nuevamente antes de importar.');
      return;
    }

    if (!previewRows.length) {
      setError('Selecciona un archivo CSV valido antes de importar.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const payload = normalizeRows(previewRows);
    const { error: insertError } = await supabase
      .from(activeArea.table)
      .insert(payload);

    setLoading(false);

    if (insertError) {
      setError(`No se pudo importar: ${insertError.message}`);
      return;
    }

    setPreviewRows([]);
    setFileName('');
    setMessage(`${payload.length} registro(s) importados correctamente en ${activeArea.label}.`);
  };

  return (
    <div className="import-export-page">
      <section className="module-hero module-hero-import">
        <button type="button" onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>Importar y exportar</h1>
        <p>Carga informacion desde CSV, descarga plantillas por area y exporta tus registros actuales.</p>
      </section>

      <section className="import-export-grid">
        <article className="import-panel">
          <div className="panel-title-row">
            <div>
              <h2>Importar archivo</h2>
              <p>{activeArea.description}</p>
            </div>
            <select value={areaKey} onChange={handleAreaChange} aria-label="Area para importar o exportar">
              {areaOptions.map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="import-actions">
            <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
              Descargar plantilla
            </button>
            <button type="button" className="btn-secondary" onClick={handleExport} disabled={loading}>
              Exportar datos
            </button>
          </div>

          <label className="file-drop">
            <span>Selecciona un CSV para {activeArea.label}</span>
            <strong>{fileName || 'Ningun archivo seleccionado'}</strong>
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          </label>

          <div className="columns-box">
            <strong>Columnas esperadas</strong>
            <div>
              {activeArea.columns.map(column => (
                <span key={column} className={activeArea.required.includes(column) ? 'required' : ''}>
                  {column}
                </span>
              ))}
            </div>
          </div>

          {error && <div className="feature-error">{error}</div>}
          {message && <div className="feature-success">{message}</div>}

          <div className="preview-table">
            <div className="records-header">
              <strong>Vista previa</strong>
              <button type="button" className="btn-primary" onClick={handleImport} disabled={loading || !previewRows.length}>
                {loading ? 'Procesando...' : 'Importar registros'}
              </button>
            </div>

            {previewRows.length ? (
              <table>
                <thead>
                  <tr>
                    {activeArea.columns.slice(0, 6).map(column => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 8).map((row, index) => (
                    <tr key={`${row[activeArea.columns[0]]}-${index}`}>
                      {activeArea.columns.slice(0, 6).map(column => <td key={column}>{row[column] || '-'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="panel-copy">Descarga una plantilla, completala y selecciona el archivo CSV para revisar los datos antes de importarlos.</p>
            )}
          </div>
        </article>

        <article className="import-panel import-help">
          <h2>Flujo recomendado</h2>
          <div className="workflow-list">
            <div className="workflow-step"><span>1</span><p>Elige el area que quieres cargar o descargar.</p></div>
            <div className="workflow-step"><span>2</span><p>Descarga la plantilla CSV para conservar las columnas correctas.</p></div>
            <div className="workflow-step"><span>3</span><p>Completa los datos y vuelve a subir el archivo.</p></div>
            <div className="workflow-step"><span>4</span><p>Revisa la vista previa y confirma la importacion.</p></div>
          </div>

          <h2 className="panel-section-title">Areas disponibles</h2>
          <div className="table-tags">
            {areaOptions.map(([key, config]) => <span key={key}>{config.label}</span>)}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ImportacionExportacionView;
