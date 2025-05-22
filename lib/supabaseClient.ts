import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// The createClient function will throw an error if the URL or key is missing or invalid.
// This ensures that the application fails fast if not configured correctly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
