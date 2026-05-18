import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_PLANS = new Set(['basic_free', 'intermediate', 'advanced', 'demo_trial']);
const TRIAL_DURATION_DAYS = 14;

type CompleteCompanyBody = {
  nombre_completo?: string;
  nombre_persona?: string;
  documento?: string;
  empresa?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  plan?: string;
  enabled_modules?: string[];
  enabled_features?: string[];
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

    const body = await req.json() as CompleteCompanyBody;
    const user = callerData.user;
    const email = (body.email || user.email || '').trim().toLowerCase();
    const plan = VALID_PLANS.has(body.plan || '') ? body.plan as string : 'basic_free';
    const metadata = user.user_metadata || {};
    const nombrePersona = body.nombre_persona?.trim() || metadata.nombre?.trim();
    const rawNombreCompleto = body.nombre_completo?.trim() || metadata.nombre_completo?.trim();
    const nombreCompleto = nombrePersona || (rawNombreCompleto && rawNombreCompleto !== email ? rawNombreCompleto : '') || email;
    const documento = body.documento || metadata.documento || metadata.dni_ruc || null;
    const direccion = body.direccion || metadata.direccion || null;
    const telefono = body.telefono || metadata.telefono || null;
    const empresaNombre = body.empresa?.trim() || 'Mi empresa';
    const trialStartedAt = plan === 'demo_trial' ? new Date() : null;
    const trialEndsAt = trialStartedAt
      ? new Date(trialStartedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const { data: existingMembership, error: membershipError } = await adminClient
      .from('empresa_usuarios')
      .select('empresa_id, rol, estado')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      return json({ error: membershipError.message }, 400);
    }

    let empresaId = existingMembership?.empresa_id as string | undefined;

    if (empresaId) {
      const { error: companyUpdateError } = await adminClient
        .from('empresas')
        .update({
          nombre: empresaNombre,
          ruc: documento,
          razon_social: empresaNombre,
          direccion,
          telefono,
          email,
          plan,
          estado: 'Activa',
          trial_started_at: trialStartedAt?.toISOString() || null,
          trial_ends_at: trialEndsAt?.toISOString() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', empresaId);

      if (companyUpdateError) return json({ error: companyUpdateError.message }, 400);

      if (!['owner', 'super_admin'].includes(existingMembership?.rol || '')) {
        const { error: roleError } = await adminClient
          .from('empresa_usuarios')
          .update({ rol: 'super_admin', estado: 'Activo' })
          .eq('empresa_id', empresaId)
          .eq('user_id', user.id);

        if (roleError) return json({ error: roleError.message }, 400);
      }
    } else {
      const { data: company, error: companyError } = await adminClient
        .from('empresas')
        .insert({
          nombre: empresaNombre,
          ruc: documento,
          razon_social: empresaNombre,
          direccion,
          telefono,
          email,
          created_by: user.id,
          plan,
          trial_started_at: trialStartedAt?.toISOString() || null,
          trial_ends_at: trialEndsAt?.toISOString() || null,
        })
        .select('id')
        .single();

      if (companyError || !company) {
        return json({ error: companyError?.message || 'No se pudo crear la empresa.' }, 400);
      }

      empresaId = company.id;

      const { error: membershipInsertError } = await adminClient
        .from('empresa_usuarios')
        .insert({
          empresa_id: empresaId,
          user_id: user.id,
          rol: 'super_admin',
          estado: 'Activo',
        });

      if (membershipInsertError) return json({ error: membershipInsertError.message }, 400);
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        nombre_completo: nombreCompleto,
        nombres: nombrePersona || nombreCompleto,
        documento_identidad: documento,
        telefono,
        direccion,
        rol: 'super_admin',
        empresa_actual_id: empresaId,
        updated_at: new Date().toISOString(),
      });

    if (profileError) return json({ error: profileError.message }, 400);

    const enabledModules = new Set(body.enabled_modules || []);
    const { data: modules } = await adminClient
      .from('app_module_catalog')
      .select('module_key')
      .eq('activo', true);

    const moduleRows = (modules || []).map((item) => ({
      empresa_id: empresaId,
      user_id: user.id,
      module_key: item.module_key,
      enabled: enabledModules.has(item.module_key),
      updated_by: user.id,
    }));

    if (moduleRows.length) {
      const { error: modulesError } = await adminClient
        .from('user_module_access')
        .upsert(moduleRows, { onConflict: 'user_id,empresa_id,module_key' });

      if (modulesError) return json({ error: modulesError.message }, 400);
    }

    const enabledFeatures = new Set(body.enabled_features || []);
    const { data: features } = await adminClient
      .from('app_feature_catalog')
      .select('feature_key')
      .eq('activo', true);

    const featureRows = (features || []).map((item) => ({
      empresa_id: empresaId,
      user_id: user.id,
      feature_key: item.feature_key,
      enabled: enabledFeatures.has(item.feature_key),
      updated_by: user.id,
    }));

    if (featureRows.length) {
      const { error: featuresError } = await adminClient
        .from('user_feature_access')
        .upsert(featureRows, { onConflict: 'user_id,empresa_id,feature_key' });

      if (featuresError) return json({ error: featuresError.message }, 400);
    }

    return json({ empresa_id: empresaId, plan });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
