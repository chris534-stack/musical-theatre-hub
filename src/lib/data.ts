import type { Event, Venue } from './types';

// Using a Map for easier CRUD operations in our "mock database"
export const venues: Map<string, Venue> = new Map([
  ['vlt', { id: 'vlt', name: 'Very Little Theatre', color: 'hsl(225, 73%, 57%)' }],
  ['oct', { id: 'oct', name: 'Oregon Contemporary Theatre', color: 'hsl(51, 100%, 50%)' }],
  ['hult', { id: 'hult', name: 'Hult Center', color: 'hsl(215.4, 16.3%, 46.9%)' }],
  ['shedd', { id: 'shedd', name: 'The Shedd Institute', color: 'hsl(0, 84.2%, 60.2%)' }],
  ['ace', { id: 'ace', name: 'Actors Cabaret of Eugene', color: 'hsl(222.2, 84%, 4.9%)' }],
]);

// Helper to get a date in the future for mock data
function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const events: Map<string, Event> = new Map([
  ['evt1', {
    id: 'evt1',
    title: 'Pride and Prejudice',
    description: 'A romantic comedy by Kate Hamill, adapted from the novel by Jane Austen.',
    date: getFutureDate(5),
    time: '19:30',
    venueId: 'vlt',
    type: 'Play',
    status: 'approved',
    url: 'https://example.com'
  }],
  ['evt2', {
    id: 'evt2',
    title: 'The Book of Mormon',
    description: 'A satirical musical about two young Mormon missionaries who travel to Africa to preach the Mormon faith.',
    date: getFutureDate(12),
    time: '20:00',
    venueId: 'hult',
    type: 'Musical',
    status: 'approved',
    url: 'https://example.com'
  }],
  ['evt3', {
    id: 'evt3',
    title: 'A Doll\'s House, Part 2',
    description: 'A sequel to Henrik Ibsen\'s classic play.',
    date: getFutureDate(20),
    time: '19:00',
    venueId: 'oct',
    type: 'Play',
    status: 'pending',
    url: 'https://example.com'
  }],
  ['evt4', {
    id: 'evt4',
    title: 'Improv Night',
    description: 'A night of hilarious unscripted comedy.',
    date: getFutureDate(2),
    time: '21:00',
    venueId: 'oct',
    type: 'Improv',
    status: 'approved',
    url: 'https://example.com'
  }],
]);

// In a real app, these would be database operations.
// We'll simulate them with in-memory data for this prototype.
export function addEvent(event: Omit<Event, 'id'>) {
  const id = `evt${events.size + 1 + Math.random()}`;
  const newEvent: Event = { ...event, id };
  events.set(id, newEvent);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<Event>) {
  const event = events.get(id);
  if (event) {
    const updatedEvent = { ...event, ...updates };
    events.set(id, updatedEvent);
  }
}

export function deleteEvent(id: string) {
  events.delete(id);
}
