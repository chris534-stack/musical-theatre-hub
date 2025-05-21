import type { AppProps } from 'next/app';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';
import '../components/Header.module.css';
import '../components/CalendarView.mobile.css';
import Header from '../components/Header';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
const MobileNavBar = dynamic(() => import('../components/MobileNavBar'), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const logSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      console.log('[Global Supabase Session]', session);
      console.log('[Global Supabase User]', userData?.user);
      if (error) console.error('[Supabase getSession error]', error);
    };
    logSession();
    router.events?.on('routeChangeComplete', logSession);
    return () => {
      router.events?.off('routeChangeComplete', logSession);
    };
  }, [router]);
  
  // Handle OAuth redirects and ensure proper page refresh for reviewer flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if this is a fresh OAuth redirect
    const isOAuthRedirect = router.asPath.includes('#access_token=');
    if (!isOAuthRedirect) return;
    
    // Get the intended redirect URL (before Supabase added the hash)
    const currentUrl = new URL(window.location.href.split('#')[0]);
    
    // Check if this was a reviewer sign-in
    const wasReviewerSignIn = currentUrl.searchParams.get('reviewerSignIn') === 'true';
    
    if (wasReviewerSignIn) {
      // Update URL to remove OAuth hash but preserve reviewer context
      const cleanUrl = new URL(currentUrl);
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
      <SpeedInsights />
      <Analytics />
    </>
  );
}

export default MyApp;
