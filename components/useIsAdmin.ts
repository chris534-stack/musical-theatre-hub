import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Optionally, support multiple admin emails from an env variable
const ADMIN_EMAILS = [
  "christopher.ridgley@gmail.com",
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [])
];

console.log('[useIsAdmin] Hook loaded');

export default function useIsAdmin(): boolean {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user on mount
    supabase.auth.getUser().then(({ data }) => {
      console.log('[useIsAdmin] Supabase getUser() result:', data);
      setUserEmail(data?.user?.email || null);
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
  const isAdmin = !!userEmailLower && adminEmailsLower.includes(userEmailLower);

  // Debugging output
  console.log('[useIsAdmin] userEmail:', userEmail, '| userEmailLower:', userEmailLower);
  console.log('[useIsAdmin] ADMIN_EMAILS:', ADMIN_EMAILS, '| adminEmailsLower:', adminEmailsLower);
  console.log('[useIsAdmin] isAdmin:', isAdmin);

  return isAdmin;
}
