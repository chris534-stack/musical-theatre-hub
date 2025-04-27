import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'christopher.ridgley@gmail.com';

export default function ReviewerAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    setLoading(true);
    getDocs(collection(db, 'users')).then((snap) => {
      const pending = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.reviewerApplication && !u.reviewerApproved && !u.reviewerDeclined);
      setApplicants(pending);
      setLoading(false);
    });
  }, [user]);

  async function handleApprove(uid: string) {
    if (!user) return;
    const idToken = await user.getIdToken();
    await fetch('/api/approve-reviewer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ uidToApprove: uid }),
    });
    await updateDoc(doc(db, 'users', uid), { reviewerApproved: true, reviewerDeclined: false });
    setApplicants((prev) => prev.filter((a) => a.id !== uid));
  }

  async function handleDecline(uid: string) {
    await updateDoc(doc(db, 'users', uid), { reviewerDeclined: true, reviewerApproved: false });
    setApplicants((prev) => prev.filter((a) => a.id !== uid));
  }

  if (!user) return <div>Please sign in as admin.</div>;
  if (user.email !== ADMIN_EMAIL) return <div>Access denied.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>Reviewer Applications</h2>
      {loading ? <div>Loading...</div> : (
        applicants.length === 0 ? <div>No pending reviewer applications.</div> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {applicants.map((a) => (
              <li key={a.id} style={{ border: '1px solid #ccc', borderRadius: 8, marginBottom: 16, padding: 16 }}>
                <div><b>Name:</b> {a.firstName} {a.lastName} ({a.email})</div>
                <div><b>Preferred Name:</b> {a.preferredName || '-'} | <b>Pronouns:</b> {a.pronouns || '-'}</div>
                <button style={{ marginRight: 12, background: '#2d6cdf', color: 'white', border: 0, borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }} onClick={() => handleApprove(a.id)}>Approve</button>
                <button style={{ background: '#ccc', color: '#222', border: 0, borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }} onClick={() => handleDecline(a.id)}>Decline</button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
