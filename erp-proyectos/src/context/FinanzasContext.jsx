import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FinanzasContext = createContext();

export const FinanzasProvider = ({ children }) => {
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ingRes, egrRes, cpcRes] = await Promise.all([
        supabase.from('ingresos').select('*').order('fecha', { ascending: false }),
        supabase.from('egresos').select('*').order('fecha', { ascending: false }),
        supabase.from('cuentas_por_cobrar').select('*').order('fecha_vencimiento')
      ]);
      if (ingRes.error) throw ingRes.error;
      if (egrRes.error) throw egrRes.error;
      if (cpcRes.error) throw cpcRes.error;

      setIngresos(ingRes.data || []);
      setEgresos(egrRes.data || []);
      setCuentasPorCobrar(cpcRes.data || []);

      // Calcular dashboard
      const totalIngresos = ingRes.data?.reduce((s, i) => s + i.monto, 0) || 0;
      const ingresosCobrados = ingRes.data?.filter(i => i.estado === 'Cobrado').reduce((s, i) => s + i.monto, 0) || 0;
      const totalEgresos = egrRes.data?.reduce((s, e) => s + e.monto, 0) || 0;
      const totalPorCobrar = cpcRes.data?.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + c.monto, 0) || 0;

      setDashboardData({
        totalIngresos, ingresosCobrados, totalEgresos,
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
  }, []);

  const addIngreso = async (data) => {
    const { data: nuevo, error } = await supabase
      .from('ingresos')
      .insert([{ ...data, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setIngresos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addEgreso = async (data) => {
    const { data: nuevo, error } = await supabase
      .from('egresos')
      .insert([{ ...data, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setEgresos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addCuentaPorCobrar = async (data) => {
    const { data: nueva, error } = await supabase
      .from('cuentas_por_cobrar')
      .insert([{ ...data, fecha_emision: data.fecha_emision || new Date().toISOString().split('T')[0], estado: 'Pendiente' }])
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
      .eq('id', id);
    if (error) throw error;
    setCuentasPorCobrar(prev => prev.map(c => c.id === id ? { ...c, estado: 'Cobrada' } : c));
  };

  return (
    <FinanzasContext.Provider value={{ 
      ingresos, egresos, cuentasPorCobrar, dashboardData,
      loading, error,
      addIngreso, addEgreso, addCuentaPorCobrar, marcarComoCobrada,
      refetch: fetchData 
    }}>
      {children}
    </FinanzasContext.Provider>
  );
};

export default FinanzasContext;