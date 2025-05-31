// API route to check Supabase health
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create a separate Supabase client for health check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const start = Date.now();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Test 1: Basic connection test
    console.log('[Health Check] Testing Supabase connection');
    
    // Test simple health endpoint (this should be fast)
    const { error: healthError } = await supabase.from('_health').select('*').limit(1);
    const healthTime = Date.now() - start;
    
    if (healthError) {
      console.error('[Health Check] Health check failed:', healthError);
      return res.status(500).json({ 
        status: 'error',
        message: 'Supabase health check failed',
        error: healthError,
        healthTime
      });
    }
    
    // Test 2: Test auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const authTime = Date.now() - start;
    
    // Test 3: Try reviewers table specifically
    const { data: reviewersData, error: reviewersError } = await supabase
      .from('reviewers')
      .select('count', { count: 'exact', head: true });
    const reviewersTime = Date.now() - start;
    
    // Test 4: Try different table for comparison
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('count', { count: 'exact', head: true });
    const eventsTime = Date.now() - start;
    
    // Return complete diagnostics
    return res.status(200).json({
      status: 'success',
      connection: {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey,
        healthTime,
        authTime,
        reviewersTime,
        eventsTime,
      },
      auth: {
        hasSession: !!authData?.session,
        error: authError ? authError.message : null
      },
      reviewers: {
        error: reviewersError ? reviewersError.message : null
      },
      events: {
        error: eventsError ? eventsError.message : null
      },
      totalTime: Date.now() - start
    });
  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Unexpected error during health check',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
