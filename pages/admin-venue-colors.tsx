import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import useSWR from 'swr';

const BRAND_YELLOW = '#ffe082';
const BRAND_BLUE = '#b2ebf2';
const BRAND_BLACK = '#222';
const BRAND_WHITE = '#fff';
const PALETTE = [BRAND_YELLOW, BRAND_BLUE, BRAND_BLACK, BRAND_WHITE];

// Fetch venues and color settings from API
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminVenueColors() {
  const { data: venues, mutate } = useSWR('/api/venues', fetcher);
  const { data: colorMap, mutate: mutateColors } = useSWR('/api/venue-colors', fetcher);
  const [localColors, setLocalColors] = useState<{ [venue: string]: { bg: string; border: string; text: string } }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (colorMap) setLocalColors(colorMap);
  }, [colorMap]);

  if (!venues) return <div>Loading...</div>;

  function handleColorChange(venue: string, field: 'bg' | 'border' | 'text', value: string) {
    setLocalColors(lc => ({ ...lc, [venue]: { ...lc[venue], [field]: value } }));
  }

  async function saveColors() {
    setSaving(true);
    await fetch('/api/venue-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localColors),
    });
    setSaving(false);
    mutateColors();
  }

  return (
    <>
      <Head>
        <title>Venue Color Manager | Admin</title>
      </Head>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ marginBottom: 30 }}>Venue Color Manager</h1>
        <p style={{ color: '#555', marginBottom: 24 }}>
          Assign a background, border, and text color for each venue's calendar marquee. Only your brand colors are allowed for consistency.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Venue</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Background</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Border</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Text</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Preview</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue: string) => (
              <tr key={venue}>
                <td style={{ padding: 8 }}>{venue}</td>
                {(['bg', 'border', 'text'] as const).map(field => (
                  <td key={field} style={{ textAlign: 'center', padding: 8 }}>
                    <select
                      value={localColors[venue]?.[field] || PALETTE[0]}
                      onChange={e => handleColorChange(venue, field, e.target.value)}
                      style={{ padding: 4, borderRadius: 4, fontWeight: 600, background: '#fafafa' }}
                    >
                      {PALETTE.map(color => (
                        <option key={color} value={color} style={{ background: color, color: color === BRAND_BLACK ? '#fff' : BRAND_BLACK }}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 18px',
                    borderRadius: 14,
                    background: localColors[venue]?.bg || BRAND_YELLOW,
                    border: `2.5px solid ${localColors[venue]?.border || BRAND_BLACK}`,
                    color: localColors[venue]?.text || BRAND_BLACK,
                    fontWeight: 700,
                  }}>
                    {venue}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={saveColors}
          disabled={saving}
          style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '10px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </main>
    </>
  );
}
