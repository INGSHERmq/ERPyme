import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadPrivateFile } from '../lib/storage';
import { useAuth } from '../context/auth/useAuth';
import { traducirError } from '../lib/errores';
import './RRHHDocumentPrompt.css';

const toDateLabel = (value) => {
  if (!value) return 'Sin fecha limite';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
};

const RRHHDocumentPrompt = () => {
  const { user, company, profile } = useAuth();
  const [request, setRequest] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const deadlineStatus = useMemo(() => {
    if (!request?.fecha_limite) return 'Pendiente';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(`${request.fecha_limite}T00:00:00`);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);

    if (days < 0) return `Vencido hace ${Math.abs(days)} dia(s)`;
    if (days === 0) return 'Vence hoy';
    return `Quedan ${days} dia(s)`;
  }, [request?.fecha_limite]);

  const loadPendingRequest = async () => {
    if (!user?.id) return;

    const empresaId = company?.id || profile?.empresa_actual_id;
    let employeesQuery = supabase
      .from('empleados')
      .select('id, empresa_id, nombre, apellidos')
      .eq('linked_user_id', user.id)
      .eq('puede_subir_documentos', true);

    if (empresaId) employeesQuery = employeesQuery.eq('empresa_id', empresaId);

    const { data: employees, error: employeeError } = await employeesQuery;
    if (employeeError || !employees?.length) {
      setRequest(null);
      setEmployee(null);
      return;
    }

    const employeeIds = employees.map((item) => item.id);
    const { data: requests, error: requestError } = await supabase
      .from('rrhh_solicitudes_documentos')
      .select('*')
      .in('empleado_id', employeeIds)
      .eq('estado', 'pendiente')
      .order('fecha_limite', { ascending: true })
      .limit(1);

    if (requestError || !requests?.length) {
      setRequest(null);
      setEmployee(null);
      return;
    }

    const pendingRequest = requests[0];
    setRequest(pendingRequest);
    setEmployee(employees.find((item) => item.id === pendingRequest.empleado_id) || employees[0]);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadPendingRequest();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, profile?.empresa_actual_id, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !request || !employee) return;

    setUploading(true);
    setMessage('');
    try {
      const upload = await uploadPrivateFile({
        file,
        folder: 'rrhh-documentos',
        userId: user?.id
      });

      const { error: documentError } = await supabase.from('rrhh_documentos').insert([{
        empresa_id: request.empresa_id || employee.empresa_id || company?.id || profile?.empresa_actual_id,
        empleado_id: employee.id,
        user_id: user?.id,
        nombre: documentName || file.name,
        tipo: file.type || 'archivo',
        fecha_vencimiento: request.fecha_limite,
        storage_path: upload.publicUrl,
        mime_type: file.type,
        size_bytes: file.size
      }]);

      if (documentError) throw documentError;

      const { error: updateError } = await supabase
        .from('rrhh_solicitudes_documentos')
        .update({ estado: 'entregado' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setMessage('Documento enviado correctamente.');
      setFile(null);
      setDocumentName('');
      setRequest(null);
      setEmployee(null);
    } catch (error) {
      setMessage(traducirError(error));
    } finally {
      setUploading(false);
    }
  };

  if (!request || !employee) return null;

  return (
    <aside className="rrhh-document-prompt" role="status" aria-live="polite">
      <div>
        <span className="rrhh-document-prompt__eyebrow">RRHH</span>
        <h2>Suba los documentos requeridos</h2>
        <p>
          Fecha limite: <strong>{toDateLabel(request.fecha_limite)}</strong>. {deadlineStatus}.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del documento"
          value={documentName}
          onChange={(event) => setDocumentName(event.target.value)}
        />
        <input type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} />
        {message && <p className="rrhh-document-prompt__message">{message}</p>}
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>
    </aside>
  );
};

export default RRHHDocumentPrompt;
