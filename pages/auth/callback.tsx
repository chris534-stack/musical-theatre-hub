import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

// Define a type for our debug info state
type DebugInfoState = {
  status: string;
  errorMessage: string | null;
  hashParams: string | null;
  urlParams: Record<string, string>;
  domainInfo: {
    href: string;
    host: string;
    origin: string;
  } | null;
  user?: {
    id: string | undefined;
    email: string | undefined;
    authProvider: string | undefined;
  };
};

export default function AuthCallback() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<DebugInfoState>({
    status: 'initializing',
    errorMessage: null,
    hashParams: null,
    urlParams: {},
    domainInfo: null
  });

  useEffect(() => {
    // Capture URL hash for debugging
    const hashParams = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    setDebugInfo((prev: DebugInfoState) => ({ 
      ...prev, 
      hashParams, 
      urlParams: Object.fromEntries(urlParams.entries()),
      domainInfo: {
        href: window.location.href,
        host: window.location.host,
        origin: window.location.origin
      }
    }));

    // The Supabase client will automatically handle the auth callback
    // by processing the URL hash params
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded, processing authentication...');
        setDebugInfo((prev: DebugInfoState) => ({ ...prev, status: 'processing' }));
        
        // Check if there's a code or error in the URL that might indicate an issue
        if (urlParams.get('error')) {
          const errorMsg = urlParams.get('error_description') || urlParams.get('error');
          console.error('OAuth error:', errorMsg);
          setDebugInfo((prev: DebugInfoState) => ({ 
            ...prev, 
            status: 'oauth_error', 
            errorMessage: errorMsg 
          }));
          return;
        }
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error.message);
          setDebugInfo((prev: DebugInfoState) => ({ 
            ...prev, 
            status: 'session_error', 
            errorMessage: error.message 
          }));
          
          // Don't redirect immediately for debugging
          setTimeout(() => {
            router.push('/');
          }, 10000); // Wait 10 seconds so we can see the debug info
          return;
        }

        if (session) {
          console.log('Authentication successful, session found');
          setDebugInfo((prev: DebugInfoState) => ({ 
            ...prev, 
            status: 'authenticated',
            user: {
              id: session.user?.id,
              email: session.user?.email,
              authProvider: session.user?.app_metadata?.provider
            }
          }));
          
          // Redirect to the page the user was trying to access or to a default page
          const redirectTo = localStorage.getItem('redirectTo') || '/';
          localStorage.removeItem('redirectTo'); // Clear the stored redirect
          
          // Short delay to show success before redirecting
          setTimeout(() => {
            router.push(redirectTo);
          }, 2000);
        } else {
          console.log('No session found');
          setDebugInfo((prev: DebugInfoState) => ({ ...prev, status: 'no_session' }));
          
          // Don't redirect immediately for debugging
          setTimeout(() => {
            router.push('/');
          }, 10000); // Wait 10 seconds so we can see the debug info
        }
      } catch (err: any) {
        console.error('Unexpected error during auth callback:', err);
        setDebugInfo((prev: DebugInfoState) => ({ 
          ...prev, 
          status: 'unexpected_error', 
          errorMessage: err.message || 'Unknown error' 
        }));
        
        // Don't redirect immediately for debugging
        setTimeout(() => {
          router.push('/');
        }, 10000); // Wait 10 seconds so we can see the debug info
      }
    };

    // Run the callback handler
    handleAuthCallback();
  }, [router]);

  // Show a loading state with debug information
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h2>Authentication Status: {debugInfo.status}</h2>
      
      {debugInfo.errorMessage && (
        <div style={{
          backgroundColor: '#fff0f0',
          padding: '10px',
          borderRadius: '5px',
          marginTop: '20px',
          maxWidth: '600px'
        }}>
          <h3>Error:</h3>
          <pre style={{whiteSpace: 'pre-wrap'}}>{debugInfo.errorMessage}</pre>
        </div>
      )}
      
      {debugInfo.status === 'authenticated' && (
        <div style={{
          backgroundColor: '#f0fff0',
          padding: '10px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>Authentication Successful!</h3>
          <p>Redirecting you shortly...</p>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#f0f0ff',
        padding: '10px',
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '14px',
        maxWidth: '600px',
        overflow: 'auto'
      }}>
        <h3>Debug Information:</h3>
        <pre style={{whiteSpace: 'pre-wrap'}}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
