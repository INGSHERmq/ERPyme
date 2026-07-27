import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import { uploadPrivateFile } from '../../lib/storage';
import './DocumentosView.css';

const DocumentosView = () => {
  const { user, company, profile } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('empresa');
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
    const empresaId = company?.id || profile?.empresa_actual_id;
    const ownerFilter = empresaId ? `empresa_id.eq.${empresaId},user_id.eq.${user.id}` : `user_id.eq.${user.id}`;
    const { data } = await supabase
      .from('rrhh_documentos')
      .select('*, empleados(nombre, apellidos)')
      .or(ownerFilter)
      .order('created_at', { ascending: false });
    setDocumentos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, profile?.empresa_actual_id, user?.id]);

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
        empresa_id: company?.id || profile?.empresa_actual_id,
        user_id: user?.id,
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

  const documentosEmpresa = documentos.filter((doc) => !doc.empleado_id);
  const documentosEmpleados = documentos.filter((doc) => doc.empleado_id);

  return (
    <div className="rrhh-view">
      <div className="view-header">
        <div>
          <h2>Documentos</h2>
          <p className="documentos-subtitle">
            Separa los archivos generales de la empresa de los documentos propios de cada trabajador.
          </p>
        </div>
        {activeSection === 'empresa' && (
          <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Subir documento'}
          </button>
        )}
      </div>

      <div className="documents-section-tabs" aria-label="Secciones de documentos">
        <button
          type="button"
          className={activeSection === 'empresa' ? 'active' : ''}
          onClick={() => setActiveSection('empresa')}
        >
          Documentos de empresa
          <span>{documentosEmpresa.length}</span>
        </button>
        <button
          type="button"
          className={activeSection === 'empleados' ? 'active' : ''}
          onClick={() => {
            setActiveSection('empleados');
            setShowForm(false);
          }}
        >
          Documentos de empleados
          <span>{documentosEmpleados.length}</span>
        </button>
      </div>

      {showForm && activeSection === 'empresa' && (
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
            {subiendo ? 'Subiendo...' : 'Guardar documento de empresa'}
          </button>
        </form>
      )}

      {activeSection === 'empresa' ? (
        documentosEmpresa.length > 0 ? (
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
                {documentosEmpresa.map((doc) => (
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
        ) : (
          <div className="empty-state">Aun no hay documentos generales de la empresa.</div>
        )
      ) : (
        <>
          <div className="documents-guidance">
            Los documentos de trabajadores se registran desde la ficha de empleados o cuando el trabajador atiende una solicitud de RRHH.
          </div>
          {documentosEmpleados.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Empleado</th>
                    <th>Tipo</th>
                    <th>Vence</th>
                    <th>Archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {documentosEmpleados.map((doc) => (
                    <tr key={doc.id}>
                      <td className="cell-bold">{doc.nombre}</td>
                      <td>{[doc.empleados?.nombre, doc.empleados?.apellidos].filter(Boolean).join(' ') || 'Empleado no disponible'}</td>
                      <td>{doc.tipo}</td>
                      <td>{doc.fecha_vencimiento || '-'}</td>
                      <td>{doc.storage_path ? <a href={doc.storage_path} target="_blank" rel="noreferrer">Ver</a> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Aun no hay documentos cargados por empleados.</div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentosView;
