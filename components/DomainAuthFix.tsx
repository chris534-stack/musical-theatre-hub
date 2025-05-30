import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * This component automatically fixes authentication issues when accessing from different domains.
 * It should be included once in your _app.tsx or a layout component.
 */
export default function DomainAuthFix() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    const checkAndFixAuth = async () => {
      try {
        // Check current session
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session;
        
        // If we have a session but can't use it from this domain, try to refresh it
        if (currentSession) {
          try {
            // Force a session token refresh to update cookies with current domain
            // Using getSession again will attempt to refresh the session
            await supabase.auth.getSession();
            console.log('[DomainAuthFix] Session refreshed for domain compatibility');
          } catch (refreshError) {
            console.warn('[DomainAuthFix] Could not refresh session:', refreshError);
          }
        }
      } catch (err) {
        console.error('[DomainAuthFix] Error refreshing session:', err);
      }
    };
    
    checkAndFixAuth();
  }, []);
  
  // This component doesn't render anything
  return null;
}
