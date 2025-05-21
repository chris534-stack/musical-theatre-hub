import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

// For admin-only access protection
async function checkAdmin(token: string): Promise<boolean> {
  if (!token) return false;
  
  // Use supabase client to get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return false;
  
  const ADMIN_EMAILS = ['christopher.ridgley@gmail.com']; // Or import from config
  const userEmail = typeof user.email === 'string' ? user.email : '';
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail.toLowerCase().trim());
  
  return isAdmin;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', ['PUT', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Admin check using Supabase token
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No access token provided.' });
  }
  
  const isAdmin = await checkAdmin(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  try {
    const { id, title, description, venue_id, category, director, ticket_link, slug, dates } = req.body;

    // Input validation
    if (!id) {
      return res.status(400).json({ error: 'Missing event ID.' });
    }

    // Validate dates array if provided
    if (dates && (!Array.isArray(dates) || dates.length === 0)) {
      return res.status(400).json({ error: 'Dates must be a non-empty array.' });
    }

    // Create update object with provided fields
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (venue_id !== undefined) updateData.venue_id = venue_id;
    if (category !== undefined) updateData.category = category;
    if (director !== undefined) updateData.director = director;
    if (ticket_link !== undefined) updateData.ticket_link = ticket_link;
    if (slug !== undefined) updateData.slug = slug;
    if (dates !== undefined) updateData.dates = dates;

    // If nothing to update, return early
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    // Update the event
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error updating event:', error);
      return res.status(500).json({ error: error.message || 'Could not update event.' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.status(200).json({ success: true, event: data[0] });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Could not update event.', details: err instanceof Error ? err.message : String(err) });
  }
}
