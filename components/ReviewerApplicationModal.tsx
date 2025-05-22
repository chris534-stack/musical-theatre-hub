import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import styles from './AddEventModal.module.css';

interface ReviewerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSubmitted?: () => void;
}

export default function ReviewerApplicationModal({ isOpen, onClose, user, onSubmitted }: ReviewerApplicationModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      // Pre-fill from Supabase user profile if available
      if (user.user_metadata?.full_name) {
        const parts = user.user_metadata.full_name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else if (user.user_metadata?.name) { // Fallback for some providers
        const parts = user.user_metadata.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      // Email is available at user.email, but not currently a field in this form/table
    }
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setPreferredName('');
      setPronouns('');
      setSubmitError(null);
      setLoading(false);
      setSuccessMessage(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!user) {
      console.error('Reviewer application error: No user object provided.');
      setSubmitError('You must be signed in to apply.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      console.error('Reviewer application error: Missing first or last name.', { firstName, lastName });
      setSubmitError('First and last name are required.');
      return;
    }
    setLoading(true);
    try {
      const applicationData = {
        id: user.id, // Supabase user ID
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferredName.trim(),
        pronouns: pronouns.trim(),
        reviewer_application_status: 'pending',
        applied_at: new Date().toISOString(),
        // email: user.email, // Example: if you add an email column to your 'reviewers' table
      };

      const { error } = await supabase.from('reviewers').upsert(applicationData, {
        onConflict: 'id', // Upsert based on the user's ID
      });

      if (error) {
        throw error;
      }

      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        setLoading(false);
        if (onSubmitted) onSubmitted();
        onClose(); // Close modal on success
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setSubmitError(`Failed to submit application: ${err.message || 'Please try again.'}`);
      console.error('Reviewer application Supabase error:', err);
    }
  };

  return isOpen ? (
    <div className={styles.customModalOverlay} onClick={onClose}>
      <div className={styles.customModalContainer} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header className={styles.customModalHeader}>
          <h2 style={{ marginBottom: 0 }}>Reviewer Application</h2>
          <button className={styles.customModalClose} aria-label="Close" onClick={onClose}>&times;</button>
        </header>
        <div className={styles.customModalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontWeight: 600 }}>First Name *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontWeight: 600 }}>Last Name *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Preferred Name</label>
              <input type="text" value={preferredName} onChange={e => setPreferredName(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Preferred Pronouns</label>
              <input type="text" value={pronouns} onChange={e => setPronouns(e.target.value)} style={{ width: '100%' }} />
            </div>
            {submitError && <div style={{ color: 'red', marginBottom: 8 }}>{submitError}</div>}
            {successMessage && <div style={{ color: 'green', marginBottom: 8 }}>{successMessage}</div>}
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
