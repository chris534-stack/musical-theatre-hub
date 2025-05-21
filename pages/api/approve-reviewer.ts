import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Only allow these emails to approve reviewers
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['christopher.ridgley@gmail.com'];

// Initialize Supabase Admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get and verify the JWT token from Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Verify the user with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is in admin list
    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ error: 'Forbidden - not an admin' });
    }
    
    // Debug admin mode for local development only
    const isDebugAdmin = process.env.NEXT_PUBLIC_DEBUG_ADMIN === 'true';
    if (!isDebugAdmin && !ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get the reviewer ID to approve
    const { reviewerId, newStatus } = req.body;
    if (!reviewerId) return res.status(400).json({ error: 'Missing reviewerId' });
    if (!newStatus || !['approved', 'rejected'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status - must be approved or rejected' });
    }
    
    // Update the reviewer status in the database
    const { error: updateError } = await supabaseAdmin
      .from('reviewers')
      .update({ 
        reviewer_application_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewerId);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: `Failed to update reviewer: ${updateError.message}` });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Approve reviewer error:', err);
    return res.status(500).json({ error: err.message });
  }
}
