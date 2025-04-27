import React from 'react';
import { auth, googleProvider, db } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function GoogleSignInButton({ onSignedIn }: { onSignedIn?: (user: any) => void }) {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Write user info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }, { merge: true });
      if (onSignedIn) onSignedIn(user);
    } catch (err) {
      alert('Sign in failed: ' + (err as Error).message);
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
