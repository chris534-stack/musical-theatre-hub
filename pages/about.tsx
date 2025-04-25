import Head from 'next/head';
import React, { useState } from 'react';
import OrgContactModal from '../components/OrgContactModal';

const About: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Head>
        <title>About Us | Eugene Musical Theatre Hub</title>
      </Head>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.2rem' }}>
        <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '2.5rem', marginBottom: '2rem', color: '#2e3a59' }}>
          About Our Stage, Eugene
        </h1>
        <section style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(46,58,89,0.08)', padding: '2rem 2.2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ color: '#ffd700', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Who We Are</h2>
          <p style={{ fontSize: '1.1rem', color: '#2e3a59', marginBottom: 0 }}>
            Our Stage, Eugene is a community-driven platform connecting performers, directors, crew, educators, and fans to celebrate and support musical theatre in Eugene, Oregon. We believe in lowering barriers, amplifying local voices, and making the arts accessible for all.
          </p>
        </section>
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, minWidth: 260, background: '#f9f9f6', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 8px 0 rgba(46,58,89,0.06)' }}>
            <h3 style={{ color: '#4b5d8c', fontWeight: 700, marginBottom: 8 }}>Our Mission</h3>
            <p style={{ color: '#2e3a59', fontSize: '1.05rem' }}>
              Our mission is actively evolving as our community grows. We aim to foster a vibrant, inclusive, and collaborative musical theatre scene by providing a centralized platform for events, opportunities, and resources. <span style={{ color: '#888', fontSize: '0.98em' }}>(Check back for updates as we grow together!)</span>
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 260, background: '#f9f9f6', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 8px 0 rgba(46,58,89,0.06)' }}>
            <h3 style={{ color: '#4b5d8c', fontWeight: 700, marginBottom: 8 }}>Our Vision</h3>
            <p style={{ color: '#2e3a59', fontSize: '1.05rem' }}>
              Our vision is a thriving, connected community where everyone can participate in and enjoy the performing arts. We’re always listening and adapting to community needs.
            </p>
          </div>
        </section>
        <section style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(46,58,89,0.08)', padding: '2rem 2.2rem' }}>
          <h2 style={{ color: '#ffd700', fontWeight: 700, fontSize: '1.4rem', marginBottom: '1rem' }}>Participating Organizations</h2>
          <ul style={{ color: '#2e3a59', fontSize: '1.08rem', columns: 2, listStyle: 'square inside', margin: 0, padding: 0 }}>
            <li>Actors Cabaret of Eugene</li>
            <li>Oregon Contemporary Theatre (OCT)</li>
            <li>Very Little Theatre (VLT)</li>
            <li>Pegasus Playhouse</li>
            <li>LCC Ragazino Theater</li>
            <li>Rose Children's Theatre</li>
            <li>Upstart Crow Youth Theatre</li>
            <li>And more—suggest your group!</li>
          </ul>
          <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
            <strong style={{ color: '#888', fontSize: '0.98em' }}>Want your organization listed?</strong>
            <br />
            <button
              onClick={() => setModalOpen(true)}
              style={{
                marginTop: 8,
                background: '#ffd700',
                color: '#2e3a59',
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                padding: '0.7rem 1.7rem',
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)'
              }}
            >
              Request Listing
            </button>
          </div>
          <OrgContactModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={async (form: { name: string; org: string; email: string; message: string }) => {
              await fetch('/api/org-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
              });
            }}
          />
        </section>
      </main>
    </>
  );
};

export default About;
