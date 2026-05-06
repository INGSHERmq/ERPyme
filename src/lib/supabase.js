import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const clearStoredAuth = async () => {
  if (typeof window === 'undefined') return;

  Object.keys(window.localStorage)
    .filter(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach(key => window.localStorage.removeItem(key));

  Object.keys(window.sessionStorage)
    .filter(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach(key => window.sessionStorage.removeItem(key));
};

export const getCurrentUserProfile = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return { user, profile };
};
