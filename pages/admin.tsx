import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Head from 'next/head';

const ADMIN_EMAILS = [
  "christopher.ridgley@gmail.com",
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [])
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth hash in URL after redirect
    if (window.location.hash.includes('access_token')) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data?.user || null);
        setLoading(false);
      });
      // Remove hash from URL for cleanliness
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      const getUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        setUser(data?.user || null);
        setLoading(false);
      };
      getUser();
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const isAdmin = user && typeof user.email === 'string' && ADMIN_EMAILS.includes(user.email);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f6' }}>Loading...</div>;
  }

  if (!user || !isAdmin) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9f9f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Head>
          <title>Admin Login | Our Stage, Eugene</title>
        </Head>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px 0 rgba(46,58,89,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: '#2e3a59', fontWeight: 800, marginBottom: 8, fontSize: '2rem', letterSpacing: '0.5px' }}>Admin Login</h1>
          <p style={{ color: '#4b5d8c', marginBottom: 28, fontSize: '1.08rem' }}>
            Please sign in with your authorized email to access the admin dashboard.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({ provider: 'google' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: '#fff',
              color: '#2e3a59',
              border: '1.5px solid #2e3a59',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.7rem 1.5rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2e3a59';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              (e.currentTarget as HTMLButtonElement).style.color = '#2e3a59';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', height: 22 }}>
              <svg width="22" height="22" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
  <g>
    <path fill="#4285F4" d="M533.5 278.4c0-17.6-1.6-35-4.8-51.7H272v97.8h146.9c-6.3 34.1-25.2 62.9-53.7 82.2v68.2h86.9c51.1-47.1 80.4-116.4 80.4-196.5z"/>
    <path fill="#34A853" d="M272 544.3c72.6 0 133.6-24.1 178.1-65.5l-86.9-68.2c-24.1 16.2-54.8 25.8-91.2 25.8-70.2 0-129.7-47.5-151-111.4H31.1v69.8C75.2 486.1 167.2 544.3 272 544.3z"/>
    <path fill="#FBBC05" d="M121 324.9c-10.1-29.9-10.1-62.1 0-92l-69.9-69.8C7.1 207.8 0 239.7 0 272.2c0 32.5 7.1 64.4 21.1 94.1l69.9-69.8z"/>
    <path fill="#EA4335" d="M272 107.7c39.6 0 75.1 13.6 103.1 40.3l77.4-77.4C405.6 24.1 344.6 0 272 0 167.2 0 75.2 58.2 31.1 153.3l69.9 69.8c21.3-63.9 80.8-111.4 151-111.4z"/>
  </g>
</svg>
            </span>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Head>
        <title>Admin Panel | Our Stage, Eugene</title>
      </Head>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px 0 rgba(46,58,89,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: '#2e3a59', fontWeight: 800, marginBottom: 8, fontSize: '2rem', letterSpacing: '0.5px' }}>Admin Panel</h1>
        <p style={{ color: '#4b5d8c', marginBottom: 28, fontSize: '1.08rem' }}>
          Welcome, {user?.email}!
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
          }}
          style={{
            background: '#ffd700',
            color: '#2e3a59',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.7rem 1.5rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Sign out
        </button>
        {/* TODO: Add event/news management tools here */}
      </div>
    </main>
  );
}
