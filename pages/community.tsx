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
            No reviews yet.<br />
            <span>
              Want to be the first? <a href="/get-involved" style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}>Apply to become a reviewer</a> on our <b>Get Involved</b> page!
            </span>
          </div>
        </section>
        {/* Reviewer application button and modal removed as this is now handled on the Get Involved page. */}
      </main>
    </>
  );
}
