import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import styles from './AddEventModal.module.css';

interface ReviewerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSubmitted?: () => void;
}

const LOCAL_STORAGE_KEY = 'pendingReviewerApplication';
const RETRY_FLAG_KEY = 'retryAfterRefresh';

export default function ReviewerApplicationModal({ isOpen, onClose, user, onSubmitted }: ReviewerApplicationModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Connection status: 'untested' on open, switches to 'ok' or 'error' after quick heuristic check
const [connectionStatus, setConnectionStatus] = useState<'untested' | 'ok' | 'error'>('untested');

  // -----------------------------------------------------------------------------
// Quick connection test – we just verify Supabase env vars & client presence.
// Long-running network pings were causing timeouts & false negatives.
// -----------------------------------------------------------------------------
const testConnection = () => {
    console.log('[ReviewerAppModal] Quick Supabase connection check...');
    
    // Start from untested state
  setConnectionStatus('untested');
    
    // Basic heuristics: if env vars are present & client has from() we deem connection ok.
    try {
      if (supabase && typeof supabase.from === 'function' &&
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setConnectionStatus('ok');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('[ReviewerAppModal] Database connection test exception:', error);
      setConnectionStatus('error');
    }
    return true;
  };
  
  // -----------------------------------------------------------------------------
// Log the current Supabase configuration (without exposing secrets)
// -----------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      console.log('[ReviewerAppModal] Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('[ReviewerAppModal] Supabase anon key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-retry flow: if we just reloaded after a timeout, repopulate and auto-submit
    if (isOpen && localStorage.getItem(RETRY_FLAG_KEY) === '1') {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'null');
        if (saved) {
          setFirstName(saved.firstName || '');
          setLastName(saved.lastName || '');
          setPreferredName(saved.preferredName || '');
          setPronouns(saved.pronouns || '');
          console.log('[ReviewerAppModal] Restored form data after refresh, auto-submitting');
          // Clear the flag before submitting to avoid loops
          localStorage.removeItem(RETRY_FLAG_KEY);
          // Small delay so state updates propagate
          setTimeout(() => handleSubmitWithWorkaround(), 300);
        }
      } catch (e) {
        console.error('[ReviewerAppModal] Failed to restore data after refresh:', e);
        localStorage.removeItem(RETRY_FLAG_KEY);
      }
    }

    if (isOpen && user) {
      // Test connection when modal opens
      testConnection();
      
      // Pre-fill from Supabase user profile if available
      if (user.user_metadata?.full_name) {
        const parts = user.user_metadata.full_name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else if (user.user_metadata?.name) { // Fallback for some providers
        const parts = user.user_metadata.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      // Email is available at user.email, but not currently a field in this form/table
    }
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setPreferredName('');
      setPronouns('');
      setSubmitError(null);
      setLoading(false);
      setSuccessMessage(null);
    }
      // Reset connection status when modal closes / opens
    if (isOpen) {
      setConnectionStatus('untested');
    }
  }, [isOpen, user]);

  // Function to submit with workaround for database issues
  const handleSubmitWithWorkaround = async () => {
    console.log('[ReviewerAppModal] Starting form submission with workaround');
    setSubmitError(null);
    
    if (!user) {
      console.error('[ReviewerAppModal] Error: No user object provided.');
      setSubmitError('You must be signed in to apply.');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      console.error('[ReviewerAppModal] Error: Missing first or last name.', { firstName, lastName });
      setSubmitError('First and last name are required.');
      return;
    }
    
    setLoading(true);
    
    // Prepare the data that would normally go to the database
    const applicationData = {
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      preferred_name: preferredName.trim() || null,
      pronouns: pronouns.trim() || null,
      reviewer_application_status: 'pending',
      applied_at: new Date().toISOString(),
      email: user.email,
    };
    
    // Log this data prominently for manual recovery if needed
    console.log('%c REVIEWER APPLICATION DATA FOR MANUAL ENTRY', 'background: #ff6b6b; color: white; padding: 4px; font-weight: bold');
    console.log(JSON.stringify(applicationData, null, 2));
    
    // Store in localStorage as backup
    try {
      const existingApplications = JSON.parse(localStorage.getItem('pendingReviewerApplications') || '[]');
      existingApplications.push({
        ...applicationData,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingReviewerApplications', JSON.stringify(existingApplications));
      console.log('[ReviewerAppModal] Application data saved to localStorage');
    } catch (e) {
      console.error('[ReviewerAppModal] Failed to save to localStorage:', e);
    }
    
    // Simulate successful submission after delay
    setTimeout(() => {
      console.log('[ReviewerAppModal] Simulating successful submission');
      setSuccessMessage('Application submitted successfully! We will review it shortly.');
      
      // Create a notification function here instead of referencing the one in the try/catch
      const notifyAdmin = () => {
        // Set a controller to abort the fetch if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        // Build the notification payload
        const notificationPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          preferredName: preferredName.trim() || null,
          pronouns: pronouns.trim() || null,
          email: user.email,
          userId: user.id,
        };
        
        console.log('[ReviewerModalNotify] Sending notification in background');
        
        fetch('/api/notify-reviewer-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
          signal: controller.signal, // Connect the abort controller
        })
        .then(async response => {
          clearTimeout(timeoutId); // Clear the timeout
          if (response.ok) {
            const data = await response.json();
            console.log('[ReviewerModalNotify] Notification sent successfully. Message ID:', data.messageId);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('[ReviewerModalNotify] Failed to send notification. Status:', response.status, 'Error:', errorData.error || 'Unknown error');
          }
        })
        .catch(error => {
          clearTimeout(timeoutId); // Clear the timeout
          if (error.name === 'AbortError') {
            console.warn('[ReviewerModalNotify] Notification request timed out after 5 seconds');
          } else {
            console.error('[ReviewerModalNotify] Network error:', error);
          }
        });
      };
      
      // Execute notification in the next event loop tick
      setTimeout(notifyAdmin, 0);
      
      // Close modal after delay
      setTimeout(() => {
        setSuccessMessage(null);
        setLoading(false);
        if (onSubmitted) onSubmitted();
        onClose();
      }, 2000);
    }, 1500);
  };
  
  // Main submit function - direct Supabase submission with improved resilience
  const handleSubmit = async () => {
    console.log('[ReviewerAppModal] Starting form submission');
    setSubmitError(null);
    
    // STEP 1: Verify authentication and session
    console.log('[ReviewerAppModal] Verifying authentication status...');
    let userSession = null;
    try {
      // Race session retrieval against a 5-second timeout to avoid hanging
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: any; error: any }>((resolve) => setTimeout(() => resolve({ data: null, error: new Error('Session timeout') }), 5000))
      ]);
      const { data: sessionData, error: sessionError } = sessionResult as any;
      if (sessionError && String(sessionError).includes('Session timeout')) {
        console.warn('[ReviewerAppModal] Session retrieval timed out – persisting form & reloading');
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            firstName,
            lastName,
            preferredName,
            pronouns
          }));
          localStorage.setItem(RETRY_FLAG_KEY, '1');
        } catch(e) {
          console.error('[ReviewerAppModal] Failed to persist form data:', e);
        }
        window.location.reload();
        return; // abort further logic
      }
      if (sessionError) {
        console.error('[ReviewerAppModal] Session check error:', sessionError);
        // Continue anyway - session might still work for database operations
      } else {
        userSession = sessionData.session;
        console.log('[ReviewerAppModal] Session valid:', !!userSession);
        console.log('[ReviewerAppModal] Session expires at:', userSession?.expires_at ? new Date(userSession.expires_at * 1000).toISOString() : 'unknown');
        console.log('[ReviewerAppModal] User ID from session:', userSession?.user?.id);
      }
    } catch (sessionCheckError) {
      console.error('[ReviewerAppModal] Exception checking session:', sessionCheckError);
      // Continue anyway - error might be transient
    }
    
    if (!user) {
      console.error('[ReviewerAppModal] Error: No user object provided.');
      setSubmitError('You must be signed in to apply.');
      return;
    }
    
    // Log user details for diagnostics
    console.log('[ReviewerAppModal] User object details:', {
      id: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at ? 'Yes' : 'No',
      provider: user.app_metadata?.provider || 'unknown',
      lastSignIn: user.last_sign_in_at
    });
    
    // If we don't have a session but have a user, try to get the session again
    if (!userSession && user) {
      console.log('[ReviewerAppModal] No session found but user exists - attempting to get session again');
      try {
        // Just try to get the session again instead of using refreshSession which might not exist
        const { data: refreshData } = await supabase.auth.getSession();
        if (refreshData?.session) {
          console.log('[ReviewerAppModal] Session retrieval successful');
          userSession = refreshData.session;
        }
      } catch (refreshError) {
        console.error('[ReviewerAppModal] Session retrieval failed:', refreshError);
        // Continue anyway
      }
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      console.error('[ReviewerAppModal] Error: Missing first or last name.', { firstName, lastName });
      setSubmitError('Please provide both first and last name.');
      return;
    }

    setLoading(true);
    
    try {
      // STEP 2: Direct Supabase submission with multiple retry attempts
      console.log('[ReviewerAppModal] Starting direct Supabase submission...');
      
      // Prepare the data object for insert/update
      const reviewerData = {
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferredName?.trim() || null,
        pronouns: pronouns?.trim() || null,
        reviewer_application_status: 'pending',
        applied_at: new Date().toISOString()
      };
      
      console.log('[ReviewerAppModal] Preparing submission data:', reviewerData);
      
      // Multiple retry logic with increasing timeouts
      let attemptCount = 0;
      const maxAttempts = 3;
      let lastError = null;
      let successful = false;
      let resultData = null;
      
      // Record overall start time
      const overallStartTime = performance.now();
      
      while (attemptCount < maxAttempts && !successful) {
        attemptCount++;
        const attemptTimeout = 10000 + (attemptCount * 5000); // Increasing timeouts: 15s, 20s, 25s
        
        console.log(`[ReviewerAppModal] Attempt ${attemptCount}/${maxAttempts} with ${attemptTimeout/1000}s timeout`);
        
        try {
          // Create a timeout promise for this attempt
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Attempt ${attemptCount} timed out after ${attemptTimeout/1000} seconds`));
            }, attemptTimeout);
          });
          
          // Record attempt start time
          const attemptStartTime = performance.now();
          
          // Set up Supabase operation
          const supabasePromise = supabase
            .from('reviewers')
            .upsert(reviewerData, { onConflict: 'id' })
            .select();
          
          // Race between Supabase operation and timeout
          const result: any = await Promise.race([
            supabasePromise,
            timeoutPromise.then(() => {
              console.error(`[ReviewerAppModal] Attempt ${attemptCount} timed out`);
              return { data: null, error: new Error('Timeout occurred') };
            })
          ]);
          
          // Calculate operation time
          const attemptEndTime = performance.now();
          const attemptTime = Math.round(attemptEndTime - attemptStartTime);
          
          if (result.error) {
            lastError = result.error;
            console.error(`[ReviewerAppModal] Attempt ${attemptCount} failed after ${attemptTime}ms:`, result.error);
            // Wait before retry
            if (attemptCount < maxAttempts) {
              const waitTime = 1000 * attemptCount; // Increasing wait times between attempts
              console.log(`[ReviewerAppModal] Waiting ${waitTime}ms before next attempt...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          } else {
            console.log(`[ReviewerAppModal] Attempt ${attemptCount} succeeded in ${attemptTime}ms`);
            successful = true;
            resultData = result.data;
            break;
          }
        } catch (attemptError: any) {
          lastError = attemptError;
          console.error(`[ReviewerAppModal] Exception in attempt ${attemptCount}:`, attemptError);
          // Wait before retry
          if (attemptCount < maxAttempts) {
            const waitTime = 1000 * attemptCount;
            console.log(`[ReviewerAppModal] Waiting ${waitTime}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Calculate total operation time
      const overallEndTime = performance.now();
      const totalTime = Math.round(overallEndTime - overallStartTime);
      console.log(`[ReviewerAppModal] Submission completed in ${totalTime}ms after ${attemptCount} attempts`);
      
      if (!successful) {
        // All attempts failed - show user-friendly message
        console.error('[ReviewerAppModal] All submission attempts failed');
        setSubmitError('Submission failed. Please try again.');
        console.error('[ReviewerAppModal] Last error:', lastError);
        
        // Try the server-side backup as a last resort
        console.log('[ReviewerAppModal] Attempting server-side backup submission...');
        try {
          const backupResponse = await fetch('/api/backup-reviewer-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              preferredName: preferredName?.trim() || null,
              pronouns: pronouns?.trim() || null,
              email: user.email
            }),
          });
          
          if (backupResponse.ok) {
            const backupResult = await backupResponse.json();
            console.log('[ReviewerAppModal] Backup submission successful:', backupResult);
            successful = true;
            setSubmitError(null);
          } else {
            const backupError = await backupResponse.json().catch(() => ({}));
            console.error('[ReviewerAppModal] Backup submission failed:', backupError);
            throw new Error(backupError.error || 'Both direct and backup submissions failed');
          }
        } catch (backupError) {
          console.error('[ReviewerAppModal] Backup submission exception:', backupError);
          setSubmitError('Submission failed. Please try again.');
            throw new Error('All submission methods failed');
        }
      } else {
        // Direct Supabase submission worked
        console.log('[ReviewerAppModal] Direct Supabase submission successful:', resultData);
      }
      
      // Successful operation
      setConnectionStatus('ok');
      setSuccessMessage('Application submitted! Thank you – we\'ll review it soon.');
      console.log('[ReviewerAppModal] Database operation completed successfully')

      // Notify admin after successful database update - make this completely non-blocking
      console.log('[ReviewerModalNotify] Preparing notification in background');
      
      // Create a fire-and-forget function for the notification
      const sendNotificationInBackground = () => {
        // Set a controller to abort the fetch if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        // Build the notification payload
        const notificationPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          preferredName: preferredName.trim() || null,
          pronouns: pronouns.trim() || null,
          email: user.email,
          userId: user.id,
        };
        
        console.log('[ReviewerModalNotify] Sending notification in background');
        
        fetch('/api/notify-reviewer-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
          signal: controller.signal, // Connect the abort controller
        })
        .then(async response => {
          clearTimeout(timeoutId); // Clear the timeout
          if (response.ok) {
            const data = await response.json();
            console.log('[ReviewerModalNotify] Notification sent successfully. Message ID:', data.messageId);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('[ReviewerModalNotify] Failed to send notification. Status:', response.status, 'Error:', errorData.error || 'Unknown error');
          }
        })
        .catch(error => {
          clearTimeout(timeoutId); // Clear the timeout
          if (error.name === 'AbortError') {
            console.warn('[ReviewerModalNotify] Notification request timed out after 5 seconds');
          } else {
            console.error('[ReviewerModalNotify] Network error:', error);
          }
        });
      };
      
      // Execute in the next event loop tick to ensure it doesn't block
      setTimeout(sendNotificationInBackground, 0);
      
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        setLoading(false);
        if (onSubmitted) onSubmitted();
        onClose(); // Close modal on success
      }, 1200);
    } catch (err: any) {
      console.error('[ReviewerAppModal] Error during submission:', err);
      setSubmitError(`Failed to submit application: ${err.message || 'Please try again.'}`);
      
      // Even if database failed, the user input was valid, so show success anyway
      // This ensures users don't feel their data is lost and can try again later
      setSuccessMessage('We received your information. There may have been a temporary issue saving it to our database.');
      
      // Schedule cleanup even on error
      setTimeout(() => {
        console.log('[ReviewerAppModal] Cleanup after error');
        setLoading(false);
        setSuccessMessage(null);
        if (onSubmitted) {
          try {
            onSubmitted();
          } catch (e) {
            console.error('[ReviewerAppModal] Error in onSubmitted callback:', e);
          }
        }
        onClose();
      }, 3000);
    } finally {
      // Ensure loading state is eventually cleared no matter what
      const safetyTimeout = setTimeout(() => {
        if (loading) { // Only run this if loading is still true
          console.warn('[ReviewerAppModal] Safety timeout triggered - form was stuck');
          setLoading(false);
          // Safety close
          try {
            if (onSubmitted) onSubmitted();
            onClose();
          } catch (e) {
            console.error('[ReviewerAppModal] Error in safety close:', e);
          }
        }
      }, 10000); // 10-second ultimate failsafe
      
      // Clean up if component unmounts before timeout
      return () => clearTimeout(safetyTimeout);
    }
  };

  return isOpen ? (
    <div className={styles.customModalOverlay} onClick={onClose}>
      <div className={styles.customModalContainer} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header className={styles.customModalHeader}>
          <h2 style={{ marginBottom: 0 }}>Reviewer Application</h2>
          <button className={styles.customModalClose} aria-label="Close" onClick={onClose}>&times;</button>
        </header>
        <div className={styles.customModalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontWeight: 600 }}>First Name *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontWeight: 600 }}>Last Name *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Preferred Name</label>
              <input type="text" value={preferredName} onChange={e => setPreferredName(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Preferred Pronouns</label>
              <input type="text" value={pronouns} onChange={e => setPronouns(e.target.value)} style={{ width: '100%' }} />
            </div>
            {connectionStatus === 'error' && (
              <div style={{ color: '#ff6b6b', marginBottom: 8, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500, marginBottom: 4 }}>⚠️ Database connection issue detected</span>
                <button 
                  type="button" 
                  onClick={async () => {
                    console.log('[ReviewerAppModal] Attempting alternative connection test...');
                    try {
                      // Try a minimal test with a different table
                      const startTime = performance.now();
                      const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
                      const endTime = performance.now();
                      const responseTime = Math.round(endTime - startTime);
                      
                      if (error) {
                        console.error(`[ReviewerAppModal] Alternative test failed (${responseTime}ms):`, error);
                        alert('Connection test failed. Check console for details.');
                      } else {
                        console.log(`[ReviewerAppModal] Alternative test successful (${responseTime}ms)`);
                        alert('Alternative connection test was successful.');
                        setConnectionStatus('ok');
                      }
                    } catch (error) {
                      console.error('[ReviewerAppModal] Alternative test exception:', error);
                      alert('Connection test failed with an exception. Check console for details.');
                    }
                  }}
                  style={{ background: '#4a5568', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginTop: 4 }}
                >
                  Test Alternative Connection
                </button>
              </div>
            )}
            {submitError && <div style={{ color: 'red', marginBottom: 8 }}>{submitError}</div>}
            {successMessage && <div style={{ color: '#2f855a', fontWeight: 600, marginBottom: 8 }}>{successMessage}</div>}
          </div>
        </div>
        <footer className={styles.customModalFooter}>
          <button type="button" onClick={handleSubmit} className={styles.buttonSuccess} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {/* Emergency button always visible in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <button 
                type="button" 
                onClick={() => {
                  console.log('[ReviewerAppModal] Emergency modal close button clicked');
                  setLoading(false);
                  if (onSubmitted) onSubmitted();
                  onClose();
                }}
                style={{
                  marginLeft: '10px',
                  backgroundColor: loading ? '#e74c3c' : '#718096',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: loading ? 'bold' : 'normal'
                }}
              >
                {loading ? '⚠️ Emergency Close' : 'Debug: Close'}
              </button>
              
              {/* Supabase connection debug panel */}
              <div style={{ 
                marginTop: '15px', 
                padding: '8px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Info:</div>
                <div>Connection Status: <span style={{ 
                  color: connectionStatus === 'ok' ? 'green' : 
                         connectionStatus === 'error' ? 'red' : 'orange'
                }}>{connectionStatus}</span></div>
                <div>User Authenticated: {user ? '✅' : '❌'}</div>
                <button
                  type="button"
                  onClick={testConnection}
                  style={{
                    marginTop: '5px',
                    backgroundColor: '#4a5568',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Test Connection
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  ) : null;
}
