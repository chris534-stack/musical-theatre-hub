import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { requireAdmin } from '../../utils/isAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Admin check
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  try {
    const { title, description, date, venue_id } = req.body;
    if (!title || !date || !venue_id) {
      return res.status(400).json({ error: 'Missing required fields: title, date, or venue_id.' });
    }
    // Prevent duplicate for same date/title/venue
    const { data: existing, error: selectError } = await supabase
      .from('events')
      .select('id')
      .eq('title', title)
      .eq('date', date)
      .eq('venue_id', venue_id);
    if (selectError) {
      return res.status(500).json({ error: 'Could not check for duplicates.' });
    }
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Duplicate event for this date, title, and venue.' });
    }
    const { data, error } = await supabase.from('events').insert([{ title, description, date, venue_id }]).select('*').single();
    if (error) {
      return res.status(500).json({ error: error.message || 'Could not add event.' });
    }
    res.status(201).json({ success: true, event: data });
  } catch (err) {
    res.status(500).json({ error: 'Could not add event.' });
  }
}
