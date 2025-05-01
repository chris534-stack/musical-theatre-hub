import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AddVenueModalProps {
  isOpen: boolean;
  initialVenueName: string;
  onClose: () => void;
  onVenueAdded: (venue: { id: number; name: string }) => void;
}

export default function AddVenueModal({ isOpen, initialVenueName, onClose, onVenueAdded }: AddVenueModalProps) {
  const [name, setName] = useState(initialVenueName || '');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from('venues')
      .insert([{ name, address }])
      .select('id, name')
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message || 'Failed to add venue.');
    } else if (data) {
      onVenueAdded(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(46,58,89,0.35)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(46,58,89,0.15)',
        padding: '2rem 2.5rem',
        minWidth: 340,
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: 16 }}>Add Venue</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600 }}>Name</label><br />
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600 }}>Address</label><br />
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
        </div>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          <button type="button" onClick={onClose} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem 1.3rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ background: '#2e3a59', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem 1.3rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Adding...' : 'Add Venue'}</button>
        </div>
      </form>
    </div>
  );
}
