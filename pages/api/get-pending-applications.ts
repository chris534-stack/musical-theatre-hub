import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

// This function will use a database table instead of KV
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
      : [];
      
    const isAdmin = session.user && session.user.email && 
      adminEmails.includes(session.user.email.toLowerCase());
    
    if (!isAdmin) {
      // Try to check admin status in database as fallback
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .single();
        
      if (userError || !userData) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }
    }

    // Get pending applications from the backup_reviewer_applications table
    const { data, error } = await supabase
      .from('backup_reviewer_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return res.status(200).json({ 
      success: true, 
      applications: data || [] 
    });
  } catch (error) {
    console.error('Error getting pending applications:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
