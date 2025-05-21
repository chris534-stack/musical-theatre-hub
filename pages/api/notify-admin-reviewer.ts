import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Get admin email from environment variable (same as org-contact uses)
const adminEmail = process.env.ADMIN_EMAIL || 'christopher.ridgley@gmail.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reviewerId, userName, userEmail } = req.body;
    
    if (!reviewerId || !userName || !userEmail) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Make sure Gmail credentials are set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn('Gmail credentials not configured - skipping email notification');
      return res.status(200).json({ success: true, emailSent: false });
    }
    
    // Site URL for links in the email - use .com domain
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ourstageeugene.com';
    // Full URL to the admin page for managing reviewers
    const adminUrl = `${siteUrl}/admin/manage-reviewers`;
    
    // Create email transporter (same as in org-contact.ts)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    
    // Email content
    const emailText = `
A new reviewer application has been submitted.

Name: ${userName}
Email: ${userEmail}

To approve or reject this application, go to: ${adminUrl}`;
    
    const emailHtml = `
      <h2>New Reviewer Application</h2>
      <p>A new reviewer application has been submitted.</p>
      <ul>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
      </ul>
      <p><a href="${adminUrl}">Click here</a> to review and manage this application.</p>
    `;
    
    try {
      // Send the notification email using the same pattern as org-contact
      await transporter.sendMail({
        from: userEmail, // Show the applicant as the sender
        to: adminEmail,
        subject: `New Reviewer Application: ${userName}`,
        text: emailText,
        html: emailHtml,
      });
      
      console.log(`Email notification sent to ${adminEmail}`);
    } catch (emailError: any) {
      console.error('Email notification error:', emailError);
      // Continue even if email fails - we don't want to block the application process
      return res.status(200).json({ success: true, emailSent: false, emailError: emailError.message });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
