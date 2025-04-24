import React, { useState } from 'react';

interface EditPerformanceModalProps {
  show: any;
  onClose: () => void;
  onUpdated: () => void;
}

const EditPerformanceModal: React.FC<EditPerformanceModalProps> = ({ show, onClose, onUpdated }) => {
  const [isMatinee, setIsMatinee] = useState(!!show.isMatinee);
  const [time, setTime] = useState(show.time || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matineeMessage, setMatineeMessage] = useState<string | null>(null);

  const handleMatineeToggle = (checked: boolean) => {
    setIsMatinee(checked);
    setMatineeMessage(checked ? 'This performance will now be treated as a matinee.' : 'This performance will now be treated as a regular (non-matinee) performance.');
    setTimeout(() => setMatineeMessage(null), 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/update-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...show, isMatinee, time }),
    });
    setLoading(false);
    if (res.ok) {
      onUpdated();
      onClose();
    } else {
      setError('Failed to update performance.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 450, minHeight: 200, maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <h3>Edit Performance</h3>
        <div style={{ marginBottom: 14 }}>
          <strong>Date:</strong> {show.date}<br />
          <strong>Current Time:</strong> <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ marginLeft: 8 }} step="60" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>
            <input type="checkbox" checked={isMatinee} onChange={e => handleMatineeToggle(e.target.checked)} />{' '}
            Matinee
          </label>
        </div>
        {matineeMessage && <div style={{ color: '#1976d2', marginBottom: 10 }}>{matineeMessage}</div>}
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ background: '#1976d2', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4 }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditPerformanceModal;
