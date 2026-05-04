import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useTareas = (proyectoId) => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Función asíncrona definida AFUERA del useEffect
  const fetchTareas = async () => {
    if (!proyectoId) {
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

  // ✅ useEffect con patrón IIFE para evitar warnings
  useEffect(() => {
    (async () => {
      await fetchTareas();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const createTarea = async (tareaData) => {
    const {  nueva, error } = await supabase
      .from('tareas')
      .insert([{ ...tareaData, proyecto_id: proyectoId }])
      .select()
      .single();
    
    if (error) throw error;
    setTareas(prev => [...prev, nueva]);
    return nueva;
  };

  const updateTarea = async (id, updates) => {
    const {  actualizada, error } = await supabase
      .from('tareas')
      .update(updates)
      .eq('id', id)
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
      .eq('id', id);
    
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