import React, { useState } from 'react';

interface EditPerformanceModalProps {
  show: any;
  onClose: () => void;
  onUpdated: () => void;
}

function useIsMobileModal() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 600 || window.innerWidth / window.innerHeight < 0.75);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
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
      body: JSON.stringify({
        originalSlug: show.slug,
        originalDate: show.date,
        originalTime: show.time,
        ...show,
        isMatinee,
        time
      }),
    });
    setLoading(false);
    if (res.ok) {
      onUpdated();
      onClose();
    } else {
      setError('Failed to update performance.');
    }
  };

  const isMobile = useIsMobileModal();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: isMobile ? '1.1rem 0.6rem 2.2rem 0.6rem' : 32,
          borderRadius: isMobile ? 0 : 8,
          minWidth: isMobile ? '100vw' : 450,
          minHeight: isMobile ? '100vh' : 200,
          maxWidth: isMobile ? '100vw' : 600,
          maxHeight: isMobile ? '100vh' : '80vh',
          width: isMobile ? '100vw' : undefined,
          height: isMobile ? '100vh' : undefined,
          position: 'relative',
          overflowY: 'auto',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 11,
          paddingBottom: 8,
          paddingTop: isMobile ? 8 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1.15rem' : '1.2rem' }}>Edit Performance</h3>
          <button
            onClick={onClose}
            style={{
              position: 'relative',
              top: 0,
              right: 0,
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              marginLeft: 8,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 14 }}>
            <strong>Date:</strong> {show.date}<br />
            <strong>Current Time:</strong>{' '}
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{ marginLeft: 8, fontSize: isMobile ? 16 : undefined, width: isMobile ? '60%' : undefined, padding: isMobile ? '8px 4px' : undefined }}
              step="60"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: isMobile ? 16 : undefined }}>
              <input
                type="checkbox"
                checked={isMatinee}
                onChange={e => handleMatineeToggle(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Matinee
            </label>
          </div>
          {matineeMessage && <div style={{ color: '#1976d2', marginBottom: 10 }}>{matineeMessage}</div>}
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        </div>
        <div style={{ display: isMobile ? 'block' : 'flex', gap: 10, justifyContent: isMobile ? 'stretch' : 'flex-end', marginTop: isMobile ? 12 : 0 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              width: isMobile ? '100%' : undefined,
              marginBottom: isMobile ? 8 : 0,
              padding: isMobile ? '12px 0' : undefined,
              fontSize: isMobile ? 16 : undefined,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: isMobile ? '12px 0' : '6px 14px',
              borderRadius: 4,
              width: isMobile ? '100%' : undefined,
              fontSize: isMobile ? 16 : undefined,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPerformanceModal;
