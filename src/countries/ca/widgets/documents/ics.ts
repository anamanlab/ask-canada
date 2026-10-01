/**
 * A one-event iCalendar file for a deadline (all-day, with a reminder 7 days before). Built on the device;
 * nothing personal goes in it: only the document type, the deadline label and the official page.
 */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const compact = (iso: string) => iso.replace(/-/g, '');

export function deadlineIcs({ date, title, body, uid }: { date: string; title: string; body: string; uid: string }) {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = `${next.getUTCFullYear()}${String(next.getUTCMonth() + 1).padStart(2, '0')}${String(next.getUTCDate()).padStart(2, '0')}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ask Canada//Letter explainer//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@ask-canada`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(body)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

/**
 * Offer the file to the person (no network). Called from a click handler only, never during render.
 * Duplicate of widgets/dates/ics.ts and widgets/taxes/ics.ts: all three should move to a shared `@/lib/ics`
 * (build + download) once core provides one.
 */
export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
