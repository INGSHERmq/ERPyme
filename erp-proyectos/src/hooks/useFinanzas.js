import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useFinanzas = () => {
  const { user } = useAuth();
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [ingRes, egrRes, cpcRes] = await Promise.all([
        supabase.from('ingresos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('egresos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
        supabase.from('cuentas_por_cobrar').select('*').eq('user_id', user.id).order('fecha_vencimiento')
      ]);

      if (ingRes.error) throw ingRes.error;
      if (egrRes.error) throw egrRes.error;
      if (cpcRes.error) throw cpcRes.error;

      setIngresos(ingRes.data || []);
      setEgresos(egrRes.data || []);
      setCuentasPorCobrar(cpcRes.data || []);

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
    
    const { data: nuevo, error } = await supabase
      .from('ingresos')
      .insert([{ ...data, user_id: user.id, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
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
        ...data, 
        user_id: user.id,
        fecha_emision: data.fecha_emision || new Date().toISOString().split('T')[0],
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

  return {
    ingresos,
    egresos,
    cuentasPorCobrar,
    dashboardData,
    loading,
    error,
    addIngreso,
    addEgreso,
    addCuentaPorCobrar,
    marcarComoCobrada,
    refetch: fetchData
  };
};

export default useFinanzas;