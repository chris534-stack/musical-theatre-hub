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
import IdeaSubmissionModal from '../components/IdeaSubmissionModal'; // Import the idea submission modal

function ReviewerSignInSection() {
  console.log("[DEBUG] ReviewerSignInSection starting render");
  const { user, isReviewer, reviewerProfile, loading: reviewerLoading, error: reviewerError, refetch: refetchReviewer } = useIsReviewer();
  const [showModal, setShowModal] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  
  console.log("[DEBUG] Initial state:", { 
    user: user ? "exists" : "null", 
    isReviewer, 
    reviewerProfile: reviewerProfile ? "exists" : "null",
    reviewerLoading, 
    reviewerError: reviewerError ? reviewerError.message : "none",
    showModal,
    thankYou,
    signInLoading,
    justSignedIn,
    url: typeof window !== 'undefined' ? window.location.href : "server-side",
    hash: typeof window !== 'undefined' ? window.location.hash : "none" 
  });

  // EMERGENCY DIRECT MODAL CONTROL
  useEffect(() => {
    // If the URL has code and reviewerSignIn parameters, immediately show the modal
    // This is a direct approach to ensure the modal shows regardless of other conditions
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('code') && params.has('reviewerSignIn')) {
        console.log("[DEBUG] EMERGENCY FIX: Directly showing modal due to code+reviewerSignIn params");
        // Force modal to show immediately
        setTimeout(() => {
          trackedSetShowModal(true);
        }, 500); // Small delay to ensure component is fully mounted
      }
    }
  }, []); // Empty deps array - run once on mount
  
  // Check if the user just came back from OAuth sign-in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we have the context parameter indicating a reviewer application flow
      const urlParams = new URLSearchParams(window.location.search);

      // If 'code' param is present from OAuth, and we're in the reviewer sign-in flow, remove 'code' immediately.
      // This is to prevent it from interfering with Supabase client on this page.
      if (urlParams.has('code') && (urlParams.get('reviewerSignIn') === 'true' || window.location.hash === '#reviewer-signin')) {
        console.log("[Reviewer Flow Debug] useEffect1: 'code' parameter found with reviewer sign-in indicators. Removing 'code'. Current URL:", window.location.href);
        const currentUrlObject = new URL(window.location.href);
        currentUrlObject.searchParams.delete('code');
        window.history.replaceState({}, '', currentUrlObject.toString());
        console.log("[Reviewer Flow Debug] useEffect1: 'code' parameter removed. New URL:", currentUrlObject.toString());
        // Update urlParams as it has changed, though 'code' is the only thing we removed that we might have cared about here.
        // For safety, re-parsing: (Note: this might not be strictly necessary if 'code' is not used further in this block)
        // urlParams = new URLSearchParams(currentUrlObject.search);
      }

      const fromReviewerSignInParam = urlParams.get('reviewerSignIn');
      const justSignedInParam = urlParams.get('justSignedIn');
      const hasReviewerHash = window.location.hash === '#reviewer-signin';
      
      console.log("[Reviewer Flow Debug] useEffect1: reviewerSignIn param:", fromReviewerSignInParam);
      console.log("[Reviewer Flow Debug] useEffect1: justSignedIn param:", justSignedInParam);
      console.log("[Reviewer Flow Debug] useEffect1: hasReviewerHash:", hasReviewerHash);
      console.log("[Reviewer Flow Debug] useEffect1: Hash is:", window.location.hash);

      // Enhanced detection - if ANY of these indicators are present, we should show the modal
      const fromReviewerSignIn = fromReviewerSignInParam === 'true';
      const freshSignIn = justSignedInParam === 'true';
      
      // Show modal if we have URL parameters OR the hash is present
      const shouldShowModal = (freshSignIn && fromReviewerSignIn) || hasReviewerHash;
      
      if (shouldShowModal) {
        console.log("[Reviewer Flow Debug] useEffect1: Modal triggers detected - setting justSignedIn to true");
        setJustSignedIn(true);
        trackedSetShowModal(true); // Directly set show modal to ensure it appears
        
        // Clean up URL parameters but keep hash for scrolling
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('justSignedIn');
        newUrl.searchParams.delete('reviewerSignIn');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, []);

  // Add explicit logging when setShowModal is called
  const trackedSetShowModal = (value: boolean) => {
    console.log(`[DEBUG] Setting showModal to ${value}`);
    setShowModal(value);
  };

  useEffect(() => {
    // This useEffect determines if the application modal should be shown.
    // It runs when relevant states from useIsReviewer or local component state change.
    console.log("[Reviewer Flow Debug] useEffect2: Inputs - reviewerLoading:", reviewerLoading, "user:", !!user, "isReviewer:", isReviewer, "thankYou:", thankYou, "reviewerProfile:", reviewerProfile, "justSignedIn:", justSignedIn, "hash:", typeof window !== 'undefined' ? window.location.hash : 'N/A');

    let newShowModalValue;

    // Basic conditions to NOT show modal:
    // - Still loading initial data from useIsReviewer
    // - No user is logged in
    // - User is already an approved reviewer
    // - User has just submitted the form (thankYou state is true)
    if (reviewerLoading || !user || isReviewer || thankYou) {
      newShowModalValue = false;
    } else if (
      reviewerProfile &&
      reviewerProfile.reviewer_application_status === 'pending' &&
      reviewerProfile.first_name &&
      reviewerProfile.last_name
    ) {
      // If a profile exists AND its status is 'pending' AND it has first/last names,
      // then the main "Thank You" message (outside this useEffect, in the render logic)
      // will be displayed, so don't show the modal.
      newShowModalValue = false;
    } else if (justSignedIn) {
      // Just came from auth signin with the intention to become a reviewer - 
      // show the modal immediately regardless of fragment identifier
      newShowModalValue = true;
    } else {
      // For all other cases, check if we're in the reviewer section before showing
      // the modal (indicated by #reviewer-signin fragment or manual click)
      const isReviewerSection = typeof window !== 'undefined' && window.location.hash === '#reviewer-signin';
      if (!isReviewerSection) {
        newShowModalValue = false;
      } else {
        // At this point: 
        // - User is in reviewer section (#reviewer-signin)
        // - User is signed in
        // - User is not an approved reviewer
        // - User hasn't just submitted the form
        // - User is not in a pending complete application state
        
        // If they have no profile at all or an incomplete profile, show the modal
        //    (even if status is 'pending' but names are missing, modal should show to complete it).
        if (reviewerProfile === null || !reviewerProfile.first_name || !reviewerProfile.last_name) {
          newShowModalValue = true;
        } else {
          // Profile exists, has first/last names.
          // If status is not 'pending' (already handled above if complete) and not 'approved' (handled by `isReviewer`),
          // this could be 'rejected' or some other state. For these, we don't show the modal.
          newShowModalValue = false;
        }
      }
    }
    
    console.log("[Reviewer Flow Debug] useEffect2: Final showModal value before set:", newShowModalValue);
    setShowModal(newShowModalValue);

  }, [user, isReviewer, reviewerProfile, thankYou, reviewerLoading, justSignedIn]);

  const handleSignIn = async () => {
    setSignInLoading(true);
    try {
      // Add parameters to the redirect URL to indicate this is a fresh sign-in from reviewer flow
      const redirectUrl = new URL(window.location.href);
      redirectUrl.searchParams.set('justSignedIn', 'true');
      redirectUrl.searchParams.set('reviewerSignIn', 'true'); // Mark that this came from reviewer sign-in
      console.log("[Reviewer Flow Debug] handleSignIn: Constructed redirectUrl:", redirectUrl.toString());
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline' // Request a refresh token
          }
        },
      });

      if (error) {
        console.error('Error signing in:', error);
        setSignInLoading(false);
      } else if (!data?.url) {
        // If there's no error but also no URL to redirect to,
        // it implies the OAuth flow might have been cancelled by the user
        // Reset loading state to allow another attempt.
        console.warn('OAuth sign-in did not result in a redirect URL. User may have cancelled.');
        setSignInLoading(false);
      }
      // If data.url is present, Supabase handles the redirect.
    } catch (catchedError) {
      // Catch any unexpected synchronous errors from the signInWithOAuth call itself.
      console.error('Unexpected error during signInWithOAuth call:', catchedError);
      setSignInLoading(false);
    }
  };

  if (!justSignedIn && (reviewerLoading || signInLoading)) {
    console.log("[DEBUG] Rendering: Loading state (reviewerLoading/signInLoading)");
    return <div style={{ marginTop: 8, color: '#2d6cdf' }}>Loading...</div>;
  }

  if (reviewerError) {
    console.log("[DEBUG] Rendering: Error state", reviewerError);
    return <div style={{ marginTop: 8, color: 'red' }}>Error: {reviewerError.message}</div>;
  }

  if (!justSignedIn && !user) {
    console.log("[DEBUG] Rendering: No user, showing sign-in button");
    return (
      <div>
        <button
          onClick={handleSignIn}
          style={{
            backgroundColor: '#FFFFFF', // White background
            color: '#444444', // Darker text color for contrast
            padding: '10px 15px',
            border: '1px solid #DADCE0', // Standard Google button border
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Softer shadow
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
    console.log("[DEBUG] Rendering: User is already a reviewer");
    return (
      <div style={{ marginTop: 8, color: '#2d6cdf' }}>
        <p>You are an approved reviewer.</p>
        <Link href="/reviewer/dashboard" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
          Go to Reviewer Dashboard
        </Link>
      </div>
    );
  }
  
  // "Thank you" message logic:
  // Show if `thankYou` state is true (user just submitted the modal)
  // OR if they have a complete (has names) pending application from a previous session.
  const hasCompletePendingApplication = 
    reviewerProfile && 
    reviewerProfile.reviewer_application_status === 'pending' &&
    reviewerProfile.first_name && 
    reviewerProfile.last_name;

  if (!justSignedIn && (thankYou || hasCompletePendingApplication)) {
    console.log("[DEBUG] Rendering: Thank you message (thankYou or hasCompletePendingApplication)");
    return <div style={{marginTop: 8, color: '#2d6cdf'}}>Thank you for applying! We'll review your application soon.</div>;
  }

  // If none of the above conditions are met, and useEffect sets showModal to true,
  // the user needs to apply or complete their application.
  // This means: user is logged in, not a reviewer, not loading, not in thankYou state, 
  // and doesn't have a complete pending application.
  // The useEffect will then show the modal if profile is null or names are missing.
  // Or user is logged in, but needs to complete application (showModal will be true)
  return (
    <>
      <div style={{marginTop: 8, color: '#2d6cdf'}}>
        {user ? 
          `Signed in as ${user.user_metadata?.full_name || user.email}` : 
          'Signed in' /* Fallback if user object isn't loaded yet */
        }
      </div>
      {/* The ReviewerApplicationModal is shown/hidden based on showModal state controlled by useEffect */}
      <ReviewerApplicationModal
        isOpen={showModal}
        onClose={() => {
          console.log("[DEBUG] Modal closed by user");
          trackedSetShowModal(false);
          // If they close the modal without submitting, and they don't have a profile,
          // we might want to avoid immediately re-showing it. This depends on desired UX.
          // For now, just closing it. If they have a partial profile, it might re-trigger.
        }}
        user={user} 
        onSubmitted={() => { 
          console.log("[DEBUG] Modal submitted by user");
          trackedSetShowModal(false); 
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
  const [showIdeaModal, setShowIdeaModal] = useState(false);
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
  const { isAdmin, loading: adminLoading } = useIsAdmin();

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
      // Use block: 'center' to center the element in the viewport
      el.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }}
>View Auditions</button>
          </div>
          <div
            id="reviewer-signin"
            className={`callout-card${shouldHighlightReviewer ? ' highlight-reviewer-card' : ''}`}
          >
            <h3>Apply to be a Reviewer</h3>
            <p>
              Want to help shape the conversation? Apply to join our reviewer community and share your thoughts on performances.
            </p>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <p className="text-blue-700 text-sm font-medium">
                Coming Soon! Our reviewer system is being upgraded.
              </p>
            </div>
          </div>
          <div className="callout-card">
            <h3>Volunteer With Us</h3>
            <p>Help make the magic happen backstage or front-of-house. Your talents are needed!</p>
            <button onClick={() => document.getElementById('volunteers-section')?.scrollIntoView({behavior: 'smooth'})}>Volunteer Now</button>
          </div>
          <div className="callout-card">
            <h3>Suggest an Idea</h3>
            <p>Have a project, show, or workshop idea? Let us know and help shape our season!</p>
            <button onClick={() => setShowIdeaModal(true)}>Submit Idea</button>
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
          {!adminLoading && isAdmin && (
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
                    {!adminLoading && isAdmin && (
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

      {/* Idea Submission Modal */}
      <IdeaSubmissionModal 
        isOpen={showIdeaModal} 
        onClose={() => setShowIdeaModal(false)} 
      />

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
