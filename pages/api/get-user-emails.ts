import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
// This gives us access to read auth.users table
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[get-user-emails] Received request');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error('[get-user-emails] Invalid or missing userIds');
      return res.status(400).json({ error: 'Invalid or missing userIds' });
    }

    console.log(`[get-user-emails] Fetching emails for ${userIds.length} users`);

    // Create a map to store user IDs and their corresponding emails
    const emailMap: Record<string, string> = {};

    // Using the service role key to access auth.users
    for (const userId of userIds) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError) {
        console.error(`[get-user-emails] Error fetching user ${userId}:`, userError);
        continue;
      }

      if (userData?.user?.email) {
        emailMap[userId] = userData.user.email;
      }
    }

    console.log(`[get-user-emails] Successfully retrieved ${Object.keys(emailMap).length} emails`);
    return res.status(200).json({ emails: emailMap });
  } catch (err: any) {
    console.error('[get-user-emails] Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
