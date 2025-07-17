
'use server';

import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  ADMIN_EMAIL,
  NEXT_PUBLIC_SITE_URL,
} = process.env;

const isSmtpConfigured = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;

if (!isSmtpConfigured) {
  console.warn(
    'SMTP environment variables are not fully configured. Email sending will be disabled.'
  );
}

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

interface ReviewerApplicationEmailData {
  applicantName: string;
  applicantEmail: string;
  requestId: string;
}

export async function sendReviewerApplicationEmail({
  applicantName,
  applicantEmail,
  requestId,
}: ReviewerApplicationEmailData) {
  if (!transporter) {
    console.log(
      'SMTP not configured, skipping email notification for new reviewer application.'
    );
    return;
  }

  if (!ADMIN_EMAIL) {
    console.error(
      'ADMIN_EMAIL is not set. Cannot send reviewer application email.'
    );
    return;
  }

  const siteUrl = NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const adminLink = `${siteUrl}/admin`;

  const mailOptions = {
    from: `"Our Stage, Eugene" <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: 'New Reviewer Application Received',
    text: `A new application to become a reviewer has been submitted.\n\n` +
          `Applicant Name: ${applicantName}\n` +
          `Applicant Email: ${applicantEmail}\n\n` +
          `Please visit the admin dashboard to review the request:\n` +
          `${adminLink}`,
    html: `<p>A new application to become a reviewer has been submitted.</p>` +
          `<ul>` +
          `<li><strong>Applicant Name:</strong> ${applicantName}</li>` +
          `<li><strong>Applicant Email:</strong> ${applicantEmail}</li>` +
          `</ul>` +
          `<p>Please visit the admin dashboard to review the request:</p>` +
          `<a href="${adminLink}">${adminLink}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reviewer application email sent successfully.');
  } catch (error) {
    console.error('Error sending reviewer application email:', error);
    // Do not re-throw, as failing to send an email should not block the user's request.
  }
}
