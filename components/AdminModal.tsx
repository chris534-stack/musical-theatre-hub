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

  const modalStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'transparent', // let the calendar show through
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    pointerEvents: 'auto',
  } : {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(30, 34, 43, 0.36)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    overflow: 'visible',
    padding: 0,
    margin: 0,
    pointerEvents: 'auto',
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
      <div style={{
        ...(isMobile ? {
          background: '#fff',
          borderRadius: '18px 0 0 18px',
          boxShadow: '0 2px 18px 0 rgba(46,58,89,0.10)',
          padding: 0,
          maxWidth: 290,
          width: '90vw',
          minWidth: 180,
          marginTop: 18,
          marginRight: 8,
          pointerEvents: 'auto',
          height: 'auto',
          maxHeight: 'calc(100vh - 36px)',
          overflowY: 'auto',
          position: 'relative',
        } : desktopCardStyle),
        marginTop: isMobile ? 18 : 12,
        marginRight: isMobile ? 8 : 18,
        pointerEvents: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.7rem 0.7rem 0.3rem 0.9rem' : '0.5rem 0.7rem 0.5rem 0.7rem',
          borderBottom: '1px solid #f1f1f1',
          background: '#fff',
          borderRadius: isMobile ? '18px 0 0 0' : '10px 10px 0 0',
        }}>
          <h2 style={{ color: '#2e3a59', fontWeight: 700, margin: 0, textAlign: 'left', fontSize: '1.1rem', flex: 1 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#2e3a59',
            cursor: 'pointer',
            marginLeft: 8,
            lineHeight: 1,
            padding: 0,
          }}>×</button>
        </div>
        <div style={{ textAlign: 'left', padding: isMobile ? '0.8rem 0.7rem 1.1rem 0.9rem' : '0.5rem 0.7rem' }}>{children}</div>
      </div>
    </div>
  );
}
