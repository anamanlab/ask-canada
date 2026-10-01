/**
 * What an Express Entry score means: the changes that would raise it, where it sits in the pool, and the round of
 * invitations it can fairly be compared with. Pure and isomorphic, built on the score and program checks in crs.ts.
 */
import { crsScore, normalizeProfile, programs, type Profile, type ProgramId } from './crs';
import { EDUCATION, POOL_BANDS } from './data';
import type { Draw, DrawKind } from './draws';

/** Changes a person could realistically make, and what each would add. Sorted by gain, top 4. */
export type Boost = { key: 'clb' | 'french' | 'canadianWork' | 'education' | 'nomination' | 'spouseClb'; gain: number; to?: number | string; patch: Partial<Profile> };

export function boosts(input: Partial<Profile>): Boost[] {
  const p = normalizeProfile(input);
  const base = crsScore(p).total;
  const out: Boost[] = [];
  const tryIt = (key: Boost['key'], patch: Partial<Profile>, to?: number | string) => {
    const gain = crsScore({ ...p, ...patch }).total - base;
    if (gain > 0) out.push({ key, gain, patch, ...(to !== undefined ? { to } : {}) });
  };
  if (p.firstClb < 10) {
    const next = p.firstClb < 7 ? 7 : p.firstClb < 9 ? 9 : 10;
    tryIt('clb', { firstClb: next }, next);
  }
  if (p.firstLanguage === 'en' && p.secondClb < 7) tryIt('french', { secondClb: 7 }, 7);
  if (p.canadianWork < 5) tryIt('canadianWork', { canadianWork: p.canadianWork + 1 }, p.canadianWork + 1);
  const i = EDUCATION.indexOf(p.education);
  if (p.education === 'bachelors' || p.education === 'two-year' || p.education === 'one-year') tryIt('education', { education: 'two-or-more' }, 'two-or-more');
  else if (p.education === 'two-or-more') tryIt('education', { education: 'masters' }, 'masters');
  else if (i < EDUCATION.indexOf('one-year')) tryIt('education', { education: 'one-year' }, 'one-year');
  if (p.spouse && p.spouseClb < 7) tryIt('spouseClb', { spouseClb: 7 }, 7);
  if (!p.nomination) tryIt('nomination', { nomination: true });
  return out.sort((a, b) => (a.key === 'nomination' ? 1 : b.key === 'nomination' ? -1 : b.gain - a.gain)).slice(0, 4);
}

/* ─────────────── Pool rank ─────────────── */

/**
 * Share of the Express Entry pool with a lower score (0–1), from the official distribution. Inside a band,
 * candidates are assumed to be spread evenly, so the result is an approximation ("about").
 */
export function poolShareBelow(score: number, bands: number[]): number | null {
  const total = bands.reduce((a, b) => a + b, 0);
  if (!total || bands.length !== POOL_BANDS.length) return null;
  let below = 0;
  POOL_BANDS.forEach(([lo, hi], i) => {
    if (score > hi) below += bands[i];
    else if (score >= lo) below += (bands[i] * (score - lo)) / (hi - lo + 1);
  });
  return Math.max(0, Math.min(1, below / total));
}

/* ─────────────── The round a profile is compared with ─────────────── */

/**
 * Round types a profile could plausibly have been invited in, most specific first. A round is only a fair
 * comparison when the person could have been in it:
 *  - provincial nominee rounds need a nomination;
 *  - Canadian Experience Class rounds need the CEC minimums (a year of skilled work in Canada, language);
 *  - general, FSW and FST rounds need the matching program's minimums;
 *  - French-language rounds need NCLC 7+ in French and eligibility for any Express Entry program.
 * Occupation-based category rounds (health, trades, STEM…) depend on work history we don't ask about: never used.
 */
function plausibleKinds(input: Partial<Profile>): DrawKind[] {
  const p = normalizeProfile(input);
  const res = programs(p);
  const ok = (id: ProgramId) => res.find((r) => r.id === id)!.eligible;
  const any = res.some((r) => r.eligible);
  const frenchClb = p.firstLanguage === 'fr' ? p.firstClb : p.secondClb;
  const kinds: DrawKind[] = [];
  if (p.nomination) kinds.push('pnp');
  if (ok('cec')) kinds.push('cec');
  if (any) kinds.push('general');
  if (ok('fsw')) kinds.push('fsw');
  if (ok('fst')) kinds.push('fst');
  if (any && frenchClb >= 7) kinds.push('french');
  return kinds;
}

/**
 * The round a score is measured against: among the recent rounds the profile could have been in, the most
 * specific type (see `plausibleKinds`), latest first. `null` when none of them was open to this profile, so the
 * widget and the answer say so instead of comparing with a round the person could never be invited in.
 */
export function referenceDraw(draws: Draw[], input: Partial<Profile>): Draw | null {
  const kinds = plausibleKinds(input);
  for (const k of kinds) {
    const d = draws.find((x) => x.kind === k);
    if (d) return d;
  }
  return null;
}

/** Whether the profile meets the minimums of at least one Express Entry program (else no round applies at all). */
export const inAnyProgram = (input: Partial<Profile>) => programs(input).some((r) => r.eligible);
