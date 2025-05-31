import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

type StoredApplication = {
  backupId: string;
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  pronouns: string | null;
  reviewer_application_status: string;
  applied_at: string;
  email: string;
  timestamp: number;
  retryCount: number;
  lastRetry: number | null;
  error?: string;
  lastError?: string;
};

export default function PendingApplications() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [processing, setProcessing] = useState<{[key: string]: string}>({});
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'connected' | 'error'>('untested');
  
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

  // Load applications from server on mount
  useEffect(() => {
    if (isAdmin) {
      fetchPendingApplications();
    }
  }, [isAdmin]);
  
  // Function to fetch pending applications from server
  const fetchPendingApplications = async () => {
    try {
      const response = await fetch('/api/get-pending-applications');
      
      if (!response.ok) {
        throw new Error(`Error fetching pending applications: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error loading pending applications:', error);
    }
  };

  // Function to test database connection
  const testConnection = async () => {
    try {
      const { error } = await supabase.from('reviewers').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('Database connection test failed:', error);
        setConnectionStatus('error');
        return false;
      }
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      setConnectionStatus('error');
      return false;
    }
  };

  // Function to submit a single pending application to the database
  const submitApplication = async (app: StoredApplication) => {
    setProcessing(prev => ({ ...prev, [app.backupId]: 'processing' }));
    
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        setProcessing(prev => ({ ...prev, [app.backupId]: 'error' }));
        return;
      }
      
      // Use the API to process this application
      const response = await fetch(`/api/process-application/${app.backupId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process application');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Success! Mark as processed
        setProcessing(prev => ({ ...prev, [app.backupId]: 'success' }));
        
        // Remove from state after a delay
        setTimeout(() => {
          setApplications(apps => apps.filter(a => a.backupId !== app.backupId));
          
          // Clear processing state
          setProcessing(prev => {
            const newState = { ...prev };
            delete newState[app.backupId];
            return newState;
          });
        }, 2000);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error processing application:', error);
      setProcessing(prev => ({ ...prev, [app.backupId]: 'error' }));
    }
  };
  
  // Function to retry all pending applications
  const retryAllApplications = async () => {
    try {
      setProcessing(prev => ({ ...prev, 'all': 'processing' }));
      
      const response = await fetch('/api/retry-pending-applications', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to retry applications: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Retry result:', result);
      
      // Refresh the list
      fetchPendingApplications();
      
      setProcessing(prev => ({ ...prev, 'all': 'success' }));
      
      // Clear status after delay
      setTimeout(() => {
        setProcessing(prev => {
          const newState = { ...prev };
          delete newState['all'];
          return newState;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error retrying applications:', error);
      setProcessing(prev => ({ ...prev, 'all': 'error' }));
    }
  };

  // Function to clear all pending applications
  const clearAllApplications = async () => {
    if (confirm('Are you sure you want to delete all pending applications? This cannot be undone.')) {
      try {
        const response = await fetch('/api/clear-pending-applications', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to clear applications: ${response.status}`);
        }
        
        setApplications([]);
      } catch (error) {
        console.error('Error clearing applications:', error);
        alert('Failed to clear applications: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Pending Reviewer Applications</h1>
      <p className="mb-4 text-gray-600">
        These applications were submitted while the database connection was down and saved locally in your browser.
      </p>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={testConnection}
            className={`px-4 py-2 rounded mr-4 ${
              connectionStatus === 'connected' 
                ? 'bg-green-500 text-white' 
                : connectionStatus === 'error' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-500 text-white'
            }`}
          >
            {connectionStatus === 'untested' 
              ? 'Test Database Connection' 
              : connectionStatus === 'connected' 
                ? '✓ Database Connected' 
                : '✗ Database Error'}
          </button>
          
          <button 
            onClick={fetchPendingApplications}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-4"
          >
            Refresh List
          </button>
          
          {applications.length > 0 && connectionStatus === 'connected' && (
            <button 
              onClick={retryAllApplications}
              disabled={processing['all'] === 'processing'}
              className={`px-4 py-2 rounded ${
                processing['all'] === 'processing' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : processing['all'] === 'error'
                    ? 'bg-red-100 text-red-800'
                    : processing['all'] === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              {processing['all'] === 'processing' 
                ? 'Processing...' 
                : processing['all'] === 'error'
                  ? 'Retry Failed' 
                  : processing['all'] === 'success'
                    ? 'Success!' 
                    : 'Retry All Applications'}
            </button>
          )}
        </div>
        
        {applications.length > 0 && (
          <button 
            onClick={clearAllApplications}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear All Pending Applications
          </button>
        )}
      </div>
      
      {applications.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500">No pending applications found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Applied</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app, index) => (
                <tr key={app.backupId} className="hover:bg-gray-50">
                  <td className="p-3">
                    {app.first_name} {app.last_name}
                    {app.preferred_name && <span className="text-gray-500 text-sm ml-2">({app.preferred_name})</span>}
                  </td>
                  <td className="p-3">{app.email}</td>
                  <td className="p-3">
                    {new Date(app.timestamp).toLocaleString()}
                    {app.retryCount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Retry count: {app.retryCount}
                        {app.lastRetry && (
                          <span className="ml-1">
                            (Last: {new Date(app.lastRetry).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                    )}
                    {app.lastError && (
                      <div className="text-xs text-red-500 mt-1 truncate max-w-xs" title={app.lastError}>
                        Error: {app.lastError.substring(0, 50)}{app.lastError.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => submitApplication(app)}
                      disabled={processing[app.backupId] === 'processing' || connectionStatus !== 'connected'}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        processing[app.backupId] === 'processing' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : processing[app.backupId] === 'error'
                            ? 'bg-red-100 text-red-800'
                            : processing[app.backupId] === 'success'
                              ? 'bg-green-100 text-green-800'
                              : connectionStatus !== 'connected'
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {processing[app.backupId] === 'processing' 
                        ? 'Processing...' 
                        : processing[app.backupId] === 'error'
                          ? 'Failed - Retry' 
                          : processing[app.backupId] === 'success'
                            ? 'Success!' 
                            : 'Submit to Database'}
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/delete-application/${app.backupId}`, {
                            method: 'POST',
                          });
                          
                          if (!response.ok) {
                            throw new Error(`Failed to delete: ${response.status}`);
                          }
                          
                          // Remove from state
                          setApplications(apps => apps.filter(a => a.backupId !== app.backupId));
                        } catch (error) {
                          console.error('Error deleting application:', error);
                          alert('Failed to delete application');
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Important Notes</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>These applications are stored <strong>only in your browser's local storage</strong>.</li>
          <li>If you clear your browser data or use a different browser, you won't see these applications.</li>
          <li>Make sure to test the database connection before attempting to submit applications.</li>
          <li>This is a temporary solution until the Supabase connection issues are resolved.</li>
        </ul>
      </div>
    </div>
  );
}
