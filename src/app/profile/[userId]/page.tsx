
import { getOrCreateUserProfile } from '@/lib/data';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import ProfileLoading from './loading';
import { Suspense } from 'react';
import type { UserProfile } from '@/lib/types';

// This server component is now much simpler and safer.
// Its only job is to fetch the initial profile data.
// If it fails for any reason, it passes `null` to the client, preventing a server crash.
async function getInitialProfile(userId: string): Promise<UserProfile | null> {
    try {
        const profile = await getOrCreateUserProfile(userId);
        if (!profile) return null;

        // Ensure the profile data is clean and serializable
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
        return serializableProfile;

    } catch (error) {
        console.error(`Failed to fetch initial profile for ${userId}:`, error);
        return null; // Return null on any error to prevent crashing the page
    }
}

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const initialProfile = await getInitialProfile(params.userId);

  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={initialProfile} userId={params.userId} />
    </Suspense>
  );
}
