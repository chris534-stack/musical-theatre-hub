// Script to seed 'Whole Lotta Nunsense' article to Firestore
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
import * as fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'our-stage-eugene-firebase-adminsdk-fbsvc-06c2558920.json');
const NEWS_URLS = [
  // Firebringer (should appear at top)
  'https://eugenescene.org/firebringer-called-a-new-stone-age-musical-takes-the-stage-at-the-very-little-theatre-at-vlt/',
  // NW10 review
  'https://eugenescene.org/review-nw10-10-minute-plays-at-oregon-contemporary-theatre-is-non-stop-and-fun-filled/',
  // Eugene Weekly poppin-off
  'https://eugeneweekly.com/2025/04/15/poppin-off/',
];

import { decodeHtml } from '../lib/decodeHtml';
async function fetchMetadata(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  // Minimal cheerio-like scraping
  const titleMatch = html.match(/<meta property=\"og:title\" content=\"([^\"]+)\"/);
  const descMatch = html.match(/<meta property=\"og:description\" content=\"([^\"]*)\"/);
  const imageMatch = html.match(/<meta property=\"og:image\" content=\"([^\"]*)\"/);
  const title = decodeHtml(titleMatch ? titleMatch[1] : (html.match(/<title>([^<]*)<\/title>/)?.[1] || ''));
  // Description: try og:description, then meta[name=description], then first <p>
  let description = descMatch ? descMatch[1] : '';
  if (!description) {
    const metaDesc = html.match(/<meta name=\"description\" content=\"([^\"]*)\"/);
    if (metaDesc) description = metaDesc[1];
  }
  if (!description) {
    const firstP = html.match(/<p>(.*?)<\/p>/i);
    if (firstP && firstP[1].length > 30) description = firstP[1];
  }
  description = decodeHtml(description);
  // Image: try og:image, then first <img>
  let image = imageMatch ? imageMatch[1] : '';
  if (!image) {
    const firstImg = html.match(/<img[^>]*src=\"([^\"]+)\"/i);
    if (firstImg) image = firstImg[1];
  }
  image = decodeHtml(image);
  let source = '';
  try { source = (new URL(url)).hostname.replace('www.', ''); } catch {}
  return { title, description, image, url, source };
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Missing service account JSON:', SERVICE_ACCOUNT_PATH);
    process.exit(1);
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert(require(SERVICE_ACCOUNT_PATH)),
    });
  }
  const db = getFirestore();
  const newsCol = db.collection('news');
  const { FieldValue } = await import('firebase-admin/firestore');

  // Delete any existing docs for these URLs
  for (const url of NEWS_URLS) {
    const snap = await newsCol.where('url', '==', url).get();
    if (!snap.empty) {
      await Promise.all(snap.docs.map(doc => doc.ref.delete()));
      console.log('Deleted old article(s) with URL:', url);
    }
  }

  // Add all articles, Firebringer last so it gets the latest timestamp
  for (let i = NEWS_URLS.length - 1; i >= 0; i--) {
    const url = NEWS_URLS[i];
    const meta = await fetchMetadata(url);
    await newsCol.add({
      ...meta,
      timestamp: FieldValue.serverTimestamp(),
    });
    console.log('Seeded article to Firestore:', meta.title);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
