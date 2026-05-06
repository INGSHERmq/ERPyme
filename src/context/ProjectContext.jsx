import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_proyectos_completos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProyectos(data || []);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchData(); })();
  }, []);

  const updateProyecto = async (id, updates) => {
    const { error } = await supabase
      .from('proyectos')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProyecto = async (id) => {
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) throw error;
    setProyectos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProjectContext.Provider value={{ 
      proyectos, 
      loading, 
      error, 
      updateProyecto, 
      deleteProyecto,
      refetch: fetchData 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
