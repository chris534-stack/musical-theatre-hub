
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import ProfileLoading from './loading';
import { Suspense } from 'react';

// This server component no longer fetches any data.
// It only passes the userId to the client component, which handles all fetching.
export default async function ProfilePage({ params }: { params: { userId: string } }) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage userId={params.userId} />
    </Suspense>
  );
}
