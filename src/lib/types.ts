export type Venue = {
  id: string;
  name: string;
  color: string;
};

export type EventStatus = 'pending' | 'approved' | 'denied';

export type EventType = 'Play' | 'Musical' | 'Improv' | 'Special Event';

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
