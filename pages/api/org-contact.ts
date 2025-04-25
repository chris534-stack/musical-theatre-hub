import type { NextApiRequest, NextApiResponse } from 'next';

import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, org, email, message } = req.body;
  if (!name || !org || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Use your provided admin email as default
  const adminEmail = process.env.ADMIN_EMAIL || 'christopher.ridgley@gmail.com';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: email,
      to: adminEmail,
      subject: `New Organization Listing Request from ${name}`,
      text: `Name: ${name}\nOrganization: ${org}\nEmail: ${email}\nMessage: ${message}`,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

