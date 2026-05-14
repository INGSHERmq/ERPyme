import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_ROLES = ['admin', 'super_admin', 'owner'];
const COMPANY_OWNER_ROLES = ['owner', 'super_admin'];

const PLAN_LIMITS: Record<string, number | null> = {
  basic_free: 1,
  intermediate: 10,
  advanced: null,
};

type CreateManagedUserBody = {
  email?: string;
  password?: string;
  nombre_completo?: string;
  rol?: string;
  enabled_modules?: string[];
  enabled_features?: string[];
  metadata?: Record<string, unknown>;
};

const json = (body: unknown, status = 200) => (
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Faltan variables de entorno de Supabase en la Edge Function.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) {
      return json({ error: 'Sesion no valida.' }, 401);
    }

    const body = await req.json() as CreateManagedUserBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password || '';
    const rol = body.rol || 'user';
    const nombreCompleto = body.nombre_completo?.trim() || email;
    const metadata = body.metadata || {};

    if (!email || !password || !nombreCompleto) {
      return json({ error: 'Email, password y nombre completo son obligatorios.' }, 400);
    }

    if (password.length < 8) {
      return json({ error: 'La contrasena debe tener al menos 8 caracteres.' }, 400);
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('empresa_usuarios')
      .select('empresa_id, rol, estado')
      .eq('user_id', callerData.user.id)
      .eq('estado', 'Activo')
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      return json({ error: 'No tienes una membresia activa.' }, 403);
    }

    if (!ADMIN_ROLES.includes(membership.rol)) {
      return json({ error: 'No tienes permisos para crear usuarios.' }, 403);
    }

    if (membership.rol === 'admin' && rol !== 'user') {
      return json({ error: 'Un administrador solo puede crear usuarios estandar.' }, 403);
    }

    const { data: company, error: companyError } = await adminClient
      .from('empresas')
      .select('id, plan')
      .eq('id', membership.empresa_id)
      .maybeSingle();

    if (companyError || !company) {
      return json({ error: 'No se encontro la empresa activa.' }, 404);
    }

    const planLimit = PLAN_LIMITS[company.plan || 'basic_free'] ?? PLAN_LIMITS.basic_free;
    if (planLimit !== null) {
      const { data: companyUsers, error: usersError } = await adminClient
        .from('empresa_usuarios')
        .select('rol')
        .eq('empresa_id', membership.empresa_id);

      if (usersError) {
        return json({ error: usersError.message }, 400);
      }

      const countedUsers = (companyUsers || []).filter((item) => !COMPANY_OWNER_ROLES.includes(item.rol));
      if (countedUsers.length >= planLimit) {
        return json({ error: `Tu plan permite crear hasta ${planLimit} usuario(s).` }, 400);
      }
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        ...metadata,
        nombre_completo: nombreCompleto,
        rol,
      },
    });

    if (createError || !created.user) {
      return json({ error: createError?.message || 'No se pudo crear el usuario en Supabase Auth.' }, 400);
    }

    const profilePayload = {
      id: created.user.id,
      email,
      nombre_completo: nombreCompleto,
      rol,
      empresa_actual_id: membership.empresa_id,
      nombres: metadata.nombres ?? null,
      apellidos: metadata.apellidos ?? null,
      fecha_nacimiento: metadata.fecha_nacimiento || null,
      telefono: metadata.telefono ?? null,
      documento_identidad: metadata.documento_identidad ?? null,
      direccion: metadata.direccion ?? null,
      cargo: metadata.cargo ?? null,
      departamento: metadata.departamento ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await adminClient.from('profiles').upsert(profilePayload);
    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }

    const { error: relationError } = await adminClient.from('empresa_usuarios').insert({
      empresa_id: membership.empresa_id,
      user_id: created.user.id,
      rol,
      estado: 'Activo',
    });

    if (relationError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: relationError.message }, 400);
    }

    const enabledModules = new Set(body.enabled_modules || []);
    const { data: modules } = await adminClient
      .from('app_module_catalog')
      .select('module_key')
      .eq('activo', true);

    const moduleRows = (modules || []).map((item) => ({
      empresa_id: membership.empresa_id,
      user_id: created.user.id,
      module_key: item.module_key,
      enabled: enabledModules.has(item.module_key),
      updated_by: callerData.user.id,
    }));

    if (moduleRows.length) {
      const { error: modulesError } = await adminClient.from('user_module_access').insert(moduleRows);
      if (modulesError) return json({ error: modulesError.message }, 400);
    }

    const enabledFeatures = new Set(body.enabled_features || []);
    const { data: features } = await adminClient
      .from('app_feature_catalog')
      .select('feature_key')
      .eq('activo', true);

    const featureRows = (features || []).map((item) => ({
      empresa_id: membership.empresa_id,
      user_id: created.user.id,
      feature_key: item.feature_key,
      enabled: enabledFeatures.has(item.feature_key),
      updated_by: callerData.user.id,
    }));

    if (featureRows.length) {
      const { error: featuresError } = await adminClient.from('user_feature_access').insert(featureRows);
      if (featuresError) return json({ error: featuresError.message }, 400);
    }

    return json({ user_id: created.user.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
