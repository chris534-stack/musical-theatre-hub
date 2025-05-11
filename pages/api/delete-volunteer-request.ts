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
  if (req.method === 'POST') {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }

    try {
      const { error } = await supabase
        .from('volunteer_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[API] Error deleting volunteer request from Supabase:', error);
        return res.status(500).json({ error: 'Failed to delete volunteer request from Supabase.', details: error.message });
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('[API] Catch block error in POST /delete-volunteer-request:', err);
      res.status(500).json({ error: 'Failed to delete volunteer request', details: err.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
