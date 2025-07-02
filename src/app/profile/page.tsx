
import type { UserProfile, Review } from '@/lib/types';
import ProfileClientPage from '@/components/profile/ProfileClientPage';
import { Suspense } from 'react';
import ProfileLoading from './[userId]/loading';

// Mock data for a fully-featured profile
const mockProfile: UserProfile = {
  userId: 'mock-user-id-123',
  displayName: 'Alex "The Thespian" Chen',
  photoURL: 'https://placehold.co/200x200.png',
  email: 'alex.chen@example.com',
  bio: `A passionate performer and director with over five years in the Eugene theatre scene. I believe in the power of local theatre to build community and tell important stories. 

When I'm not on stage, you can find me hiking Spencer Butte or trying out a new coffee shop downtown!`,
  roleInCommunity: 'Performer',
  communityStartDate: '2019',
  galleryImageUrls: [
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png',
  ],
  coverPhotoUrl: 'https://placehold.co/1600x400.png',
};

const mockReviews: Review[] = [
  {
    id: 'mock-review-1',
    showId: 'mock-show-1',
    showTitle: 'Lizzie the Musical',
    performanceDate: '2024-04-15',
    reviewerId: 'mock-user-id-123',
    reviewerName: 'Alex "The Thespian" Chen',
    createdAt: new Date('2024-04-16T10:00:00Z').toISOString(),
    overallExperience: 'Exceptional & Memorable',
    specialMomentsText: "The rock score was performed with incredible energy by the band, and the lighting design perfectly captured the show's dark, intense mood.",
    recommendations: ['Dramatic', 'Musical', 'Date Night'],
    showHeartText: 'A profound exploration of a historical figure through a modern rock lens.',
    communityImpactText: 'A story like this is exactly what Eugene needs right now.',
    ticketInfo: 'Paid $35 for a seat in the mezzanine, Row E. Great view.',
    valueConsiderationText: 'The production value was outstanding and felt like a bargain.',
    timeWellSpentText: "Absolutely. The show was engaging from start to finish.",
    likes: 42,
    dislikes: 2,
    votedBy: [],
  },
  {
    id: 'mock-review-2',
    showId: 'mock-show-2',
    showTitle: 'The Play That Goes Wrong',
    performanceDate: '2024-03-20',
    reviewerId: 'mock-user-id-123',
    reviewerName: 'Alex "The Thespian" Chen',
    createdAt: new Date('2024-03-21T19:00:00Z').toISOString(),
    overallExperience: 'Thoroughly Entertaining',
    specialMomentsText: "The comedic timing of the entire cast was impeccable. I haven't laughed that hard in a theatre in years. The collapsing set was a character in itself!",
    recommendations: ['Comedic', 'Family-Friendly'],
    showHeartText: 'Pure, unadulterated fun. A perfect escape.',
    communityImpactText: "It's wonderful to have a show that brings pure joy and laughter to the community.",
    ticketInfo: 'Front row seats! Cost about $40.',
    valueConsiderationText: 'Worth every penny for the laughs.',
    timeWellSpentText: 'A perfect night out to de-stress and have a great time.',
    likes: 78,
    dislikes: 0,
    votedBy: [],
  }
];

// This page now directly renders the ProfileClientPage with mock data.
// The original authentication-based redirect logic is temporarily removed.
export default function MockProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClientPage initialProfile={mockProfile} initialReviews={mockReviews} />
    </Suspense>
  );
}
