
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  const profileData = await getOrCreateUserProfile(userId);

  if (!profileData) {
    notFound();
  }
  
  // Temporarily disable review fetching to isolate the error source.
  // const reviewsData = await getReviewsByUserId(userId);
  const reviewsData = [];
  
  // Force serialization to definitively fix or expose the root cause of the error.
  const profile = JSON.parse(JSON.stringify(profileData));
  const reviews = JSON.parse(JSON.stringify(reviewsData));
  
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={profile} initialReviews={reviews} />
    </Suspense>
  );
}
