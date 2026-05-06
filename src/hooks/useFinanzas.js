import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useFinanzas = () => {
  const { user } = useAuth();
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) {
      setIngresos([]);
      setEgresos([]);
      setCuentasPorCobrar([]);
      setClientes([]);
      setDashboardData(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const [ingRes, egrRes, cpcRes, clientesRes] = await Promise.all([
        supabase.from('ingresos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('egresos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('cuentas_por_cobrar').select('*').eq('user_id', user.id).order('fecha_vencimiento'),
        supabase.from('clientes').select('id,nombre').eq('user_id', user.id).order('nombre')
      ]);

      if (ingRes.error) throw ingRes.error;
      if (egrRes.error) throw egrRes.error;
      if (cpcRes.error) throw cpcRes.error;
      if (clientesRes.error) throw clientesRes.error;

      setIngresos(ingRes.data || []);
      setEgresos(egrRes.data || []);
      setClientes(clientesRes.data || []);
      setCuentasPorCobrar((cpcRes.data || []).map(c => ({
        ...c,
        clienteNombre: clientesRes.data?.find(cliente => cliente.id === c.cliente_id)?.nombre || 'Sin cliente',
        fechaVencimiento: c.fecha_vencimiento,
        fechaEmision: c.fecha_emision
      })));

      const totalIngresos = ingRes.data?.reduce((s, i) => s + i.monto, 0) || 0;
      const ingresosCobrados = ingRes.data?.filter(i => i.estado === 'Cobrado').reduce((s, i) => s + i.monto, 0) || 0;
      const totalEgresos = egrRes.data?.reduce((s, e) => s + e.monto, 0) || 0;
      const totalPorCobrar = cpcRes.data?.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + c.monto, 0) || 0;

      setDashboardData({
        totalIngresos,
        ingresosCobrados,
        totalEgresos,
        balance: ingresosCobrados - totalEgresos,
        totalPorCobrar
      });
    } catch (err) {
      console.error('Error cargando finanzas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addIngreso = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const payload = {
      tipo: data.tipo || 'Proyecto',
      concepto: data.concepto,
      monto: data.monto,
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      proyecto_id: (data.proyecto_id ?? data.proyectoId) || null,
      cliente_id: (data.cliente_id ?? data.clienteId) || null,
      estado: data.estado || 'Pendiente',
      metodo: data.metodo || 'Pendiente',
      user_id: user.id
    };
    
    const { data: nuevo, error } = await supabase
      .from('ingresos')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    setIngresos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addEgreso = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nuevo, error } = await supabase
      .from('egresos')
      .insert([{ ...data, user_id: user.id, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setEgresos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addCuentaPorCobrar = async (data) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('cuentas_por_cobrar')
      .insert([{ 
        cliente_id: data.cliente_id ?? data.clienteId,
        proyecto_id: (data.proyecto_id ?? data.proyectoId) || null,
        concepto: data.concepto,
        monto: data.monto,
        user_id: user.id,
        fecha_emision: (data.fecha_emision ?? data.fechaEmision) || new Date().toISOString().split('T')[0],
        fecha_vencimiento: data.fecha_vencimiento ?? data.fechaVencimiento,
        estado: 'Pendiente'
      }])
      .select()
      .single();
    if (error) throw error;
    setCuentasPorCobrar(prev => [...prev, nueva]);
    return nueva;
  };

  const marcarComoCobrada = async (id) => {
    const { error } = await supabase
      .from('cuentas_por_cobrar')
      .update({ estado: 'Cobrada' })
      .eq('id', id)
      .eq('user_id', user?.id);
    if (error) throw error;
    setCuentasPorCobrar(prev => prev.map(c => c.id === id ? { ...c, estado: 'Cobrada' } : c));
  };

  const marcarCuentaComoCobrada = marcarComoCobrada;

  return {
    ingresos,
    egresos,
    cuentasPorCobrar,
    clientes,
    dashboardData,
    loading,
    error,
    addIngreso,
    addEgreso,
    addCuentaPorCobrar,
    marcarComoCobrada,
    marcarCuentaComoCobrada,
    refetch: fetchData
  };
};

export default useFinanzas;
