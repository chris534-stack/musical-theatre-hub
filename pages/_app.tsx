import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import '../components/Header.module.css';
import '../components/CalendarView.mobile.css';
import Header from '../components/Header';
import dynamic from 'next/dynamic';
const MobileNavBar = dynamic(() => import('../components/MobileNavBar'), { ssr: false });

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...pageProps} />
      <MobileNavBar />
      <div id="global-portal-root" />
    </SessionProvider>
  );
}

export default MyApp;
