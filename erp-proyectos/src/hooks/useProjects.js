import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useProjects = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📥 LEER: Función para cargar proyectos
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_proyectos_completos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProyectos(data || []);
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect con patrón IIFE para evitar warnings
  useEffect(() => {
    (async () => {
      await fetchProjects();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 👈 Dependencias vacías: solo se ejecuta al montar

  // ✏️ ACTUALIZAR: (Mover tarjeta en Scrum, editar, etc.)
  const updateProyecto = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('proyectos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Actualización optimista del estado local
      setProyectos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      
      return true;
    } catch (err) {
      console.error('Error actualizando:', err);
      return false;
    }
  };

  // ➕ CREAR
  const createProyecto = async (newProject) => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .insert([newProject])
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

  // 🗑️ ELIMINAR
  const deleteProyecto = async (id) => {
    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
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