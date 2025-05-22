import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for SSR/build contexts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a client only if URL and key are available (important for build process)
let supabase;

// Only initialize the client if we have the required config
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // During build, we create a dummy client that will be replaced at runtime
  // This prevents build errors while ensuring proper initialization in production
  console.warn('Supabase URL or anon key not available - creating minimal client');
  
  // Create a minimal client that won't throw during build but will be replaced at runtime
  // @ts-ignore - We're intentionally creating a minimal implementation
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

export { supabase };
