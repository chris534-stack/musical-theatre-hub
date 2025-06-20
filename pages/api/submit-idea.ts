import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, idea_type, title, description } = req.body;

    // Validate required fields
    if (!name || !email || !idea_type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert the idea into the database
    const { data, error } = await supabase
      .from('ideas')
      .insert([
        {
          name,
          email,
          idea_type,
          title,
          description,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error submitting idea:', error);
      return res.status(500).json({ error: 'Failed to submit idea' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in submit-idea API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
