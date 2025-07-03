
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  const profile = await getOrCreateUserProfile(userId);

  if (!profile) {
    notFound();
  }
  
  const reviews = await getReviewsByUserId(userId);
  
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={profile} initialReviews={reviews} />
    </Suspense>
  );
}
