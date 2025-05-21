import React, { useEffect, useState, useRef } from 'react';
import DatePicker from 'react-multi-date-picker';
import { mutate } from 'swr';

import styles from './AddEventModal.module.css';
import formatDate from './formatDate';
import AddVenueModal from './AddVenueModal';


// Steps for the stepper
const steps = [
  { title: 'Basic Info', description: 'Title, Venue, Category' },
  { title: 'Dates & Times', description: 'Event Dates and Times' },
  { title: 'Review', description: 'Confirm Details' },
];

const categoryOptions = [
  { value: 'performance', label: 'Performance' },
  { value: 'audition', label: 'Audition' },
  { value: 'workshop', label: 'Workshop' },
];

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    venue: string;
    category: string;
    description: string;
    director: string;
    ticketLink?: string;
    dates: DateEntry[];
  }) => void;
}

interface DateEntry {
  date: string;
  mainTime: string;
  isMatinee: boolean;
  matineeTime: string;
}


export default function AddEventModal({ isOpen, onClose, onSubmit }: AddEventModalProps) {
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<any>(null);
  const [newVenueName, setNewVenueName] = useState('');
  // Spinner CSS (minimal, add to module if you want to style further)
  // You can move this to AddEventModal.module.css for better styling
  const spinnerStyle = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .${styles.spinner} {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top: 2px solid #4a90e2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      vertical-align: middle;
    }
  `;

  const datePickerRef = useRef<any>(null);
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form state
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [director, setDirector] = useState('');
  const [ticketLink, setTicketLink] = useState('');
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(true);

  // For review step
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    let errs: Record<string, string> = {};
    if (step === 0) {
      if (!title) errs.title = 'Title is required';
      if (!venue) errs.venue = 'Venue is required';
      if (!category) errs.category = 'Category is required';
      if (!description) errs.description = 'Description is required';
      if (!director) errs.director = 'Director is required';
    }
    if (step === 1) {
      if (!dates.length) errs.dates = 'At least one date is required';
      dates.forEach((d, i) => {
        if (!d.date) errs[`date${i}`] = 'Date required';
        if (!d.mainTime && !d.matineeTime) errs[`time${i}`] = 'Time required';
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setSubmitError(null);
    // Dynamically import supabase client for browser
    const { supabase } = await import('../lib/supabaseClient');
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    // Look up venue_id by venue name ONCE
    let venue_id: number | null = null;
    if (venue) {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('id')
        .ilike('name', venue);
      if (error || !venues || venues.length === 0) {
        setPendingEventData({
          title,
          description,
          venue,
        });
        setNewVenueName(venue);
        setLoading(false);
        setSubmitError(`Venue '${venue}' not found in database.`);
        return;
      }
      venue_id = venues[0].id;
    }

    // Prepare dates array for backend
    const eventPayload = {
      title,
      description,
      venue_id,
      dates: dates.map(d => ({
        date: d.date,
        mainTime: d.mainTime,
        isMatinee: d.isMatinee,
        matineeTime: d.matineeTime,
      })),
    };

    const res = await fetch('/api/add-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(eventPayload),
    });
    setLoading(false);
    if (res.ok) {
      mutate('/api/events'); // Refresh calendar events
      onClose();
    } else {
      const errJson = await res.json().catch(() => ({}));
      setSubmitError(errJson.error || 'Failed to add event.');
    }
  };


  return (
    <>
      {showAddVenueModal && (
        <AddVenueModal
          isOpen={showAddVenueModal}
          initialVenueName={newVenueName}
          onClose={() => setShowAddVenueModal(false)}
          onVenueAdded={async (venue) => {
            setShowAddVenueModal(false);
            // Retry event submission with new venue_id
            if (pendingEventData) {
              setLoading(true);
              setSubmitError(null);
              const eventPayload = {
                title: pendingEventData.title,
                description: pendingEventData.description,
                date: pendingEventData.dateTimeStr,
                venue_id: venue.id,
              };
              // Get authentication token
              const { supabase } = await import('../lib/supabaseClient');
              const session = await supabase.auth.getSession();
              const accessToken = session.data.session?.access_token;
              
              if (!accessToken) {
                setSubmitError('Authentication error: No access token available. Please try signing out and in again.');
                setLoading(false);
                return;
              }
              
              const res = await fetch('/api/add-event', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(eventPayload),
              });
              setLoading(false);
              if (res.ok) {
                mutate('/api/events');
                onClose();
              } else {
                const errJson = await res.json().catch(() => ({}));
                setSubmitError(errJson.error || 'Failed to add event after adding venue.');
              }
            }
          }}
        />
      )}
      {isOpen ? (
        <div className={styles.customModalOverlay} onClick={onClose}>
        <div
          className={styles.customModalContainer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
          onClick={e => e.stopPropagation()}
        >
          <header className={styles.customModalHeader}>
            <h2 id="add-event-title">Add Event</h2>
            <button className={styles.customModalClose} aria-label="Close" onClick={onClose}>
              &times;
            </button>
          </header>
          <div className={styles.customModalBody}>
          {/* Simple Step Indicator */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: 18 }}>Step {step + 1} of 3</span><br />
            <span style={{ fontSize: 14, color: '#718096' }}>{steps[step].title} &mdash; {steps[step].description}</span>
          </div>
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className={styles.formSection} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="modalLabel" htmlFor="event-title">Title</label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event Title"
                className="modalInput"
                autoComplete="off"
              />
              {errors.title && <span className={styles.error}>{errors.title}</span>}

              <label className="modalLabel" htmlFor="event-venue">Venue</label>
              <input
                id="event-venue"
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="Venue"
                className="modalInput"
                autoComplete="off"
              />
              {errors.venue && <span className={styles.error}>{errors.venue}</span>}

              <label className="modalLabel" htmlFor="event-category">Category</label>
              <select
                id="event-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="modalSelect"
              >
                <option value="">Select Category</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.category && <span className={styles.error}>{errors.category}</span>}

              <label className="modalLabel" htmlFor="event-description">Description</label>
              <textarea
                id="event-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Event Description"
                className="modalTextarea"
                autoComplete="off"
              />
              {errors.description && <span className={styles.error}>{errors.description}</span>}

              <label className="modalLabel" htmlFor="event-director">Director</label>
              <input
                id="event-director"
                type="text"
                value={director}
                onChange={e => setDirector(e.target.value)}
                placeholder="Director"
                className="modalInput"
                autoComplete="off"
              />
              {errors.director && <span className={styles.error}>{errors.director}</span>}

              <label className="modalLabel" htmlFor="event-ticket-link">
                Ticket Purchase Link <span style={{ color: '#b6bfcf', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="event-ticket-link"
                type="text"
                value={ticketLink}
                onChange={e => setTicketLink(e.target.value)}
                placeholder="https://..."
                className="modalInput"
                autoComplete="off"
              />
              <span style={{ color: '#b6bfcf', fontSize: 13, marginBottom: 8 }}>
                Add a link for online ticket sales
              </span>
            </div>
          )}
            {/* Step 2: Dates & Times */}
            {step === 1 && (
              <div>
                {showDatePicker && (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 16, justifyContent: 'center', margin: '0 auto 24px auto', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontWeight: 600, marginBottom: 8, fontSize: 16 }}>Select Event Dates</label>
                        <DatePicker
                          multiple
                          value={dates.map(d => d.date)}
                          onChange={(selectedDates: any) => {
                            // selectedDates is an array of date objects or strings
                            const toDateString = (d: any) => {
                              if (!d) return '';
                              if (typeof d === 'string') return d;
                              if (d.format) return d.format('YYYY-MM-DD');
                              if (d instanceof Date) {
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                              }
                              return String(d);
                            };
                            const selected = Array.isArray(selectedDates) ? selectedDates.map(toDateString) : [];
                            const newDates = selected.map((date: string) => {
                              const existing = dates.find(d => d.date === date);
                              return existing || { date, mainTime: '', isMatinee: false, matineeTime: '' };
                            });
                            setDates(newDates);
                          }}
                          calendarPosition="static"
                          format="YYYY-MM-DD"
                          placeholder="Select event dates"
                          style={{ width: '100%', marginBottom: 8 }}
                        />
                      </div>
                      <button
                        type="button"
                        style={{
                          marginTop: 32,
                          background: '#2e3a59',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 24px',
                          fontWeight: 600,
                          fontSize: 15,
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          minWidth: 90,
                        }}
                        onClick={() => {
                          setShowDatePicker(false);
                          handleNext();
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 14, color: '#444' }}>
                  {dates.length ? dates.map(d => d.date).join(', ') : 'No dates selected'}
                </div>
                {errors.dates && <span style={{ color: '#E53E3E', fontSize: 14 }}>{errors.dates}</span>}
                {/* Example for each date: */}
                {dates.map((d, i) => (
                  <div key={i} style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 8 }}>
                    <span>Date: {d.date}</span>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontWeight: 600, marginBottom: 4 }}>Main Time</label>
                        <input type="time" value={d.mainTime || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newDates = [...dates];
                          newDates[i].mainTime = e.target.value;
                          setDates(newDates);
                        }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={d.isMatinee}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newDates = [...dates];
                              newDates[i].isMatinee = e.target.checked;
                              setDates(newDates);
                            }}
                            style={{ marginRight: '8px' }}
                          />
                          Matinee
                        </label>
                      </div>
                      {d.isMatinee && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontWeight: 600, marginBottom: 4 }}>Matinee Time</label>
                          <input type="time" value={d.matineeTime || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newDates = [...dates];
                            newDates[i].matineeTime = e.target.value;
                            setDates(newDates);
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {/* Step 3: Review & Submit */}
          {step === 2 && (
            <div className={styles.reviewSection}>
              <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 18 }}>Review Event Details</div>
              <hr style={{ marginBottom: '16px', borderColor: '#E2E8F0' }} />
              <dl style={{ margin: 0, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <dt style={{ display: 'inline', fontWeight: 600 }}>Title:</dt>
                  <dd style={{ display: 'inline', marginLeft: 6 }}>{title}</dd>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <dt style={{ display: 'inline', fontWeight: 600 }}>Venue:</dt>
                  <dd style={{ display: 'inline', marginLeft: 6 }}>{venue}</dd>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <dt style={{ display: 'inline', fontWeight: 600 }}>Category:</dt>
                  <dd style={{ display: 'inline', marginLeft: 6 }}>{categoryOptions.find(opt => opt.value === category)?.label}</dd>
                </div>
              </dl>
              <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Dates & Times:</div>
              <ul style={{ paddingLeft: 24, margin: 0 }}>
                {dates.map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <span>{formatDate(d.date)}: Main {d.mainTime || 'N/A'}{d.isMatinee ? `, Matinee ${d.matineeTime || 'N/A'}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
          <footer className={styles.customModalFooter}>
            <button type="button" onClick={onClose} className={styles.buttonGhost} style={{ marginRight: 12 }}>Cancel</button>
            {step > 0 && <button type="button" onClick={handleBack} className={styles.buttonGhost} style={{ marginRight: 12 }}>Back</button>}
            {step < steps.length - 1 && <button type="button" onClick={handleNext} className={styles.buttonPrimary}>Next</button>}
            {step === steps.length - 1 && (
  <button
    type="button"
    onClick={handleSubmit}
    className={styles.buttonSuccess}
    disabled={loading}
    style={loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
  >
    {loading ? (
      <span>
        <span className={styles.spinner} style={{ marginRight: 8 }} />
        Submitting...
      </span>
    ) : (
      'Submit'
    )}
  </button>
)}
{submitError && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(46,58,89,0.35)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 16px rgba(46,58,89,0.15)',
      padding: '2rem 2.5rem',
      minWidth: 320,
      maxWidth: '80vw',
      textAlign: 'center',
    }}>
      <div style={{ color: 'red', fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>{submitError}</div>
      {submitError && submitError.includes("not found in database") ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          <button
            onClick={() => setSubmitError(null)}
            style={{
              background: '#bbb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '0.6rem 1.3rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              setShowAddVenueModal(true);
              setSubmitError(null);
            }}
            style={{
              background: '#2e3a59',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '0.6rem 1.3rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Add Venue
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSubmitError(null)}
          style={{
            background: '#2e3a59',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.6rem 1.3rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      )}
    </div>
  </div>
)}
          </footer>
        </div>
      </div>
    ) : null}
    </>
  );
}
