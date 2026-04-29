import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Flag para evitar updates si el componente se desmonta

    const loadData = async () => {
      try {
        if (isMounted) setLoading(true);
        const response = await axios.get('http://localhost:3001/api/proyectos');
        if (isMounted) {
          setProyectos(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Error al cargar los proyectos');
          console.error(err);
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

  // Crear proyecto
  const createProyecto = async (nuevoProyecto) => {
    try {
      const response = await axios.post('http://localhost:3001/api/proyectos', nuevoProyecto);
      setProyectos(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      throw err;
    }
  };

  // Actualizar proyecto
  const updateProyecto = async (id, datosActualizados) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/proyectos/${id}`, datosActualizados);
      setProyectos(prev => prev.map(p => p.id === id ? response.data : p));
      return response.data;
    } catch (err) {
      console.error('Error al actualizar proyecto:', err);
      throw err;
    }
  };

  // Eliminar proyecto
  const deleteProyecto = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/proyectos/${id}`);
      setProyectos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      throw err;
    }
  };

  // Función de refetch manual
  const refetch = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/proyectos');
      setProyectos(response.data);
      setError(null);
    } catch (err) {
      setError('Error al recargar los proyectos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      proyectos, 
      loading, 
      error, 
      createProyecto, 
      updateProyecto, 
      deleteProyecto,
      refetch
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;