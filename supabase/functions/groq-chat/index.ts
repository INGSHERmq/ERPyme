import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan variables de entorno de Supabase (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)');
    }

    if (!groqApiKey) {
      throw new Error('Falta la variable de entorno GROQ_API_KEY en Supabase. Asegúrate de configurarla ejecutando "supabase secrets set GROQ_API_KEY=..."');
    }

    // Authenticate user session
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado. Debes iniciar sesión en la plataforma.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Get the request body
    const body = await req.json();

    // Call the official Groq completions API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API Error: ${errorText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: groqResponse.status
      });
    }

    const responseData = await groqResponse.json();

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
