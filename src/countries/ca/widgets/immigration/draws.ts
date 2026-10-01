/** Express Entry rounds of invitations: shapes + helpers (isomorphic). Data: live feed or snapshot.ts. */

export type DrawKind =
  | 'cec' | 'pnp' | 'fsw' | 'fst' | 'general' | 'french' | 'healthcare' | 'trades' | 'stem' | 'education'
  | 'transport' | 'agriculture' | 'managers' | 'physicians' | 'military' | 'other';

export type Draw = {
  number: number;
  date: string;
  /** Official round name in the answer's language (as published). */
  name: string;
  /** Official names in both languages, so the widget can follow the reader's language, not the tool's. */
  names?: { en: string; fr: string };
  kind: DrawKind;
  size: number;
  crs: number;
};

export type PoolDistribution = { asOf: string; bands: number[]; total: number };

export type DrawsData = { draws: Draw[]; pool: PoolDistribution | null; live: boolean };

/** Round type from its official English name. */
export function drawKind(nameEn: string): DrawKind {
  const n = nameEn.toLowerCase();
  if (/canadian experience/.test(n)) return 'cec';
  if (/provincial nominee/.test(n)) return 'pnp';
  if (/federal skilled worker/.test(n)) return 'fsw';
  if (/federal skilled trades/.test(n)) return 'fst';
  if (/no program specified|general/.test(n)) return 'general';
  if (/french/.test(n)) return 'french';
  if (/physician/.test(n)) return 'physicians';
  if (/health/.test(n)) return 'healthcare';
  if (/trade/.test(n)) return 'trades';
  if (/stem|science|technology/.test(n)) return 'stem';
  if (/education/.test(n)) return 'education';
  if (/transport/.test(n)) return 'transport';
  if (/agricultur/.test(n)) return 'agriculture';
  if (/manager/.test(n)) return 'managers';
  if (/military/.test(n)) return 'military';
  return 'other';
}

/** "Healthcare and Social Services Occupations, 2026-Version 3" → "Healthcare and Social Services Occupations". */
export const cleanDrawName = (name: string) =>
  name
    .replace(/\s*[,(]?\s*(\d{4}\s*-\s*)?version\s*\d+\)?\s*$/i, '')
    .replace(/\s+\d{4}\s*$/, '')
    .trim();

/** Round types with a stable official name, localized from `messages` (round.*) instead of the feed. */
export const NAMED_KINDS: DrawKind[] = ['cec', 'pnp', 'fsw', 'fst', 'general', 'french'];

/** Parses "September 27, 2026" (English feed dates) to ISO. */
export function isoFromLongDate(s: string | undefined): string | null {
  if (!s) return null;
  const d = new Date(`${s.replace(/\s+at\s.*$/, '')} 12:00 UTC`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
