import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const SimpleCrudContabilidadView = ({ title, table, fields }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
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

    const { error } = await supabase.from(table).insert([payload]);
    if (error) {
      alert(error.message || 'No se pudo registrar');
      return;
    }
    setFormData(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ''])));
    setShowForm(false);
    await fetchRows();
  };

  if (loading) return <div className="loading">Cargando {title.toLowerCase()}...</div>;

  return (
    <div className="finanzas-view">
      <div className="view-header">
        <h2>{title}</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>
      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div className="form-field" key={field.name}>
              <label htmlFor={`${table}-${field.name}`}>{field.label}</label>
              <input
                id={`${table}-${field.name}`}
                type={field.type || 'text'}
                placeholder={field.label}
                required={field.required}
                value={formData[field.name]}
                onChange={(event) => setFormData((prev) => ({ ...prev, [field.name]: event.target.value }))}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {fields.slice(0, 5).map((field) => <th key={field.name}>{field.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {fields.slice(0, 5).map((field) => <td key={field.name}>{String(row[field.name] ?? '-')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleCrudContabilidadView;
