import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client
import { requireAdmin } from '../../utils/isAdmin';

// Returns a list of unique venues from the Supabase 'venues' table
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    // Potentially handle POST request logic here if needed in the future
    // For now, just returning an error as POST is not implemented beyond admin check
    return res.status(405).json({ error: 'POST method not implemented for this route' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']); // Include POST in Allow header
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all venue names from the 'venues' table
    const { data, error } = await supabase
      .from('venues')
      .select('name');

    if (error) {
      console.error('Supabase error fetching venues:', error);
      throw error; // Propagate the error to be caught by the catch block
    }

    // Extract the venue names into a simple array of strings
    // The data from Supabase will be an array of objects like [{ name: 'Venue A' }, { name: 'Venue B' }]
    // We also filter out any null or undefined names just in case.
    const venueNames = data ? data.map(venue => venue.name).filter(Boolean) : [];
    
    // While fetching directly from the 'venues' table and selecting 'name' should give unique venues,
    // if names are not unique in the table (which would be unusual for a primary name field),
    // an extra step for ensuring uniqueness could be `Array.from(new Set(venueNames))`
    // For now, assuming 'name' in 'venues' table is sufficiently unique.
    res.status(200).json(venueNames);
  } catch (err: any) {
    console.error('Error fetching venues:', err);
    res.status(500).json({ error: 'Failed to fetch venues', details: err.message });
  }
}
