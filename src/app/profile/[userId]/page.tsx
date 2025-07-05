
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  const profile = await getOrCreateUserProfile(userId);
  
  if (profile) {
    const reviews = await getReviewsByUserId(userId);
  
    // Manually construct a plain, serializable profile object to pass to the client.
    // This is a safeguard to ensure no complex objects like Dates are passed.
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
  } else {
    // If profile is null, call notFound() and nothing else.
    // This prevents the server from crashing by trying to access a null object.
    notFound();
  }
}
