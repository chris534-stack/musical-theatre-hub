'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const GoogleIcon = (props: { className?: string }) => (
    <Image 
      src="/google-logo.png" 
      alt="Google logo" 
      width={24} 
      height={24}
      className={props.className}
      data-ai-hint="google logo"
    />
);

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/profile');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/profile');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (loading || user) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join Our Stage</CardTitle>
          <CardDescription>Sign in to continue to your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full">
            <GoogleIcon className="mr-2 h-6 w-6" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
