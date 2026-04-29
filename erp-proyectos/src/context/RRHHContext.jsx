import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const RRHHContext = createContext();

export const RRHHProvider = ({ children }) => {
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, asistRes, asigRes, incRes, dashRes] = await Promise.all([
        axios.get('http://localhost:3001/api/rrhh/empleados'),
        axios.get('http://localhost:3001/api/rrhh/asistencias'),
        axios.get('http://localhost:3001/api/rrhh/asignaciones'),
        axios.get('http://localhost:3001/api/rrhh/incidentes'),
        axios.get('http://localhost:3001/api/rrhh/dashboard')
      ]);
      setEmpleados(empRes.data);
      setAsistencias(asistRes.data);
      setAsignaciones(asigRes.data);
      setIncidentes(incRes.data);
      setDashboardData(dashRes.data);
    } catch (error) {
      console.error('Error cargando datos de RRHH:', error);
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

  const addEmpleado = async (data) => {
    const res = await axios.post('http://localhost:3001/api/rrhh/empleados', data);
    setEmpleados(prev => [...prev, res.data]);
    return res.data;
  };

  const addAsistencia = async (data) => {
    const res = await axios.post('http://localhost:3001/api/rrhh/asistencias', data);
    setAsistencias(prev => [...prev, res.data]);
    return res.data;
  };

  const addAsignacion = async (data) => {
    const res = await axios.post('http://localhost:3001/api/rrhh/asignaciones', data);
    setAsignaciones(prev => [...prev, res.data]);
    return res.data;
  };

  const addIncidente = async (data) => {
    const res = await axios.post('http://localhost:3001/api/rrhh/incidentes', data);
    setIncidentes(prev => [...prev, res.data]);
    return res.data;
  };

  return (
    <RRHHContext.Provider value={{ 
      empleados, asistencias, asignaciones, incidentes, dashboardData, 
      loading, addEmpleado, addAsistencia, addAsignacion, addIncidente, refetch 
    }}>
      {children}
    </RRHHContext.Provider>
  );
};

export default RRHHContext;