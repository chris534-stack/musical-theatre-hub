import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebaseClient'; // Assuming you export 'auth' from firebaseClient.ts

export default function GoogleSignInButton({ onSignedIn }: { onSignedIn?: (user: any) => void }) {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // The signed-in user info.
      const user = result.user;
      if (onSignedIn) {
        onSignedIn(user);
      }
    } catch (error: any) {
      alert('Sign in failed: ' + error.message);
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
