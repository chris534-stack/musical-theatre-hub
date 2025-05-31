import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Record the start time to measure performance
  const startTime = Date.now();
  
  try {
    // Step 1: Test a simple SELECT with explicit timeout
    console.log('Test 1: Testing SELECT operation...');
    const selectPromise = supabase.from('reviewers').select('count', { count: 'exact', head: true });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SELECT operation timed out after 5 seconds')), 5000)
    );
    
    const selectResult = await Promise.race([selectPromise, timeoutPromise]) as any;
    const selectTime = Date.now() - startTime;
    console.log(`Test 1 completed in ${selectTime}ms:`, selectResult);
    
    // Step 2: Test RLS policies for this session
    console.log('Test 2: Checking current session...');
    const { data: session } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.session;
    console.log('Authenticated:', isAuthenticated);
    
    // Step 3: Test a dummy INSERT operation to check write permissions
    // Using a fake ID that won't conflict with real users
    console.log('Test 3: Testing INSERT operation (will be rolled back)...');
    const insertStartTime = Date.now();
    const insertPromise = supabase.from('reviewers')
      .insert({
        id: 'test-' + Date.now(),
        first_name: 'Test',
        last_name: 'User',
        reviewer_application_status: 'test',
        applied_at: new Date().toISOString()
      })
      .select();
    
    const insertTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('INSERT operation timed out after 8 seconds')), 8000)
    );
    
    try {
      const insertResult = await Promise.race([insertPromise, insertTimeoutPromise]) as any;
      const insertTime = Date.now() - insertStartTime;
      console.log(`Test 3 completed in ${insertTime}ms:`, insertResult);
      
      // If we got here without error, attempt to clean up test data
      if (!insertResult.error && insertResult.data?.length > 0) {
        const testId = insertResult.data[0].id;
        await supabase.from('reviewers').delete().eq('id', testId);
      }
    } catch (insertError) {
      console.error('Insert test failed:', insertError);
    }
    
    return res.status(200).json({
      success: true,
      connectionTime: selectTime,
      authenticated: isAuthenticated,
      sessionInfo: session?.session ? {
        userId: session.session.user.id,
        email: session.session.user.email,
        role: session.session.user.role,
      } : null,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      time: Date.now() - startTime
    });
  }
}
