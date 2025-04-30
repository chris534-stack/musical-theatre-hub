import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import VolunteerRequestModal from '../components/VolunteerRequestModal';
import formatDate from '../components/formatDate';
import useIsAdmin from '../components/useIsAdmin';
import { GetServerSideProps } from 'next';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Event {
  title: string;
  date: string;
  category: string;
  venue?: string;
  [key: string]: any;
}

import ReviewerApplicationModal from '../components/ReviewerApplicationModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

function ReviewerSignInSection() {
  // No highlight/scroll logic here anymore; handled by parent


  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        // If missing reviewer info, prompt modal
        if (!snap.exists() || !snap.data().firstName || !snap.data().lastName || !snap.data().reviewerApplication) {
          setShowModal(true);
        }
      });
    } else {
      setProfile(null);
    }
  }, [user]);

  if (!user) {
    return (
      <div>
        <GoogleSignInButton />
      </div>
    );
  }
  if (thankYou) {
    return <div style={{marginTop: 8, color: '#2d6cdf'}}>Thank you for applying! We'll review your application soon.</div>;
  }
  return (
    <>
      <div style={{marginTop: 8, color: '#2d6cdf'}}>
        Signed in as <b>{user.displayName || user.email}</b>
      </div>
      <ReviewerApplicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={user}
        onSubmitted={() => { setShowModal(false); setThankYou(true); }}
      />
    </>
  );
}

