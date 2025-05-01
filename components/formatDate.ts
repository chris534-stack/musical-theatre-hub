// Utility to format a date string (YYYY-MM-DD or Date object) to 'Month DaySuffix, Year'
export default function formatDate(date: string | Date): string {
  let d: Date;
  if (typeof date === 'string') {
    // If date is in YYYY-MM-DD, parse as local date
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleString('default', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  const daySuffix = getDaySuffix(day);
  return `${month} ${day}${daySuffix}, ${year}`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
