/**
 * iCalendar (.ics, RFC 5545) files for "Add to calendar". Pure string building plus a
 * tiny browser helper that hands the file to the person's calendar app. Nothing leaves the device.
 *
 * TODO(core-lib/ics): delete this file once core provides a shared `@/lib/ics` (`toICS` + `saveCalendar`).
 * The dates, taxes and documents widgets each carry their own copy of this builder and download helper (reported to
 * core in round 5); a widget can't add to `src/lib`, so the copy stays until the shared one lands. Callers here only
 * use `saveCalendar(filename, events, { calName, prodId })` from event handlers, so the swap is an import change.
 */
import { addDays } from '@/lib/dates/business-days';

type IcsEvent = {
  uid: string;
  /** All-day event date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  description?: string;
  url?: string;
  /** Reminder text (shown by the calendar app before the event). */
  reminder?: string;
};

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
const day = (iso: string) => iso.replace(/-/g, '');

/** Fold lines at 75 octets (UTF-8 safe), as the spec requires. */
function fold(line: string) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (bytes.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function toICS(
  events: IcsEvent[],
  opts: { calName: string; prodId: string; stamp: string; /** Minutes before the (midnight) start: 900 = 9 a.m. the day before. */ alarmMinutes?: number },
): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${opts.prodId}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(opts.calName)}`];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${opts.stamp}`,
      `DTSTART;VALUE=DATE:${day(e.date)}`,
      `DTEND;VALUE=DATE:${day(addDays(e.date, 1))}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('TRANSP:TRANSPARENT');
    if (opts.alarmMinutes && e.reminder) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.reminder)}`, `TRIGGER:-PT${opts.alarmMinutes}M`, 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** UTC timestamp in iCalendar form (`20260930T120000Z`). */
const icsStamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Browser only (call from an event handler): save the calendar file (iOS/macOS offer "Add to Calendar", others open it in their app). */
function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Build the file and hand it to the person's calendar app, with a reminder at 9 a.m. the day before each date. */
export function saveCalendar(file: string, events: IcsEvent[], cal: { calName: string; prodId: string }) {
  downloadICS(`${file}.ics`, toICS(events, { ...cal, stamp: icsStamp(), alarmMinutes: 900 }));
}
