
'use server';

import { createClient } from '@supabase/supabase-js';

// These variables are now expected to be in your .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase credentials are not set in environment variables. Image functionality is disabled.");
        return null;
    }
    // Create a new client for each server action to ensure it's fresh
    return createClient(supabaseUrl, supabaseKey);
}

export { getSupabaseClient };
