import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f6' }}>Loading...</div>;
  }

  if (!session) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9f9f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Head>
          <title>Admin Login | Eugene Musical Theatre Hub</title>
        </Head>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px 0 rgba(46,58,89,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: '#2e3a59', fontWeight: 800, marginBottom: 8, fontSize: '2rem', letterSpacing: '0.5px' }}>Admin Login</h1>
          <p style={{ color: '#4b5d8c', marginBottom: 28, fontSize: '1.08rem' }}>
            Please sign in with your authorized Google account to access the admin dashboard.
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
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
              <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C34.728 32.091 29.728 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.761 0 5.287.99 7.274 2.617l6.849-6.849C34.346 5.14 29.396 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20c11.046 0 19.87-7.954 19.87-20 0-1.341-.138-2.359-.259-3.333z"/>
                  <path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.12 18.961 13 24 13c2.761 0 5.287.99 7.274 2.617l6.849-6.849C34.346 5.14 29.396 3 24 3c-6.627 0-12 5.373-12 12 0 2.042.516 3.97 1.416 5.691z"/>
                  <path fill="#FBBC05" d="M24 44c5.356 0 10.243-1.797 13.993-4.889l-6.481-5.303C29.726 35.001 27.037 36 24 36c-5.709 0-10.572-3.872-12.303-9.093l-6.535 5.034C7.743 39.625 15.308 44 24 44z"/>
                  <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-1.635 4.091-6.635 7-11.303 7-2.761 0-5.287-.99-7.274-2.617l-6.849 6.849C13.654 42.86 18.604 45 24 45c8.692 0 16.257-4.375 19.838-11.059l-6.535-5.034C34.572 40.128 29.709 44 24 44z"/>
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
        <title>Admin Panel | Eugene Musical Theatre Hub</title>
      </Head>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px 0 rgba(46,58,89,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: '#2e3a59', fontWeight: 800, marginBottom: 8, fontSize: '2rem', letterSpacing: '0.5px' }}>Admin Panel</h1>
        <p style={{ color: '#4b5d8c', marginBottom: 28, fontSize: '1.08rem' }}>
          Welcome, {session.user?.email}!
        </p>
        <button
          onClick={() => signOut()}
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
