import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

type TestResult = {
  success: boolean;
  responseTime?: number;
  error?: string | null;
  data?: any;
  timestamp?: number;
};

type DiagnosticsState = {
  directTest?: TestResult;
  apiTest?: any;
  envTest?: {
    supabaseUrl: boolean;
    supabaseKey: boolean;
    url?: string;
  };
  pingTest?: TestResult;
};

export default function SupabaseDiagnostics() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [results, setResults] = useState<DiagnosticsState>({});
  const [loading, setLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [timeoutValue, setTimeoutValue] = useState(10000); // 10 seconds default

  // Check if user is admin on component mount
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Get current user session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          // No session means not logged in
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        const currentUser = session.user;
        
        // Check if user has admin role based on environment variable
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
          ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
          : [];
        
        if (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
          setIsAdmin(true);
        } else {
          // Alternative check against database if needed
          try {
            const { data, error: roleError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();
            
            if (!roleError) {
              setIsAdmin(!!data);
            }
          } catch (dbError) {
            console.error('Error checking admin status in database:', dbError);
          }
        }
      } catch (error) {
        console.error('Unexpected error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  // Function to run direct browser-based test
  const runDirectTest = async () => {
    setDirectError(null);
    setLoading(true);
    
    try {
      console.log('Starting direct Supabase test...');
      
      // Create a timeout that will reject after specified time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection timed out after ${timeoutValue/1000} seconds`));
        }, timeoutValue);
      });
      
      // The actual test
      const testPromise = new Promise<TestResult>(async (resolve) => {
        try {
          const startTime = performance.now();
          const { data, error } = await supabase.from('reviewers').select('count', { count: 'exact', head: true });
          const endTime = performance.now();
          
          resolve({
            success: !error,
            responseTime: Math.round(endTime - startTime),
            error: error ? error.message : null,
            data,
            timestamp: Date.now()
          });
        } catch (err) {
          resolve({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            data: null,
            timestamp: Date.now()
          });
        }
      });
      
      const result = await Promise.race([testPromise, timeoutPromise]) as TestResult;
      console.log('Direct test result:', result);
      setResults((prev: DiagnosticsState) => ({ ...prev, directTest: result }));
    } catch (error) {
      console.error('Direct test failed:', error);
      setDirectError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch results from our API endpoint
  const runApiTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/supabase-health');
      const data = await response.json();
      setResults((prev: DiagnosticsState) => ({ ...prev, apiTest: data }));
    } catch (error) {
      console.error('API test failed:', error);
      setResults((prev: DiagnosticsState) => ({ 
        ...prev, 
        apiTest: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Failed to fetch' 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  // If not admin, show access denied
  if (!isLoading && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be an administrator to access this page.</p>
      </div>
    );
  }

  // Function to check environment variables
  const checkEnvironmentVars = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Checking environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseKey);
    
    setResults((prev: DiagnosticsState) => ({
      ...prev,
      envTest: {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        url: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : undefined
      }
    }));
  };
  
  // Function to ping Supabase endpoint
  const pingSupabase = async () => {
    setLoading(true);
    try {
      // Get the Supabase URL from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not found in environment variables');
      }
      
      // Construct a URL to ping (just to check connectivity, not auth)
      const pingUrl = `${supabaseUrl}/rest/v1/`;
      
      console.log('Pinging Supabase at:', pingUrl);
      const startTime = performance.now();
      
      // Create a timeout that will reject after specified time
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection timed out after ${timeoutValue/1000} seconds`));
        }, timeoutValue);
      });
      
      // The actual ping
      const pingPromise = fetch(pingUrl, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/json'
        }
      }).then(response => {
        const endTime = performance.now();
        return {
          success: response.ok,
          responseTime: Math.round(endTime - startTime),
          status: response.status,
          statusText: response.statusText
        };
      });
      
      const result = await Promise.race([pingPromise, timeoutPromise]);
      console.log('Ping result:', result);
      
      setResults((prev: DiagnosticsState) => ({ ...prev, pingTest: {
        ...result,
        timestamp: Date.now()
      }}));
      
    } catch (error) {
      console.error('Ping test failed:', error);
      setResults((prev: DiagnosticsState) => ({ 
        ...prev, 
        pingTest: { 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        } 
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // Run env check on component mount
  useEffect(() => {
    checkEnvironmentVars();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Diagnostics</h1>
      <p className="mb-4 text-gray-600">Use this page to diagnose Supabase connection issues.</p>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <button
          onClick={checkEnvironmentVars}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Check Environment Variables
        </button>
        
        {results?.envTest && (
          <div className="mt-4">
            <h3 className="font-semibold">Results:</h3>
            <div className="mt-2 p-3 bg-gray-800 text-white rounded">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-opacity-20"
                     style={{ backgroundColor: results.envTest.supabaseUrl ? '#4ade80' : '#f87171' }}>
                  {results.envTest.supabaseUrl ? '✓' : '✗'}
                </div>
                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
                  <p className="text-sm text-gray-300">{results.envTest.supabaseUrl ? (results.envTest.url || 'Present') : 'Missing'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-opacity-20"
                     style={{ backgroundColor: results.envTest.supabaseKey ? '#4ade80' : '#f87171' }}>
                  {results.envTest.supabaseKey ? '✓' : '✗'}
                </div>
                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                  <p className="text-sm text-gray-300">{results.envTest.supabaseKey ? 'Present' : 'Missing'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Ping Test</h2>
        <p className="mb-2 text-gray-600">Checks basic connectivity to the Supabase endpoint (no auth required)</p>
        <button
          onClick={pingSupabase}
          disabled={loading}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Ping Supabase Endpoint'}
        </button>
        
        {results?.pingTest && (
          <div className="mt-4">
            <h3 className="font-semibold">Results:</h3>
            <div className="mt-2 p-3 bg-gray-800 text-white rounded overflow-auto">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-opacity-20"
                     style={{ backgroundColor: results.pingTest.success ? '#4ade80' : '#f87171' }}>
                  {results.pingTest.success ? '✓' : '✗'}
                </div>
                <div>
                  <p className="font-medium">Connection Status</p>
                  <p className="text-sm text-gray-300">
                    {results.pingTest.success 
                      ? `Success (${results.pingTest.responseTime}ms)` 
                      : `Failed: ${results.pingTest.error || 'Unknown error'}`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Last tested: {results.pingTest.timestamp ? new Date(results.pingTest.timestamp).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Direct Browser Test</h2>
        <p className="mb-2 text-gray-600">Tests direct database query from browser (requires authentication)</p>
        <div className="flex items-center mb-4">
          <input
            type="range"
            min="3000"
            max="30000"
            step="1000"
            value={timeoutValue}
            onChange={(e) => setTimeoutValue(Number(e.target.value))}
            className="mr-4"
          />
          <span>Timeout: {timeoutValue/1000}s</span>
        </div>
        <button
          onClick={runDirectTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Direct Test'}
        </button>
        
        {directError && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
            {directError}
          </div>
        )}
        
        {results?.directTest && (
          <div className="mt-4">
            <h3 className="font-semibold">Results:</h3>
            <pre className="mt-2 p-3 bg-gray-800 text-white rounded overflow-auto max-h-60">
              {JSON.stringify(results.directTest, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">API-based Test</h2>
        <button
          onClick={runApiTest}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run API Test'}
        </button>
        
        {results?.apiTest && (
          <div className="mt-4">
            <h3 className="font-semibold">Results:</h3>
            <pre className="mt-2 p-3 bg-gray-800 text-white rounded overflow-auto max-h-96">
              {JSON.stringify(results.apiTest, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
        <p className="mb-2 text-sm italic">Based on the diagnostic results, here are some things to check:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check if your Supabase project is active in the Supabase dashboard</li>
          <li>Verify that your .env.local file has the correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>Check for any network issues, firewall restrictions, or VPN that might be blocking connections</li>
          <li>Test if other Supabase projects work from the same environment</li>
          <li>Try using the Supabase CLI to check your project status</li>
        </ul>
      </div>
    </div>
  );
}
