import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role key for admin-level operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing required userId' });
  }

  try {
    // Generate a secure random token (64 character hex string)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Update the reviewers table with the token
    const { data, error } = await supabase
      .from('reviewers')
      .update({ review_token: token })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error generating token:', error);
      return res.status(500).json({ error: 'Failed to generate token', details: error.message });
    }

    return res.status(200).json({ success: true, token });
  } catch (error: any) {
    console.error('Server error generating token:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
