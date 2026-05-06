import { useState, useEffect } from 'react';
import { supabase, getCurrentUserProfile, clearStoredAuth } from '../../lib/supabase';
import { AuthContext } from './context';

const isRefreshTokenError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('refresh token') || message.includes('invalid refresh token');
};

const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const clearAuthState = async (error) => {
      if (isRefreshTokenError(error)) await clearStoredAuth();
      if (!isMounted) return;
      setUser(null);
      setProfile(null);
    };

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        if (sessionError) throw sessionError;

        if (session?.user) {
          const result = await withTimeout(getCurrentUserProfile(), 5000);
          if (isMounted) {
            setUser(result?.user || session.user);
            setProfile(result?.profile || null);
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking session o Timeout:', error.message);
        await clearAuthState(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            const result = await getCurrentUserProfile();
            if (isMounted) {
              setUser(result?.user || session.user);
              setProfile(result?.profile || null);
            }
          } else if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('Error en onAuthStateChange:', error);
          await clearAuthState(error);
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
        console.error('Error al cerrar sesion:', error);
        if (isRefreshTokenError(error)) await clearStoredAuth();
      }
    } catch (err) {
      console.error('Error inesperado en signOut:', err);
      if (isRefreshTokenError(err)) await clearStoredAuth();
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
