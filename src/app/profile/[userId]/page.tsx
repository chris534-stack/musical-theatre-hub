
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  let profile: UserProfile | null = null;
  let reviews: Review[] = [];

  try {
    // Attempt to fetch all necessary data for the page
    profile = await getOrCreateUserProfile(userId);
    if (profile) {
      reviews = await getReviewsByUserId(userId);
    }
  } catch (error) {
    console.error(`Failed to fetch data for profile page (user: ${userId}):`, error);
    // If any part of the data fetching fails, treat the profile as not found.
    // This prevents the server component from crashing.
    notFound();
  }
  
  // If the profile is null after the try block (e.g., user doesn't exist at all), show a 404.
  if (!profile) {
    notFound();
  }
  
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
