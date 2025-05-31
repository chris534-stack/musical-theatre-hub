import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// List of admin emails from environment variable, if available
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : [];

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Get current user session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          // No session means not logged in
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        const currentUser = session.user;
        setUser(currentUser);
        
        // Check if the user's email is in the admin list
        if (currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) {
          setIsAdmin(true);
        } else {
          // Fallback - check if user has admin role in database
          // This could be implemented according to your specific admin management system
          const { data, error: roleError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          
          if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
            console.error('Error checking admin role:', roleError);
          }
          
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Unexpected error in useIsAdmin hook:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setIsAdmin(false);
          setUser(null);
        } else {
          checkAdminStatus();
        }
      }
    );
    
    return () => {
      // Clean up subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  return { isAdmin, isLoading, user };
}
