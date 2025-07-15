

import ProfileClientPage from '@/components/profile/ProfileClientPage';
import ProfileLoading from './loading';
import { Suspense } from 'react';

export default async function ProfilePage({ params }: { params: { userId:string } }) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage userId={params.userId} />
    </Suspense>
  );
}
