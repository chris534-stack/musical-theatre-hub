import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: { name: string; org: string; email: string; message: string }) => void;
}

const OrgContactModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: '', org: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(46,58,89,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '2rem 2.2rem', maxWidth: 400, width: '100%', boxShadow: '0 6px 32px 0 rgba(46,58,89,0.15)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
        <h2 style={{ color: '#2e3a59', fontWeight: 700, fontSize: '1.3rem', marginBottom: 18 }}>Request Organization Listing</h2>
        {success ? (
          <div style={{ color: '#34A853', fontWeight: 600, textAlign: 'center', margin: '1.2rem 0' }}>
            Thank you! Your message has been sent.
          </div>
        ) : (
          <form onSubmit={async e => {
            e.preventDefault();
            setSubmitting(true);
            await onSubmit(form);
            setSubmitting(false);
            setSuccess(true);
          }}>
            <input type="text" required placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
            <input type="text" required placeholder="Organization Name" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
            <input type="email" required placeholder="Your Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
            <textarea required placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ width: '100%', marginBottom: 14, padding: 8, borderRadius: 6, border: '1px solid #ddd', minHeight: 64, resize: 'vertical' }} />
            <button type="submit" disabled={submitting} style={{ width: '100%', background: '#ffd700', color: '#2e3a59', fontWeight: 700, border: 'none', borderRadius: 8, padding: '0.8rem 0', fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)' }}>
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrgContactModal;
