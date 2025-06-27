'use client';

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Client SDK for client-side functions
import type { Event, Venue } from './types';

/**
 * [CLIENT-SIDE] Updates a venue document. Called from the admin dashboard.
 */
export async function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>): Promise<void> {
  const venueDoc = doc(db, 'venues', id);
  await updateDoc(venueDoc, updates);
}

/**
 * [CLIENT-SIDE] Deletes a venue document. Called from the admin dashboard.
 */
export async function deleteVenue(id: string): Promise<void> {
  const venueDoc = doc(db, 'venues', id);
  await deleteDoc(venueDoc);
}

/**
 * [CLIENT-SIDE] Updates an event document. Called from the admin dashboard.
 */
export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, updates);
}

/**
 * [CLIENT-SIDE] Deletes an event document. Called from the admin dashboard.
 */
export async function deleteEvent(id: string): Promise<void> {
  const eventDoc = doc(db, 'events', id);
  await deleteDoc(eventDoc);
}
