import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role key for admin-level operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[NotifyReviewerApp] Value of process.env.ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
  if (req.method !== 'POST') {
    console.log('[NotifyReviewerApp] Method Not Allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, preferredName, pronouns, email, userId } = req.body;

  if (!firstName || !lastName || !email || !userId) {
    console.log('[NotifyReviewerApp] Missing required fields: firstName, lastName, email, or userId');
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, or userId' });
  }

  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) {
    console.error('[NotifyReviewerApp] ADMIN_EMAILS environment variable is not set.');
    return res.status(500).json({ error: 'ADMIN_EMAILS environment variable is not set.' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    console.error('[NotifyReviewerApp] GMAIL_USER or GMAIL_PASS environment variable is not set.');
    return res.status(500).json({ error: 'Email server configuration error.' });
  }

  // Generate a secure random token (64 character hex string)
  const token = crypto.randomBytes(32).toString('hex');
  
  try {
    // Update the reviewers table with the token
    const { error: tokenError } = await supabase
      .from('reviewers')
      .update({ review_token: token })
      .eq('id', userId);

    if (tokenError) {
      console.error('[NotifyReviewerApp] Error saving review token:', tokenError);
      return res.status(500).json({ error: 'Failed to generate review token', details: tokenError.message });
    }

    // Create the secure review link using the request's host
    // Get host from headers with fallback to environment variable
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    console.log(`[NotifyReviewerApp] Building review link with baseUrl: ${baseUrl}`);
    const reviewLink = `${baseUrl}/admin/review-application?token=${token}`;

    console.log('[NotifyReviewerApp] Attempting to send reviewer application email...');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const applicantFullName = `${firstName} ${lastName}`;
    const subject = `New Reviewer Application: ${applicantFullName}`;
    
    // Updated email template with review link
    const textBody = `
      A new reviewer application has been submitted:

      Full Name: ${applicantFullName}
      Preferred Name: ${preferredName || 'N/A'}
      Pronouns: ${pronouns || 'N/A'}
      Email: ${email}

      To review this application, click on the secure link below:
      ${reviewLink}

      This link is unique and secure. Please do not share it.
    `;

    const htmlBody = `
      <h2>New Reviewer Application</h2>
      <p>A new reviewer application has been submitted:</p>
      
      <ul>
        <li><strong>Full Name:</strong> ${applicantFullName}</li>
        <li><strong>Preferred Name:</strong> ${preferredName || 'N/A'}</li>
        <li><strong>Pronouns:</strong> ${pronouns || 'N/A'}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      
      <p><a href="${reviewLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px;">Review Application</a></p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #666;">This link is unique and secure. Please do not share it.</p>
    `;

    const mailOptions = {
      from: gmailUser,
      to: adminEmails, // Nodemailer handles comma-separated emails
      replyTo: email,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[NotifyReviewerApp] Email sent successfully! Message ID:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId, token });
  } catch (error: any) {
    console.error('[NotifyReviewerApp] Failed to send email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
