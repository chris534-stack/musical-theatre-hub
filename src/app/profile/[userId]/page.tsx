
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
  
  try {
    const rawProfile = await getOrCreateUserProfile(userId);

    if (!rawProfile) {
      notFound();
    }
    
    // Manually construct a plain, serializable profile object to prevent server crashes
    const profile: UserProfile = {
      userId: rawProfile.userId,
      displayName: rawProfile.displayName || 'New User',
      photoURL: rawProfile.photoURL || '',
      email: rawProfile.email || '',
      bio: rawProfile.bio || '',
      roleInCommunity: rawProfile.roleInCommunity || 'Audience',
      communityStartDate: rawProfile.communityStartDate || '',
      galleryImageUrls: rawProfile.galleryImageUrls || [],
      coverPhotoUrl: rawProfile.coverPhotoUrl || '',
      showEmail: rawProfile.showEmail || false,
    };

    // The data is already sanitized by the data-fetching function.
    const reviews = await getReviewsByUserId(userId);
    
    return (
      <Suspense fallback={<ProfileLoading />}>
        <ProfileClientPage initialProfile={profile} initialReviews={reviews} />
      </Suspense>
    );
  } catch (error) {
    console.error("Failed to render profile page:", error);
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            There was a problem loading this profile. It may be due to a temporary network issue. Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
