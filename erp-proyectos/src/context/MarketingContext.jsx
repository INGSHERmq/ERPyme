import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MarketingContext = createContext();

export const MarketingProvider = ({ children }) => {
  const [clientes, setClientes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientesRes, cotizacionesRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('v_cotizaciones_completas').select('*').order('fecha', { ascending: false })
      ]);
      if (clientesRes.error) throw clientesRes.error;
      if (cotizacionesRes.error) throw cotizacionesRes.error;
      setClientes(clientesRes.data || []);
      setCotizaciones(cotizacionesRes.data || []);
    } catch (err) {
      console.error('Error cargando marketing:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCliente = async (data) => {
    const { data: nuevo, error } = await supabase
      .from('clientes')
      .insert([{ ...data, creado: new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  const addCotizacion = async (data) => {
    const { data: nueva, error } = await supabase
      .from('cotizaciones')
      .insert([{ ...data, fecha: data.fecha || new Date().toISOString().split('T')[0] }])
      .select()
      .single();
    if (error) throw error;
    setCotizaciones(prev => [...prev, nueva]);
    return nueva;
  };

  return (
    <MarketingContext.Provider value={{ 
      clientes, 
      cotizaciones, 
      loading, 
      error,
      addCliente, 
      addCotizacion,
      refetch: fetchData 
    }}>
      {children}
    </MarketingContext.Provider>
  );
};

export default MarketingContext;