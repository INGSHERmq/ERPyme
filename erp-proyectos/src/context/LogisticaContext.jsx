import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const LogisticaContext = createContext();

export const LogisticaProvider = ({ children }) => {
  const [activos, setActivos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [guias, setGuias] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actRes, asigRes, mantRes, guiasRes, dashRes] = await Promise.all([
        axios.get('http://localhost:3001/api/logistica/activos'),
        axios.get('http://localhost:3001/api/logistica/asignaciones'),
        axios.get('http://localhost:3001/api/logistica/mantenimientos'),
        axios.get('http://localhost:3001/api/logistica/guias'),
        axios.get('http://localhost:3001/api/logistica/dashboard')
      ]);
      setActivos(actRes.data);
      setAsignaciones(asigRes.data);
      setMantenimientos(mantRes.data);
      setGuias(guiasRes.data);
      setDashboardData(dashRes.data);
    } catch (error) {
      console.error('Error cargando datos de logística:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => { if (isMounted) await fetchData(); };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const refetch = () => fetchData();

  const addActivo = async (data) => {
    const res = await axios.post('http://localhost:3001/api/logistica/activos', data);
    setActivos(prev => [...prev, res.data]);
    return res.data;
  };

  const addAsignacion = async (data) => {
    const res = await axios.post('http://localhost:3001/api/logistica/asignaciones', data);
    setAsignaciones(prev => [...prev, res.data]);
    return res.data;
  };

  const devolverAsignacion = async (id) => {
    const res = await axios.put(`http://localhost:3001/api/logistica/asignaciones/${id}`, { estado: 'Devuelta' });
    setAsignaciones(prev => prev.map(a => a.id === id ? res.data : a));
    return res.data;
  };

  const addMantenimiento = async (data) => {
    const res = await axios.post('http://localhost:3001/api/logistica/mantenimientos', data);
    setMantenimientos(prev => [...prev, res.data]);
    return res.data;
  };

  const completarMantenimiento = async (id) => {
    const res = await axios.put(`http://localhost:3001/api/logistica/mantenimientos/${id}`, { estado: 'Completado' });
    setMantenimientos(prev => prev.map(m => m.id === id ? res.data : m));
    return res.data;
  };

  const addGuia = async (data) => {
    const res = await axios.post('http://localhost:3001/api/logistica/guias', data);
    setGuias(prev => [...prev, res.data]);
    return res.data;
  };

  return (
    <LogisticaContext.Provider value={{ 
      activos, asignaciones, mantenimientos, guias, dashboardData, 
      loading, addActivo, addAsignacion, devolverAsignacion, addMantenimiento, completarMantenimiento, addGuia, refetch 
    }}>
      {children}
    </LogisticaContext.Provider>
  );
};

export default LogisticaContext;