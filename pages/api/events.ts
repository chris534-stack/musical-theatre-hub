import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Debugging logs for Supabase env variables
console.log('---[Supabase Debug]---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 'undefined');
console.log('----------------------');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  try {
    console.log('[API] /api/events called (JOIN event + event_dates)');
    // Join event and event_dates
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
        event_dates (
          id,
          date,
          time,
          is_matinee
        ),
        venues (
          id,
          name,
          address
        )
      `);
    if (error) throw error;
    // Transform to grouped format
    const groupedEvents = (data || []).map(event => ({
      ...event,
      venue: event.venues && typeof event.venues === 'object' && 'name' in event.venues ? event.venues.name : null, // flatten venue name for frontend compatibility
      dates: (event.event_dates || []).map(ed => ({
        date: ed.date,
        time: ed.time,
        isMatinee: ed.is_matinee, // map snake_case to camelCase for frontend compatibility
      })),
    }));
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

