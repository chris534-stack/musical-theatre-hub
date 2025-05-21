import { useEffect, useState } from 'react';
// Firebase imports are kept for now for data fetching, but auth is replaced.
import { db } from '../../firebaseConfig'; // Keep for Firestore data access for now
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; // Keep for Firestore
import Link from 'next/link';
import useIsReviewer from '../../components/useIsReviewer'; // Import the hook
import { supabase } from '../../lib/supabaseClient'; // For potential Supabase direct calls if needed

export default function ReviewerDashboard() {
  const { user, isReviewer, reviewerProfile, loading: reviewerLoading, error: reviewerError } = useIsReviewer();
  
  // State for Firestore data (drafts and reviews) - will be migrated later
  const [drafts, setDrafts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true); // For Firestore data loading

  // Effect for fetching review data from Firestore (to be migrated to Supabase later)
  useEffect(() => {
    if (user && isReviewer) {
      setDataLoading(true);
      // Fetch drafts from Firestore
      getDocs(query(collection(db, 'reviews'), where('userId', '==', user.id), where('status', '==', 'draft')))
        .then((snap) => setDrafts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        .catch(err => console.error("Error fetching drafts:", err));
      
      // Fetch submitted reviews from Firestore
      getDocs(query(collection(db, 'reviews'), where('userId', '==', user.id), where('status', '==', 'submitted')))
        .then((snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        .catch(err => console.error("Error fetching submitted reviews:", err))
        .finally(() => setDataLoading(false));
    } else {
      setDataLoading(false); // Not a reviewer or no user, so no data to load
    }
  }, [user, isReviewer]);

  async function handleNewDraft() {
    if (!user) return;
    // This function will need to be updated to use Supabase to create a new draft.
    // For now, it uses Firestore. This is out of scope for the current UI task.
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        userId: user.id, // Using Supabase user.id - ensure this matches Firestore if it's still used
        status: 'draft',
        created: new Date().toISOString(), // Use ISO string for consistency
        content: '',
        // Ensure other necessary fields for Supabase are added here when migrating
      });
      alert("New draft created (using old Firestore method for now). Redirecting...");
      window.location.href = `/reviews/edit/${docRef.id}`; // This route will also need update
    } catch (e) {
      console.error("Error creating new draft (Firestore):", e);
      alert("Error creating draft. Functionality will be updated soon.");
    }
  }

  if (reviewerLoading) return <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, textAlign: 'center' }}>Loading user status...</div>;
  
  if (reviewerError) return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, color: 'red' }}>
      <h2>Error</h2>
      <p>Could not determine reviewer status: {reviewerError.message}</p>
      <p>Please try refreshing the page. If the problem persists, contact admin.</p>
    </div>
  );

  if (!user) return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Dashboard</h2>
      <p>Please <Link href="/get-involved#reviewer-signin" style={{textDecoration: 'underline'}}>sign in</Link> to access this page.</p>
      <p>If you wish to become a reviewer, you can apply on the "Get Involved" page after signing in.</p>
    </div>
  );

  if (!isReviewer) {
    if (reviewerProfile && reviewerProfile.reviewer_application_status === 'pending') {
      return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
          <h2>Reviewer Application Pending</h2>
          <p>Your application to be a reviewer is currently under review. You'll receive access to the dashboard once your application is approved.</p>
          <p>Thank you for your patience. If you have any questions, please <a href="mailto:christopher.ridgley@gmail.com" style={{textDecoration: 'underline'}}>contact admin</a>.</p>
        </div>
      );
    }
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
        <h2>Access Denied</h2>
        <p>You are not an approved reviewer. To gain access to the reviewer dashboard, please apply to become a reviewer.</p>
        <p>You can find the application form on the <Link href="/get-involved#reviewer-signin" style={{textDecoration: 'underline'}}>Get Involved page</Link>.</p>
        <p>If you believe this is an error, please <a href="mailto:christopher.ridgley@gmail.com" style={{textDecoration: 'underline'}}>contact admin</a>.</p>
      </div>
    );
  }

  // APPROVED reviewer content starts here
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Dashboard</h2>
      <p>Welcome, <b>{user.user_metadata?.full_name || user.email}</b>! You are an approved reviewer.</p>
      <p>Here you can manage your reviews and drafts. (Note: Review data below is still from Firestore and will be migrated).</p>
      
      <button 
        style={{ background: '#2d6cdf', color: 'white', border: 0, borderRadius: 4, padding: '10px 24px', cursor: 'pointer', marginBottom: 24, fontSize: '1rem' }} 
        onClick={handleNewDraft}
        title="This will use the old Firestore method for now."
      >
        Start New Review
      </button>

      {dataLoading ? <p>Loading review data...</p> : (
        <>
          <h3>Your Drafts</h3>
          {drafts.length === 0 ? <p>No drafts yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {drafts.map((d) => (
                <li key={d.id} style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: 10, padding: '12px 16px', background: '#f9f9f9' }}>
                  <Link href={`/reviews/edit/${d.id}`} style={{textDecoration: 'underline', color: '#2d6cdf'}}>
                    Edit Draft (Created: {d.created ? new Date(d.created.seconds ? d.created.seconds * 1000 : d.created).toLocaleDateString() : 'Unknown date'})
                  </Link>
                  {/* Basic content preview could go here if available */}
                </li>
              ))}
            </ul>
          )}
          <h3>Your Submitted Reviews</h3>
          {reviews.length === 0 ? <p>No submitted reviews yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {reviews.map((r) => (
                <li key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: 10, padding: '12px 16px', background: '#f9f9f9' }}>
                  <Link href={`/reviews/${r.id}`} style={{textDecoration: 'underline', color: '#2d6cdf'}}>
                    View Review (Submitted: {r.submitted_at ? new Date(r.submitted_at.seconds ? r.submitted_at.seconds * 1000 : r.submitted_at).toLocaleDateString() : 'Unknown date'})
                  </Link>
                  {/* Basic content preview could go here */}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p style={{ marginTop: 32, fontSize: '0.9rem', color: '#555' }}>
        Need help or have questions? <a href="mailto:christopher.ridgley@gmail.com" style={{textDecoration: 'underline'}}>Contact admin</a>.
      </p>
    </div>
  );
}
