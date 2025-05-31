import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function SupabaseTest() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: 'Test',
    lastName: 'User',
    preferredName: '',
    pronouns: ''
  });
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user?.id) {
          setUserId(sessionData.session.user.id);
          
          // Check admin emails from env var
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
          if (adminEmails.includes(sessionData.session.user.email?.toLowerCase() || '')) {
            setIsAdmin(true);
          } else {
            // Check admin_users table as fallback
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('id')
              .eq('id', sessionData.session.user.id)
              .single();
              
            setIsAdmin(!!adminData);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  // Run initial tests
  useEffect(() => {
    if (!loading && isAdmin) {
      runTests();
    }
  }, [loading, isAdmin]);

  async function runTests() {
    setTestResults({});
    
    // Test 1: Check Supabase URL and keys
    try {
      const results: Record<string, any> = {};
      
      results.supabaseUrl = {
        status: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'missing',
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 12)}...` : 
          'Not set'
      };
      
      results.supabaseKey = {
        status: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'missing',
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 12)}...` : 
          'Not set'
      };
      
      // Test 2: Check user authentication
      const { data: authData, error: authError } = await supabase.auth.getUser();
      results.authentication = {
        status: authData?.user ? 'ok' : 'error',
        error: authError ? authError.message : null,
        user: authData?.user ? {
          id: authData.user.id,
          email: authData.user.email,
          provider: authData.user.app_metadata?.provider
        } : null
      };
      
      // Test 3: Simple ping to reviewers table (no write)
      try {
        const startTime = performance.now();
        const { data: pingData, error: pingError } = await Promise.race([
          supabase.from('reviewers').select('id').limit(1),
          new Promise<{data: null, error: {message: string}}>((resolve) => 
            setTimeout(() => resolve({
              data: null, 
              error: {message: 'Operation timed out after 5 seconds'}
            }), 5000)
          )
        ]) as any;
        
        const endTime = performance.now();
        results.ping = {
          status: pingError ? 'error' : 'ok',
          error: pingError ? pingError.message : null,
          time: `${Math.round(endTime - startTime)}ms`,
          data: pingData
        };
      } catch (pingExc) {
        results.ping = {
          status: 'exception',
          error: pingExc instanceof Error ? pingExc.message : 'Unknown error',
          time: 'N/A'
        };
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async function handleTestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);
    setErrorMessage(null);
    
    if (!userId) {
      setErrorMessage('No user ID available. Please sign in.');
      return;
    }
    
    try {
      // Prepare test data
      const reviewerData = {
        id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        preferred_name: formData.preferredName || null,
        pronouns: formData.pronouns || null,
        reviewer_application_status: 'test',
        applied_at: new Date().toISOString()
      };
      
      console.log('Attempting Supabase operation with data:', reviewerData);
      
      // Set up a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out after 15 seconds')), 15000);
      });
      
      // Start timing
      const startTime = performance.now();
      
      // Perform operation with timeout
      const result = await Promise.race([
        supabase.from('reviewers').upsert(reviewerData, { onConflict: 'id' }).select(),
        timeoutPromise
      ]) as any;
      
      // End timing
      const endTime = performance.now();
      const opTime = Math.round(endTime - startTime);
      
      setSubmitResult({
        success: !result.error,
        time: `${opTime}ms`,
        error: result.error ? result.error.message : null,
        code: result.error?.code,
        data: result.data,
        details: {
          table: 'reviewers',
          operation: 'upsert',
          onConflict: 'id',
          ...reviewerData
        }
      });
    } catch (error) {
      console.error('Test submission error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="container mx-auto p-4">Admin access required</div>;
  }

  return (
    <>
      <Head>
        <title>Supabase Diagnostic Test</title>
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Supabase Diagnostic Test</h1>
        
        <div className="mb-6">
          <button 
            onClick={runTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Run Tests
          </button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Configuration & Connection Tests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Test</th>
                  <th className="py-2 px-4 border">Status</th>
                  <th className="py-2 px-4 border">Details</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(testResults).map(([test, result]: [string, any]) => (
                  <tr key={test}>
                    <td className="py-2 px-4 border">{test}</td>
                    <td className={`py-2 px-4 border ${
                      result.status === 'ok' ? 'bg-green-100' : 
                      result.status === 'error' ? 'bg-red-100' : 
                      result.status === 'exception' ? 'bg-red-100' : 
                      result.status === 'missing' ? 'bg-yellow-100' : 
                      'bg-gray-100'
                    }`}>
                      {result.status}
                    </td>
                    <td className="py-2 px-4 border">
                      {result.error ? (
                        <div className="text-red-600">{result.error}</div>
                      ) : null}
                      
                      {result.time ? (
                        <div>Response time: {result.time}</div>
                      ) : null}
                      
                      {result.value ? (
                        <div>{result.value}</div>
                      ) : null}
                      
                      {result.user ? (
                        <div>
                          User: {result.user.email} ({result.user.id.substring(0, 8)}...)
                          via {result.user.provider}
                        </div>
                      ) : null}
                      
                      {result.data ? (
                        <div className="text-xs mt-1 overflow-x-auto">
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Database Submission</h2>
          <form onSubmit={handleTestSubmit} className="space-y-4 bg-gray-50 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Preferred Name</label>
                <input
                  type="text"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({...formData, preferredName: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Pronouns</label>
                <input
                  type="text"
                  value={formData.pronouns}
                  onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div>
              <button 
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Database Submission
              </button>
            </div>
          </form>
          
          {submitResult && (
            <div className={`mt-4 p-4 rounded ${submitResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {submitResult.success ? 'Submission Successful!' : 'Submission Failed'}
              </h3>
              <div>Operation time: {submitResult.time}</div>
              
              {submitResult.error && (
                <div className="text-red-600 mt-2">
                  <div>Error: {submitResult.error}</div>
                  {submitResult.code && <div>Code: {submitResult.code}</div>}
                </div>
              )}
              
              <div className="mt-2">
                <h4 className="font-medium">Operation Details:</h4>
                <pre className="text-xs mt-1 bg-white p-2 rounded overflow-x-auto">
                  {JSON.stringify(submitResult.details, null, 2)}
                </pre>
              </div>
              
              {submitResult.data && (
                <div className="mt-2">
                  <h4 className="font-medium">Response Data:</h4>
                  <pre className="text-xs mt-1 bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(submitResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Supabase Connection Troubleshooting</h2>
          <div className="space-y-2">
            <p><strong>Common issues:</strong></p>
            <ul className="list-disc pl-6">
              <li>Row Level Security (RLS) policies blocking operations</li>
              <li>Network connectivity issues or firewall restrictions</li>
              <li>Invalid or expired authentication tokens</li>
              <li>Missing required columns or schema mismatches</li>
              <li>Incorrect database permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
