
import React, { useEffect, useState, useRef } from 'react';
import DatePicker from 'react-multi-date-picker';
import { mutate } from 'swr';

import styles from './AddEventModal.module.css';
import formatDate from './formatDate';


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
    let allOk = true;
    for (const d of dates) {
      const event = {
        title,
        venue,
        category,
        description,
        director,
        ticketLink,
        date: d.date,
        mainTime: d.mainTime,
        isMatinee: d.isMatinee,
        matineeTime: d.matineeTime,
      };
      const res = await fetch('/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!res.ok) allOk = false;
    }
    setLoading(false);
    if (allOk) {
      mutate('/api/events'); // Refresh calendar events
      onClose();
    } else {
      setSubmitError('Failed to add one or more events.');
    }
  };

  return (
    isOpen ? (
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
            <div className={styles.formSection} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Title & Venue Row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column' }}>
                  <label className={styles.label}>Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" className={styles.input} />
                  {errors.title && <span className={styles.error}>{errors.title}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column' }}>
                  <label className={styles.label}>Venue</label>
                  <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue" className={styles.input} />
                  {errors.venue && <span className={styles.error}>{errors.venue}</span>}
                </div>
              </div>

              {/* Category Row */}
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 400 }}>
                <label className={styles.label}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={styles.input}>
                  <option value="">Select Category</option>
                  {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.category && <span className={styles.error}>{errors.category}</span>}
              </div>

              {/* Description Row */}
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 600 }}>
                <label className={styles.label}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Event Description" className={styles.input} rows={3} style={{ resize: 'vertical', minHeight: 60 }} />
                {errors.description && <span className={styles.error}>{errors.description}</span>}
              </div>

              {/* Director & Ticket Link Row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column' }}>
                  <label className={styles.label}>Director</label>
                  <input value={director} onChange={e => setDirector(e.target.value)} placeholder="Director" className={styles.input} />
                  {errors.director && <span className={styles.error}>{errors.director}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column' }}>
                  <label className={styles.label}>Ticket Purchase Link <span style={{ color: '#A0AEC0', fontWeight: 400 }}>(optional)</span></label>
                  <input value={ticketLink} onChange={e => setTicketLink(e.target.value)} placeholder="https://..." className={styles.input} />
                  <span style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2 }}>Add a link for online ticket sales</span>
                </div>
              </div>
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
            {step > 0 && <button type="button" onClick={handleBack} className={styles.buttonGhost} style={{ marginRight: 12 }}>Back</button>}
            {step < steps.length - 1 && <button type="button" onClick={handleNext} className={styles.buttonPrimary}>Next</button>}
            {step === steps.length - 1 && <button type="button" onClick={handleSubmit} className={styles.buttonSuccess}>Submit</button>}
          </footer>
        </div>
      </div>
    ) : null
  );
}
