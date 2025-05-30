import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The Supabase client will automatically handle the auth callback
    // by processing the URL hash params
    const handleAuthCallback = async () => {
      try {
        // Add some logging to help debugging
        console.log('Auth callback page loaded, processing authentication...');
        
        // This will handle the PKCE flow
        // The session will be automatically set in the Supabase client
        // We just need to redirect the user after it's complete
        
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error.message);
          // Redirect to homepage on error
          router.push('/');
          return;
        }

        if (session) {
          console.log('Authentication successful, redirecting...');
          // Redirect to the page the user was trying to access or to a default page
          const redirectTo = localStorage.getItem('redirectTo') || '/';
          localStorage.removeItem('redirectTo'); // Clear the stored redirect
          router.push(redirectTo);
        } else {
          console.log('No session found, redirecting to homepage');
          router.push('/');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        router.push('/');
      }
    };

    // Run the callback handler
    handleAuthCallback();
  }, [router]);

  // Show a simple loading state while processing
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column' 
    }}>
      <h2>Signing you in...</h2>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  );
}
