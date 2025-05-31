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
  redirectTo?: string; // Add redirectTo to debug info
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
    console.log('Full URL:', window.location.href);
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
        console.log('Session:', session);
        console.log('Error:', error);
        
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
          // First initialize redirectTo, then use it in the debugInfo
          let redirectTo = '/';
          
          setDebugInfo((prev: DebugInfoState) => ({ 
            ...prev, 
            status: 'authenticated',
            user: {
              id: session.user?.id,
              email: session.user?.email,
              authProvider: session.user?.app_metadata?.provider
            }
            // Will set redirectTo later once determined
          }));
          
          // Check if we were in the reviewer application flow
          // Parse the URL that initiated the auth flow from the session
          try {
            console.log('Auth callback - Checking redirect sources');
            console.log('Auth provider:', session.user?.app_metadata?.provider);
            console.log('Auth metadata:', JSON.stringify(session.user?.app_metadata || {}));
            console.log('Referrer:', document.referrer);
            console.log('Current URL:', window.location.href);
            console.log('Current origin:', window.location.origin);
            
            // Simple but effective approach to handle domain differences
            if (session.user?.app_metadata?.provider === 'google') {
              // Get current domain
              const currentOrigin = window.location.origin;
              
              // Check if this was a reviewer application
              const storedRedirect = session.user?.app_metadata?.redirect_url;
              const hasReviewerParams = storedRedirect && storedRedirect.includes('reviewerSignIn=true');
              const referrer = document.referrer;
              const fromGetInvolved = referrer && referrer.toLowerCase().includes('/get-involved');
              
              if (hasReviewerParams || fromGetInvolved) {
                // This is a reviewer application flow - create a domain-aware redirect URL
                redirectTo = `${currentOrigin}/get-involved?justSignedIn=true&reviewerSignIn=true#reviewer-signin`;
                console.log('Reviewer application detected, redirecting to:', redirectTo);
              } else if (storedRedirect) {
                // Try to use stored redirect but ensure it's on the current domain
                try {
                  const parsedUrl = new URL(storedRedirect);
                  // Create new URL with current origin but same path
                  redirectTo = `${currentOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
                  console.log('Using domain-adjusted redirect URL:', redirectTo);
                } catch (e) {
                  // If URL parsing fails, use stored redirect as-is
                  redirectTo = storedRedirect;
                  // Otherwise check if we can reconstruct the redirect URL from referrer
                  if (referrer && referrer.includes('/get-involved')) {
                    // If we came from the get-involved page, redirect back there with params
                    // Add the hash fragment to ensure the modal shows
                    redirectTo = '/get-involved?justSignedIn=true&reviewerSignIn=true#reviewer-signin';
                    console.log('Enhanced redirect URL with hash fragment:', redirectTo);
                  } else {
                    // Fallback to localStorage or default
                    redirectTo = localStorage.getItem('redirectTo') || '/';
                  }
                }
              } else {
                // No specific redirect, use localStorage fallback or homepage
                redirectTo = localStorage.getItem('redirectTo') || '/';
                console.log('Using fallback redirect:', redirectTo);
              }
            } else {
              // Not a Google auth, use standard redirect
              redirectTo = localStorage.getItem('redirectTo') || '/';
              console.log('Non-Google auth, using standard redirect:', redirectTo);
            }
          } catch (e) {
            console.error('Error determining redirect URL:', e);
            // Fallback to localStorage or default
            redirectTo = localStorage.getItem('redirectTo') || '/';
          }
          
          localStorage.removeItem('redirectTo'); // Clear the stored redirect
          
          // Perform a full browser navigation to ensure a clean redirect
          console.log('Redirecting to:', redirectTo);
          console.log('User session:', session.user);
          console.log('Redirecting with window.location.assign to:', redirectTo);
          window.location.assign(redirectTo);
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
