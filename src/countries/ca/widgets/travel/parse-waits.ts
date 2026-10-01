/**
 * Pure parsers for CBSA's border wait times (no network, no DOM), server-side only in practice:
 *  - the CSV https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-eng.csv (";;"-separated; bwt-fra.csv for French office names)
 *  - the notices on the wait-times page (menu-eng.html / menu-fra.html)
 * Parsing is defensive: anything unexpected is dropped rather than guessed.
 */
import { textOf } from './html';
import type { Crossing, Province, Wait } from './types';

const PROVINCES: Province[] = ['NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC'];

function parseWait(raw: string): Wait {
  const s = raw.trim();
  if (!s || s === '--') return { minutes: null, label: 'unknown' };
  if (/no delay|aucun d[ée]lai/i.test(s)) return { minutes: 0, label: 'none' };
  if (/not applicable|ne s.applique pas/i.test(s)) return { minutes: null, label: 'na' };
  if (/closed|ferm[ée]/i.test(s)) return { minutes: null, label: 'closed' };
  const h = s.match(/(\d+)\s*(?:hours?|heures?|h)\b/i);
  const m = s.match(/(\d+)\s*min/i);
  if (h || m) return { minutes: (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0), label: 'minutes' };
  return { minutes: null, label: 'unknown' };
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Rows: Customs Office;; Location;; Last updated;; Commercial Canada-bound;; Commercial U.S.-bound;;
 * Travellers Canada-bound;; Travellers U.S.-bound;; (CBSA reports only Canada-bound waits).
 * `frNames` (optional) are the French office names, row for row: with them each crossing carries its name
 * in both official languages (`names`), so the board follows the UI's language. `name` is CBSA's English one.
 */
export function parseWaitsCsv(csv: string, frNames?: string[]): Crossing[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.includes(';;'));
  const rows = lines.slice(1).map((l) => l.split(';;').map((c) => c.trim()));
  return rows
    .filter((r) => r.length >= 6 && r[0])
    .map((r, i) => {
      const [canada = r[1], us = ''] = r[1].split('/');
      const prov = canada.match(/,\s*([A-Z]{2})\s*$/)?.[1] as Province | undefined;
      const fr = frNames?.[i]?.trim();
      return {
        id: slug(r[0]),
        name: r[0],
        ...(fr ? { names: { en: r[0], fr } } : {}),
        canada: canada.trim(),
        us: us.trim(),
        province: prov && PROVINCES.includes(prov) ? prov : null,
        updated: r[2],
        commercial: parseWait(r[3]),
        travellers: parseWait(r[5]),
      };
    });
}

/** First column of a CBSA CSV (office names), row for row. */
export const officeNames = (csv: string) =>
  csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.includes(';;'))
    .slice(1)
    .map((l) => l.split(';;')[0]?.trim() ?? '');

/* ---------- CBSA wait-times page notices ---------- */

export type WaitNotice = { title: string; body: string; until: string | null };

/**
 * Notices published on the CBSA wait-times page (menu-eng.html / menu-fra.html): the live
 * `<section class="alert …">` blocks, never the commented-out templates. A notice whose last
 * `<time datetime>` is before `today` (YYYY-MM-DD) has ended and is dropped, even if the page still shows it.
 */
export function parseWaitNotices(html: string, today: string): WaitNotice[] {
  const live = html.replace(/<!--[\s\S]*?-->/g, '');
  const out: WaitNotice[] = [];
  for (const m of live.matchAll(/<section\b[^>]*class="[^"]*\balert\b[^"]*"[^>]*>([\s\S]*?)<\/section>/gi)) {
    const inner = m[1];
    const tidy = (s: string) => textOf(s).replace(/'/g, '’');
    const title = tidy(inner.match(/<h[2-5]\b[^>]*>([\s\S]*?)<\/h[2-5]>/i)?.[1] ?? '');
    const body = tidy(inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
    if (!title || title.length < 8) continue;
    const dates = [...inner.matchAll(/datetime="(\d{4}-\d{2}-\d{2})/g)].map((d) => d[1]).sort();
    const until = dates.at(-1) ?? null;
    if (until && until < today) continue;
    out.push({ title, body, until });
  }
  return out.slice(0, 4);
}
