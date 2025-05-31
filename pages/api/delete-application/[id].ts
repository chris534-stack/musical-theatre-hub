import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated as admin
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
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

    // Get application ID from URL parameter
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid application ID' });
    }

    // Delete the backup application
    const { error: deleteError } = await supabase
      .from('backup_reviewer_applications')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return res.status(500).json({ 
        error: 'Failed to delete application',
        details: deleteError.message
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Application ${id} deleted successfully` 
    });
    
  } catch (error) {
    console.error('Error deleting backup application:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
