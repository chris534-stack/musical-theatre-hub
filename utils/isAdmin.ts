import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  console.error('Supabase server-side credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) are not set in environment variables. Admin checks will fail.');
  // Fallback to a dummy client if not configured, to prevent crashes on import, though admin checks will fail.
  supabaseAdmin = createClient('http://localhost:54321', 'dummykey');
}

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[requireAdmin] Supabase credentials not configured on server.");
    return false;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("[requireAdmin] No Bearer token found in Authorization header.");
    return false;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.warn("[requireAdmin] Token not found after 'Bearer '.");
    return false;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    console.error("[requireAdmin] Error validating token with Supabase:", error.message);
    return false;
  }

  if (!user || !user.email) {
    console.warn("[requireAdmin] No user or user email found from token.");
    return false;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.error("[requireAdmin] ADMIN_EMAILS environment variable is not set.");
    return false;
  }

  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase());
  const userEmailLower = user.email.toLowerCase();

  const isAdmin = adminEmails.includes(userEmailLower);
  if (!isAdmin) {
    console.log(`[requireAdmin] Access denied for ${user.email}. Not in admin list.`);
  }

  return isAdmin;
}
