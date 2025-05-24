import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import styles from '../../styles/AdminReview.module.css';
import Head from 'next/head';

interface ReviewerApplication {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  pronouns?: string;
  reviewer_application_status: string;
  applied_at: string;
  email?: string;
  review_token?: string;
  updated_at?: string;
}

export default function ReviewApplicationPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [application, setApplication] = useState<ReviewerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionTaken, setActionTaken] = useState<'approved' | 'denied' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // Only run once token is available from router.query
    if (!token) return;
    
    // Handle string or array of strings (URL parameters can be either)
    const tokenValue = Array.isArray(token) ? token[0] : token;
    
    async function fetchApplication() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching application with token:', tokenValue);
        
        // Find reviewer with this token
        const { data, error } = await supabase
          .from('reviewers')
          .select('*')
          .eq('review_token', tokenValue);
          
        if (error) {
          console.error('Supabase error:', error);
          throw new Error('Error retrieving application data');
        }
        
        if (!data || data.length === 0) {
          console.error('No data found for token:', token);
          throw new Error('Invalid or expired review token');
        }
        
        const applicationData = data[0];
        console.log('Application found:', applicationData);
        
        // Check if application has already been reviewed
        if (applicationData.reviewer_application_status !== 'pending') {
          setActionTaken(applicationData.reviewer_application_status === 'approved' ? 'approved' : 'denied');
          setMessage(`This application has already been ${applicationData.reviewer_application_status}`);
        }
        
        setApplication(applicationData);
      } catch (err: any) {
        console.error('Error fetching application:', err);
        setError(err.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    }
    
    fetchApplication();
  }, [token]);
  
  const handleAction = async (action: 'approved' | 'denied') => {
    if (!application || processing) return;
    
    setProcessing(true);
    setMessage(null);
    
    try {
      console.log('Processing action:', action, 'for application ID:', application.id);
      
      // Update the reviewer status in Supabase
      const { error } = await supabase
        .from('reviewers')
        .update({ 
          reviewer_application_status: action,
          updated_at: new Date().toISOString(),
          // Keep the token for now but invalidate it by marking it as used
          // This preserves the relationship but prevents reuse
          review_token: application.review_token ? application.review_token + '_used' : 'expired'
        })
        .eq('id', application.id);
        
      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to ${action === 'approved' ? 'approve' : 'deny'} application: ${error.message}`);
      }
      
      console.log('Application status updated successfully');
      setActionTaken(action);
      setMessage(`Application successfully ${action}!`);
      
      // TODO: Send email notification to the applicant about their application status
      
    } catch (err: any) {
      console.error('Error processing action:', err);
      setError(err.message || 'Failed to process your request');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container || 'container'}>
        <Head>
          <title>Reviewer Application Review</title>
        </Head>
        <main className={styles.main || 'main'}>
          <h1>Loading application...</h1>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container || 'container'}>
        <Head>
          <title>Error - Reviewer Application Review</title>
        </Head>
        <main className={styles.main || 'main'}>
          <h1>Error</h1>
          <p className={styles.error || 'error'}>{error}</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className={styles.container || 'container'}>
      <Head>
        <title>Reviewer Application Review</title>
      </Head>
      <main className={styles.main || 'main'}>
        <h1>Reviewer Application Review</h1>
        
        {actionTaken ? (
          <div className={actionTaken === 'approved' ? styles.success : styles.error}>
            <h2>Application {actionTaken}</h2>
            <p>{message}</p>
          </div>
        ) : (
          <>
            {application && (
              <div className={styles.applicationCard || 'card'}>
                <h2>Application Details</h2>
                <div className={styles.applicantInfo}>
                  <p><strong>Name:</strong> {application.first_name} {application.last_name}</p>
                  {application.preferred_name && (
                    <p><strong>Preferred Name:</strong> {application.preferred_name}</p>
                  )}
                  {application.pronouns && (
                    <p><strong>Pronouns:</strong> {application.pronouns}</p>
                  )}
                  <p><strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString()}</p>
                  <p><strong>Email:</strong> {application.email || 'Not provided'}</p>
                  <p><strong>Application Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: application.reviewer_application_status === 'pending' ? '#f0ad4e' : (application.reviewer_application_status === 'approved' ? '#5cb85c' : '#d9534f') }}>{application.reviewer_application_status}</span></p>
                  <p><strong>Application ID:</strong> {application.id}</p>
                </div>
                
                <div className={styles.actions}>
                  <button 
                    className={`${styles.approveButton || 'approveButton'}`}
                    onClick={() => handleAction('approved')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button 
                    className={`${styles.denyButton || 'denyButton'}`}
                    onClick={() => handleAction('denied')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Deny Application'}
                  </button>
                </div>
                
                {message && (
                  <div className={styles.message}>
                    <p>{message}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
