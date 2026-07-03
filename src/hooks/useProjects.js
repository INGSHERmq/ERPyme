import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';
import { traducirError } from '../lib/errores';

const dedupeProjectsByQuote = (projects) => {
  const byQuoteId = new Map();
  const deduped = [];

  projects.forEach((project) => {
    const quoteId = project.cotizacion_id || Number(project.nombre?.match(/Proyecto cotizacion #(\d+)/)?.[1]);
    if (!quoteId) {
      deduped.push(project);
      return;
    }

    const key = Number(quoteId);
    const existing = byQuoteId.get(key);
    if (!existing) {
      byQuoteId.set(key, { index: deduped.length, project });
      deduped.push(project);
      return;
    }

    if (!existing.project.cotizacion_id && project.cotizacion_id) {
      byQuoteId.set(key, { index: existing.index, project });
      deduped[existing.index] = project;
    }
  });

  return deduped;
};

const useProjects = () => {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    if (!user?.id) {
      setProyectos([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('v_proyectos_completos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProyectos(dedupeProjectsByQuote(data || []));
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
      setError(traducirError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchProjects(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateProyecto = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('proyectos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      return true;
    } catch (err) {
      console.error('Error actualizando:', err);
      return false;
    }
  };

  const createProyecto = async (newProject) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .insert([{ ...newProject, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setProyectos((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creando:', err);
      return null;
    }
  };

  const deleteProyecto = async (id) => {
    try {
      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      setProyectos((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      console.error('Error eliminando:', err);
      return false;
    }
  };

  return {
    proyectos,
    loading,
    error,
    updateProyecto,
    createProyecto,
    deleteProyecto,
    refetch: fetchProjects,
  };
};

export default useProjects;
