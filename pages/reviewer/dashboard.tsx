import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import Link from 'next/link';

export default function ReviewerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isReviewer, setIsReviewer] = useState(false);
  const [status, setStatus] = useState<'loading'|'pending'|'approved'|'not_applied'>('loading');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) {
        setStatus('not_applied');
        setLoading(false);
        return;
      }
      await u.getIdToken(true); // refresh claims
      const token = await u.getIdTokenResult();
      if (token.claims.reviewer) {
        setIsReviewer(true);
        setStatus('approved');
      } else {
        // Check Firestore application status
        const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', u.email)));
        if (!userDoc.empty) {
          const data = userDoc.docs[0].data();
          if (data.reviewerApplication && data.reviewerApproved) setStatus('approved');
          else if (data.reviewerApplication && data.reviewerDeclined) setStatus('not_applied');
          else if (data.reviewerApplication) setStatus('pending');
          else setStatus('not_applied');
        } else {
          setStatus('not_applied');
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !isReviewer) return;
    setLoading(true);
    // Fetch drafts
    getDocs(query(collection(db, 'reviews'), where('userId', '==', user.uid), where('status', '==', 'draft')))
      .then((snap) => setDrafts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // Fetch submitted reviews
    getDocs(query(collection(db, 'reviews'), where('userId', '==', user.uid), where('status', '==', 'submitted')))
      .then((snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    setLoading(false);
  }, [user, isReviewer]);

  async function handleNewDraft() {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'reviews'), {
      userId: user.uid,
      status: 'draft',
      created: Date.now(),
      content: '',
    });
    window.location.href = `/reviews/edit/${docRef.id}`;
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Dashboard</h2>
      <p>Please <Link href="/get-involved">sign in and apply to be a reviewer</Link> to access this page.</p>
    </div>
  );

  if (status === 'pending') return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Application Pending</h2>
      <p>Your application to be a reviewer is under review. You'll receive access once approved.</p>
      <p>Need help? <a href="mailto:christopher.ridgley@gmail.com">Contact admin</a>.</p>
    </div>
  );
  if (status === 'not_applied') return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Dashboard</h2>
      <p>You are not an approved reviewer. <Link href="/get-involved">Apply here</Link> if you haven't already.</p>
      <p>Need help? <a href="mailto:christopher.ridgley@gmail.com">Contact admin</a>.</p>
    </div>
  );

  // APPROVED reviewer
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Dashboard</h2>
      <p>Welcome, you are an approved reviewer! Here you can manage your reviews and drafts.</p>
      <button style={{ background: '#2d6cdf', color: 'white', border: 0, borderRadius: 4, padding: '8px 24px', cursor: 'pointer', marginBottom: 24 }} onClick={handleNewDraft}>New Review</button>
      <h3>Your Drafts</h3>
      {drafts.length === 0 ? <div>No drafts yet.</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {drafts.map((d) => (
            <li key={d.id} style={{ border: '1px solid #ccc', borderRadius: 8, marginBottom: 10, padding: 12 }}>
              <Link href={`/reviews/edit/${d.id}`}>Edit Draft</Link>
            </li>
          ))}
        </ul>
      )}
      <h3>Your Submitted Reviews</h3>
      {reviews.length === 0 ? <div>No submitted reviews yet.</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reviews.map((r) => (
            <li key={r.id} style={{ border: '1px solid #ccc', borderRadius: 8, marginBottom: 10, padding: 12 }}>
              <Link href={`/reviews/${r.id}`}>View Review</Link>
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: 32 }}>Need help? <a href="mailto:christopher.ridgley@gmail.com">Contact admin</a>.</p>
    </div>
  );
}
