import { useState, useEffect } from 'react';
import { supabase, getCurrentUserProfile } from '../../lib/supabase';
import { AuthContext } from './context';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // ✅ FUNCIÓN DE SEGURIDAD: Evita que la app se quede colgada infinitamente
    const withTimeout = (promise, ms) => {
      let timeoutId;
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
    };

    const checkSession = async () => {
      try {
        // ✅ Le damos 5 segundos máximo. Si no responde, salta al catch.
        const { user: currentUser } = await withTimeout(supabase.auth.getUser(), 5000);
        
        if (currentUser && isMounted) {
          // ✅ También protegemos la carga del perfil
          const result = await withTimeout(getCurrentUserProfile(), 5000);
          setUser(result?.user || null);
          setProfile(result?.profile || null);
        }
      } catch (error) {
        console.error('Error checking session o Timeout:', error.message);
        
        // ✅ SI FALLA POR TIMEOUT, FORZAMOS LIMPIEZA de la caché corrupta
        if (isMounted) {
          await supabase.auth.signOut(); 
          setUser(null);
          setProfile(null);
        }
      } finally {
        // GARANTÍA TOTAL de que el loading se apaga
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const result = await getCurrentUserProfile();
            if (isMounted) {
              setUser(result?.user || session.user);
              setProfile(result?.profile || null);
            }
          } else {
            if (isMounted) {
              setUser(null);
              setProfile(null);
            }
          }
        } catch (error) {
          console.error('Error en onAuthStateChange:', error);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  };

  const signUp = async (email, password, nombre_completo, rol = 'user') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo, rol } }
    });
    if (error) throw error;
    return data.user;
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al contactar Supabase para cerrar sesión:', error);
      }
    } catch (err) {
      console.error('Error inesperado en signOut:', err);
    }
  };

  const updateProfile = async (updates) => {
    if (!user?.id) throw new Error('No authenticated user');
    
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    setProfile(updated);
    return updated;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}