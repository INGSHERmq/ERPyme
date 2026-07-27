import { useState, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import useLogistica from '../../hooks/useLogistica';
import useProjects from '../../hooks/useProjects';
import useRRHH from '../../hooks/useRRHH';
import './AsignacionesView.css';

const AsignacionesView = () => {
  const { activos, asignaciones, asignarActivo, loading, refetch } = useLogistica();
  const { proyectos } = useProjects();
  const { empleados } = useRRHH();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activo_id: '',
    tipo_asignacion: 'Empleado',
    ref_id: '',
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await asignarActivo({
        activo_id: Number(formData.activo_id),
        tipo_asignacion: formData.tipo_asignacion,
        ref_id: Number(formData.ref_id),
        observaciones: formData.observaciones
      });
      setShowForm(false);
      setFormData({
        activo_id: '',
        tipo_asignacion: 'Empleado',
        ref_id: '',
        observaciones: ''
      });
      refetch();
      alert('Activo asignado correctamente');
    } catch (error) {
      console.error('Error al asignar:', error);
      alert('Error: ' + (error.message || 'No se pudo asignar el activo'));
    }
  };

  // FIX: Lógica limpia sin 'let' para evitar errores de ESLint
  const asignacionesConDetalles = useMemo(() => {
    if (!asignaciones || !activos) return [];
    
    return asignaciones.map(asig => {
      const activo = activos.find(a => Number(a.id) === Number(asig.activo_id));
      
      // Usamos const con operador ternario para asignar el nombre destino
      const destinoNombre = asig.tipo_asignacion === 'Empleado'
        ? empleados?.find(e => Number(e.id) === Number(asig.ref_id))?.nombre || 'Empleado no encontrado'
        : proyectos?.find(p => Number(p.id) === Number(asig.ref_id))?.nombre || 'Proyecto no encontrado';

      return {
        ...asig,
        activo_nombre: activo?.nombre || 'Activo no encontrado',
        destino_nombre: destinoNombre // Ahora se usa correctamente
      };
    });
  }, [asignaciones, activos, empleados, proyectos]);

  if (loading) return <div className="loading">Cargando asignaciones...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Asignaciones de Activos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Asignación'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          
          {/* 1. Seleccionar Activo */}
          <select required value={formData.activo_id} onChange={e => setFormData({...formData, activo_id: e.target.value})}>
            <option value="">Seleccionar Activo *</option>
            {activos.filter(a => a.estado === 'Disponible').map(a => (
              <option key={a.id} value={a.id}>{a.nombre} ({a.tipo})</option>
            ))}
          </select>

          {/* 2. Seleccionar Tipo de Destino */}
          <select value={formData.tipo_asignacion} onChange={e => setFormData({...formData, tipo_asignacion: e.target.value, ref_id: ''})}>
            <option value="Empleado">A un Empleado</option>
            <option value="Proyecto">A un Proyecto</option>
          </select>

          {/* 3. Seleccionar Destino Específico (Dinámico) */}
          <select required value={formData.ref_id} onChange={e => setFormData({...formData, ref_id: e.target.value})}>
            <option value="">Seleccionar {formData.tipo_asignacion} *</option>
            
            {formData.tipo_asignacion === 'Empleado' ? (
              empleados?.filter(e => e.estado === 'Activo').map(e => (
                <option key={e.id} value={e.id}>{e.nombre} ({e.cargo})</option>
              ))
            ) : (
              proyectos?.map(p => (
                <option key={p.id} value={p.id}>#{p.id} - {p.nombre}</option>
              ))
            )}
          </select>

          <input 
            placeholder="Observaciones (opcional)" 
            value={formData.observaciones} 
            onChange={e => setFormData({...formData, observaciones: e.target.value})} 
          />
          
          <button type="submit" className="btn-primary">Asignar</button>
        </form>
      )}

      <DataTable
        data={asignacionesConDetalles}
        searchKeys={['activo_nombre', 'destino_nombre', 'tipo_asignacion', 'estado']}
        searchPlaceholder="Buscar por activo, asignado, tipo o estado..."
        pageSize={10}
        columns={['Activo', 'Asignado A', 'Tipo', 'Fecha Asignación', 'Estado']}
        renderRow={(a) => (
          <tr key={a.id}>
            <td className="cell-bold">{a.activo_nombre}</td>
            <td>{a.destino_nombre}</td>
            <td><span className="badge badge-blue">{a.tipo_asignacion}</span></td>
            <td>{a.fecha_asignacion}</td>
            <td><span className={`badge badge-${a.estado === 'Activa' ? 'green' : 'gray'}`}>{a.estado}</span></td>
          </tr>
        )}
      />
    </div>
  );
};

export default AsignacionesView;