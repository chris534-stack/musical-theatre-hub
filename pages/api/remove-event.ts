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
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    res.setHeader('Allow', ['DELETE', 'POST']);
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
  
  // Extract event id from request body or query params
  const id = req.method === 'DELETE' 
    ? req.query.id 
    : req.body.id;
    
  if (!id) {
    return res.status(400).json({ error: 'Missing event ID.' });
  }

  try {
    // Delete the event from Supabase
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error removing event:', error);
      return res.status(500).json({ error: error.message || 'Could not remove event.' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error removing event:', err);
    res.status(500).json({ error: 'Could not remove event.', details: err instanceof Error ? err.message : String(err) });
  }
}
