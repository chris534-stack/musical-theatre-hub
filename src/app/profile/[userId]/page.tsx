
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  // Step 1: Fetch the profile first, and only the profile.
  const profile = await getOrCreateUserProfile(userId);

  // Step 2: Immediately validate the profile. If it's null, stop everything.
  // This is the critical fix that prevents any further code from running and crashing.
  if (!profile) {
    notFound();
  }

  // Step 3: Only after we have a valid profile, we fetch the reviews.
  const reviews = await getReviewsByUserId(userId);

  // This code is now safe because we know `profile` is not null.
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
