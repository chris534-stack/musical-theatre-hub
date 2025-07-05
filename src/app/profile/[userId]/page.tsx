

import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  // getOrCreateUserProfile is now guaranteed not to throw a fatal error.
  // It will return null if the user doesn't exist or an unrecoverable error occurs.
  const profile = await getOrCreateUserProfile(userId);
  
  // If the profile is null for any reason (ghost user, doesn't exist, etc.), show a 404.
  // The 'return' is critical to stop execution here.
  if (!profile) {
    return notFound();
  }
  
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
}
