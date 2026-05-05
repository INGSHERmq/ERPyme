import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth/useAuth';

const useTareas = (proyectoId) => {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTareas = async () => {
    if (!proyectoId || !user?.id) {
      setTareas([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('v_tareas_completas')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setTareas(data || []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchTareas(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId, user?.id]);

  const createTarea = async (tareaData) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    const { data: nueva, error } = await supabase
      .from('tareas')
      .insert([{ ...tareaData, proyecto_id: proyectoId, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    setTareas(prev => [...prev, nueva]);
    return nueva;
  };

  const updateTarea = async (id, updates) => {
    const { data: actualizada, error } = await supabase
      .from('tareas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user?.id)
      .select()
      .single();
    
    if (error) throw error;
    setTareas(prev => prev.map(t => t.id === id ? actualizada : t));
    return actualizada;
  };

  const deleteTarea = async (id) => {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    
    if (error) throw error;
    setTareas(prev => prev.filter(t => t.id !== id));
  };

  return {
    tareas,
    loading,
    error,
    createTarea,
    updateTarea,
    deleteTarea,
    refetch: fetchTareas
  };
};

export default useTareas;