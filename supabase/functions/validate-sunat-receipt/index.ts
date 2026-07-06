import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
    });

    // 1. Obtener los datos de entrada
    const body = await req.json().catch(() => ({}));
    const { mi_ruc, numRuc, codComp, numeroSerie, numero, fechaEmision, monto } = body;

    if (!mi_ruc || !numRuc || !codComp || !numeroSerie || !numero || !fechaEmision) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Faltan parámetros obligatorios para la consulta.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtener credenciales SUNAT del entorno
    const clientId = Deno.env.get('SUNAT_CLIENT_ID');
    const clientSecret = Deno.env.get('SUNAT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Credenciales API SUNAT (SUNAT_CLIENT_ID o SUNAT_CLIENT_SECRET) no configuradas en el servidor.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Generar el Token de Acceso (Fase B)
    const tokenUrl = `https://api-seguridad.sunat.gob.pe/v1/clientesextranet/${clientId}/oauth2/token/`;
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('scope', 'https://api.sunat.gob.pe/v1/contribuyente/contribuyentes');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        JSON.stringify({ ok: false, error: `Error al obtener token de SUNAT: ${errorText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'SUNAT no retornó un token de acceso válido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Consultar el Comprobante (Fase C)
    const validationUrl = `https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/${mi_ruc}/validarcomprobante`;
    
    // Formatear el monto si existe para cumplir con el estándar (debe ser string con decimales)
    const formattedMonto = monto ? Number(monto).toFixed(2) : '0.00';

    const validationPayload = {
      numRuc,
      codComp,
      numeroSerie,
      numero: String(numero),
      fechaEmision,
      monto: formattedMonto
    };

    const validationResponse = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validationPayload)
    });

    if (!validationResponse.ok) {
      const errorText = await validationResponse.text();
      return new Response(
        JSON.stringify({ ok: false, error: `Error de SUNAT en validación: ${errorText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = await validationResponse.json();

    return new Response(
      JSON.stringify({ ok: true, data: validationResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
