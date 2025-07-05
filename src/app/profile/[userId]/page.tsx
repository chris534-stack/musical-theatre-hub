

import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  let profile: UserProfile | null = null;
  let reviews: Review[] = [];
  let errorState: string | null = null;
  
  try {
    profile = await getOrCreateUserProfile(userId);
    
    if (profile) {
      reviews = await getReviewsByUserId(userId);
    } else {
      notFound();
    }
  } catch (error) {
    console.error("Failed to render profile page:", error);
    errorState = "There was a problem loading this profile. It may be due to a temporary network issue. Please refresh the page to try again.";
  }
    
  if (errorState) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    notFound();
  }
  
  // Manually construct a plain, serializable profile object to pass to the client
  const serializableProfile: UserProfile = {
      userId: profile.userId,
      displayName: profile.displayName || 'New User',
      photoURL: profile.photoURL || '',
      email: profile.email || '',
      bio: profile.bio || '',
      roleInCommunity: profile.roleInCommunity || 'Audience',
      communityStartDate: profile.communityStartDate || '',
      galleryImageUrls: profile.galleryImageUrls || [],
      coverPhotoUrl: profile.coverPhotoUrl || '',
      showEmail: profile.showEmail || false,
      authStatus: profile.authStatus || 'active',
  };

  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={serializableProfile} initialReviews={reviews} />
    </Suspense>
  );
}
