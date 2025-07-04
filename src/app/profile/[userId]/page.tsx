
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import type { Review, UserProfile } from '@/lib/types';

// Helper function to safely create a serializable review object
function sanitizeReview(review: Review): Review {
    return {
        id: review.id,
        showId: review.showId,
        showTitle: review.showTitle,
        performanceDate: review.performanceDate,
        reviewerId: review.reviewerId,
        reviewerName: review.reviewerName,
        createdAt: review.createdAt,
        overallExperience: review.overallExperience,
        specialMomentsText: review.specialMomentsText,
        recommendations: review.recommendations || [],
        showHeartText: review.showHeartText,
        communityImpactText: review.communityImpactText,
        ticketInfo: review.ticketInfo,
        valueConsiderationText: review.valueConsiderationText,
        timeWellSpentText: review.timeWellSpentText,
        likes: review.likes || 0,
        dislikes: review.dislikes || 0,
        votedBy: review.votedBy || [],
        disclosureText: review.disclosureText || '',
    };
}


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

    const rawReviews = await getReviewsByUserId(userId);
    // Manually construct a plain, serializable array of review objects
    const reviews: Review[] = rawReviews.map(sanitizeReview);
    
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
