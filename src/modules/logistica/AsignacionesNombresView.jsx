import { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth/useAuth';

const AsignacionesNombresView = () => {
  const { user, membership, profile } = useAuth();
  const empresaId = membership?.empresa_id || profile?.empresa_actual_id || null;
  const [objetos, setObjetos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    inventario_objeto_id: '',
    proyecto_id: '',
    empleado_id: '',
    cantidad: '1',
    estado: 'asignado'
  });

  const fetchData = async () => {
    if (!user?.id) return;
    const [objRes, proyRes, empRes, asigRes, cotRes] = await Promise.all([
      supabase.from('inventario_objetos').select('id,nombre').eq('empresa_id', empresaId).order('nombre'),
      supabase.from('proyectos').select('id,nombre').eq('empresa_id', empresaId).order('nombre'),
      supabase.from('empleados').select('id,nombre').eq('empresa_id', empresaId).order('nombre'),
      supabase.from('asignaciones_inventario').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      supabase.from('cotizaciones').select('id,titulo').eq('empresa_id', empresaId)
    ]);
    setObjetos(objRes.data || []);
    const cotizacionesPorId = new Map((cotRes.data || []).map((c) => [String(c.id), c.titulo]));
    const proyectosConTitulo = (proyRes.data || []).map((proyecto) => {
      const match = String(proyecto.nombre || '').match(/#(\d+)/);
      const cotizacionTitulo = match ? cotizacionesPorId.get(match[1]) : null;
      return {
        ...proyecto,
        nombre_mostrar: cotizacionTitulo ? `${proyecto.nombre} (${cotizacionTitulo})` : proyecto.nombre
      };
    });
    setProyectos(proyectosConTitulo);
    setEmpleados(empRes.data || []);
    setRows(asigRes.data || []);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, empresaId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cantidad = Number(formData.cantidad || 1);
    const inventario_objeto_id = Number(formData.inventario_objeto_id);

    const { error } = await supabase.from('asignaciones_inventario').insert([{
      empresa_id: empresaId,
      inventario_objeto_id,
      proyecto_id: formData.proyecto_id ? Number(formData.proyecto_id) : null,
      empleado_id: formData.empleado_id ? Number(formData.empleado_id) : null,
      cantidad,
      estado: formData.estado
    }]);
    if (error) {
      alert(error.message || 'No se pudo registrar la asignación');
      return;
    }

    // Reduce inventory stock
    const { data: objeto } = await supabase.from('inventario_objetos').select('stock_actual').eq('id', inventario_objeto_id).single();
    if (objeto) {
      const newStock = Math.max(0, (objeto.stock_actual || 0) - cantidad);
      await supabase.from('inventario_objetos').update({ stock_actual: newStock }).eq('id', inventario_objeto_id);
    }

    setFormData({ inventario_objeto_id: '', proyecto_id: '', empleado_id: '', cantidad: '1', estado: 'asignado' });
    setShowForm(false);
    await fetchData();
  };

  const confirmarDevolucion = async (row) => {
    const objeto = objetos.find((item) => Number(item.id) === Number(row.inventario_objeto_id));
    if (!objeto || !window.confirm(`¿Confirmar la devolución de ${row.cantidad} ${objeto.nombre}?`)) return;
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario_objetos').select('stock_actual').eq('id', row.inventario_objeto_id).single();
    if (inventarioError) return alert(inventarioError.message || 'No se pudo validar el inventario');
    const { error: updateError } = await supabase.from('asignaciones_inventario')
      .update({ estado: 'devuelto', fecha_devolucion: new Date().toISOString().slice(0, 10) }).eq('id', row.id);
    if (updateError) return alert(updateError.message || 'No se pudo confirmar la devolución');
    const { error: stockError } = await supabase.from('inventario_objetos')
      .update({ stock_actual: Number(inventario.stock_actual || 0) + Number(row.cantidad || 0) }).eq('id', row.inventario_objeto_id);
    if (stockError) return alert('La devolución fue confirmada, pero no se pudo actualizar el stock.');
    await fetchData();
  };

  return (
    <div className="logistica-view">
      <div className="view-header">
        <h2>Asignaciones</h2>
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva asignación'}
        </button>
      </div>

      {showForm && (
        <form className="simple-form" onSubmit={handleSubmit}>
          <select required value={formData.inventario_objeto_id} onChange={(e) => setFormData((p) => ({ ...p, inventario_objeto_id: e.target.value }))}>
            <option value="">Objeto</option>
            {objetos.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
          <select value={formData.proyecto_id} onChange={(e) => setFormData((p) => ({ ...p, proyecto_id: e.target.value }))}>
            <option value="">Proyecto (opcional)</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre_mostrar || p.nombre}</option>)}
          </select>
          <select value={formData.empleado_id} onChange={(e) => setFormData((p) => ({ ...p, empleado_id: e.target.value }))}>
            <option value="">Empleado (opcional)</option>
            {empleados.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
          </select>
          <input type="number" min="1" required placeholder="Cantidad" value={formData.cantidad} onChange={(e) => setFormData((p) => ({ ...p, cantidad: e.target.value }))} />
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <DataTable
        data={rows}
        searchKeys={['estado']}
        searchPlaceholder="Buscar por estado..."
        pageSize={10}
        columns={['Objeto', 'Proyecto', 'Empleado', 'Cantidad', 'Fecha y Hora', 'Estado', 'Acción']}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{objetos.find((o) => o.id === row.inventario_objeto_id)?.nombre || '-'}</td>
            <td>{proyectos.find((p) => p.id === row.proyecto_id)?.nombre_mostrar || '-'}</td>
            <td>{empleados.find((e) => e.id === row.empleado_id)?.nombre || '-'}</td>
            <td>{row.cantidad}</td>
            <td>{new Date(row.created_at).toLocaleString()}</td>
            <td>{row.estado}</td>
            <td>{row.estado === 'devolucion_solicitada' ? (
              <button type="button" className="btn-action btn-cobrar" onClick={() => confirmarDevolucion(row)}>Confirmar devolución</button>
            ) : '-'}</td>
          </tr>
        )}
      />
    </div>
  );
};

export default AsignacionesNombresView;
