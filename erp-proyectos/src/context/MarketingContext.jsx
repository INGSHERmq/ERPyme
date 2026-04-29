import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const MarketingContext = createContext();

export const MarketingProvider = ({ children }) => {
  const [clientes, setClientes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ useEffect refactorizado con patrón isMounted + async/await
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (isMounted) setLoading(true);
        
        const [clientesRes, cotizacionesRes, proyectosRes] = await Promise.all([
          axios.get('http://localhost:3001/api/clientes'),
          axios.get('http://localhost:3001/api/cotizaciones'),
          axios.get('http://localhost:3001/api/proyectos')
        ]);
        
        if (isMounted) {
          setClientes(clientesRes.data);
          setCotizaciones(cotizacionesRes.data);
          setProyectos(proyectosRes.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error cargando datos de marketing:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const [clientesRes, cotizacionesRes, proyectosRes] = await Promise.all([
        axios.get('http://localhost:3001/api/clientes'),
        axios.get('http://localhost:3001/api/cotizaciones'),
        axios.get('http://localhost:3001/api/proyectos')
      ]);
      setClientes(clientesRes.data);
      setCotizaciones(cotizacionesRes.data);
      setProyectos(proyectosRes.data);
    } catch (error) {
      console.error('Error recargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCliente = async (data) => {
    const res = await axios.post('http://localhost:3001/api/clientes', data);
    setClientes(prev => [...prev, res.data]);
    return res.data;
  };

  const addCotizacion = async (data) => {
    const res = await axios.post('http://localhost:3001/api/cotizaciones', data);
    setCotizaciones(prev => [...prev, res.data]);
    return res.data;
  };

  return (
    <MarketingContext.Provider value={{ 
      clientes, 
      cotizaciones, 
      proyectos,
      loading, 
      addCliente, 
      addCotizacion,
      refetch 
    }}>
      {children}
    </MarketingContext.Provider>
  );
};

export default MarketingContext;