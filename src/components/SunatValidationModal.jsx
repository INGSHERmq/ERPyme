import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Helper lists/mappings to show human readable text for SUNAT response codes
const ESTADOS_COMPROBANTE = {
  '0': { text: 'No Existe', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '1': { text: 'Aceptado', color: 'var(--trading-up)', bg: 'rgba(14, 203, 129, 0.1)' },
  '2': { text: 'Anulado', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '3': { text: 'Autorizado', color: 'var(--trading-up)', bg: 'rgba(14, 203, 129, 0.1)' },
  '4': { text: 'No Autorizado', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
};

const ESTADOS_RUC = {
  '00': { text: 'Activo', color: 'var(--trading-up)', bg: 'rgba(14, 203, 129, 0.1)' },
  '01': { text: 'Baja Provisional', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '02': { text: 'Baja Provisional por Oficio', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '03': { text: 'Baja Definitiva', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '11': { text: 'Suspensión Temporal', color: 'var(--binance-yellow)', bg: 'rgba(252, 213, 53, 0.1)' },
  '12': { text: 'Aun no Activo', color: 'var(--muted)', bg: 'rgba(112, 122, 138, 0.1)' },
  '20': { text: 'Baja de Oficio', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '21': { text: 'Baja Definitiva por Oficio', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
};

const CONDICIONES_DOMICILIO = {
  '00': { text: 'Habido', color: 'var(--trading-up)', bg: 'rgba(14, 203, 129, 0.1)' },
  '09': { text: 'Pendiente', color: 'var(--binance-yellow)', bg: 'rgba(252, 213, 53, 0.1)' },
  '11': { text: 'No Hallado', color: 'var(--binance-yellow)', bg: 'rgba(252, 213, 53, 0.1)' },
  '12': { text: 'No Habido', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
  '20': { text: 'No Hallado en Denuncia', color: 'var(--trading-down)', bg: 'rgba(246, 70, 93, 0.1)' },
};

const SunatValidationModal = ({ isOpen, onClose, invoice, proveedor, miRuc }) => {
  const [numRuc, setNumRuc] = useState('');
  const [codComp, setCodComp] = useState('01'); // 01 = Factura default
  const [serie, setSerie] = useState('');
  const [correlativo, setCorrelativo] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [monto, setMonto] = useState('0.00');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  // Parse invoice details on load
  useEffect(() => {
    if (invoice && isOpen) {
      setErrorMsg(null);
      setResult(null);

      // Emitter RUC
      setNumRuc(proveedor?.ruc || '');

      // Serie, correlativo y tipo comprobante desde columnas directas
      const parsedSerie = invoice.serie || '';
      const parsedCorrelativo = invoice.correlativo || '';
      const parsedCodComp = invoice.tipo_comprobante || '01';

      setSerie(parsedSerie);
      setCorrelativo(parsedCorrelativo);

      // Detect receipt type based on series first letter if tipo_comprobante is default or not code format
      if (parsedCodComp === '01' || parsedCodComp === 'Factura') {
        const firstLetter = parsedSerie.charAt(0).toUpperCase();
        if (firstLetter === 'B') {
          setCodComp('03'); // Boleta
        } else if (firstLetter === 'R') {
          setCodComp('R1'); // Recibo por Honorarios
        } else {
          setCodComp('01'); // Factura
        }
      } else {
        setCodComp(parsedCodComp);
      }

      // Format date from YYYY-MM-DD to dd/mm/yyyy
      const dateStr = invoice.fecha_emision || '';
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        setFechaEmision(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
      } else {
        setFechaEmision(dateStr);
      }

      // Amount
      setMonto(invoice.total ? Number(invoice.total).toFixed(2) : '0.00');
    }
  }, [invoice, proveedor, isOpen]);

  if (!isOpen) return null;

  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      if (!miRuc) {
        throw new Error('El RUC de tu empresa no está configurado. Por favor, regístralo en la configuración de la empresa.');
      }

      if (!proveedor?.ruc) {
        throw new Error('Esta factura no tiene un proveedor con RUC asignado. No se puede validar contra SUNAT.');
      }

      if (!serie || !correlativo) {
        throw new Error('Esta factura no tiene serie o correlativo. Revisa los datos antes de validar.');
      }

      const { data, error } = await supabase.functions.invoke('validate-sunat-receipt', {
        body: {
          mi_ruc: miRuc,
          numRuc,
          codComp,
          numeroSerie: serie.toUpperCase().trim(),
          numero: correlativo.trim(),
          fechaEmision,
          monto
        }
      });

      if (error) throw error;

      if (data && data.ok) {
        setResult(data.data);
      } else {
        setErrorMsg(data?.error || 'No se pudo validar el comprobante.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error en la conexión con el servidor de validación.');
    } finally {
      setLoading(false);
    }
  };

  // Helper renderers
  const getBadgeStyle = (config) => {
    return {
      color: config?.color || 'var(--text-main)',
      backgroundColor: config?.bg || 'var(--surface-elevated)',
      padding: '6px 12px',
      borderRadius: 'var(--radius-pill)',
      fontWeight: '700',
      display: 'inline-block',
      fontSize: '13px'
    };
  };

  const estadoCpConfig = result?.data ? ESTADOS_COMPROBANTE[result.data.estadoCp] : null;
  const estadoRucConfig = result?.data ? ESTADOS_RUC[result.data.estadoRuc] : null;
  const condDomiRucConfig = result?.data ? CONDICIONES_DOMICILIO[result.data.condDomiRuc] : null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <header>
          <span>Validación SUNAT</span>
          <button type="button" onClick={onClose}>✕</button>
        </header>

        <h2>Validar Comprobante de Compra</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 20px' }}>
          Confirma los datos requeridos por SUNAT para realizar la consulta en tiempo real.
        </p>

        <form onSubmit={handleValidate} className="profile-form" style={{ gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', gridColumn: '1 / -1' }}>
            <label>
              RUC Emisor (Proveedor)
              <input 
                type="text" 
                required 
                maxLength={11} 
                value={numRuc} 
                onChange={(e) => setNumRuc(e.target.value)} 
              />
            </label>
            <label>
              Tipo de Comprobante
              <select value={codComp} onChange={(e) => setCodComp(e.target.value)}>
                <option value="01">01 - Factura</option>
                <option value="03">03 - Boleta de Venta</option>
                <option value="07">07 - Nota de Crédito</option>
                <option value="08">08 - Nota de Débito</option>
                <option value="R1">R1 - Recibo por Honorarios</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', gridColumn: '1 / -1' }}>
            <label>
              Serie (ej. F001, E001)
              <input 
                type="text" 
                required 
                maxLength={4} 
                value={serie} 
                onChange={(e) => setSerie(e.target.value)} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label>
              Número Correlativo
              <input 
                type="text" 
                required 
                value={correlativo} 
                onChange={(e) => setCorrelativo(e.target.value)} 
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', gridColumn: '1 / -1' }}>
            <label>
              Fecha de Emisión (dd/mm/yyyy)
              <input 
                type="text" 
                required 
                placeholder="dd/mm/yyyy"
                value={fechaEmision} 
                onChange={(e) => setFechaEmision(e.target.value)} 
              />
            </label>
            <label>
              Monto Total
              <input 
                type="number" 
                step="0.01" 
                required 
                value={monto} 
                onChange={(e) => setMonto(e.target.value)} 
              />
            </label>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: 'auto', minWidth: '150px' }}
            >
              {loading ? 'Consultando...' : 'Validar en SUNAT'}
            </button>
          </div>
        </form>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="profile-error" style={{ marginTop: '20px' }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* Resultados de Validación */}
        {result && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-elevated)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--on-surface)' }}>
              Resultado de Consulta:
            </h3>

            {result.success ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Estado Comprobante:</span>
                  <span style={getBadgeStyle(estadoCpConfig)}>
                    {estadoCpConfig?.text || `Código ${result.data.estadoCp}`}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Estado RUC Emisor:</span>
                  <span style={getBadgeStyle(estadoRucConfig)}>
                    {estadoRucConfig?.text || `Código ${result.data.estadoRuc}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Condición Domicilio RUC:</span>
                  <span style={getBadgeStyle(condDomiRucConfig)}>
                    {condDomiRucConfig?.text || `Código ${result.data.condDomiRuc}`}
                  </span>
                </div>

                {/* Observaciones */}
                {result.data.observaciones && result.data.observaciones.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderLeft: '4px solid var(--binance-yellow)',
                    backgroundColor: 'rgba(252, 213, 53, 0.05)',
                    fontSize: '13px'
                  }}>
                    <strong style={{ color: 'var(--binance-yellow)' }}>Observaciones SUNAT:</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '20px', color: 'var(--text-main)' }}>
                      {result.data.observaciones.map((obs, idx) => (
                        <li key={idx}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-error">
                La SUNAT no pudo validar este comprobante. Respuesta: {result.message || 'Sin mensaje de detalle'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SunatValidationModal;
