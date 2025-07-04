
import { notFound } from 'next/navigation';
import { getOrCreateUserProfile, getReviewsByUserId } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './loading';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  // The try/catch is removed to let Next.js handle rendering errors and streaming more predictably.
  // This helps avoid the generic "unexpected response" error.
  const rawProfile = await getOrCreateUserProfile(userId);

  if (!rawProfile) {
    // This function will stop rendering and show the not-found page.
    notFound();
  }
  
  const rawReviews = await getReviewsByUserId(userId);

  // This is the definitive fix for this type of error. It ensures any non-serializable
  // data (like Date objects or Timestamps from Firebase) is converted to a plain string
  // before being sent from the server component to the client component.
  const profile = JSON.parse(JSON.stringify(rawProfile));
  const reviews = JSON.parse(JSON.stringify(rawReviews));
  
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={profile} initialReviews={reviews} />
    </Suspense>
  );
}
