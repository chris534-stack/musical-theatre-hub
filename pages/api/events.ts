import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Define interfaces for our data model
interface EventDate {
  date: string;
  time?: string;
  mainTime?: string;
  isMatinee: boolean;
  matineeTime?: string | null;
}

interface Venue {
  id: number;
  name: string;
  address?: string;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  director?: string;
  slug: string;
  ticket_link?: string;
  venue_id: number;
  category?: string;
  venues?: Venue | any; // Allow for different venues response types from Supabase
  dates?: EventDate[] | any; // Allow for different dates formats during migration
}

interface FormattedEvent extends Omit<Event, 'venues' | 'dates'> {
  venue: string | null;
  dates: EventDate[];
}

// Debugging logs for Supabase env variables
console.log('---[Supabase Debug]---');
// First check server-side variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined');
// Fallback to client-side variables
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'undefined');
console.log('----------------------');

// Try to use server-side admin credentials first (service role key has RLS bypass)
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If server-side credentials are missing, fall back to client-side credentials
if (!supabaseUrl || !supabaseKey) {
  console.log('[API] Using fallback client credentials for Supabase');
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  try {
    console.log('[API] /api/events called (using JSONB dates field)');
    
    // Get events with JSONB dates field and venue join
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        director,
        slug,
        ticket_link,
        venue_id,
        category,
        dates,
        venues (
          id,
          name,
          address
        )
      `);
    if (error) throw error;
    // Transform to grouped format (ensuring backward compatibility with calendar component)
    const groupedEvents = (data || []).map((event: Event) => {
      // Handle both old and new date formats
      let formattedDates: EventDate[] = [];
      
      // Debug the event data
      console.log('[API] Event data:', event.title, 'dates:', JSON.stringify(event.dates));
      
      // If we have the new JSONB dates format
      if (event.dates && Array.isArray(event.dates)) {
        formattedDates = event.dates.map((d: any) => ({
          // Ensure exact property names expected by the calendar component
          date: d.date, 
          time: d.time || d.mainTime || '19:30', // Support both formats with default
          isMatinee: d.isMatinee === undefined ? (d.is_matinee || false) : d.isMatinee // Support both camelCase and snake_case
        }));
      }
      
      // Safety check - if no dates, add a dummy one to prevent errors
      if (formattedDates.length === 0) {
        console.log('[API] Warning: Event', event.title, 'has no dates');
      }
      
      return {
        ...event,
        venue: event.venues && typeof event.venues === 'object' && 'name' in event.venues ? event.venues.name : null, // flatten venue name for frontend compatibility
        dates: formattedDates,
      } as FormattedEvent;
    });
    if (Array.isArray(groupedEvents) && groupedEvents.length > 0) {
      console.log('[API] /api/events: first grouped event:', JSON.stringify(groupedEvents[0], null, 2));
    }
    res.status(200).json(groupedEvents);
    const duration = Date.now() - start;
    console.log(`[API] /api/events (Supabase JOIN) responded in ${duration}ms`);
  } catch (err) {
    console.error('[API] /api/events error:', err);
    res.status(500).json({ error: 'Could not load events from Supabase.', details: err instanceof Error ? err.message : err });
  }
}

