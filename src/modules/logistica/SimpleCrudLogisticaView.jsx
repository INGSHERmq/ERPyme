import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useProjects from '../../hooks/useProjects';
import DataTable from '../../components/DataTable';

const SimpleCrudLogisticaView = ({ title, table, fields }) => {
  const { user, membership, profile } = useAuth();
  const { proyectos } = useProjects();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]);
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(true);
  const [formData, setFormData] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ''])));

  const fetchRows = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100);
    if (error) {
      alert(error.message || `No se pudo cargar ${title.toLowerCase()}`);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(data || []);
    if (table === 'inventario_objetos') {
      const { data: asignacionesData } = await supabase.from('asignaciones_inventario')
        .select('inventario_objeto_id,proyecto_id,empleado_id,estado').eq('empresa_id', membership?.empresa_id || profile?.empresa_actual_id)
        .in('estado', ['asignado', 'devolucion_solicitada']);
      setAsignaciones(asignacionesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => { await fetchRows(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, table]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {};
    fields.forEach((field) => {
      const raw = formData[field.name];
      if (raw === '' || raw === null || raw === undefined) return;
      payload[field.name] = field.type === 'number' ? Number(raw) : raw;
    });
    const empresaId = membership?.empresa_id || profile?.empresa_actual_id;
    if (empresaId) payload.empresa_id = empresaId;
    if (!['inventario_objetos', 'mantenimiento_objetos'].includes(table)) payload.user_id = user.id;

    if (table === 'inventario_objetos' && payload.codigo) {
      const { data: existing } = await supabase.from(table).select('id, stock_actual').eq('codigo', payload.codigo).single();
      if (existing) {
        const newStock = Number(existing.stock_actual || 0) + Number(payload.stock_actual || 0);
        const { error } = await supabase.from(table).update({ ...payload, stock_actual: newStock }).eq('id', existing.id);
        if (error) {
          alert(error.message || `No se pudo actualizar el inventario`);
          return;
        }
        setFormData(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ''])));
        setShowForm(false);
        await fetchRows();
        return;
      }
    }

    const { error } = await supabase.from(table).insert([payload]);
    if (error) {
      alert(error.message || `No se pudo crear en ${table}`);
      return;
    }

    setFormData(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ''])));
    setShowForm(false);
    await fetchRows();
  };

  if (loading) return <div className="loading">Cargando {title.toLowerCase()}...</div>;

  const agotados = table === 'inventario_objetos' ? rows.filter((row) => Number(row.stock_actual) <= 0) : [];

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>{title}</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {agotados.length > 0 && mostrarAlertaStock && (
        <div role="alert" className="empty-state" style={{ border: '1px solid #f6465d', marginBottom: '16px', position: 'relative', padding: '18px 48px 18px 20px' }}>
          <button type="button" aria-label="Cerrar alerta" onClick={() => setMostrarAlertaStock(false)} style={{ position: 'absolute', top: '10px', right: '12px', border: 0, background: 'transparent', color: 'var(--text-main)', fontSize: '22px', cursor: 'pointer' }}>×</button>
          <strong>Stock agotado ({agotados.length})</strong>
          {agotados.map((item) => {
            const destinos = asignaciones.filter((a) => Number(a.inventario_objeto_id) === Number(item.id)).map((a) =>
              proyectos.find((p) => Number(p.id) === Number(a.proyecto_id))?.nombre_mostrar || proyectos.find((p) => Number(p.id) === Number(a.proyecto_id))?.nombre || 'Asignado sin proyecto'
            );
            return <div key={item.id}>{item.nombre}: {destinos.length ? destinos.join(', ') : 'sin asignación activa'}</div>;
          })}
        </div>
      )}

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div className="form-field" key={field.name}>
              <label htmlFor={`${table}-${field.name}`}>{field.label}</label>
              {field.type === 'project' ? (
                <select
                  id={`${table}-${field.name}`}
                  required={field.required}
                  value={formData[field.name]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [field.name]: event.target.value }))}
                >
                  <option value="">Sin proyecto</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre_mostrar || proyecto.nombre}</option>
                  ))}
                </select>
              ) : field.type === 'select' ? (
                <select
                  id={`${table}-${field.name}`}
                  required={field.required}
                  value={formData[field.name]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [field.name]: event.target.value }))}
                >
                  {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.name === 'ruc' ? (
                <input
                  id={`${table}-${field.name}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  required={field.required}
                  placeholder={field.label}
                  value={formData[field.name]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [field.name]: event.target.value.replace(/\D/g, '').slice(0, 11) }))}
                />
              ) : (
                <input
                  id={`${table}-${field.name}`}
                  type={field.type || 'text'}
                  required={field.required}
                  placeholder={field.label}
                  value={formData[field.name]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [field.name]: event.target.value }))}
                />
              )}
            </div>
          ))}
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <DataTable
        data={rows}
        searchKeys={fields.slice(0, 6).map((f) => f.name)}
        searchPlaceholder={`Buscar en ${title.toLowerCase()}...`}
        pageSize={10}
        columns={fields.slice(0, 6).map((f) => f.label)}
        renderRow={(row) => (
          <tr key={row.id}>
            {fields.slice(0, 6).map((field) => (
              <td key={field.name}>
                {field.type === 'project'
                  ? proyectos.find((proyecto) => Number(proyecto.id) === Number(row[field.name]))?.nombre_mostrar || proyectos.find((proyecto) => Number(proyecto.id) === Number(row[field.name]))?.nombre || '-'
                  : String(row[field.name] ?? '-')}
              </td>
            ))}
          </tr>
        )}
        emptyMessage="Sin registros."
      />
    </div>
  );
};

export default SimpleCrudLogisticaView;
