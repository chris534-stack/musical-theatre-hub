

export type Venue = {
  id: string;
  name: string;
  color: string;
  address?: string;
  sourceUrl?: string;
};

export type EventStatus = 'pending' | 'approved' | 'denied';

export type EventType = 'Play' | 'Musical' | 'Improv' | 'Special Event' | string; // Allow string for migrated data

export type EventOccurrence = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
};

export type Event = {
  id: string;
  title: string;
  description: string;
  occurrences: EventOccurrence[];
  venueId: string;
  type: EventType;
  tags?: string[];
  status: EventStatus;
  url?: string;
};

export type Idea = {
  id: string;
  // Fields from the form
  idea: string;
  showType: string;
  targetAudience: string;
  communityFit: string;
  // User info
  userId?: string;
  userName: string;
  userEmail: string;
  // Timestamp
  timestamp: Date;
};

export type NewsArticle = {
  id:string;
  url: string;
  title: string;
  summary: string;
  imageUrl?: string;
  createdAt: string;
  order: number;
};

export type Review = {
    id: string;
    showId: string;
    showTitle: string;
    performanceDate: string; // ISO String format
    reviewerId: string;
    reviewerName: string;
    createdAt: string;
    overallExperience: string;
    specialMomentsText: string;
    recommendations: string[];
    showHeartText: string;
    communityImpactText: string;
    ticketInfo: string;
    valueConsiderationText: string;
    timeWellSpentText: string;
    likes: number;
    dislikes: number;
    votedBy: string[];
    disclosureText: string;
};

// An "Expanded Event" is a single performance instance, derived from a parent Event
export type ExpandedCalendarEvent = Omit<Event, 'occurrences'> & {
    uniqueOccurrenceId: string; // A unique ID for this specific performance
    date: string;
    time: string;
    venue?: Venue;
    reviews: Review[];
};

export type ReviewerRequest = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  photoURL: string;
  email: string;
  bio?: string;
  roleInCommunity?: 'Performer' | 'Technician' | 'Designer' | 'Director' | 'Audience' | 'Other';
  communityStartDate?: string;
  galleryImageUrls?: string[];
  coverPhotoUrl?: string;
  showEmail?: boolean;
  authStatus?: 'active' | 'notFound';
};
