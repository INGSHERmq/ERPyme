import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';
import useLogistica from '../../hooks/useLogistica';
import { useNotification } from '../../context/NotificationContext';
import './MantenimientoView.css';

const MantenimientoView = () => {
  const { activos, mantenimientos, programarMantenimiento, loading, refetch } = useLogistica();
  const { user } = useAuth();
  const { showConfirm } = useNotification();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activo_id: '',
    tipo: 'Preventivo',
    descripcion: '',
    costo: '',
    tecnico: '',
    estado: 'Pendiente',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await programarMantenimiento({
        ...formData,
        costo: Number(formData.costo),
        activo_id: Number(formData.activo_id)
      });
      setShowForm(false);
      setFormData({
        activo_id: '',
        tipo: 'Preventivo',
        descripcion: '',
        costo: '',
        tecnico: '',
        estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0]
      });
      refetch();
      alert('✅ Mantenimiento programado correctamente');
    } catch (error) {
      console.error('Error al programar:', error);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activo_id: '',
    tipo: 'Preventivo',
    descripcion: '',
    costo: '',
    tecnico: '',
    estado: 'Pendiente',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await programarMantenimiento({
        ...formData,
        costo: Number(formData.costo),
        activo_id: Number(formData.activo_id)
      });
      setShowForm(false);
      setFormData({
        activo_id: '',
        tipo: 'Preventivo',
        descripcion: '',
        costo: '',
        tecnico: '',
        estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0]
      });
      refetch();
      alert('✅ Mantenimiento programado correctamente');
    } catch (error) {
      console.error('Error al programar:', error);
      alert('❌ Error al programar mantenimiento');
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ✅ Función para completar mantenimiento y crear egreso (USANDO SUPABASE)
  const handleCompletar = async (mantenimiento) => {
    const confirmed = await showConfirm('¿Completar mantenimiento y registrar egreso?', 'Confirmar Cierre');
    if (!confirmed) return;

    try {
      console.log('Completando mantenimiento:', mantenimiento);

      // 1. Actualizar estado del mantenimiento a Completado
      const { error: updateError } = await supabase
        .from('mantenimientos')
        .update({ estado: 'Completado' })
        .eq('id', mantenimiento.id)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // 2. Actualizar estado del activo a Disponible
      if (mantenimiento.activo_id) {
        const { error: activoError } = await supabase
          .from('activos')
          .update({ estado: 'Disponible' })
          .eq('id', mantenimiento.activo_id)
          .eq('user_id', user?.id);

        if (activoError) throw activoError;
      }

      // 3. Crear egreso automático en Supabase
      const fechaHoy = new Date().toISOString().split('T')[0];
      
      const egresoData = {
        categoria: mantenimiento.tipo || 'Mantenimiento',
        concepto: `${mantenimiento.tipo}: ${mantenimiento.descripcion}`,
        monto: mantenimiento.costo || 0,
        fecha: fechaHoy,
        proyecto_id: null,
        tipo: 'Operativo',
        metodo: 'Transferencia',
        user_id: user?.id
      };

      console.log('Creando egreso:', egresoData);
      
      const { data: nuevoEgreso, error: egresoError } = await supabase
        .from('egresos')
        .insert([egresoData])
        .select()
        .single();

      if (egresoError) throw egresoError;
      
      console.log('Egreso creado:', nuevoEgreso);

      alert('✅ Mantenimiento completado y egreso registrado en Finanzas');
      refetch();
    } catch (error) {
      console.error('Error al completar mantenimiento:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo completar'));
    }
  };

  if (loading) return <div className="loading">Cargando mantenimientos...</div>;

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>🔧 Control de Mantenimiento</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Programar'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="simple-form">
          <select name="activo_id" required value={formData.activo_id} onChange={handleChange}>
            <option value="">Seleccionar Activo *</option>
            {activos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select name="tipo" value={formData.tipo} onChange={handleChange}>
            <option>Preventivo</option>
            <option>Correctivo</option>
            <option>Inspección</option>
          </select>
          <input name="descripcion" placeholder="Descripción del trabajo *" required value={formData.descripcion} onChange={handleChange} />
          <input name="costo" type="number" placeholder="Costo ($)" required value={formData.costo} onChange={handleChange} />
          <input name="tecnico" placeholder="Técnico/Proveedor" value={formData.tecnico} onChange={handleChange} />
          <input name="fecha" type="date" required value={formData.fecha} onChange={handleChange} />
          <button type="submit" className="btn-primary">Programar</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Costo</th>
              <th>Técnico</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {mantenimientos.map(m => (
              <tr key={m.id}>
                <td className="cell-bold">{m.activoNombre || '—'}</td>
                <td>{m.tipo}</td>
                <td>{m.descripcion}</td>
                <td>${m.costo?.toLocaleString() || 0}</td>
                <td>{m.tecnico || '—'}</td>
                <td>
                  <span className={`badge badge-${m.estado === 'Completado' ? 'green' : 'yellow'}`}>
                    {m.estado}
                  </span>
                </td>
                <td>
                  {m.estado === 'Pendiente' && (
                    <button className="btn-action btn-cobrar" onClick={() => handleCompletar(m)}>
                      ✅ Completar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MantenimientoView;
