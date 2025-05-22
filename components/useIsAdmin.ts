import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Admin emails allowed to access admin features
const ADMIN_EMAILS = [
  "christopher.ridgley@gmail.com",
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [])
];

console.log('[useIsAdmin] Hook loaded');

interface UseIsAdminReturn {
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

// Support both object destructuring and direct boolean access for backwards compatibility
export default function useIsAdmin(): UseIsAdminReturn & { valueOf: () => boolean } {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Check if user is admin based on email
  const isAdmin = !!userEmailLower && adminEmailsLower.includes(userEmailLower);
  
  // Log information only if the user is an admin (for security)
  if (isAdmin) {
    console.log('[useIsAdmin] Admin access granted for:', userEmail);
  }

  // Create result object with valueOf method to maintain backward compatibility
  // This ensures that if the hook is used directly in boolean expressions, it still works
  const result = { isAdmin, loading, error } as UseIsAdminReturn & { valueOf: () => boolean };
  
  // Allow the result to be used directly in boolean contexts by implementing valueOf
  // WARNING: Deprecated usage pattern - always destructure properly instead
  result.valueOf = () => {
    console.warn('[DEPRECATED] Using useIsAdmin() directly as a boolean is insecure. Please destructure it properly: const { isAdmin } = useIsAdmin();');
    return false; // For security, always return false when used in this deprecated way
  };
  
  return result;
}
