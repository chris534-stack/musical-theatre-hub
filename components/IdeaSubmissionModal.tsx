import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface IdeaSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IdeaSubmissionModal({ isOpen, onClose }: IdeaSubmissionModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ideaType, setIdeaType] = useState('show');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Auto-populate form fields if user is signed in
  useEffect(() => {
    async function populateUserInfo() {
      try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }
        
        if (session?.user) {
          // If user is logged in, populate the name and email fields
          if (session.user.user_metadata?.full_name) {
            setName(session.user.user_metadata.full_name);
          } else if (session.user.user_metadata?.name) {
            setName(session.user.user_metadata.name);
          }
          
          if (session.user.email) {
            setEmail(session.user.email);
          }
        }
      } catch (error) {
        console.error('Error populating user info:', error);
      }
    }
    
    if (isOpen) {
      populateUserInfo();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Submit the idea using the API endpoint
      const response = await fetch('/api/submit-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          idea_type: ideaType,
          title: ideaTitle,
          description: ideaDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit idea');
      }
      
      setSubmitSuccess(true);
      // Reset form after successful submission
      setName('');
      setEmail('');
      setIdeaType('show');
      setIdeaTitle('');
      setIdeaDescription('');
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting idea:', error);
      setError('Failed to submit your idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Submit Your Idea</h2>
          <button 
            type="button" 
            className="close-button" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-content">
          {submitSuccess ? (
            <div className="success-message">
              <div className="checkmark-circle">✓</div>
              <h3>Thank You!</h3>
              <p>Your idea has been submitted successfully. We'll review it and get back to you soon!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ideaType">Type of Idea</label>
                <select
                  id="ideaType"
                  value={ideaType}
                  onChange={(e) => setIdeaType(e.target.value)}
                  required
                >
                  <option value="show">Show or Production</option>
                  <option value="workshop">Workshop</option>
                  <option value="event">Special Event</option>
                  <option value="community">Community Project</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="ideaTitle">Idea Title</label>
                <input
                  id="ideaTitle"
                  type="text"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ideaDescription">Description</label>
                <textarea
                  id="ideaDescription"
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  rows={5}
                  placeholder="Please describe your idea in detail. What makes it special? Why would it be a good fit for our community?"
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-container {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #2d3748;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
        }
        
        .modal-content {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #4a5568;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .error-message {
          color: #e53e3e;
          margin-bottom: 16px;
          padding: 8px;
          background-color: #fff5f5;
          border-radius: 4px;
          border-left: 3px solid #e53e3e;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        
        .cancel-button {
          padding: 8px 16px;
          background-color: #e2e8f0;
          color: #4a5568;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .submit-button {
          padding: 8px 16px;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .submit-button:hover {
          background-color: #2c5282;
        }
        
        .cancel-button:hover {
          background-color: #cbd5e0;
        }
        
        .submit-button:disabled,
        .cancel-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .success-message {
          text-align: center;
          padding: 20px 0;
        }
        
        .checkmark-circle {
          width: 60px;
          height: 60px;
          background-color: #48bb78;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 16px;
        }
        
        .success-message h3 {
          margin: 0 0 8px;
          color: #2d3748;
        }
        
        .success-message p {
          color: #4a5568;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
