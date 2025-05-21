import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useIsAdmin from '../../components/useIsAdmin';
import Link from 'next/link';

interface ReviewerApplication {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  pronouns?: string;
  reviewer_application_status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  created_at: string;
  updated_at: string;
  email?: string; // We'll fetch this from auth.users
}

export default function ManageReviewers() {
  const { isAdmin, loading: adminLoading, error: adminError } = useIsAdmin();
  const [applications, setApplications] = useState<ReviewerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Only fetch data if the user is an admin
    if (isAdmin) {
      fetchReviewerApplications();
    } else if (!adminLoading) {
      setLoading(false);
    }
  }, [isAdmin, adminLoading]);

  async function fetchReviewerApplications() {
    setLoading(true);
    setError(null);
    try {
      // Fetch applications - this will require admin role in Supabase
      const { data, error } = await supabase
        .from('reviewers')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Fetch emails for each user from auth.users (only possible with admin/service_role key)
      // For each application, fetch the email from the auth.users table
      const applicationsWithEmail = await Promise.all(
        data.map(async (app) => {
          try {
            // First try to get user info which includes email
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(app.id);
            
            if (authError || !authData) {
              console.warn('Could not get email for user:', app.id, authError);
              return { ...app, email: 'Email unavailable' };
            }
            
            return { ...app, email: authData.user.email };
          } catch (e) {
            console.error('Error fetching user email:', e);
            return { ...app, email: 'Error fetching email' };
          }
        })
      );

      setApplications(applicationsWithEmail);
    } catch (err: any) {
      console.error('Error fetching reviewer applications:', err);
      setError(`Failed to load reviewer applications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(reviewerId: string, newStatus: 'approved' | 'rejected') {
    setActionLoading(true);
    setActionResult(null);
    try {
      // Get current user's token to send to the API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/approve-reviewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reviewerId, newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reviewer status');
      }

      setActionResult({
        success: true,
        message: `Reviewer ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`
      });

      // Refresh the list
      fetchReviewerApplications();
    } catch (err: any) {
      console.error('Error updating reviewer status:', err);
      setActionResult({
        success: false,
        message: `Failed to update status: ${err.message}`
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (adminLoading) {
    return <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>Checking admin status...</div>;
  }

  if (adminError) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
        <h2>Error</h2>
        <p>Failed to check admin status: {adminError.message}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
        <h2>Admin Access Required</h2>
        <p>You must be an admin to access this page.</p>
        <Link href="/" style={{ textDecoration: 'underline' }}>
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Manage Reviewer Applications</h2>
      
      {actionResult && (
        <div style={{ 
          padding: '8px 16px', 
          marginBottom: 16, 
          backgroundColor: actionResult.success ? '#e6f7e6' : '#ffebeb',
          borderRadius: 4,
          border: `1px solid ${actionResult.success ? '#c3e6c3' : '#ffcccb'}`
        }}>
          {actionResult.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p>Review and manage applications to become reviewers.</p>
        <button 
          onClick={() => fetchReviewerApplications()} 
          disabled={loading}
          style={{ 
            background: '#2d6cdf', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4, 
            padding: '8px 16px', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p>No reviewer applications found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Pronouns</th>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Applied</th>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: 10 }}>
                    {app.first_name} {app.last_name}
                    {app.preferred_name && <><br/><span style={{ fontSize: '0.8em', color: '#666' }}>Preferred: {app.preferred_name}</span></>}
                  </td>
                  <td style={{ padding: 10 }}>{app.email || 'N/A'}</td>
                  <td style={{ padding: 10 }}>{app.pronouns || 'N/A'}</td>
                  <td style={{ padding: 10 }}>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td style={{ padding: 10 }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 12,
                      backgroundColor: 
                        app.reviewer_application_status === 'approved' ? '#e6f7e6' : 
                        app.reviewer_application_status === 'rejected' ? '#ffebeb' : 
                        '#fff8e1',
                      color: 
                        app.reviewer_application_status === 'approved' ? '#2e7d32' : 
                        app.reviewer_application_status === 'rejected' ? '#c62828' : 
                        '#f57c00'
                    }}>
                      {app.reviewer_application_status}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    {app.reviewer_application_status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleStatusChange(app.id, 'approved')}
                          disabled={actionLoading}
                          style={{ 
                            backgroundColor: '#2e7d32', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '4px 8px', 
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                          disabled={actionLoading}
                          style={{ 
                            backgroundColor: '#c62828', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '4px 8px', 
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div>
                        {app.reviewer_application_status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            disabled={actionLoading}
                            style={{ 
                              backgroundColor: '#c62828', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: 4, 
                              padding: '4px 8px', 
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              fontSize: '0.8em'
                            }}
                          >
                            Revoke
                          </button>
                        )}
                        {app.reviewer_application_status === 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            disabled={actionLoading}
                            style={{ 
                              backgroundColor: '#2e7d32', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: 4, 
                              padding: '4px 8px', 
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              fontSize: '0.8em'
                            }}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
