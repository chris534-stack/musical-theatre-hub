import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[NotifyReviewerApp] Value of process.env.ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
  if (req.method !== 'POST') {
    console.log('[NotifyReviewerApp] Method Not Allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, preferredName, pronouns, email } = req.body;

  if (!firstName || !lastName || !email) {
    console.log('[NotifyReviewerApp] Missing required fields: firstName, lastName, or email');
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, or email' });
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
  const textBody = `
    A new reviewer application has been submitted:

    Full Name: ${applicantFullName}
    Preferred Name: ${preferredName || 'N/A'}
    Pronouns: ${pronouns || 'N/A'}
    Email: ${email}

    Please review their application in the admin dashboard.
  `;

  try {
    const mailOptions = {
      from: gmailUser,
      to: adminEmails, // Nodemailer handles comma-separated emails
      replyTo: email,
      subject: subject,
      text: textBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[NotifyReviewerApp] Email sent successfully! Message ID:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[NotifyReviewerApp] Failed to send email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
