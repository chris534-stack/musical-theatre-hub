import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    // Get application ID from request
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing application ID' });
    }

    // Fetch backup application from database
    const { data: backupApp, error: fetchError } = await supabase
      .from('backup_reviewer_applications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !backupApp) {
      return res.status(404).json({ 
        error: 'Backup application not found', 
        details: fetchError?.message 
      });
    }

    // Try to insert application into main reviewers table
    const applicationData = {
      id: backupApp.user_id,
      first_name: backupApp.first_name,
      last_name: backupApp.last_name,
      preferred_name: backupApp.preferred_name,
      pronouns: backupApp.pronouns,
      reviewer_application_status: backupApp.reviewer_application_status,
      applied_at: backupApp.applied_at,
    };
    
    try {
      // Try insertion first with timeout
      const insertPromise = supabase.from('reviewers').insert(applicationData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 5000)
      );
      
      const { error: insertError } = await Promise.race([
        insertPromise, 
        timeoutPromise
      ]) as any;
      
      // If duplicate key, try update instead
      if (insertError && insertError.code === '23505') {
        const updatePromise = supabase.from('reviewers')
          .update(applicationData)
          .eq('id', backupApp.user_id);
          
        const { error: updateError } = await Promise.race([
          updatePromise,
          timeoutPromise
        ]) as any;
        
        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }
        
        // Update succeeded - mark backup as succeeded
        await supabase
          .from('backup_reviewer_applications')
          .update({ 
            succeeded: true,
            retry_count: backupApp.retry_count + 1,
            last_retry: new Date().toISOString()
          })
          .eq('id', id);
          
        return res.status(200).json({ 
          success: true, 
          method: 'update',
          message: 'Application updated successfully in main table'
        });
      } else if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      } else {
        // Insert succeeded - mark backup as succeeded
        await supabase
          .from('backup_reviewer_applications')
          .update({ 
            succeeded: true,
            retry_count: backupApp.retry_count + 1,
            last_retry: new Date().toISOString()
          })
          .eq('id', id);
          
        return res.status(200).json({ 
          success: true, 
          method: 'insert',
          message: 'Application inserted successfully in main table'
        });
      }
    } catch (error) {
      // Update retry count and last retry timestamp
      await supabase
        .from('backup_reviewer_applications')
        .update({ 
          retry_count: backupApp.retry_count + 1,
          last_retry: new Date().toISOString(),
          last_error: error instanceof Error ? error.message : String(error),
          succeeded: false
        })
        .eq('id', id);
        
      return res.status(500).json({ 
        error: 'Failed to process application', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error processing application:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
