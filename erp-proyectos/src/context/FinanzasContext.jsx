import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const FinanzasContext = createContext();

export const FinanzasProvider = ({ children }) => {
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ingresosRes, egresosRes, cuentasRes, dashboardRes] = await Promise.all([
        axios.get('http://localhost:3001/api/finanzas/ingresos'),
        axios.get('http://localhost:3001/api/finanzas/egresos'),
        axios.get('http://localhost:3001/api/finanzas/cuentas-por-cobrar'),
        axios.get('http://localhost:3001/api/finanzas/dashboard')
      ]);
      setIngresos(ingresosRes.data);
      setEgresos(egresosRes.data);
      setCuentasPorCobrar(cuentasRes.data);
      setDashboardData(dashboardRes.data);
    } catch (error) {
      console.error('Error cargando datos de finanzas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) await fetchData();
    };
    
    loadData();
    
    return () => { isMounted = false; };
  }, []);

  const refetch = () => fetchData();

  const addIngreso = async (data) => {
    const res = await axios.post('http://localhost:3001/api/finanzas/ingresos', data);
    setIngresos(prev => [...prev, res.data]);
    return res.data;
  };

  const addEgreso = async (data) => {
    const res = await axios.post('http://localhost:3001/api/finanzas/egresos', data);
    setEgresos(prev => [...prev, res.data]);
    return res.data;
  };

  const addCuentaPorCobrar = async (data) => {
    const res = await axios.post('http://localhost:3001/api/finanzas/cuentas-por-cobrar', data);
    setCuentasPorCobrar(prev => [...prev, res.data]);
    return res.data;
  };

  const marcarCuentaComoCobrada = async (id) => {
    const res = await axios.put(`http://localhost:3001/api/finanzas/cuentas-por-cobrar/${id}`, { estado: 'Cobrada' });
    setCuentasPorCobrar(prev => prev.map(c => c.id === id ? res.data : c));
    return res.data;
  };

  return (
    <FinanzasContext.Provider value={{ 
      ingresos, 
      egresos, 
      cuentasPorCobrar, 
      dashboardData,
      loading, 
      addIngreso, 
      addEgreso, 
      addCuentaPorCobrar,
      marcarCuentaComoCobrada,
      refetch 
    }}>
      {children}
    </FinanzasContext.Provider>
  );
};

export default FinanzasContext;