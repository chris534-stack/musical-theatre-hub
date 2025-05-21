import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create the Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Using production domain for OAuth flow instead of Supabase domain
    flowType: 'pkce',
    // This will be used as the display name for OAuth screens
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});
