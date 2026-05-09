import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import { uploadPrivateFile } from '../../lib/storage';

const DocumentosView = () => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    fecha_vencimiento: ''
  });
  const [archivo, setArchivo] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('rrhh_documentos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setDocumentos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!archivo) {
      alert('Selecciona un archivo');
      return;
    }

    try {
      setSubiendo(true);
      const upload = await uploadPrivateFile({
        file: archivo,
        folder: 'rrhh-documentos',
        userId: user?.id
      });

      const { error } = await supabase.from('rrhh_documentos').insert([{
        empleado_id: null,
        nombre: formData.nombre,
        tipo: formData.tipo,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        storage_path: upload.publicUrl,
        mime_type: archivo.type,
        size_bytes: archivo.size
      }]);

      if (error) throw error;
      setShowForm(false);
      setArchivo(null);
      setFormData({ nombre: '', tipo: '', fecha_vencimiento: '' });
      await fetchData();
    } catch (error) {
      alert(error.message || 'No se pudo guardar el documento');
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) return <div className="loading">Cargando documentos...</div>;

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <h2>Documentos</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Subir documento'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="doc-nombre">Nombre del documento *</label>
            <input
              id="doc-nombre"
              placeholder="Nombre del documento *"
              required
              value={formData.nombre}
              onChange={(event) => setFormData(prev => ({ ...prev, nombre: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="doc-tipo">Tipo de documento *</label>
            <input
              id="doc-tipo"
              placeholder="Tipo de documento *"
              required
              value={formData.tipo}
              onChange={(event) => setFormData(prev => ({ ...prev, tipo: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="doc-vencimiento">Fecha de vencimiento</label>
            <input
              id="doc-vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(event) => setFormData(prev => ({ ...prev, fecha_vencimiento: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="doc-archivo">Archivo</label>
            <input id="doc-archivo" type="file" required onChange={(event) => setArchivo(event.target.files?.[0] || null)} />
          </div>
          <button type="submit" className="btn-primary" disabled={subiendo}>
            {subiendo ? 'Subiendo...' : 'Guardar documento'}
          </button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Vence</th>
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc) => (
              <tr key={doc.id}>
                <td className="cell-bold">{doc.nombre}</td>
                <td>{doc.tipo}</td>
                <td>{doc.fecha_vencimiento || '-'}</td>
                <td>{doc.storage_path ? <a href={doc.storage_path} target="_blank" rel="noreferrer">Ver</a> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentosView;
