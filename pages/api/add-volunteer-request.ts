import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../utils/isAdmin';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();

  if (req.method === 'POST') {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    try {
      const { venue, expertise, description, dates, timeCommitment } = req.body;

      // Basic validation (can be expanded)
      if (!venue || !description) {
        return res.status(400).json({ error: 'Venue and Description are required.' });
      }

      const { data, error } = await supabase
        .from('volunteer_requests')
        .insert([
          {
            venue,
            expertise,
            description,
            dates: dates || [], // Ensure dates is an array, defaults to empty if not provided
            time_commitment: timeCommitment, // Map to snake_case
          },
        ])
        .select(); // Optionally select the inserted row to return it

      if (error) {
        console.error('[API] Error inserting volunteer request:', error);
        return res.status(500).json({ error: 'Failed to save volunteer request to Supabase.', details: error.message });
      }

      res.status(200).json({ success: true, data: data ? data[0] : null });
      const duration = Date.now() - start;
      console.log(`[API] /api/add-volunteer-request (POST) responded in ${duration}ms`);

    } catch (err: any) {
      console.error('[API] Catch block error in POST /add-volunteer-request:', err);
      res.status(500).json({ error: 'Failed to save volunteer request', details: err.message });
    }

  } else if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('volunteer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[API] Error fetching volunteer requests:', error);
        return res.status(500).json({ error: 'Failed to load volunteer requests from Supabase.', details: error.message });
      }

      // Map snake_case to camelCase for client consistency
      const formattedData = data.map(item => ({
        id: item.id,
        venue: item.venue,
        expertise: item.expertise,
        description: item.description,
        dates: item.dates,
        timeCommitment: item.time_commitment,
        createdAt: item.created_at,
      }));

      res.status(200).json(formattedData);
      const duration = Date.now() - start;
      console.log(`[API] /api/add-volunteer-request (GET) responded in ${duration}ms`);

    } catch (err: any) {
      console.error('[API] Catch block error in GET /add-volunteer-request:', err);
      res.status(500).json({ error: 'Failed to load volunteer requests', details: err.message });
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
