import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { requireAdmin } from '../../utils/isAdmin';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Admin check using Supabase token
  const authHeader = req.headers.authorization;
  console.log('[API Debug] Auth header exists:', !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[API Error] Missing or malformed authorization header');
    return res.status(401).json({ error: 'No valid authorization header provided.' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    console.error('[API Error] No token found after Bearer prefix');
    return res.status(401).json({ error: 'No access token provided.' });
  }
  
  console.log('[API Debug] Retrieved token length:', token.length);
  
  // Use supabase client to get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError) {
    console.error('[API Error] User validation error:', userError.message);
    return res.status(401).json({ error: `Invalid access token: ${userError.message}` });
  }
  
  if (!user) {
    console.error('[API Error] No user found with token');
    return res.status(401).json({ error: 'No user found with this token.' });
  }
  
  console.log('[API Debug] User email from token:', user.email);
  
  // Use environment variable for admin emails
  const adminEmailsEnv = process.env.ADMIN_EMAILS || 'christopher.ridgley@gmail.com';
  const ADMIN_EMAILS = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase());
  
  const userEmail = typeof user.email === 'string' ? user.email.toLowerCase().trim() : '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);
  
  console.log('[API Debug] Admin emails:', ADMIN_EMAILS);
  console.log('[API Debug] User email lowercase:', userEmail);
  console.log('[API Debug] Is admin:', isAdmin);
  
  if (!isAdmin) {
    console.error(`[API Error] User ${userEmail} is not in admin list`);
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  console.log('[API Debug] Admin check passed for user:', userEmail);

  try {
    let { title, description, venue_id, dates } = req.body;
    // Validate and normalize
    if (!title || !dates || !Array.isArray(dates) || dates.length === 0 || venue_id === undefined || venue_id === null) {
      return res.status(400).json({ error: 'Missing required fields: title, dates array, or venue_id.' });
    }
    title = title.trim();
    if (!title) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
    // Ensure venue_id is a number
    if (typeof venue_id === 'string') venue_id = parseInt(venue_id, 10);
    if (isNaN(venue_id)) {
      return res.status(400).json({ error: 'venue_id must be a valid number.' });
    }

    // 1. Generate a unique slug from the title
    function slugify(str: string) {
      return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;
    while (slugExists) {
      const { data: existing, error: slugError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) {
        slugExists = false;
      } else {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    }

    // Format dates for JSONB storage
    const formattedDates = dates.map((d: any) => ({
      date: d.date,
      time: d.mainTime,
      isMatinee: d.isMatinee || false,
      matineeTime: d.matineeTime || null
    }));
    
    // Create admin client that bypasses RLS policies
    console.log('[API Debug] Creating admin Supabase client to bypass RLS');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Insert event with dates in JSONB field using admin privileges
    const { data: event, error: eventError } = await adminSupabase
      .from('events')
      .insert([{ 
        title, 
        description, 
        venue_id, 
        slug,
        dates: formattedDates,
        director: req.body.director,
        category: req.body.category,
        ticket_link: req.body.ticket_link
      }])
      .select('*')
      .single();
    
    if (eventError || !event) {
      return res.status(500).json({ error: eventError?.message || 'Could not add event.' });
    }

    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Could not add event.' });
  }
}
