import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Only allow this email to approve reviewers
const ADMIN_EMAILS = ['christopher.ridgley@gmail.com'];

// Initialize Firebase Admin SDK (reuse if already initialized)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get and verify the ID token from Authorization header
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await getAuth().verifyIdToken(idToken);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Approve reviewer: set reviewer custom claim for target user
    const { uidToApprove } = req.body;
    if (!uidToApprove) return res.status(400).json({ error: 'Missing uidToApprove' });
    await getAuth().setCustomUserClaims(uidToApprove, { reviewer: true });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
