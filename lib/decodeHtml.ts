// Utility to decode HTML entities
export function decodeHtml(html: string): string {
  if (!html) return '';
  // Browser way (works in Node >= 20 with jsdom or in browser)
  if (typeof window !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
  // Node fallback
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…');
}
