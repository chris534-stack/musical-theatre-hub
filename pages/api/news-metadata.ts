import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { decodeHtml } from '../../lib/decodeHtml';
import { requireAdmin } from '../../utils/isAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
  }
  const { url } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url param' });
  }
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    // Try Open Graph first
    const title = decodeHtml($('meta[property="og:title"]').attr('content') || $('title').text());
    // Description: try og:description, then meta[name=description], then first <p>
    let description = $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || '';
    if (!description) {
      const firstP = $('p').first().text();
      if (firstP && firstP.length > 30) description = firstP;
    }
    description = decodeHtml(description);
    // Image: try og:image, then first <img>
    let image = $('meta[property="og:image"]').attr('content') || '';
    if (!image) {
      const firstImg = $('img').first().attr('src');
      if (firstImg) image = firstImg;
    }
    image = decodeHtml(image);
    const source = (new URL(url)).hostname.replace('www.', '');
    res.status(200).json({ title, description, image, url, source });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata', details: err instanceof Error ? err.message : err });
  }
}
