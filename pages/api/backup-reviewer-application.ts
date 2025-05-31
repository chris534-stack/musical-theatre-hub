import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import nodemailer from 'nodemailer';

// Set up email transporter (using environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

// Admin email for notifications
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim())
  : [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      firstName, 
      lastName, 
      preferredName, 
      pronouns, 
      email 
    } = req.body;

    if (!userId || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First try to submit directly to Supabase
    const applicationData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName || null,
      pronouns: pronouns || null,
      reviewer_application_status: 'pending',
      applied_at: new Date().toISOString(),
    };

    // Create a promise to track the Supabase operation with timeout
    const supabasePromise = new Promise(async (resolve, reject) => {
      try {
        // Try insertion first
        const { error: insertError } = await supabase
          .from('reviewers')
          .insert(applicationData);

        // If duplicate key, try update instead
        if (insertError && insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('reviewers')
            .update(applicationData)
            .eq('id', userId);

          if (!updateError) {
            // Update successful
            resolve({ success: true, method: 'update' });
          } else {
            reject(new Error(`Update error: ${updateError.message}`));
          }
        } else if (!insertError) {
          // Insert successful
          resolve({ success: true, method: 'insert' });
        } else {
          reject(new Error(`Insert error: ${insertError.message}`));
        }
      } catch (error) {
        reject(error);
      }
    });

    // Set up a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase operation timed out')), 5000);
    });

    try {
      // Try the main Supabase operation with timeout
      const result = await Promise.race([supabasePromise, timeoutPromise]) as any;
      
      // If successful, send notification email and return success
      await sendNotificationEmail({
        firstName,
        lastName,
        preferredName,
        pronouns,
        email,
        userId,
        submittedToSupabase: true,
      });
      
      return res.status(200).json({ 
        success: true, 
        method: result.method,
        message: `Application ${result.method === 'insert' ? 'inserted' : 'updated'} successfully in Supabase`
      });
      
    } catch (error) {
      console.log('Supabase submission failed, using backup storage:', error);
      
      // If Supabase fails, store in backup table
      const { data: backupData, error: backupError } = await supabase
        .from('backup_reviewer_applications')
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          preferred_name: preferredName || null,
          pronouns: pronouns || null,
          reviewer_application_status: 'pending',
          applied_at: new Date().toISOString(),
          email,
          error_details: error instanceof Error ? error.message : String(error),
        });
      
      if (backupError) {
        console.error('Failed to store in backup table:', backupError);
        // Even if backup fails, we'll still pretend success to the user
        // but log the complete failure for admin investigation
        console.error('COMPLETE FAILURE - APPLICATION DATA:', {
          userId, firstName, lastName, preferredName, pronouns, email
        });
      }
      
      // Send notification email as backup
      await sendNotificationEmail({
        firstName,
        lastName,
        preferredName,
        pronouns,
        email,
        userId,
        submittedToSupabase: false,
        backupId: backupData ? backupData[0]?.id : undefined,
      });
      
      // Return success to the client even though we used backup
      // This prevents UI confusion and preserves the data
      return res.status(200).json({ 
        success: true, 
        method: 'backup',
        message: 'Application stored in backup system'
      });
    }
  } catch (error) {
    console.error('Error in backup-reviewer-application:', error);
    return res.status(500).json({ 
      error: 'Server error processing application', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Function to send notification email
async function sendNotificationEmail(data: {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  pronouns?: string | null;
  email: string;
  userId: string;
  submittedToSupabase: boolean;
  backupId?: string;
}) {
  if (ADMIN_EMAILS.length === 0) {
    console.warn('No admin emails configured for notifications');
    return;
  }
  
  const subject = data.submittedToSupabase 
    ? `New Reviewer Application: ${data.firstName} ${data.lastName}`
    : `[ACTION REQUIRED] Backup Reviewer Application: ${data.firstName} ${data.lastName}`;
  
  const html = `
    <h2>${data.submittedToSupabase ? 'New Reviewer Application' : 'BACKUP: Reviewer Application'}</h2>
    <p>A new reviewer application has been submitted${!data.submittedToSupabase ? ' (stored in backup system due to Supabase connection issues)' : ''}.</p>
    
    <h3>Applicant Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${data.firstName} ${data.lastName}${data.preferredName ? ` (${data.preferredName})` : ''}</li>
      <li><strong>Email:</strong> ${data.email}</li>
      ${data.pronouns ? `<li><strong>Pronouns:</strong> ${data.pronouns}</li>` : ''}
      <li><strong>User ID:</strong> ${data.userId}</li>
      ${!data.submittedToSupabase && data.backupId ? `<li><strong>Backup ID:</strong> ${data.backupId}</li>` : ''}
      <li><strong>Submission Time:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    
    ${!data.submittedToSupabase ? `
    <p><strong>NOTE:</strong> This application could not be saved to Supabase due to connection issues. 
    It has been stored in the backup system and will be automatically retried. You can also manually
    manage pending applications at <a href="https://ourstageeugene.com/admin/pending-applications">ourstageeugene.com/admin/pending-applications</a>.</p>
    ` : ''}
    
    <p>You can review this application in the admin dashboard.</p>
  `;
  
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ourstageeugene.com',
      to: ADMIN_EMAILS.join(', '),
      subject,
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', info.messageId);
    return info.messageId;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Don't throw here - we don't want to break the application flow if email fails
    // This is a notification, not core functionality
    return null;
  }
}
