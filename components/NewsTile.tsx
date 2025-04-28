import React from 'react';

interface NewsTileProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  source: string;
}

const NewsTile: React.FC<NewsTileProps> = ({ title, description, image, url, source }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" style={{
    display: 'flex', flexDirection: 'column', background: '#fff',
    borderRadius: 12, boxShadow: '0 2px 12px rgba(46,58,89,0.10)',
    overflow: 'hidden', textDecoration: 'none', color: '#23395d', marginBottom: 20, maxWidth: 400
  }}>
    {image && <img src={image} alt={title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />}
    <div style={{ padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>{description}</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{source}</div>
      <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 15 }}>Read More &rarr;</div>
    </div>
  </a>
);

export default NewsTile;
