import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { requireAdmin } from '../../utils/isAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Admin check using Supabase token
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No access token provided.' });
  }
  // Use supabase client to get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }
  const ADMIN_EMAILS = ['christopher.ridgley@gmail.com']; // Or import from config
  const userEmail = typeof user.email === 'string' ? user.email : '';
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail.toLowerCase().trim());
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  try {
    let { title, description, venue_id, dates } = req.body;
    // Validate and normalize
    if (!title || !dates || !Array.isArray(dates) || dates.length === 0 || venue_id === undefined || venue_id === null) {
      return res.status(400).json({ error: 'Missing required fields: title, dates array, or venue_id.' });
    }
    title = title.trim();
    if (!title) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
    // Ensure venue_id is a number
    if (typeof venue_id === 'string') venue_id = parseInt(venue_id, 10);
    if (isNaN(venue_id)) {
      return res.status(400).json({ error: 'venue_id must be a valid number.' });
    }

    // 1. Generate a unique slug from the title
    function slugify(str: string) {
      return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;
    while (slugExists) {
      const { data: existing, error: slugError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) {
        slugExists = false;
      } else {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    }

    // 2. Insert event (no date field, with unique slug)
    const { data: event, error: eventError } = await supabase.from('events').insert([{ title, description, venue_id, slug }]).select('*').single();
    if (eventError || !event) {
      return res.status(500).json({ error: eventError?.message || 'Could not add event.' });
    }

    // 2. Insert dates into event_dates
    const eventDatesPayload = dates.map((d: any) => ({
      event_id: event.id,
      date: d.date,
      time: d.mainTime,
      is_matinee: d.isMatinee || false,
      matinee_time: d.matineeTime || null,
    }));
    const { data: eventDates, error: datesError } = await supabase.from('event_dates').insert(eventDatesPayload).select('*');
    if (datesError) {
      return res.status(500).json({ error: datesError.message || 'Could not add event dates.' });
    }

    res.status(201).json({ success: true, event, event_dates: eventDates });
  } catch (err) {
    res.status(500).json({ error: 'Could not add event.' });
  }
}
