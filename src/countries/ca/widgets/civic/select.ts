/**
 * Small pure helpers the renderers share with the server builders (client-safe: no tables, no parsers).
 * Everything heavier lives in build/ (pure, server + fixtures) and live/ (server only).
 */
import { POSTAL_PROVINCE, type Lang } from './data';
import type { Mp, VoterInput, VoterVerdict } from './types';

/** The widget's content language for a UI locale (official pages exist in English and French). */
export const langOf = (locale: string): Lang => (locale === 'fr' ? 'fr' : 'en');

/* ───────────────────────── Postal codes ───────────────────────── */

// Canadian postal codes never use D, F, I, O, Q or U; W and Z never start one.
const POSTAL = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?-?(\d[ABCEGHJ-NPRSTV-Z]\d)$/;

/** "k1a0b1", "K1A 0B1", "k1a-0b1" → { code: "K1A0B1", display: "K1A 0B1" }, or null when not a valid code. */
export function normalizePostal(input: string | undefined | null): { code: string; display: string; province?: string } | null {
  if (!input) return null;
  const m = input.trim().toUpperCase().replace(/\s+/g, ' ').match(POSTAL);
  if (!m) return null;
  return { code: `${m[1]}${m[2]}`, display: `${m[1]} ${m[2]}`, province: POSTAL_PROVINCE[m[1][0]] };
}

/** Finds a postal code anywhere in free text ("my postal code is k1a 0b1"). */
export function findPostal(text: string): string | undefined {
  const m = text.toUpperCase().match(/\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?-?(\d[ABCEGHJ-NPRSTV-Z]\d)\b/);
  return m ? `${m[1]} ${m[2]}` : undefined;
}

/** Looks like the person tried to give a postal code (so "invalid" beats "ask"). */
export const looksLikePostal = (s: string) => /^[A-Za-z]\d[A-Za-z]/.test(s.trim()) || /\d[A-Za-z]\d$/.test(s.trim());

/* ───────────────────────── MP profile ───────────────────────── */

/** For gendered French copy ("Votre députée"): 'n' (neutral wording) when the profile didn't say. */
export const genderOf = (mp: Pick<Mp, 'feminine'>): 'f' | 'm' | 'n' => (mp.feminine == null ? 'n' : mp.feminine ? 'f' : 'm');

/** "English / French" or "Anglais / Français" (House of Commons "Preferred Language") → language codes. */
export function preferredLangs(value?: string): Lang[] {
  if (!value) return [];
  const out: Lang[] = [];
  for (const part of value.split(/[\/,]|\bet\b|\band\b/i)) {
    const w = part.trim().toLowerCase();
    if (/^(english|anglais)$/.test(w) && !out.includes('en')) out.push('en');
    if (/^(french|fran[cç]ais)$/.test(w) && !out.includes('fr')) out.push('fr');
  }
  return out;
}

/* ───────────────────────── Voter check ───────────────────────── */

export function voterVerdict({ age, citizen, livesAbroad }: Pick<VoterInput, 'age' | 'citizen' | 'livesAbroad'>): VoterVerdict {
  if (citizen === false) return 'not-citizen';
  // The Register of Future Electors is only for citizens aged 14 to 17 who live in Canada.
  if (age != null && age < 18) return livesAbroad ? 'future-abroad' : age < 14 ? 'too-young' : 'future-elector';
  if (citizen !== true || age == null) return 'unknown';
  return livesAbroad ? 'abroad' : 'eligible';
}
