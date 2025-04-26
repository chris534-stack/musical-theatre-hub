import React from 'react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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

// modalStyle must be constructed inside the component to use isMobile


const closeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 18,
  background: 'none',
  border: 'none',
  fontSize: 22,
  color: '#2e3a59',
  cursor: 'pointer',
};

export default function AdminModal({ open, onClose, title, children }: AdminModalProps) {
  const isMobile = useIsMobileModal();
  if (!open) return null;

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    left: 'unset',
    width: 'auto',
    height: 'auto',
    background: 'rgba(46,58,89,0.18)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    overflow: 'visible',
    padding: 0,
    margin: 0,
    pointerEvents: 'none', // allow button underneath to be clickable except for modal
  };

  // Handler for overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click is on the overlay, not the card
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const mobileCardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 6px 32px 0 rgba(46,58,89,0.16)',
    padding: '0.5rem 0.7rem',
    width: 'auto',
    height: 'auto',
    textAlign: 'left',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    margin: 0,
    pointerEvents: 'auto',
    display: 'block',
  };
  const desktopCardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 6px 32px 0 rgba(46,58,89,0.16)',
    padding: '0.5rem 0.7rem',
    minWidth: 'unset',
    maxWidth: 'unset',
    width: 'auto',
    textAlign: 'left',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    margin: 0,
    pointerEvents: 'auto',
    display: 'block',
  };
  return (
    <div style={modalStyle} onClick={handleOverlayClick}>
      <div style={{... (isMobile ? mobileCardStyle : desktopCardStyle), marginTop: 12, marginRight: 18, pointerEvents: 'auto'}} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 14,
          right: 18,
          background: 'none',
          border: 'none',
          fontSize: 22,
          color: '#2e3a59',
          cursor: 'pointer',
          zIndex: 10,
        }}>×</button>
        <h2 style={{ color: '#2e3a59', fontWeight: 700, marginBottom: 10, textAlign: 'left', marginTop: 0, fontSize: '1.1rem' }}>{title}</h2>
        <div style={{ textAlign: 'left' }}>{children}</div>
      </div>
    </div>
  );
}
