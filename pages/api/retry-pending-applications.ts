import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

// Define the backup application type
interface BackupApplication {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  pronouns: string | null;
  reviewer_application_status: string;
  applied_at: string;
  email: string;
  retry_count: number;
  last_retry: string | null;
  last_error: string | null;
  succeeded: boolean;
  created_at: string;
}

// Maximum number of retries before giving up
const MAX_RETRIES = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST for manual retries, or GET for cron job/automated retries
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For POST requests, ensure it's from an admin
  if (req.method === 'POST') {
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
  }

  try {
    // Get all pending applications (not succeeded yet)
    const { data: pendingApps, error: fetchError } = await supabase
      .from('backup_reviewer_applications')
      .select('*')
      .eq('succeeded', false)
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Error fetching pending applications: ${fetchError.message}`);
    }
    
    if (!pendingApps || pendingApps.length === 0) {
      return res.status(200).json({ success: true, message: 'No pending applications to retry' });
    }
    
    console.log(`Found ${pendingApps.length} pending applications to retry`);
    
    // Process each pending application
    const results = await Promise.allSettled(
      pendingApps.map(async (app: BackupApplication) => {
        // Check if we've exceeded retry limit
        if (app.retry_count >= MAX_RETRIES) {
          return {
            id: app.id,
            status: 'maxRetries',
            retryCount: app.retry_count,
            lastRetry: app.last_retry
          };
        }
        
        // Prepare application data for Supabase
        const applicationData = {
          id: app.user_id,
          first_name: app.first_name,
          last_name: app.last_name,
          preferred_name: app.preferred_name,
          pronouns: app.pronouns,
          reviewer_application_status: app.reviewer_application_status,
          applied_at: app.applied_at,
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
              .eq('id', app.user_id);
              
            const { error: updateError } = await Promise.race([
              updatePromise,
              timeoutPromise
            ]) as any;
            
            if (updateError) {
              throw new Error(`Update failed: ${updateError.message}`);
            }
            
            // Update successful - mark as succeeded
            await supabase
              .from('backup_reviewer_applications')
              .update({ 
                succeeded: true,
                retry_count: app.retry_count + 1,
                last_retry: new Date().toISOString()
              })
              .eq('id', app.id);
              
            return { 
              id: app.id, 
              status: 'success', 
              method: 'update',
            };
          } else if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`);
          } else {
            // Insert successful - mark as succeeded
            await supabase
              .from('backup_reviewer_applications')
              .update({ 
                succeeded: true,
                retry_count: app.retry_count + 1,
                last_retry: new Date().toISOString()
              })
              .eq('id', app.id);
              
            return { 
              id: app.id, 
              status: 'success', 
              method: 'insert',
            };
          }
        } catch (error) {
          // Update retry count and last retry timestamp
          await supabase
            .from('backup_reviewer_applications')
            .update({ 
              retry_count: app.retry_count + 1,
              last_retry: new Date().toISOString(),
              last_error: error instanceof Error ? error.message : String(error),
              succeeded: false
            })
            .eq('id', app.id);
          
          return { 
            id: app.id, 
            status: 'retry', 
            error: error instanceof Error ? error.message : String(error),
            retryCount: app.retry_count + 1
          };
        }
      })
    );
    
    // Summarize results
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'fulfilled' && r.value?.status === 'success').length,
      retried: results.filter(r => r.status === 'fulfilled' && r.value?.status === 'retry').length,
      maxRetries: results.filter(r => r.status === 'fulfilled' && r.value?.status === 'maxRetries').length,
      errors: results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.status === 'error')).length,
      details: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason })
    };
    
    return res.status(200).json({ 
      success: true, 
      message: `Processed ${results.length} pending applications`,
      summary
    });
  } catch (error) {
    console.error('Error processing pending applications:', error);
    return res.status(500).json({ 
      error: 'Server error retrying applications', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
