import { useCallback, useEffect, useState } from 'react';
import { supabase, getCurrentUserProfile, clearStoredAuth } from '../../lib/supabase';
import { AuthContext } from './context';
import { APP_FEATURE_KEYS, ERP_MODULE_KEYS, PLAN_KEYS, getPlanConfig } from '../../config/modules';
import { getTrialStatus } from '../../lib/trial';

const AUTH_TIMEOUT_MS = 8000;

const ADMIN_ROLES = ['admin', 'super_admin', 'owner'];
const COMPANY_OWNER_ROLES = ['owner', 'super_admin'];
const VALID_PLAN_KEYS = Object.values(PLAN_KEYS);

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

const toFullName = (data) => (
  data.nombre_completo || data.nombre || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.email
);

const createDemoPassword = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `Demo-${crypto.randomUUID()}-Erpyme1`;
  }
  return `Demo-${Date.now()}-${Math.random().toString(36).slice(2)}-Erpyme1`;
};

const isSchemaCacheColumnError = (error, columnName) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('schema cache') && message.includes(columnName.toLowerCase());
};

const isMissingRpcError = (error, functionName) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('could not find the function') ||
    (message.includes('schema cache') && message.includes(functionName.toLowerCase())) ||
    message.includes(`${functionName.toLowerCase()}(`)
  );
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [company, setCompany] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const resetAuthState = useCallback(async (error) => {
    if (error) console.error('Auth reset:', error.message || error);
    if (!error || isRecoverableAuthError(error)) await clearStoredAuth();
    setUser(null);
    setProfile(null);
    setMembership(null);
    setCompany(null);
    setEnabledModules([]);
    setEnabledFeatures([]);
  }, []);

  const loadCompany = useCallback(async (empresaId) => {
    if (!empresaId) return null;

    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .maybeSingle();

    if (error) {
      console.error('Error loading company:', error);
      return null;
    }

    return data;
  }, []);

  const reconcileCompanyPlanFromMetadata = useCallback(async (currentUser, currentMembership, currentCompany) => {
    const metadataPlan = currentUser?.user_metadata?.plan;
    const canRepairCompany = COMPANY_OWNER_ROLES.includes(currentMembership?.rol);

    if (!canRepairCompany || !VALID_PLAN_KEYS.includes(metadataPlan)) return currentCompany;
    if (currentCompany?.plan === metadataPlan) return currentCompany;

    const plan = getPlanConfig(metadataPlan);
    const { error } = await supabase.functions.invoke('complete-company-registration', {
      body: {
        nombre_completo: currentUser.user_metadata?.nombre_completo || currentUser.email,
        nombre_persona: currentUser.user_metadata?.nombre || currentUser.user_metadata?.nombre_completo || currentUser.email,
        documento: currentUser.user_metadata?.documento || currentUser.user_metadata?.dni_ruc,
        direccion: currentUser.user_metadata?.direccion,
        empresa: currentUser.user_metadata?.empresa || currentCompany?.nombre || 'Mi empresa',
        email: currentUser.email,
        plan: metadataPlan,
        enabled_modules: plan.modules,
        enabled_features: plan.features
      }
    });

    if (error) {
      console.warn('No se pudo sincronizar el plan de la empresa:', error.message || error);
      return currentCompany;
    }

    return loadCompany(currentMembership.empresa_id);
  }, [loadCompany]);

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

  const loadModulesForUser = useCallback(async (currentUser, currentMembership, currentCompany) => {
    if (!currentUser?.id || !currentMembership?.empresa_id) return [];
    if (getTrialStatus(currentCompany).isExpired) return [];

    const planModules = getPlanConfig(currentCompany?.plan || currentCompany?.plan_key).modules;
    if (ADMIN_ROLES.includes(currentMembership.rol)) return planModules;

    const { data, error } = await supabase
      .from('user_module_access')
      .select('module_key, enabled')
      .eq('user_id', currentUser.id)
      .eq('empresa_id', currentMembership.empresa_id);

    if (error) {
      console.error('Error loading module access:', error);
      return [];
    }

    if (!data?.length) return [];
    return data
      .filter((row) => row.enabled && planModules.includes(row.module_key))
      .map((row) => row.module_key);
  }, []);

  const loadFeaturesForUser = useCallback(async (currentUser, currentMembership, currentCompany) => {
    if (!currentUser?.id || !currentMembership?.empresa_id) return [];
    if (getTrialStatus(currentCompany).isExpired) return [];

    const planFeatures = getPlanConfig(currentCompany?.plan || currentCompany?.plan_key).features;
    if (ADMIN_ROLES.includes(currentMembership.rol)) return planFeatures;

    const { data, error } = await supabase
      .from('user_feature_access')
      .select('feature_key, enabled')
      .eq('user_id', currentUser.id)
      .eq('empresa_id', currentMembership.empresa_id);

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('schema cache')) return planFeatures;
      console.error('Error loading feature access:', error);
      return [];
    }

    if (!data?.length) return planFeatures;
    return data
      .filter((row) => row.enabled && planFeatures.includes(row.feature_key))
      .map((row) => row.feature_key);
  }, []);

  const loadProfileFromSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setMembership(null);
      setCompany(null);
      setEnabledModules([]);
      setEnabledFeatures([]);
      return;
    }

    const result = await withTimeout(getCurrentUserProfile());
    const currentUser = result?.user || session.user;
    const currentProfile = result?.profile || null;
    const currentMembership = await loadMembership(currentUser, currentProfile);

    if (!currentMembership) {
      await supabase.auth.signOut();
      throw new Error('Tu usuario está inactivo o no tiene una membresía activa.');
    }

    const loadedCompany = await loadCompany(currentMembership.empresa_id);
    const currentCompany = await reconcileCompanyPlanFromMetadata(currentUser, currentMembership, loadedCompany);
    const modules = await loadModulesForUser(currentUser, currentMembership, currentCompany);
    const features = await loadFeaturesForUser(currentUser, currentMembership, currentCompany);

    setUser(currentUser);
    setProfile(currentProfile);
    setMembership(currentMembership);
    setCompany(currentCompany);
    setEnabledModules(modules);
    setEnabledFeatures(features);
  }, [loadCompany, loadFeaturesForUser, loadMembership, loadModulesForUser, reconcileCompanyPlanFromMetadata]);

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
              setCompany(null);
              setEnabledModules([]);
              setEnabledFeatures([]);
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

  const registerCompanyAccount = async (payload) => {
    const nombreCompleto = toFullName(payload);
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            nombre: payload.nombre,
            documento: payload.dni_ruc,
            dni_ruc: payload.dni_ruc,
            direccion: payload.direccion,
            telefono: payload.telefono,
            rol: 'super_admin',
            plan: payload.plan,
            empresa: payload.empresa
          }
        }
      })
    );

    if (error) throw error;
    let createdUser = data.user;
    if (!createdUser?.id) throw new Error('No se pudo crear el usuario.');

    if (!data.session) {
      const { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password
        })
      );

      if (signInError) {
        throw new Error('La cuenta se creó, pero Supabase no inició sesión. Desactiva Confirm email en Authentication > Providers > Email y vuelve a intentar iniciar sesión.');
      }

      createdUser = signInData.user || createdUser;
    }

    const plan = getPlanConfig(payload.plan);
    const setupPayload = {
      nombre_completo: nombreCompleto,
      nombre_persona: payload.nombre,
      documento: payload.dni_ruc,
      empresa: payload.empresa,
      direccion: payload.direccion,
      telefono: payload.telefono,
      email: payload.email,
      plan: payload.plan,
      enabled_modules: plan.modules,
      enabled_features: plan.features
    };

    const { error: functionError } = await supabase.functions.invoke('complete-company-registration', {
      body: setupPayload
    });

    if (functionError) {
      const functionUnavailable = String(functionError.message || '').toLowerCase().includes('function not found');
      if (!functionUnavailable) throw functionError;
    }

    if (functionError) {
      const { error: setupError } = await supabase.rpc('complete_company_registration', {
        p_nombre_completo: nombreCompleto,
        p_nombre_persona: payload.nombre,
        p_documento: payload.dni_ruc,
        p_empresa: payload.empresa,
        p_direccion: payload.direccion,
        p_email: payload.email,
        p_plan: payload.plan,
        p_enabled_modules: plan.modules,
        p_enabled_features: plan.features
      });

      if (setupError) {
        if (isSchemaCacheColumnError(setupError, 'plan')) {
          throw new Error('Supabase aun no refresco la columna plan. Ejecuta select pg_notify(' + "'pgrst', 'reload schema'" + '); y vuelve a intentar.');
        }
        throw setupError;
      }
    }

    await checkSession({ refresh: true, silent: true });
    return createdUser;
  };

  const startDemoAccount = async ({ email, telefono }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const phone = telefono.trim();
    const password = createDemoPassword();
    const demoName = `Demo ${normalizedEmail.split('@')[0] || 'ERPyme'}`;
    const demoPayload = {
      nombre: demoName,
      dni_ruc: `DEMO-${Date.now()}`,
      empresa: `Demo ERPyme - ${normalizedEmail}`,
      direccion: 'Demo virtual',
      email: normalizedEmail,
      telefono: phone,
      password,
      confirmPassword: password,
      plan: PLAN_KEYS.DEMO
    };

    return registerCompanyAccount(demoPayload);
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setMembership(null);
    setCompany(null);
    setEnabledModules([]);
    setEnabledFeatures([]);

    try {
      const { error } = await withTimeout(supabase.auth.signOut());
      if (error) throw error;
      await clearStoredAuth();
    } catch (error) {
      await resetAuthState(error);
    }
  };

  const updateProfile = async (updates) => {
    if (!user?.id) throw new Error('No authenticated user');

    const payload = {
      ...updates,
      nombre_completo: updates.nombre_completo || toFullName({ ...profile, ...updates }),
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(payload)
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

  const listManagedUsers = async () => {
    if (!profile?.empresa_actual_id) return [];

    const { data, error } = await supabase.rpc('admin_list_managed_users');
    if (!error && data?.length) {
      return data.map((item) => ({
        id: item.membership_id,
        user_id: item.user_id,
        rol: item.rol,
        estado: item.estado,
        created_at: item.created_at,
        profile: {
          id: item.user_id,
          email: item.email,
          nombre_completo: item.nombre_completo,
          nombres: item.nombres,
          apellidos: item.apellidos,
          fecha_nacimiento: item.fecha_nacimiento,
          telefono: item.telefono,
          documento_identidad: item.documento_identidad,
          direccion: item.direccion,
          cargo: item.cargo,
          departamento: item.departamento
        },
        modules: item.modules || {},
        features: item.features || {}
      }));
    }

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      const functionMissing = (
        msg.includes('could not find the function') ||
        msg.includes('schema cache') ||
        msg.includes('current_empresa_role') ||
        msg.includes('does not exist')
      );
      if (!functionMissing) throw error;
    }

    const { data: users, error: usersError } = await supabase
      .from('empresa_usuarios')
      .select('id, user_id, rol, estado, created_at')
      .eq('empresa_id', profile.empresa_actual_id)
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;
    if (!users?.length) return [];

    const userIds = users.map((item) => item.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, nombre_completo, nombres, apellidos, fecha_nacimiento, telefono, documento_identidad, direccion, cargo, departamento')
      .in('id', userIds);

    const { data: moduleData } = await supabase
      .from('user_module_access')
      .select('user_id, module_key, enabled')
      .eq('empresa_id', profile.empresa_actual_id)
      .in('user_id', userIds);

    const { data: featureData } = await supabase
      .from('user_feature_access')
      .select('user_id, feature_key, enabled')
      .eq('empresa_id', profile.empresa_actual_id)
      .in('user_id', userIds)
      .catch(() => ({ data: [] }));

    const profileMap = new Map((profilesData || []).map((item) => [item.id, item]));
    const modulesMap = new Map();
    const featuresMap = new Map();

    (moduleData || []).forEach((item) => {
      const current = modulesMap.get(item.user_id) || {};
      current[item.module_key] = item.enabled;
      modulesMap.set(item.user_id, current);
    });

    (featureData || []).forEach((item) => {
      const current = featuresMap.get(item.user_id) || {};
      current[item.feature_key] = item.enabled;
      featuresMap.set(item.user_id, current);
    });

    return users.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      rol: item.rol,
      estado: item.estado,
      created_at: item.created_at,
      profile: profileMap.get(item.user_id) || null,
      modules: modulesMap.get(item.user_id) || {},
      features: featuresMap.get(item.user_id) || {}
    }));
  };

  const createManagedUser = async (data) => {
    if (!profile?.empresa_actual_id) throw new Error('No hay empresa seleccionada');

    if (!membership || !ADMIN_ROLES.includes(membership.rol)) {
      throw new Error('No tienes permisos para crear usuarios');
    }

    if (membership.rol === 'admin' && data.rol !== 'user') {
      throw new Error('Un administrador solo puede crear usuarios estandar');
    }

    const plan = getPlanConfig(company?.plan || company?.plan_key);
    const currentUsers = await listManagedUsers();
    const countedUsers = currentUsers.filter((item) => !COMPANY_OWNER_ROLES.includes(item.rol));
    if (plan.userLimit !== null && countedUsers.length >= plan.userLimit) {
      throw new Error(`Tu plan permite crear hasta ${plan.userLimit} usuario(s).`);
    }

    const rpcPayload = {
      p_email: data.email,
      p_password: data.password,
      p_nombre_completo: toFullName(data),
      p_rol: data.rol,
      p_enabled_modules: data.enabledModuleKeys || [],
      p_enabled_features: data.enabledFeatureKeys || [],
      p_metadata: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono,
        documento_identidad: data.documento_identidad,
        direccion: data.direccion,
        cargo: data.cargo,
        departamento: data.departamento
      }
    };

    const functionPayload = {
      email: rpcPayload.p_email,
      password: rpcPayload.p_password,
      nombre_completo: rpcPayload.p_nombre_completo,
      rol: rpcPayload.p_rol,
      enabled_modules: rpcPayload.p_enabled_modules,
      enabled_features: rpcPayload.p_enabled_features,
      metadata: rpcPayload.p_metadata
    };

    const { data: functionData, error } = await supabase.functions.invoke('admin-create-managed-user', {
      body: functionPayload
    });

    if (!error) return;

    // Edge Functions return their useful validation message in the response body.
    // Surface it in the form instead of exposing only an opaque HTTP 400.
    if (functionData?.error) throw new Error(functionData.error);
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json();
        if (body?.error) throw new Error(body.error);
      } catch (responseError) {
        if (responseError instanceof Error && responseError.message !== 'Unexpected end of JSON input') throw responseError;
      }
    }

    const functionUnavailable = String(error.message || '').toLowerCase().includes('function not found');
    if (!functionUnavailable) throw error;

    const { error: rpcError } = await supabase.rpc('admin_create_managed_user', rpcPayload);

    if (rpcError) {
      if (isMissingRpcError(rpcError, 'admin_create_managed_user')) {
        throw new Error('Falta desplegar la Edge Function admin-create-managed-user o crear la RPC admin_create_managed_user en Supabase.');
      }
      throw rpcError;
    }
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
      enabled: enabledModuleKeys.includes(moduleKey),
      updated_by: user?.id
    }));

    const { error } = await supabase.from('user_module_access').upsert(rows, {
      onConflict: 'user_id,empresa_id,module_key'
    });
    if (error) throw error;
  };

  const updateManagedUserFeatures = async (targetUserId, enabledFeatureKeys) => {
    const rows = APP_FEATURE_KEYS.map((featureKey) => ({
      user_id: targetUserId,
      empresa_id: profile?.empresa_actual_id,
      feature_key: featureKey,
      enabled: enabledFeatureKeys.includes(featureKey),
      updated_by: user?.id
    }));

    const { error } = await supabase.from('user_feature_access').upsert(rows, {
      onConflict: 'user_id,empresa_id,feature_key'
    });
    if (error) throw error;
  };

  const setManagedUserPassword = async (targetUserId, newPassword) => {
    const { error } = await supabase.rpc('admin_set_user_password', {
      p_user_id: targetUserId,
      p_new_password: newPassword
    });
    if (error) throw error;
  };

  const appRole = membership?.rol || profile?.rol || 'user';
  const canAccessAdminPanel = ADMIN_ROLES.includes(appRole);
  const canCreateAdmins = ['super_admin', 'owner'].includes(appRole);
  const trialStatus = getTrialStatus(company);

  const value = {
    user,
    profile,
    company,
    loading,
    signIn,
    signUp,
    registerCompanyAccount,
    startDemoAccount,
    signOut,
    updateProfile,
    refreshAccessData,
    createManagedUser,
    listManagedUsers,
    updateManagedUserStatus,
    updateManagedUserModules,
    updateManagedUserFeatures,
    setManagedUserPassword,
    membership,
    appRole,
    enabledModules,
    enabledFeatures,
    trialStatus,
    canAccessFeature: (featureKey) => enabledFeatures.includes(featureKey),
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
