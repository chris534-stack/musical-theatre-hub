import React from 'react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(46,58,89,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 6px 32px 0 rgba(46,58,89,0.16)',
  padding: '2rem 2.5rem 2rem 2.5rem',
  minWidth: 320,
  maxWidth: 600,
  width: '100%',
  textAlign: 'center',
  position: 'relative',
  maxHeight: '80vh',
  overflowY: 'auto',
};

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
  if (!open) return null;
  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <button aria-label="Close modal" style={closeStyle} onClick={onClose}>&times;</button>
        <h2 style={{ color: '#2e3a59', fontWeight: 700, marginBottom: 18 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
