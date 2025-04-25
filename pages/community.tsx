import Head from 'next/head';

import React, { useState } from 'react';

export default function Community() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Head>
        <title>Community | Our Stage, Eugene</title>
      </Head>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ marginBottom: 24 }}>Community</h1>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>Show Reviews</h2>
          <div style={{ background: '#f5f7fb', borderRadius: 10, padding: '1.2rem 1.1rem', marginBottom: 10, color: '#555', fontStyle: 'italic' }}>
            No reviews yet. Be the first to share your thoughts on local shows!
          </div>
        </section>
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 8 }}>Become a Volunteer Reviewer</h2>
          <p style={{ marginBottom: 12 }}>
            Interested in writing reviews for local shows? Apply to become a volunteer reviewer!
            All reviews are subject to admin approval before being published.
          </p>
          <button
            style={{ background: '#1976d2', color: 'white', fontWeight: 600, border: 'none', borderRadius: 6, padding: '10px 26px', fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)', marginBottom: 10 }}
            onClick={() => setShowModal(true)}
          >
            Apply to be a Reviewer
          </button>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            (All reviews are reviewed by our site admins before publication to ensure quality and accuracy.)
          </div>
        </section>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(46,58,89,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 6px 32px 0 rgba(46,58,89,0.16)', padding: '2.2rem 2rem 1.6rem 2rem', minWidth: 300, maxWidth: 420, width: '95vw', position: 'relative' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#2e3a59', cursor: 'pointer' }}>×</button>
              <h3 style={{ marginTop: 0, marginBottom: 18, color: '#2e3a59' }}>Reviewer Application (Coming Soon)</h3>
              <div style={{ color: '#555', fontSize: 15, marginBottom: 12 }}>
                Thank you for your interest in contributing reviews!<br />
                Reviewer applications will open soon. Please check back later.
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600, fontSize: 15, marginTop: 8, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
