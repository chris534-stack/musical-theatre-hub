import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Optionally, support multiple admin emails from an env variable
const ADMIN_EMAILS = [
  "christopher.ridgley@gmail.com",
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [])
];

// Optional debug mode for local development
const DEBUG_ADMIN = process.env.NEXT_PUBLIC_DEBUG_ADMIN === 'true';

console.log('[useIsAdmin] Hook loaded');

interface UseIsAdminReturn {
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export default function useIsAdmin(): UseIsAdminReturn {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch user on mount
    setLoading(true);
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (authError) {
        console.error('[useIsAdmin] Auth error:', authError);
        setError(new Error(authError.message));
      } else {
        console.log('[useIsAdmin] Supabase getUser() result:', data);
        setUserEmail(data?.user?.email || null);
        setError(null);
      }
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useIsAdmin] Supabase onAuthStateChange:', session);
      setUserEmail(session?.user?.email || null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // Robust admin check: case-insensitive, trimmed
  const adminEmailsLower = ADMIN_EMAILS.map(e => e.toLowerCase().trim());
  const userEmailLower = userEmail?.toLowerCase().trim();
  
  // Check if user is admin based on email or debug mode
  const isEmailAdmin = !!userEmailLower && adminEmailsLower.includes(userEmailLower);
  const isAdmin = isEmailAdmin || DEBUG_ADMIN;

  // Debugging output
  console.log('[useIsAdmin] userEmail:', userEmail, '| userEmailLower:', userEmailLower);
  console.log('[useIsAdmin] ADMIN_EMAILS:', ADMIN_EMAILS, '| adminEmailsLower:', adminEmailsLower);
  console.log('[useIsAdmin] isAdmin:', isAdmin, '| DEBUG_ADMIN:', DEBUG_ADMIN);

  // Return object with all needed properties
  return { isAdmin, loading, error };
}
