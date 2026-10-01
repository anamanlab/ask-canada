/**
 * Redactor for the free text the model passes along (summary, title, labels, actions, form code). Server
 * side, with the explainer. Removes SIN/card/passport numbers (core redactor) plus long reference, account,
 * client, access-code or phone-like tokens. Dates, money, form numbers and year ranges stay.
 */
import { redactPii } from '@/lib/pii';
import { FORMS } from './forms-catalogue';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const YEAR = /^(19|20)\d{2}$/;
const compact = (s: string) => s.replace(/[^a-z0-9]/gi, '').toUpperCase();

/** Form numbers in the verified catalogue ("INS5210", "ISP3550", "IMM5476"), without spaces or hyphens. */
const CATALOGUE_CODES = new Set(FORMS.map((f) => compact(f.code)));
/** The shape of a federal form number: a known series prefix, up to four digits, an optional suffix ("T2201", "RC4288", "IMM5476E", "T4A-OAS"). */
const FORM_CODE = /^(T|TD|TL|TX|NR|RC|RCH|INS|ISP|NAS|SC|EMP|IMM|CIT|PPTC|AUT|GST|PD)-?\d{1,4}[A-Z]{0,3}(-[A-Z]+)?$/i;

/** "2026-2027", "2026-27": a benefit or tax year range, not a reference number. */
function isYearRange(tok: string) {
  const m = /^((?:19|20)\d{2})-(\d{2}|(?:19|20)\d{2})$/.exec(tok);
  if (!m) return false;
  const from = Number(m[1]);
  const to = m[2].length === 2 ? Math.floor(from / 100) * 100 + Number(m[2]) : Number(m[2]);
  return to > from && to - from <= 10;
}

/** "2026-June", "mid-2026", "juillet-2026": hyphenated years and words, with at most one year's worth of digits each. */
const isYearsAndWords = (tok: string) => tok.includes('-') && tok.split('-').every((p) => YEAR.test(p) || /^[A-Za-z]+$/.test(p));

const isPublic = (tok: string) => ISO.test(tok) || YEAR.test(tok) || CATALOGUE_CODES.has(compact(tok)) || FORM_CODE.test(tok) || isYearRange(tok) || isYearsAndWords(tok);

export function scrub(text: string | undefined, max = 600): { text?: string; hit: boolean } {
  if (!text) return { text: undefined, hit: false };
  const core = redactPii(text);
  let hit = core.found.length > 0;
  const out = core.text
    .replace(/[A-Za-z0-9][A-Za-z0-9-]{6,}/g, (tok) => {
      const digits = (tok.match(/\d/g) ?? []).length;
      if (digits < 4 || isPublic(tok)) return tok;
      hit = true;
      return '•••';
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
  return { text: out || undefined, hit };
}
