import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import VolunteerRequestModal from '../components/VolunteerRequestModal';
import formatDate from '../components/formatDate';
import useIsAdmin from '../components/useIsAdmin';
import { GetServerSideProps } from 'next';
import { supabase } from '../lib/supabaseClient'; // Corrected import path

interface Event {
  title: string;
  date: string;
  category: string;
  venue?: string;
  [key: string]: any;
}

import ReviewerApplicationModal from '../components/ReviewerApplicationModal';
import useIsReviewer from '../components/useIsReviewer'; // Import the hook
import Link from 'next/link'; // Import Link for navigation

function ReviewerSignInSection() {
  const { user, isReviewer, reviewerProfile, loading: reviewerLoading, error: reviewerError } = useIsReviewer();
  const [showModal, setShowModal] = useState(false);
  const [thankYou, setThankYou] = useState(false); // For after modal submission
  const [signInLoading, setSignInLoading] = useState(false); // For OAuth button click

  useEffect(() => {
    // This useEffect determines if the application modal should be shown.
    // It runs when relevant states from useIsReviewer or local component state change.

    // Conditions under which the modal should NOT be shown:
    if (reviewerLoading || !user || isReviewer || thankYou || (reviewerProfile && reviewerProfile.reviewer_application_status === 'pending')) {
      setShowModal(false);
      return;
    }

    // If we've passed the above conditions, it means:
    // - Not loading data (`!reviewerLoading`)
    // - User is logged in (`user` is present)
    // - User is not an approved reviewer (`!isReviewer`)
    // - User hasn't just submitted the form (`!thankYou`)
    // - User's application is not 'pending' (already checked)

    // Now, decide to show the modal if:
    // 1. The user has no reviewer profile record yet (`reviewerProfile === null`).
    // OR 2. The user has a profile, but it's missing essential information like first_name or last_name.
    if (reviewerProfile === null || !reviewerProfile.first_name || !reviewerProfile.last_name) {
      setShowModal(true);
    } else {
      // Profile exists, has first/last names, is not pending, and user is not approved.
      // This could be a 'rejected' status or a profile that's somehow complete but not approved/pending.
      // Based on the current task (prompt for new/incomplete applications), we don't show the modal here.
      setShowModal(false);
    }
  }, [user, isReviewer, reviewerProfile, thankYou, reviewerLoading]);

  const handleSignIn = async () => {
    setSignInLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href, // Redirect back to the same page
        },
      });

      if (error) {
        console.error('Error signing in:', error);
        setSignInLoading(false);
      } else if (!data?.url) {
        // If there's no error but also no URL to redirect to,
        // it implies the OAuth flow might have been cancelled by the user
        // in a way that didn't produce an explicit error (e.g., closing the popup).
        // Reset loading state to allow another attempt.
        console.warn('OAuth sign-in did not result in a redirect URL. User may have cancelled.');
        setSignInLoading(false);
      }
      // If data.url is present, Supabase handles the redirect.
      // signInLoading will effectively remain true for this component instance,
      // but the page reloads and re-initializes the component, where signInLoading will be false by default.
      // The useIsReviewer hook's 'reviewerLoading' will then manage the loading state.
    } catch (catchedError) {
      // Catch any unexpected synchronous errors from the signInWithOAuth call itself.
      console.error('Unexpected error during signInWithOAuth call:', catchedError);
      setSignInLoading(false);
    }
  };

  if (reviewerLoading || signInLoading) {
    return <div style={{ marginTop: 8, color: '#2d6cdf' }}>Loading...</div>;
  }

  if (reviewerError) {
    return <div style={{ marginTop: 8, color: 'red' }}>Error: {reviewerError.message}</div>;
  }

  if (!user) {
    return (
      <div>
        <button
          onClick={handleSignIn}
          style={{
            backgroundColor: '#4285F4', // Google's blue
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            marginTop: '8px',
          }}
        >
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="18px"
            height="18px"
            viewBox="0 0 48 48"
            style={{ marginRight: '10px' }}
          >
            <g>
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              ></path>
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              ></path>
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              ></path>
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              ></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </g>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (isReviewer) {
    return (
      <div style={{ marginTop: 8, color: '#2d6cdf' }}>
        <p>You are an approved reviewer.</p>
        <Link href="/reviewer/dashboard" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
          Go to Reviewer Dashboard
        </Link>
      </div>
    );
  }
  
  if (thankYou || (reviewerProfile && reviewerProfile.reviewer_application_status === 'pending')) {
    return <div style={{marginTop: 8, color: '#2d6cdf'}}>Thank you for applying! We'll review your application soon.</div>;
  }

  // User is logged in, not a reviewer, not pending, and modal should be shown (determined by useEffect)
  // Or user is logged in, but needs to complete application (showModal will be true)
  return (
    <>
      <div style={{marginTop: 8, color: '#2d6cdf'}}>
        Signed in as <b>{user.user_metadata?.full_name || user.email}</b>
      </div>
      {/* The ReviewerApplicationModal is shown/hidden based on showModal state controlled by useEffect */}
      <ReviewerApplicationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // If they close the modal without submitting, and they don't have a profile,
          // we might want to avoid immediately re-showing it. This depends on desired UX.
          // For now, just closing it. If they have a partial profile, it might re-trigger.
        }}
        user={user} 
        onSubmitted={() => { 
          setShowModal(false); 
          setThankYou(true); 
          // The useIsReviewer hook will automatically pick up the profile change
          // due to its onAuthStateChange listener re-fetching, or if we force a re-fetch.
          // For an immediate update, we could trigger a re-fetch here if the hook doesn't do it fast enough.
          // However, the `thankYou` state will cover the immediate UI change.
        }}
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
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('Error getting session for delete:', sessionError);
        // Optionally, show a user-facing error message here
        alert('Authentication error. Please try signing out and in again.');
        return;
      }
      const accessToken = sessionData.session.access_token;

      const res = await fetch('/api/delete-volunteer-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Added Authorization header
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        mutate(); // Re-fetches volunteer requests via SWR key '/api/add-volunteer-request'
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to delete volunteer request - Server response:', res.status, errorData);
        alert(`Failed to delete volunteer request. Server responded with ${res.status}. ${errorData.error || ''}`);
      }
    } catch (e: any) {
      console.error('Failed to delete volunteer request - Network or other error:', e);
      alert('Failed to delete volunteer request. Check your network connection.');
    }
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
                  <div className="audition-desc">
                    {event.description && event.description.length > 150
                      ? `${event.description.substring(0, 150)}...`
                      : event.description}
                  </div>
                  {event.ticketLink && (
                    <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" className="ticket-link" style={{ color: '#2e3a59', fontWeight: 600, textDecoration: 'underline', display: 'block', marginTop: 6 }}>
                      Learn more
                    </a>
                  )}
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
                    <h4 className="volunteer-venue">{req.venue}</h4>
                    <p className="volunteer-description">{req.description}</p>
                    <div className="volunteer-meta">
                      <p><span className="label">Expertise:</span> {req.expertise || 'Any'}</p>
                      <p><span className="label">Dates Needed:</span> {req.dates && req.dates.length ? req.dates.map((d: string) => formatDate(d)).join(', ') : 'TBA'}</p>
                      <p><span className="label">Time Commitment:</span> {req.timeCommitment || 'TBA'}</p>
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
        .volunteer-card h4.volunteer-venue {
          font-size: 1.1rem;
          margin-top: 0;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
        }
        p.volunteer-description {
          font-size: 0.95rem;
          color: #555;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .volunteer-meta {
          margin-top: auto;
        }
        .volunteer-meta p {
          font-size: 0.9rem;
          color: #444;
          margin-bottom: 6px;
        }
        .volunteer-meta p:last-child {
          margin-bottom: 0;
        }
        .volunteer-meta .label {
          font-weight: 600;
          margin-right: 5px;
          color: #333;
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
