import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use null coalescing to prevent crashes during build when env vars may not be available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Wrap client creation in try/catch to handle build-time env issues
// Define a type for our fallback client that matches the minimal interface we need
type MinimalSupabaseClient = {
  auth: {
    getSession: () => Promise<{data: {session: null | any}, error: null | any}>,
    getUser: () => Promise<{data: {user: null | any}, error: null | any}>,
    onAuthStateChange: () => {data: {subscription: {unsubscribe: () => void}}},
    signInWithOAuth: (options: any) => Promise<{data: null, error: null}>,
    signOut: () => Promise<{error: null}>
  },
  // Add database methods to the type for build-time support
  from: (table: string) => any
};

// The exported supabase client will either be a real SupabaseClient or our minimal version
let supabase: SupabaseClient | MinimalSupabaseClient;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Create a dummy client for build-time that will be properly initialized at runtime
    console.warn('Supabase credentials missing at build time - using fallback');
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: (options: any) => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: (table: string) => ({
        insert: (data: any) => ({
          select: (columns: string) => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        })
      })
    };
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Provide a minimal implementation that won't crash the app
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: (options: any) => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: (table: string) => ({
      insert: (data: any) => ({
        select: (columns: string) => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    })
  };
}

export { supabase };

