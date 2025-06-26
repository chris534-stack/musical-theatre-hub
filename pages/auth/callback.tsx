import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '../../lib/firebaseClient'; // Import Firebase app instance

// Define a type for debug info state
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
    // Initial state
    status: 'initializing',
    errorMessage: null,
    hashParams: null,
    urlParams: {},
    domainInfo: null
  });

  useEffect(() => {
    const auth = getAuth(firebaseApp); // Get Firebase Auth instance
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

    const handleAuthCallback = async () => {
      console.log('Auth callback page loaded, processing authentication...');
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
        
        // Use Firebase to handle the redirect result
        const result = await getRedirectResult(auth);
        const user = result?.user || auth.currentUser; // Get user from result or current state
        
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

        if (user) {
          console.log('Authentication successful, session found');
          // First initialize redirectTo, then use it in the debugInfo
          let redirectTo = '/';
          
          setDebugInfo((prev: DebugInfoState) => ({ 
            ...prev, 
            status: 'authenticated', // Update status
            user: {
              id: user.uid, // Use Firebase user ID
              email: user.email || 'N/A', // Use Firebase user email
              authProvider: user.providerData?.[0]?.providerId || 'N/A' // Get provider ID
            }
            // Will set redirectTo later once determined
          }));
          
          // Check if we were in the reviewer application flow
          try {
            console.log('Auth callback - Checking redirect sources');
            console.log('Firebase Auth provider:', user.providerData?.[0]?.providerId);
            console.log('Referrer:', document.referrer);
            console.log('Current URL:', window.location.href);
            console.log('Current origin:', window.location.origin);
            
            // Use localStorage to retrieve the intended redirect URL
            const storedRedirect = localStorage.getItem('redirectTo');
            const referrer = document.referrer;
            const currentOrigin = window.location.origin;

            if (storedRedirect) {
              // Check if the stored redirect includes reviewer flow parameters
              const hasReviewerParams = storedRedirect.includes('reviewerSignIn=true');

              if (hasReviewerParams) {
                // If reviewer flow, ensure redirect is to the current origin's get-involved page
                redirectTo = `${currentOrigin}/get-involved?justSignedIn=true&reviewerSignIn=true#reviewer-signin`;
                console.log('Reviewer application flow detected from stored redirect, redirecting to:', redirectTo);
              } else {
                // For other stored redirects, try to use it directly or adjust origin
                try {
                   const parsedUrl = new URL(storedRedirect);
                   // Create new URL with current origin but same path, search, and hash
                   redirectTo = `${currentOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
                   console.log('Using domain-adjusted stored redirect URL:', redirectTo);
                } catch (e) {
                    // If URL parsing fails or it's an external URL, fall back
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
