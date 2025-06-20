import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[AuthCallback] Processing authentication...');
      setStatusMessage('Verifying session...');

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error')) {
        const errorMsg = urlParams.get('error_description') || urlParams.get('error');
        console.error('[AuthCallback] OAuth error:', errorMsg);
        setStatusMessage(`Authentication failed: ${errorMsg}`);
        router.push('/'); // Redirect immediately on OAuth error
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Error getting session:', error.message);
          setStatusMessage('Error verifying session. Redirecting...');
          router.push('/'); // Redirect immediately on session error
          return;
        }

        if (session) {
          console.log('[AuthCallback] Session found. Determining redirect path...');
          setStatusMessage('Authentication successful. Redirecting...');

          let redirectTo = '/'; // Default redirect
          const currentOrigin = window.location.origin;

          // Priority: Reviewer sign-in flow
          const appMetadataRedirectUrl = session.user?.app_metadata?.redirect_url as string | undefined;
          const isReviewerSignInByMetadata = appMetadataRedirectUrl?.includes('reviewerSignIn=true');
          // document.referrer can be unreliable, but used as a fallback for reviewer flow detection
          const isReviewerSignInByReferrer = document.referrer?.toLowerCase().includes('/get-involved');

          if (session.user?.app_metadata?.provider === 'google' && (isReviewerSignInByMetadata || isReviewerSignInByReferrer)) {
            redirectTo = `${currentOrigin}/get-involved?justSignedIn=true&reviewerSignIn=true#reviewer-signin`;
            console.log(`[AuthCallback] Reviewer flow detected. Redirecting to: ${redirectTo}`);
          } else if (appMetadataRedirectUrl) {
            // Use app_metadata.redirect_url if available, ensuring it's on the current domain
            try {
              const parsedUrl = new URL(appMetadataRedirectUrl);
              // Only allow redirects to the same origin for security
              if (parsedUrl.origin === currentOrigin || appMetadataRedirectUrl.startsWith('/')) {
                redirectTo = appMetadataRedirectUrl.startsWith('/')
                  ? `${currentOrigin}${appMetadataRedirectUrl}`
                  : appMetadataRedirectUrl;
                console.log(`[AuthCallback] Using app_metadata.redirect_url (domain-adjusted): ${redirectTo}`);
              } else {
                console.warn(`[AuthCallback] app_metadata.redirect_url (${appMetadataRedirectUrl}) is for a different origin. Falling back to default.`);
                // redirectTo remains '/'
              }
            } catch (e) {
              console.warn(`[AuthCallback] Error parsing app_metadata.redirect_url (${appMetadataRedirectUrl}). Falling back. Error: ${e}`);
              // redirectTo remains '/' or could use localStorage as a next fallback if desired
            }
          } else {
            // Fallback to localStorage or default
            const storedRedirect = localStorage.getItem('redirectTo');
            if (storedRedirect) {
              // Ensure localStorage redirect is also same-origin or relative
              if (storedRedirect.startsWith('/') || new URL(storedRedirect).origin === currentOrigin) {
                 redirectTo = storedRedirect.startsWith('/') ? `${currentOrigin}${storedRedirect}` : storedRedirect;
                 console.log(`[AuthCallback] Using localStorage redirect: ${redirectTo}`);
              } else {
                console.warn(`[AuthCallback] localStorage redirect (${storedRedirect}) is for a different origin. Falling back to default.`);
                // redirectTo remains '/'
              }
            } else {
              console.log('[AuthCallback] No specific redirect found. Using default:', redirectTo);
            }
          }
          
          if (localStorage.getItem('redirectTo')) {
            localStorage.removeItem('redirectTo'); // Clean up localStorage
          }
          
          // Using window.location.assign for a full navigation, which can be cleaner after auth.
          window.location.assign(redirectTo);

        } else {
          console.log('[AuthCallback] No session found after callback processing. Redirecting to home.');
          setStatusMessage('No active session. Redirecting...');
          router.push('/'); // Redirect immediately if no session
        }
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error during auth callback:', err.message);
        setStatusMessage('An unexpected error occurred. Redirecting...');
        router.push('/'); // Redirect immediately on unexpected error
      }
    };

    handleAuthCallback();
  }, [router]); // router dependency for router.push

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h2>Authenticating...</h2>
      <p>{statusMessage}</p>
      {/* Minimal UI, no debug info directly on page */}
    </div>
  );
}
