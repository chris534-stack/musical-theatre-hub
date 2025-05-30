import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Admin emails (consider moving this to an environment variable)
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS ? 
  process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim()) : 
  ['christopher.ridgley@gmail.com'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[approve-reviewer] Received request:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get application ID from request body
    const { applicationId } = req.body;
    console.log('[approve-reviewer] Application ID:', applicationId);
    
    if (!applicationId) {
      console.error('[approve-reviewer] Missing applicationId');
      return res.status(400).json({ error: 'Missing applicationId' });
    }

    // Update the reviewer application status to 'approved'
    const { data, error } = await supabase
      .from('reviewers')
      .update({ reviewer_application_status: 'approved' })
      .eq('id', applicationId);

    if (error) {
      console.error('[approve-reviewer] Error updating reviewer status:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('[approve-reviewer] Successfully approved reviewer application');
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[approve-reviewer] Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
