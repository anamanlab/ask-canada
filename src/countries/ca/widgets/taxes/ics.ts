/**
 * A calendar file (RFC 5545) for the tax dates, built on the device: all-day events with a reminder a week before,
 * content lines folded at 75 octets.
 *   downloadIcs('tax-dates-2026.ics', toICS(items, plan.today))   // call from a click handler
 */
import { addDays } from '@/lib/dates/business-days';

export function toICS(items: { date: string; title: string; detail: string }[], stamp: string) {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const d = (x: string) => x.replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ask Canada//Tax dates//EN', 'CALSCALE:GREGORIAN'];
  for (const it of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${d(it.date)}-${it.title.length}-${Math.abs(hash(it.title))}@ask-canada`,
      `DTSTAMP:${d(stamp)}T090000Z`,
      `DTSTART;VALUE=DATE:${d(it.date)}`,
      `DTEND;VALUE=DATE:${d(addDays(it.date, 1))}`,
      `SUMMARY:${esc(it.title)}`,
      `DESCRIPTION:${esc(it.detail)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(it.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

/**
 * Content lines are at most 75 octets (RFC 5545, section 3.1): a longer one continues on the next line after a
 * CRLF and one space. Counted in UTF-8 bytes and cut between characters, never inside one.
 */
function fold(line: string) {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let part = '';
  let size = 0;
  for (const ch of line) {
    const n = bytes.encode(ch).length;
    // Continuation lines start with the space, which counts toward their 75 octets.
    if (size + n > 75) {
      out.push(part);
      part = ' ';
      size = 1;
    }
    part += ch;
    size += n;
  }
  out.push(part);
  return out.join('\r\n');
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Hand the file to the person (no network). The browser keeps a detached link's click; nothing joins the page. */
export function downloadIcs(filename: string, ics: string) {
  const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  // The download reads the blob after the click returns: release it once it has had time to start.
  window.setTimeout(() => URL.revokeObjectURL(href), 4000);
}
