import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

/**
 * This API endpoint provides information about the current authentication state
 * and environment variables to help debug domain-specific issues.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers to allow requests from all domains
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    // Handle OPTIONS request for CORS preflight
    return res.status(200).end();
  }
  
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Get current environment info
    const environmentInfo = {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      host: req.headers.host,
      origin: req.headers.origin
    };
    
    // Return environment and auth info for debugging
    return res.status(200).json({
      auth: {
        hasSession: !!sessionData?.session,
        sessionError: sessionError ? sessionError.message : null
      },
      environment: environmentInfo,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer
      }
    });
  } catch (err) {
    console.error('Auth domain fix error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
