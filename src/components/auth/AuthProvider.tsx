'use client';

import * as React from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUserProfile } from '@/lib/actions';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isReviewer: boolean;
};

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isReviewer: false,
});

// --- FOR TESTING: To skip the login page, provide a mock user object here. ---
// --- To return to normal behavior, set MOCK_USER to null. ---
// --- DO NOT DEPLOY WITH A MOCK USER. ---
const MOCK_USER: User | null = null;


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isReviewer, setIsReviewer] = React.useState(false);

  React.useEffect(() => {
    // --- DEVELOPMENT OVERRIDE TO SKIP LOGIN ---
    if (MOCK_USER) {
        setUser(MOCK_USER);
        // For testing, the mock user is both an admin and a reviewer
        setIsAdmin(true);
        setIsReviewer(true);
        setLoading(false);
        return; // Skip the real auth listener
    }
    // --- END OVERRIDE ---

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        
        // Admin Check
        if (adminEmail) {
          setIsAdmin(user.email === adminEmail);
        } else {
          // If not configured, any signed-in user is an admin for testing.
          setIsAdmin(true); 
        }

        // Reviewer Check - fetch from user profile
        const profileResult = await getOrCreateUserProfile(user.uid);
        if (profileResult.success && profileResult.data) {
          setIsReviewer(profileResult.data.isReviewer || false);
        }

      } else {
        setIsAdmin(false);
        setIsReviewer(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading, isAdmin, isReviewer };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
