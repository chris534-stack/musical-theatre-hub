
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import type { Review, UserProfile } from '@/lib/types';


export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  try {
    const profile = await getOrCreateUserProfile(userId);
    
    if (!profile) {
      // This is the critical fix. When notFound() is called, it throws an error
      // that Next.js catches to render the 404 page. Nothing after this line will execute.
      notFound();
    }

    // This code below will now ONLY run if a valid profile was found.
    const reviewsData = await getReviewsByUserId(userId);
    
    // Ensure reviews are properly serializable - following the Review type definition
    const serializableReviews = reviewsData.map(review => ({
      id: review.id || '',
      showId: review.showId || '',
      showTitle: review.showTitle || '',
      performanceDate: review.performanceDate || '',
      reviewerId: review.reviewerId || '',
      reviewerName: review.reviewerName || '',
      createdAt: review.createdAt || '',
      overallExperience: review.overallExperience || '',
      specialMomentsText: review.specialMomentsText || '',
      recommendations: Array.isArray(review.recommendations) ? review.recommendations : [],
      showHeartText: review.showHeartText || '',
      communityImpactText: review.communityImpactText || '',
      ticketInfo: review.ticketInfo || '',
      valueConsiderationText: review.valueConsiderationText || '',
      timeWellSpentText: review.timeWellSpentText || '',
      likes: typeof review.likes === 'number' ? review.likes : 0,
      dislikes: typeof review.dislikes === 'number' ? review.dislikes : 0,
      votedBy: Array.isArray(review.votedBy) ? review.votedBy : [],
      disclosureText: review.disclosureText || ''
    }));

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
        <ProfileClientPage initialProfile={serializableProfile} initialReviews={serializableReviews} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error rendering ProfilePage:', error);
    throw error; // Let Next.js error boundary handle it
  }
}
