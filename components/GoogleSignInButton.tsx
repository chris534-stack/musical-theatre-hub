import React from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GoogleSignInButton({ onSignedIn }: { onSignedIn?: (user: any) => void }) {
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert('Sign in failed: ' + error.message);
    } else {
      // Supabase handles redirect and session automatically.
      // Optionally, you can listen for auth state changes elsewhere to get the user.
      if (onSignedIn) {
        // You may want to fetch the user from supabase.auth.getUser() here if needed.
        const { data: { user } } = await supabase.auth.getUser();
        onSignedIn(user);
      }
    }
  };


  return (
    <button onClick={handleSignIn} style={{
      background: '#fff',
      color: '#444',
      border: '1px solid #ccc',
      borderRadius: 6,
      padding: '10px 18px',
      fontWeight: 500,
      fontSize: '1rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    }}>
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={22} height={22} style={{marginRight: 8}} />
      Sign in with Google
    </button>
  );
}