export default function GetInvolved() {
  const [shouldHighlightReviewer, setShouldHighlightReviewer] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#reviewer-signin') {
      const card = document.getElementById('reviewer-signin');
      if (card) {
        const isMobile = window.innerWidth < 700;
        if (isMobile) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          // Manual scroll with offset for desktop
          const rect = card.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const offset = 64; // px from top
          const top = rect.top + scrollTop - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        setShouldHighlightReviewer(true);
        setTimeout(() => setShouldHighlightReviewer(false), 2000);
      }
    }
  }, []);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  // Fetch auditions with SWR from new endpoint
  const { data: auditions, isLoading: loadingAuditions } = useSWR('/api/auditions', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch auditions');
    return res.json();
  });
  const { data: volunteerRequests = [], isLoading: loadingVolunteers, mutate } = useSWR('/api/add-volunteer-request', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });
  const isAdmin = useIsAdmin();

  const handleDeleteVolunteer = async (id: number) => {
    await fetch('/api/delete-volunteer-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    mutate();
  };

  return (
    <>
      <Head>
        <title>Get Involved | Our Stage, Eugene</title>
      </Head>
      <main>
        <div className="hero">
          <h1>Get Involved</h1>
          <p className="hero-intro">Join the Musical Theatre Community! Whether you’re a performer, a behind-the-scenes enthusiast, or have a creative idea, there’s a place for you here.</p>
        </div>
        <div className="callout-cards">
          <div className="callout-card">
            <h3>Audition Opportunities</h3>
            <p>Ready to shine on stage? See upcoming auditions and take your shot!</p>
            <button
  onClick={() => {
    const el = document.getElementById('auditions-section');
    if (el) {
      const isMobile = window.innerWidth < 700;
      if (isMobile) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const offset = 64;
        const top = rect.top + scrollTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }}
>View Auditions</button>
          </div>
          <div className="callout-card">
            <h3>Volunteer With Us</h3>
            <p>Help make the magic happen backstage or front-of-house. Your talents are needed!</p>
            <button onClick={() => document.getElementById('volunteers-section')?.scrollIntoView({behavior: 'smooth'})}>Volunteer Now</button>
          </div>
          <div
            id="reviewer-signin"
            className={`callout-card${shouldHighlightReviewer ? ' highlight-reviewer-card' : ''}`}
          >
            <h3>Apply to be a Reviewer</h3>
            <p>
              Want to help shape the conversation? Apply to join our reviewer community and share your thoughts on performances.
            </p>
            <ReviewerSignInSection />
          </div>
          <div className="callout-card">
            <h3>Suggest an Idea</h3>
            <p>Have a project, show, or workshop idea? Let us know and help shape our season!</p>
            <button onClick={() => alert('Idea submission coming soon!')}>Submit Idea</button>
          </div>
        </div>
        <section id="auditions-section" style={{marginTop: 48}}>
          <h2>Upcoming Auditions</h2>
          {loadingAuditions ? (
            <div className="skeleton auditions-skeleton">Loading auditions...</div>
          ) : auditions && auditions.length === 0 ? (
            <p>No upcoming auditions at this time.</p>
          ) : (
            <div className="grid auditions-grid">
              {auditions && auditions.map((event: any, idx: number) => (
                <div className="audition-card" key={idx}>
                  <strong>{event.title}</strong>
                  <div className="audition-details">
                    <span>{event.venue || 'Unknown Venue'}{' '}</span>
                    <span>{(() => {
                      if (!event.date) return event.time || 'TBA';
                      const d = new Date(event.date + (event.time ? 'T' + event.time : ''));
                      const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                      const timeStr = event.time ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                      return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
                    })()}</span>
                  </div>
                  <div className="audition-desc">{event.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section id="volunteers-section" style={{marginTop: 48}}>
          <h2>Volunteers Needed</h2>
          {isAdmin && (
            <>
              <button style={{ marginBottom: 16 }} onClick={() => setShowVolunteerModal(true)}>
                + Add Volunteer Request
              </button>
              <VolunteerRequestModal isOpen={showVolunteerModal} onClose={() => setShowVolunteerModal(false)} />
            </>
          )}
          {loadingVolunteers ? (
            <div className="skeleton volunteers-skeleton">Loading volunteer requests...</div>
          ) : (
            <div className="grid volunteers-grid">
              {volunteerRequests.length === 0 ? (
                <div className="volunteer-card empty">No volunteer requests at this time.</div>
              ) : (
                volunteerRequests.map((req: any, idx: number) => (
                  <div className="volunteer-card" key={req.id || idx}>
                    {isAdmin && (
                      <button
                        aria-label="Remove volunteer request"
                        className="remove-btn"
                        onClick={() => handleDeleteVolunteer(req.id)}
                      >
                        ×
                      </button>
                    )}
                    <div className="volunteer-details">
                      <span><strong>{req.venue}</strong> - {req.description}</span>
                      <span><b>Expertise:</b> {req.expertise || 'Any'}</span>
                      <span><b>Dates Needed:</b> {req.dates && req.dates.length ? req.dates.map((d: string) => formatDate(d)).join(', ') : 'TBA'}</span>
                      <span><b>Time Commitment:</b> {req.timeCommitment || 'TBA'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
      <style jsx>{`
        .hero {
          text-align: center;
          margin-bottom: 32px;
        }
        .hero-intro {
          font-size: 1.2rem;
          color: #444;
          margin-top: 10px;
        }
        .callout-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: center;
          margin-bottom: 40px;
        }
        .callout-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.09);
          padding: 28px 22px 18px 22px;
          width: 280px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }
        .callout-card h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.25rem;
        }
        .callout-card p {
          color: #555;
          margin-bottom: 18px;
        }
        .callout-card button {
          background: #2d6cdf;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 20px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .callout-card button:hover {
          background: #1e4fa1;
        }
        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 32px;
        }
        .auditions-grid {
          justify-content: flex-start;
        }
        .audition-card {
          background: #f6f8fa;
          border-radius: 8px;
          padding: 18px 20px;
          min-width: 220px;
          max-width: 330px;
          flex: 1 1 220px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
          display: flex;
          flex-direction: column;
          margin-bottom: 0;
        }
        .audition-details {
          color: #333;
          font-size: 0.97rem;
          margin-bottom: 8px;
        }
        .audition-desc {
          color: #666;
          font-size: 0.97rem;
          margin-top: 6px;
        }
        .volunteers-grid {
          justify-content: flex-start;
        }
        .volunteer-card {
          background: #f8f7f3;
          border-radius: 8px;
          padding: 18px 20px;
          min-width: 220px;
          max-width: 330px;
          flex: 1 1 220px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
          display: flex;
          flex-direction: column;
          position: relative;
          margin-bottom: 0;
        }
        .volunteer-card.empty {
          text-align: center;
          color: #888;
          font-style: italic;
        }
        .volunteer-details {
          color: #333;
          font-size: 0.97rem;
        }
        .remove-btn {
          color: #fff;
          background: #E53E3E;
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          line-height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 10px;
          right: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.11);
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.2s infinite linear;
          border-radius: 6px;
          min-height: 32px;
          margin-bottom: 16px;
          color: transparent;
          position: relative;
        }
        .auditions-skeleton { min-height: 48px; width: 100%; max-width: 400px; }
        .volunteers-skeleton { min-height: 48px; width: 100%; max-width: 400px; }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .highlight-reviewer-card {
          animation: reviewer-card-pulse 1.5s cubic-bezier(.4,0,.6,1) 0s 2;
          box-shadow: 0 0 0 0 #ffd700, 0 2px 12px rgba(0,0,0,0.09);
          border-radius: 10px;
        }
        @keyframes reviewer-card-pulse {
          0% { box-shadow: 0 0 0 0 #ffd700; }
          50% { box-shadow: 0 0 16px 8px #ffe066; }
          100% { box-shadow: 0 0 0 0 #ffd700; }
        }
      `}</style>
    </>
  );
}

// Remove getServerSideProps; we'll fetch auditions client-side for better perceived performance
