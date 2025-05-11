import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  try {
    // Fetch all audition events from Supabase
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        director,
        slug,
        ticket_link,
        venues ( name ),
        category,
        event_dates (
          id,
          date,
          time,
          is_matinee
        )
      `)
      .ilike('category', 'audition');

    console.log('[API DEBUG] Raw events from Supabase:', JSON.stringify(events, null, 2)); // Log raw events

    if (error) {
      console.error('[API] /api/auditions error:', error);
      return res.status(500).json({ error: 'Could not load auditions from Supabase.', details: error.message });
    }

    const now = new Date();
    // Filter and map auditions with at least one future date
    const auditionsWithDates = (events || [])
      .map((e: any) => {
        console.log('[API DEBUG] Processing event:', JSON.stringify(e, null, 2)); // Log each event being processed
        let soonestDate = null;
        if (Array.isArray(e.event_dates) && e.event_dates.length > 0) {
          // If event_dates is joined, filter for future dates
          console.log(`[API DEBUG] Event ${e.id} event_dates:`, JSON.stringify(e.event_dates, null, 2)); // Log event_dates
          const futureDates = e.event_dates.filter((d: any) => new Date(d.date) >= now);
          soonestDate = futureDates.length > 0 ? futureDates[0] : e.event_dates[0];
        } else if (Array.isArray(e.dates) && e.dates.length > 0) {
          // fallback for legacy field
          console.log(`[API DEBUG] Event ${e.id} (legacy) dates:`, JSON.stringify(e.dates, null, 2)); // Log legacy dates
          const futureDates = e.dates.filter((d: any) => new Date(d.date) >= now);
          soonestDate = futureDates.length > 0 ? futureDates[0] : e.dates[0];
        }
        console.log(`[API DEBUG] Event ${e.id} soonestDate:`, JSON.stringify(soonestDate, null, 2)); // Log soonestDate
        return {
          title: e.title,
          venue: e.venues ? e.venues.name : 'Venue TBD',
          date: soonestDate?.date || e.date,
          time: soonestDate?.time || e.time,
          category: e.category,
          description: e.description,
          ticketLink: e.ticket_link || e.ticketLink || '',
        };
      })
    console.log('[API DEBUG] Auditions after mapping (before final filter):', JSON.stringify(auditionsWithDates, null, 2)); // Log before final filter

    const auditions = auditionsWithDates.filter((e: any) => e.date && new Date(e.date) >= now);
    console.log('[API DEBUG] Final auditions sent to client:', JSON.stringify(auditions, null, 2)); // Log final auditions

    res.status(200).json(auditions);
    const duration = Date.now() - start;
    console.log(`[API] /api/auditions (Supabase) responded in ${duration}ms`);
  } catch (err: any) {
    console.error('[API] /api/auditions error:', err);
    res.status(500).json({ error: 'Could not load auditions.', details: err.message });
  }
}
