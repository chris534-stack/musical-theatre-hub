import { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import Head from 'next/head';

type Reviewer = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  pronouns?: string;
  reviewer_application_status: string;
  applied_at: string;
  email?: string; // Added email field for display purposes
};

export default function AdminDashboard() {
  const [pendingReviewerCount, setPendingReviewerCount] = useState<number | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  // New state for reviewer applications
  const [reviewerApplications, setReviewerApplications] = useState<Reviewer[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCounts();

    // Handle deep-linking to specific application if provided in URL hash
    if (typeof window !== 'undefined') {
      // URL format would be /admin#application-[id]
      const hashParts = window.location.hash.split('#application-');
      if (hashParts.length > 1) {
        const applicationId = hashParts[1];
        // Set the active tab to reviewer applications
        setActiveTab(0);
        // Highlight this application with a yellow background
        setHighlightedId(applicationId);
        // Wait for DOM to update before scrolling
        setTimeout(() => {
          const element = document.getElementById(`application-${applicationId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchPendingReviewerApplications();
    }
  }, [activeTab]);

  async function fetchPendingCounts() {
    setIsLoading(true);
    setError(null);
    try {
      const { count: reviewerCount, error: reviewerError } = await supabase
        .from('reviewers')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_application_status', 'pending');
      if (reviewerError) throw reviewerError;
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (reviewsError) throw reviewsError;
      setPendingReviewerCount(reviewerCount ?? 0);
      setPendingReviewCount(reviewsCount ?? 0);
    } catch (e: any) {
      setError(e.message || 'Could not load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function fetchPendingReviewerApplications() {
    setLoadingApplications(true);
    try {
      console.log('Fetching pending reviewer applications...');
      
      // 1. Fetch pending applications from the reviewers table
      const { data, error } = await supabase
        .from('reviewers')
        .select('*')
        .eq('reviewer_application_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching from reviewers table:', error);
        throw error;
      }

      // Make a copy of the data so we can add emails to it
      const reviewersWithEmails = [...(data || [])];
      
      // 2. If we have applications, fetch their email addresses through an API call
      if (reviewersWithEmails.length > 0) {
        // For security reasons, we'll make a server-side API call to get the emails
        // This way we don't expose the admin API keys to the client
        const emailResponse = await fetch('/api/get-user-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: reviewersWithEmails.map(reviewer => reviewer.id)
          }),
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          
          // Add emails to each reviewer
          reviewersWithEmails.forEach(reviewer => {
            reviewer.email = emailData.emails[reviewer.id] || 'Email not found';
          });
        } else {
          console.error('Failed to fetch user emails');
        }
      }
      
      console.log('Fetched reviewer applications with emails:', reviewersWithEmails);
      setReviewerApplications(reviewersWithEmails);
    } catch (e: any) {
      console.error('Error fetching reviewer applications:', e);
    } finally {
      setLoadingApplications(false);
    }
  }
  
  async function handleApplicationAction(id: string, action: 'approve' | 'reject') {
    setProcessingApplicationId(id);
    try {
      if (action === 'approve') {
        // Call the approve-reviewer API endpoint
        const response = await fetch('/api/approve-reviewer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId: id }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to approve reviewer');
        }
      } else {
        // Update the status directly to rejected
        const { error } = await supabase
          .from('reviewers')
          .update({ reviewer_application_status: 'rejected' })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Refresh data after successful action
      await fetchPendingReviewerApplications();
      await fetchPendingCounts();
    } catch (e: any) {
      console.error(`Error ${action}ing application:`, e);
      alert(`Failed to ${action} application: ${e.message}`);
    } finally {
      setProcessingApplicationId(null);
    }
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <Head>
          <title>Admin Dashboard | Our Stage, Eugene</title>
        </Head>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
          <div style={{ border: '4px solid #3182CE', borderRadius: '50%', borderTop: '4px solid transparent', width: '50px', height: '50px', animation: 'spin 1s linear infinite' }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <Head>
          <title>Admin Dashboard | Our Stage, Eugene</title>
        </Head>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Admin Dashboard</h1>
        <div style={{ background: '#FED7D7', color: '#822727', padding: '1rem', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  // Now using activeTab state declared at the top of the component

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', paddingBottom: 'calc(2rem + 56px)' }}>
      {/* Added bottom padding (56px) to account for the mobile nav bar */}
      <Head>
        <title>Admin Dashboard | Our Stage, Eugene</title>
      </Head>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Admin Dashboard</h1>
      
      {/* Summary Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Pending Reviewer Applications</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{pendingReviewerCount}</p>
        </div>
        <div style={{ padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Pending Show Reviews</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{pendingReviewCount}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div>
        <div style={{ borderBottom: '1px solid #E2E8F0', display: 'flex' }}>
          <button 
            onClick={() => setActiveTab(0)}
            style={{ 
              padding: '0.75rem 1rem', 
              fontWeight: activeTab === 0 ? 'bold' : 'normal',
              borderBottom: activeTab === 0 ? '2px solid #3182CE' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reviewer Applications
          </button>
          <button 
            onClick={() => setActiveTab(1)}
            style={{ 
              padding: '0.75rem 1rem', 
              fontWeight: activeTab === 1 ? 'bold' : 'normal',
              borderBottom: activeTab === 1 ? '2px solid #3182CE' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Show Reviews
          </button>
        </div>
        
        {/* Tab Panels */}
        <div style={{ padding: '1.5rem 0' }}>
          {activeTab === 0 && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pending Reviewer Applications</h3>
              
              {loadingApplications ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                  <div style={{ border: '3px solid #3182CE', borderRadius: '50%', borderTop: '3px solid transparent', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : reviewerApplications.length === 0 ? (
                <p>No pending reviewer applications found.</p>
              ) : (
                <div>
                  {/* Mobile-responsive table with better styling */}
                  <div className="reviewer-table" style={{ overflowX: 'auto' }}>
                    <style jsx>{`
                      .reviewer-table table {
                        width: 100%;
                        border-collapse: collapse;
                      }
                      .reviewer-table th, .reviewer-table td {
                        padding: 0.75rem;
                        text-align: left;
                      }
                      .reviewer-table th {
                        font-weight: 600;
                        border-bottom: 2px solid #E2E8F0;
                      }
                      .reviewer-table tr {
                        border-bottom: 1px solid #E2E8F0;
                      }
                      .reviewer-table .action-buttons {
                        display: flex;
                        gap: 0.5rem;
                        justify-content: flex-end;
                      }
                      .reviewer-table .btn {
                        border: none;
                        border-radius: 4px;
                        padding: 0.4rem 0.8rem;
                        font-weight: 500;
                        cursor: pointer;
                      }
                      .reviewer-table .btn-approve {
                        background: #38A169;
                        color: white;
                      }
                      .reviewer-table .btn-reject {
                        background: #E53E3E;
                        color: white;
                      }
                      .reviewer-table .btn:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                      }
                      @media (max-width: 768px) {
                        .reviewer-table th:nth-child(3),
                        .reviewer-table td:nth-child(3) {
                          display: none; /* Hide Email ID on medium screens */
                        }
                      }
                      @media (max-width: 576px) {
                        .reviewer-table th:nth-child(2),
                        .reviewer-table td:nth-child(2) {
                          display: none; /* Hide preferred name on very small screens */
                        }
                      }
                      @media (max-width: 576px) {
                        .reviewer-table .action-buttons {
                          flex-direction: column;
                        }
                      }
                    `}</style>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Preferred Name</th>
                          <th>Email ID</th>
                          <th>Date Applied</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewerApplications.map(application => (
                          <tr 
                            key={application.id}
                            id={`application-${application.id}`} 
                            style={{
                              transition: highlightedId === application.id ? 'background-color 1.5s ease' : 'none',
                              backgroundColor: highlightedId === application.id ? '#fef9c3' : 'transparent'
                            }}
                          >
                            <td>
                              {`${application.first_name} ${application.last_name}`}
                              {application.pronouns && ` (${application.pronouns})`}
                            </td>
                            <td>
                              {application.preferred_name || '-'}
                            </td>
                            <td>
                              {application.email || 'Loading email...'}
                            </td>
                            <td>
                              {new Date(application.applied_at || application.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="action-buttons">
                                <button
                                  onClick={() => handleApplicationAction(application.id, 'approve')}
                                  disabled={processingApplicationId === application.id}
                                  className="btn btn-approve"
                                >
                                  {processingApplicationId === application.id ? '...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleApplicationAction(application.id, 'reject')}
                                  disabled={processingApplicationId === application.id}
                                  className="btn btn-reject"
                                >
                                  {processingApplicationId === application.id ? '...' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 1 && (
            <p>Show reviews section coming soon.</p>
          )}
        </div>
      </div>
      
      {/* Sign Out Button */}
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={async () => {
            const auth = getAuth();
            await signOut(auth);
            window.location.reload();
          }}
          style={{
            background: '#FFD700',
            color: '#2E3A59',
            border: 'none',
            borderRadius: '5px',
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
