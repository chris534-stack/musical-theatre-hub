

import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  try {
    const rawProfile = await getOrCreateUserProfile(userId);

    if (!rawProfile) {
      notFound();
    }
    
    const rawReviews = await getReviewsByUserId(userId);

    // Force serialization to prevent "unexpected response" errors.
    // This strips any non-serializable data (like raw Timestamps) before passing to the client component.
    const profile = JSON.parse(JSON.stringify(rawProfile));
    const reviews = JSON.parse(JSON.stringify(rawReviews));
    
    return (
      <Suspense fallback={<ProfileLoading />}>
        <ProfileClientPage initialProfile={profile} initialReviews={reviews} />
      </Suspense>
    );

  } catch (error: any) {
    console.error(`Error loading profile page for user ${userId}:`, error);
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            There was a problem loading this profile. It may be due to a data issue or a temporary server problem. Please try again later.
            <p className="text-xs mt-2 font-mono">Error: {error.message}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
