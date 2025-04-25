import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import '../components/Header.module.css';
import Header from '../components/Header';
import dynamic from 'next/dynamic';
const MobileNavBar = dynamic(() => import('../components/MobileNavBar'), { ssr: false });

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...pageProps} />
      <MobileNavBar />
    </SessionProvider>
  );
}

export default MyApp;
