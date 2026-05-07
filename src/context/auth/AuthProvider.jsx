import { useCallback, useEffect, useState } from 'react';
import { supabase, getCurrentUserProfile, clearStoredAuth } from '../../lib/supabase';
import { AuthContext } from './context';
import { ERP_MODULE_KEYS } from '../../config/modules';

const AUTH_TIMEOUT_MS = 8000;

const isRecoverableAuthError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('refresh token') ||
    message.includes('invalid refresh token') ||
    message.includes('jwt') ||
    message.includes('session') ||
    message.includes('expired') ||
    message.includes('localstorage')
  );
};

const withTimeout = (promise, ms = AUTH_TIMEOUT_MS) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const resetAuthState = useCallback(async (error) => {
    if (error) console.error('Auth reset:', error.message || error);
    if (!error || isRecoverableAuthError(error)) await clearStoredAuth();
    setUser(null);
    setProfile(null);
    setMembership(null);
    setEnabledModules([]);
  }, []);

  const loadModulesForUser = useCallback(async (currentUser, currentProfile, currentMembership) => {
    if (!currentUser?.id) return [];
    if (['super_admin', 'owner'].includes(currentMembership?.rol)) return ERP_MODULE_KEYS;

    const empresaId = currentMembership?.empresa_id || currentProfile?.empresa_actual_id;
    if (!empresaId) return ERP_MODULE_KEYS;

    const { data, error } = await supabase
      .from('user_module_access')
      .select('module_key, enabled')
      .eq('user_id', currentUser.id)
      .eq('empresa_id', empresaId);

    if (error) {
      console.error('Error loading module access:', error);
      return ERP_MODULE_KEYS;
    }

    if (!data?.length) return ERP_MODULE_KEYS;
    return data.filter((row) => row.enabled).map((row) => row.module_key);
  }, []);

  const loadMembership = useCallback(async (currentUser, currentProfile) => {
    if (!currentUser?.id) return null;

    const membershipQuery = supabase
      .from('empresa_usuarios')
      .select('id, empresa_id, rol, estado, created_at')
      .eq('user_id', currentUser.id)
      .eq('estado', 'Activo');

    const { data, error } = currentProfile?.empresa_actual_id
      ? await membershipQuery.eq('empresa_id', currentProfile.empresa_actual_id).limit(1)
      : await membershipQuery.order('created_at', { ascending: true }).limit(1);

    if (error) {
      console.error('Error loading membership:', error);
      return null;
    }

    return data?.[0] || null;
  }, []);

  const loadProfileFromSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    const result = await withTimeout(getCurrentUserProfile());
    const currentUser = result?.user || session.user;
    const currentProfile = result?.profile || null;
    const currentMembership = await loadMembership(currentUser, currentProfile);
    const modules = await loadModulesForUser(currentUser, currentProfile, currentMembership);

    setUser(currentUser);
    setProfile(currentProfile);
    setMembership(currentMembership);
    setEnabledModules(modules);
  }, [loadMembership, loadModulesForUser]);

  const checkSession = useCallback(async ({ refresh = false, silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const sessionResult = refresh
        ? await withTimeout(supabase.auth.refreshSession())
        : await withTimeout(supabase.auth.getSession());

      if (sessionResult.error) throw sessionResult.error;
      await loadProfileFromSession(sessionResult.data?.session);
    } catch (error) {
      await resetAuthState(error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [loadProfileFromSession, resetAuthState]);

  useEffect(() => {
    let isMounted = true;

    const safeCheckSession = async (options) => {
      if (!isMounted) return;
      await checkSession(options);
    };

    safeCheckSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (!isMounted) return;

          try {
            if (event === 'SIGNED_OUT' || !session?.user) {
              setUser(null);
              setProfile(null);
              setMembership(null);
              setEnabledModules([]);
              setLoading(false);
              return;
            }

            await loadProfileFromSession(session);
          } catch (error) {
            await resetAuthState(error);
          } finally {
            if (isMounted) setLoading(false);
          }
        }, 0);
      }
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        safeCheckSession({ refresh: true, silent: true });
      }
    };

    const handleFocus = () => safeCheckSession({ refresh: true, silent: true });

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSession, loadProfileFromSession, resetAuthState]);

  const signIn = async (email, password) => {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password })
    );
    if (error) throw error;
    return data.user;
  };

  const signUp = async (email, password, nombre_completo, rol = 'user') => {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo, rol } }
      })
    );
    if (error) throw error;
    return data.user;
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setMembership(null);
    setEnabledModules([]);

    try {
      const { error } = await withTimeout(supabase.auth.signOut());
      if (error) throw error;
    } catch (error) {
      await resetAuthState(error);
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

  const refreshAccessData = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    await loadProfileFromSession(data?.session);
  }, [loadProfileFromSession]);

  const createManagedUser = async ({ email, password, nombre_completo, rol, enabledModuleKeys }) => {
    if (!profile?.empresa_actual_id) throw new Error('No hay empresa seleccionada');

    if (!membership || !['admin', 'super_admin', 'owner'].includes(membership.rol)) {
      throw new Error('No tienes permisos para crear usuarios');
    }

    if (membership.rol === 'admin' && rol !== 'user') {
      throw new Error('Un administrador solo puede crear usuarios estandar');
    }

    const currentSession = await supabase.auth.getSession();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo } }
    });

    if (signUpError) throw signUpError;
    const createdUser = signUpData?.user;
    if (!createdUser?.id) throw new Error('No se pudo crear el usuario en Auth');

    await supabase.from('profiles').upsert({
      id: createdUser.id,
      email,
      nombre_completo,
      rol,
      empresa_actual_id: profile.empresa_actual_id,
      updated_at: new Date().toISOString()
    });

    const { error: membershipError } = await supabase.from('empresa_usuarios').upsert({
      empresa_id: profile.empresa_actual_id,
      user_id: createdUser.id,
      rol,
      estado: 'Activo'
    }, { onConflict: 'empresa_id,user_id' });

    if (membershipError) throw membershipError;

    const moduleRows = ERP_MODULE_KEYS.map((moduleKey) => ({
      user_id: createdUser.id,
      empresa_id: profile.empresa_actual_id,
      module_key: moduleKey,
      enabled: enabledModuleKeys.includes(moduleKey)
    }));

    const { error: moduleError } = await supabase.from('user_module_access').upsert(moduleRows, {
      onConflict: 'user_id,empresa_id,module_key'
    });

    if (moduleError) throw moduleError;

    if (currentSession?.data?.session) {
      await supabase.auth.setSession({
        access_token: currentSession.data.session.access_token,
        refresh_token: currentSession.data.session.refresh_token
      });
    }
  };

  const listManagedUsers = async () => {
    if (!profile?.empresa_actual_id) return [];

    const { data: users, error: usersError } = await supabase
      .from('empresa_usuarios')
      .select('id, user_id, rol, estado, created_at')
      .eq('empresa_id', profile.empresa_actual_id)
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;
    if (!users?.length) return [];

    const userIds = users.map((item) => item.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, nombre_completo')
      .in('id', userIds);
    if (profilesError) throw profilesError;

    const { data: moduleData, error: moduleError } = await supabase
      .from('user_module_access')
      .select('user_id, module_key, enabled')
      .eq('empresa_id', profile.empresa_actual_id)
      .in('user_id', userIds);
    if (moduleError) throw moduleError;

    const profileMap = new Map((profilesData || []).map((item) => [item.id, item]));
    const modulesMap = new Map();
    (moduleData || []).forEach((item) => {
      const current = modulesMap.get(item.user_id) || {};
      current[item.module_key] = item.enabled;
      modulesMap.set(item.user_id, current);
    });

    return users.map((item) => ({
      ...item,
      profile: profileMap.get(item.user_id) || null,
      modules: modulesMap.get(item.user_id) || {}
    }));
  };

  const updateManagedUserStatus = async (targetUserId, estado) => {
    const { error } = await supabase
      .from('empresa_usuarios')
      .update({ estado })
      .eq('empresa_id', profile?.empresa_actual_id)
      .eq('user_id', targetUserId);
    if (error) throw error;
  };

  const updateManagedUserModules = async (targetUserId, enabledModuleKeys) => {
    const rows = ERP_MODULE_KEYS.map((moduleKey) => ({
      user_id: targetUserId,
      empresa_id: profile?.empresa_actual_id,
      module_key: moduleKey,
      enabled: enabledModuleKeys.includes(moduleKey)
    }));

    const { error } = await supabase.from('user_module_access').upsert(rows, {
      onConflict: 'user_id,empresa_id,module_key'
    });
    if (error) throw error;
  };

  const appRole = membership?.rol || profile?.rol || 'user';
  const canAccessAdminPanel = ['admin', 'super_admin', 'owner'].includes(appRole);
  const canCreateAdmins = ['super_admin', 'owner'].includes(appRole);

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshAccessData,
    createManagedUser,
    listManagedUsers,
    updateManagedUserStatus,
    updateManagedUserModules,
    membership,
    appRole,
    enabledModules,
    canAccessAdminPanel,
    canCreateAdmins,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
