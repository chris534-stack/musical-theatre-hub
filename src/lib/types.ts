export type Venue = {
  id: string;
  name: string;
  color: string;
};

export type EventStatus = 'pending' | 'approved' | 'denied';

export type EventType = 'Play' | 'Musical' | 'Improv' | 'Special Event' | string; // Allow string for migrated data

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venueId: string;
  type: EventType;
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
