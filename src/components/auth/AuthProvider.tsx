'use client';

import * as React from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isReviewer, setIsReviewer] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const reviewerEmails = (process.env.NEXT_PUBLIC_REVIEWER_EMAILS || '').split(',').filter(e => e);

      if (user) {
        // Admin Check
        if (adminEmail) {
          setIsAdmin(!!user && user.email === adminEmail);
        } else {
          // If not configured, any signed-in user is an admin for testing.
          setIsAdmin(true); 
        }

        // Reviewer Check
        if (reviewerEmails.length > 0) {
            setIsReviewer(reviewerEmails.includes(user.email || ''));
        } else {
            // For testing, if no reviewer emails are set, any logged-in user is a reviewer.
            setIsReviewer(true);
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
