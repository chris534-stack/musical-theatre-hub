
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';

// This new async component handles all data fetching and validation.
// If the profile is not found, it calls `notFound()` and this component's
// render process is completely halted by Next.js.
async function ProfileData({ userId }: { userId: string }) {
  // Step 1: Fetch the profile first.
  const profile = await getOrCreateUserProfile(userId);

  // Step 2: Immediately validate. If null, `notFound` will be thrown
  // and caught by Next.js, preventing any further code in this function
  // from executing.
  if (!profile) {
    notFound();
  }

  // Step 3: Only after a valid profile is confirmed, fetch reviews.
  const reviews = await getReviewsByUserId(userId);

  // This code is now guaranteed to be safe because `profile` is not null.
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

  // Only if all data is valid do we render the client component.
  return <ProfileClientPage initialProfile={serializableProfile} initialReviews={reviews} />;
}


// The main page component now just sets up the Suspense boundary.
export default async function ProfilePage({ params }: { params: { userId: string } }) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileData userId={params.userId} />
    </Suspense>
  );
}
