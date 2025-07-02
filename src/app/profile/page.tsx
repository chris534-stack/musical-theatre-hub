'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ProfileLoadingSkeleton() {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
      </div>
    );
}

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is finished, showing the skeleton
    }

    if (user) {
      router.replace(`/profile/${user.uid}`);
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
        <ProfileLoadingSkeleton />
    </div>
  );
}
