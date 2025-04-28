import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import NewsTile from '../components/NewsTile';
import AdminModal from '../components/AdminModal';
import useIsAdmin from '../components/useIsAdmin';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import { decodeHtml } from '../lib/decodeHtml';

const TEST_URL = 'https://eugeneweekly.com/2025/04/10/a-whole-lotta-nunsense/';

async function fetchMetadata(url: string) {
  const res = await fetch(`/api/news-metadata?url=${encodeURIComponent(url)}`);
  return await res.json();
}

export default function News() {
  const isAdmin = useIsAdmin();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch all news articles from Firestore
  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const newsArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNews(newsArr);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to fetch news articles');
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  // Seed the test article if not present
  useEffect(() => {
    async function seedTestArticle() {
      if (!isAdmin) return; // Only seed if admin is viewing
      try {
        const q = query(collection(db, 'news'), where('url', '==', TEST_URL));
        const snap = await getDocs(q);
        if (snap.empty) {
          const meta = await fetchMetadata(TEST_URL);
          await addDoc(collection(db, 'news'), {
            ...meta,
            url: TEST_URL,
            timestamp: serverTimestamp(),
          });
          // Reload news after seeding
          const q2 = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
          const snap2 = await getDocs(q2);
          setNews(snap2.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setError(null);
        }
      } catch (err: any) {
        setError('Failed to seed test article: ' + (err?.message || err));
      }
    }
    seedTestArticle();
  }, [isAdmin]);

  // Handle admin submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const meta = await fetchMetadata(inputUrl);
      await addDoc(collection(db, 'news'), {
        ...meta,
        url: inputUrl,
        timestamp: serverTimestamp(),
      });
      setInputUrl('');
      setModalOpen(false);
      // Reload news
      const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setSubmitError('Failed to add article.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>News | Our Stage, Eugene</title>
      </Head>
      <main style={{ margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2.3rem', color: '#2e3a59', marginBottom: 20 }}>News</h1>
        {isAdmin && (
          <button
            style={{ marginBottom: 20, padding: '8px 18px', fontWeight: 600, background: '#2e3a59', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => setModalOpen(true)}
          >
            + Add News Article
          </button>
        )}
        {loading && <div>Loading news articles…</div>}
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 32,
            margin: '0 auto',
            maxWidth: 850,
            marginTop: 8,
            justifyContent: 'center',
          }}
          className="news-grid-responsive"
        >
          {news.map((meta) => (
            <div key={meta.id || meta.url} style={{ position: 'relative' }}>
              <NewsTile
                title={decodeHtml(meta.title)}
                description={decodeHtml(meta.description)}
                image={meta.image}
                url={meta.url}
                source={meta.source}
              />
              {isAdmin && (
                <button
                  style={{ position: 'absolute', top: 10, right: 10, background: '#eee', border: '1px solid #bbb', borderRadius: 6, padding: '2px 10px', fontSize: 13, cursor: 'pointer', zIndex: 2 }}
                  onClick={() => { setEditData(meta); setEditModalOpen(true); }}
                >
                  Edit
                </button>
              )}
            </div>
          ))}
          {/* Spacer to prevent bottom nav overlap */}
          <div style={{ height: 70, width: '100%' }} />
        </div>
      </main>
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add News Article">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label htmlFor="news-url" style={{ fontWeight: 600 }}>Article URL</label>
          <input
            id="news-url"
            type="url"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="https://..."
            required
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
          {submitError && <div style={{ color: 'red' }}>{submitError}</div>}
          <button type="submit" disabled={submitting} style={{ background: '#2e3a59', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
            {submitting ? 'Adding…' : 'Add Article'}
          </button>
        </form>
      </AdminModal>
      {/* Admin Edit Modal */}
      <AdminModal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit News Article">
        {editData && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setEditSubmitting(true);
            setEditError(null);
            try {
              const ref = doc(db, 'news', editData.id);
              await updateDoc(ref, {
                title: editData.title,
                description: editData.description,
                image: editData.image,
              });
              // Update local state
              setNews(news.map(n => n.id === editData.id ? { ...n, ...editData } : n));
              setEditModalOpen(false);
            } catch (err: any) {
              setEditError('Failed to update article.');
            } finally {
              setEditSubmitting(false);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontWeight: 600 }}>Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={e => setEditData({ ...editData, title: e.target.value })}
              required
              style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
            <label style={{ fontWeight: 600 }}>Description</label>
            <textarea
              value={editData.description}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
              style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, minHeight: 60 }}
            />
            <label style={{ fontWeight: 600 }}>Image URL</label>
            <input
              type="text"
              value={editData.image}
              onChange={e => setEditData({ ...editData, image: e.target.value })}
              style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {editError && <div style={{ color: 'red' }}>{editError}</div>}
            <button type="submit" disabled={editSubmitting} style={{ background: '#2e3a59', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}
      </AdminModal>
    </>
  );
}
