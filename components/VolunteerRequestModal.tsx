import React, { useState, useRef } from 'react';
import DatePicker from 'react-multi-date-picker';
import { mutate } from 'swr';
import styles from './AddEventModal.module.css';

interface VolunteerRequest {
  venue: string;
  expertise: string;
  description: string;
  dates: string[];
  timeCommitment: string;
}

interface VolunteerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VolunteerRequestModal({ isOpen, onClose }: VolunteerRequestModalProps) {
  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setVenue('');
      setExpertise('');
      setDescription('');
      setTimeCommitment('');
      setSubmitError(null);
      setLoading(false);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const [venue, setVenue] = useState('');
  const [expertise, setExpertise] = useState('');
  const [description, setDescription] = useState('');

  const [timeCommitment, setTimeCommitment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const datePickerRef = useRef<any>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!venue.trim()) {
      setSubmitError('Venue is required.');
      return;
    }

    setLoading(true);
    const req: VolunteerRequest = {
      venue,
      expertise,
      description,
      dates: [],
      timeCommitment
    };
    const res = await fetch('/api/add-volunteer-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    setLoading(false);
    if (res.ok) {
      mutate('/api/add-volunteer-request');
      setSuccessMessage('Volunteer request submitted!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } else {
      setSubmitError('Failed to add volunteer request.');
    }
  };


  return isOpen ? (
    <div className={styles.customModalOverlay} onClick={onClose}>
      <div className={styles.customModalContainer} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header className={styles.customModalHeader}>
          <h2 style={{ marginBottom: 0 }}>New Volunteer Request</h2>
          <button className={styles.customModalClose} aria-label="Close" onClick={onClose}>&times;</button>
        </header>
        <div className={styles.customModalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Venue</label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Expertise Needed</label>
              <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="e.g. Lighting, Sound, Set Design" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Description / What is Needed</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Estimated Time Commitment</label>
              <input type="text" value={timeCommitment} onChange={e => setTimeCommitment(e.target.value)} placeholder="e.g. 3 hours/day, 2 weeks" style={{ width: '100%' }} />
            </div>
            {submitError && <div style={{ color: 'red', marginBottom: 8 }}>{submitError}</div>}
          </div>
        </div>
        <footer className={styles.customModalFooter}>
          <button type="button" onClick={handleSubmit} className={styles.buttonSuccess} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;
}
