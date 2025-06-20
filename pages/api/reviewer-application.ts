import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ----------------------------------------------------------------------------------
// Server-side Supabase client using service-role key so we can upsert securely.
// NOTE: Do NOT expose this key to the browser; Vercel env var must be secret only.
// ----------------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  throw new Error('[API /reviewer-application] Missing Supabase env vars');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

// ----------------------------------------------------------------------------------
// Input validation schema
// ----------------------------------------------------------------------------------
const ApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  preferredName: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // -------------------------------------------------------------------------------
  // Validate JWT from client. Expect Authorization: Bearer <access_token>
  // -------------------------------------------------------------------------------
  const authHeader = req.headers.authorization || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(.*)$/i);
  if (!tokenMatch) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const accessToken = tokenMatch[1];
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // -------------------------------------------------------------------------------
  // Validate body
  // -------------------------------------------------------------------------------
  const parse = ApplicationSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { firstName, lastName, preferredName, pronouns } = parse.data;

  // -------------------------------------------------------------------------------
  // Upsert into reviewers table using user.id as primary key
  // -------------------------------------------------------------------------------
  const { error: dbError } = await supabase
    .from('reviewers')
    .upsert(
      {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        preferred_name: preferredName ?? null,
        pronouns: pronouns ?? null,
        reviewer_application_status: 'pending' // new applications start as pending
      },
      { onConflict: 'id' }
    );

  if (dbError) {
    console.error('[API reviewer-application] DB error', dbError);
    return res.status(500).json({ error: 'Database error', details: dbError.message });
  }

  return res.status(201).json({ ok: true });
}
