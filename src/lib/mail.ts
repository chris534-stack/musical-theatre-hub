
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    'SMTP environment variables are not fully configured. Email sending will be disabled.'
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT || '587', 10),
  secure: parseInt(SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

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
  if (!ADMIN_EMAIL) {
    console.error('ADMIN_EMAIL is not set. Cannot send notification email.');
    return;
  }

   if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log('Skipping email send because SMTP is not configured.');
    return;
  }

  const adminDashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin`;

  const mailOptions = {
    from: `"Our Stage, Eugene" <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: 'New Reviewer Application Received!',
    text: `A new application to become a reviewer has been submitted.\n\n`
        + `Name: ${applicantName}\n`
        + `Email: ${applicantEmail}\n\n`
        + `Please visit the admin dashboard to review this request:\n`
        + `${adminDashboardUrl}\n\n`
        + `Request ID: ${requestId}`,
    html: `<p>A new application to become a reviewer has been submitted.</p>`
        + `<p><strong>Name:</strong> ${applicantName}<br>`
        + `<strong>Email:</strong> ${applicantEmail}</p>`
        + `<p>Please visit the admin dashboard to review this request:</p>`
        + `<p><a href="${adminDashboardUrl}">Admin Dashboard</a></p>`
        + `<p><small>Request ID: ${requestId}</small></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reviewer application email sent to ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Error sending reviewer application email:', error);
    throw new Error('Failed to send notification email.');
  }
}
