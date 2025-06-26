import type { AppProps } from 'next/app';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';
import '../components/Header.module.css';
import '../components/CalendarView.mobile.css';
import Header from '../components/Header';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useRouter, Router } from 'next/router';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { supabase } from '../lib/supabaseClient';
import MobileNavBar from '../components/MobileNavBar';
import DomainAuthFix from '../components/DomainAuthFix';

// App initialization

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const logSession = async () => {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        console.log('[Global Firebase User]', user);
      });
    };
    logSession();
    Router.events.on('routeChangeComplete', logSession);
    return () => {
      Router.events.off('routeChangeComplete', logSession);
    };
  }, [router]);
  
  // Handle OAuth redirects and ensure proper page refresh for reviewer flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Force rebuild - timestamp: 2025-05-21T17:10:00
    console.log('[OAuth Redirect Debug] Checking for OAuth redirect');
    
    // Check if this is a fresh OAuth redirect
    const isOAuthRedirect = router.asPath.includes('#access_token=');
    if (!isOAuthRedirect) return;
    
    // Get the intended redirect URL (before Supabase added the hash)
    const currentUrl = new URL(window.location.href.split('#')[0]);
    
    // Check if this was a reviewer sign-in
    const wasReviewerSignIn = currentUrl.searchParams.get('reviewerSignIn') === 'true';
    
    if (wasReviewerSignIn) {
      // Update URL to remove OAuth hash but preserve reviewer context
      const cleanUrl = new URL(window.location.origin + currentUrl.pathname); // Use window.location.origin for base
      cleanUrl.searchParams.set('justSignedIn', 'true');
      
      // Use router.replace to avoid adding to history stack
      router.replace(cleanUrl.toString(), undefined, { shallow: false });
    }
  }, [router.asPath, router]);

  return (
    <>
      <Header />
      <Component {...pageProps} />
      <MobileNavBar />
      <div id="global-portal-root" />
      <DomainAuthFix />
      <SpeedInsights />
      <Analytics />
    </>
  );
}

export default MyApp;
