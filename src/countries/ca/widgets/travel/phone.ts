/**
 * Tap-to-call for the phone numbers in the Global Affairs Canada feed. Pure and isomorphic.
 *
 * The feed writes office numbers in many styles ("81 (3) 5412-6200", "011 (509) 2812-9000",
 * "+66 (0) 2646 4300", "(57-601) 657-9800", "06-6949-1605"). A `tel:` link must be E.164 ("+81354126200")
 * to work from a Canadian phone roaming abroad, so each number is normalised here, and a number we can't
 * normalise with confidence is shown as plain text (never a link that dials the wrong place).
 * Surveyed across all 230 destination feeds on 2026-09-30; see phone.test.mjs.
 */

/** ITU country calling codes (1 = North American Numbering Plan). */
const CODES = new Set(
  (
    '1 7 20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98 ' +
    '211 212 213 216 218 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 247 248 ' +
    '249 250 251 252 253 254 255 256 257 258 260 261 262 263 264 265 266 267 268 269 290 291 297 298 299 350 351 352 353 354 355 356 357 358 ' +
    '359 370 371 372 373 374 375 376 377 378 379 380 381 382 383 385 386 387 389 420 421 423 500 501 502 503 504 505 506 507 508 509 590 591 ' +
    '592 593 594 595 596 597 598 599 670 672 673 674 675 676 677 678 679 680 681 682 683 685 686 687 688 689 690 691 692 850 852 853 855 856 ' +
    '880 886 960 961 962 963 964 965 966 967 968 970 971 972 973 974 975 976 977 992 993 994 995 996 998'
  ).split(' '),
);

/** Calling code of each travel.gc.ca destination (ISO code as used by the feed). */
const BY_ISO: Record<string, string> = {
  AF: '93', AL: '355', DZ: '213', AD: '376', AO: '244', AQ: '', AR: '54', AM: '374', AW: '297', AU: '61', AT: '43', AZ: '994',
  'PT-20': '351', BH: '973', BD: '880', BY: '375', BE: '32', BZ: '501', BJ: '229', BT: '975', BO: '591', BQ: '599', BA: '387',
  BW: '267', BR: '55', BN: '673', BG: '359', BF: '226', BI: '257', CV: '238', KH: '855', CM: '237', IC: '34', CF: '236', TD: '235',
  CL: '56', CN: '86', CO: '57', KM: '269', CK: '682', CR: '506', CI: '225', HR: '385', CU: '53', CW: '599', CY: '357', CZ: '420',
  CD: '243', DK: '45', DJ: '253', EC: '593', EG: '20', SV: '503', GQ: '240', ER: '291', EE: '372', SZ: '268', ET: '251', FK: '500',
  FJ: '679', FI: '358', FR: '33', GF: '594', PF: '689', GA: '241', GM: '220', GE: '995', DE: '49', GH: '233', GI: '350', GR: '30',
  GL: '299', GP: '590', GT: '502', GN: '224', GW: '245', GY: '592', HT: '509', HN: '504', HK: '852', HU: '36', IS: '354', IN: '91',
  ID: '62', IR: '98', IQ: '964', IE: '353', IL: '972', IT: '39', JP: '81', JO: '962', KZ: '7', KE: '254', KI: '686', XK: '383',
  KW: '965', KG: '996', LA: '856', LV: '371', LB: '961', LS: '266', LR: '231', LY: '218', LI: '423', LT: '370', LU: '352', MO: '853',
  MG: '261', MW: '265', MY: '60', MV: '960', ML: '223', MT: '356', MH: '692', MQ: '596', MR: '222', MU: '230', YT: '262', MX: '52',
  FM: '691', MD: '373', MC: '377', MN: '976', ME: '382', MA: '212', MZ: '258', MM: '95', NA: '264', NR: '674', NP: '977', NL: '31',
  NC: '687', NZ: '64', NI: '505', NE: '227', NG: '234', NU: '683', KP: '850', MK: '389', NO: '47', OM: '968', PK: '92', PW: '680',
  PA: '507', PG: '675', PY: '595', PE: '51', PH: '63', PL: '48', PT: '351', QA: '974', CG: '242', RE: '262', RO: '40', RU: '7',
  RW: '250', BL: '590', MF: '590', PM: '508', WS: '685', SM: '378', ST: '239', SA: '966', SN: '221', RS: '381', SC: '248', SL: '232',
  SG: '65', SK: '421', SI: '386', SB: '677', SO: '252', ZA: '27', KR: '82', SS: '211', ES: '34', LK: '94', SD: '249', SR: '597',
  SE: '46', CH: '41', SY: '963', TW: '886', TJ: '992', TZ: '255', TH: '66', TL: '670', TG: '228', TK: '690', TO: '676', TN: '216',
  TR: '90', TM: '993', TV: '688', UG: '256', UA: '380', AE: '971', GB: '44', UY: '598', UZ: '998', VU: '678', VE: '58', VN: '84',
  YE: '967', ZM: '260', ZW: '263',
  // North American Numbering Plan
  AS: '1', AI: '1', AG: '1', BS: '1', BB: '1', BM: '1', VG: '1', KY: '1', DM: '1', DO: '1', GD: '1', GU: '1', JM: '1', MS: '1',
  MP: '1', PR: '1', KN: '1', LC: '1', VC: '1', SX: '1', TT: '1', TC: '1', US: '1', VI: '1',
};

/** Countries where the leading 0 is part of the number, not a trunk prefix (Italy, San Marino). */
const KEEPS_ZERO = new Set(['39', '378']);
/** Canada's Emergency Watch and Response Centre, sometimes printed without +1 in the feed. */
const EWRC_DIGITS = '6139968885';

export const callingCode = (iso?: string): string | undefined => (iso ? BY_ISO[iso.toUpperCase()] || undefined : undefined);

const digitsOf = (s: string) => s.replace(/\D/g, '');
const e164 = (d: string) => (d.length >= 8 && d.length <= 15 ? `tel:+${d}` : null);

/**
 * `tel:` href for one number as printed, or null when it can't be dialled with confidence.
 * - `iso`: the destination, whose calling code resolves national numbers ("06-…" in Japan → +81 6 …).
 * - `local`: the number is meant to be dialled inside the destination (toll-free lines like
 *   "001-800-514-0129", short emergency numbers): dial it exactly as printed.
 */
export function telHref(raw: string, opts: { iso?: string; local?: boolean } = {}): string | null {
  // Drop notes in parentheses ("(Cell)", "(+8 within Russia / en Russie)") and extensions.
  const s = raw
    .replace(/\([^)]*[A-Za-zÀ-ÿ][^)]*\)/g, ' ')
    .replace(/\s*(?:ext\.?|poste|x)\s*\d.*$/i, '')
    .replace(/[.;,]+\s*$/, '')
    .trim();
  if (!/^[+(\d][\d\s()+.-]*$/.test(s) || !/\d/.test(s)) return null;
  const all = digitsOf(s);
  if (!all) return null;
  // Emergency and short codes ("911", "112", "1669") are dialled as they are, wherever you are.
  if (all.length <= 5) return `tel:${all}`;
  if (opts.local) return s.startsWith('+') ? e164(all) : `tel:${all}`;
  if (all === EWRC_DIGITS) return `tel:+1${all}`;

  const cc = callingCode(opts.iso);

  // "+33 (0)1 44 43 29 02", "+66 0 5385 0147", "(+973) 1753 6270", "+ 355 (4) 225 7274"
  if (/^\(?\s*\+/.test(s)) {
    const body = s.replace(/^\(?\s*\+\s*/, '');
    const code = body.match(/^\d{1,3}/)?.[0] ?? '';
    const rest = body.slice(code.length).replace(/^\)?[\s-]*(?:\(0\)|0(?=[\s-]))[\s-]*/, ' ');
    return e164(digitsOf(code + rest));
  }
  // International access prefixes: "011 (509) 2812-9000" (dialled from North America), "00 44 …".
  const exit = s.match(/^(011|00)[\s-]*\(?(\d{1,3})\)?[\s-]/);
  if (exit && CODES.has(exit[2])) return e164(all.slice(exit[1].length));

  // "1-246-629-3550": North American number. ("1-592-…" in Guyana is its +592 number with a stray 1.)
  const nanp = s.match(/^1[\s.-]?\(?(\d{3})\)?[\s.-]?\d{3}[\s.-]?\d{4}$/);
  if (nanp) {
    if (cc && cc !== '1' && nanp[1] === cc) return e164(all.slice(1));
    return `tel:+${all}`;
  }

  // Leading group: "(57-601) 657-9800" → "57601"; "81 (3) 5412-6200" → "81".
  const paren = s.match(/^\(([\d\s-]+)\)/);
  const first = paren ? digitsOf(paren[1]) : (s.match(/^\d+/)?.[0] ?? '');
  const afterFirst = paren ? s.slice(paren[0].length) : s.slice(first.length);
  const codeAt = (d: string) => [3, 2, 1].map((n) => d.slice(0, n)).find((c) => CODES.has(c) && c !== '1');
  const dropTrunk = (d: string, code: string) => {
    // "213 (0) 770-083-000": the (0) after the country code is the national trunk prefix.
    const rest = afterFirst.replace(/^[\s-]*\(0\)/, '');
    return paren ? d : code + digitsOf(rest);
  };

  // National number in a North American destination: "(809) 262-3100" in the Dominican Republic.
  if (cc === '1' && all.length === 10 && /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(s)) return `tel:+1${all}`;

  if (first && !first.startsWith('0')) {
    const code = codeAt(first);
    const nextIsParen = /^[\s-]*\(/.test(afterFirst);
    // The destination's own code ("81 (3) 5412-6200" in Japan, "359-2-969-9710" in Bulgaria).
    if (cc && cc !== '1' && (first === cc || (paren && first.startsWith(cc)))) return e164(dropTrunk(all, cc));
    // Written without spaces: "260977133344" in Zambia.
    if (cc && cc !== '1' && !paren && first === all && all.startsWith(cc) && all.length >= 10) return e164(all);
    // Another country's code, written the international way: "(34) 91 382 8400", "92 (51) 208-6000".
    if (code && (paren || (first === code && nextIsParen)) && all.length >= 10) return e164(dropTrunk(all, code));
    return null;
  }

  // National number with trunk 0 in the destination: "06-6949-1605" (Japan), "(0)3-636-3300" (Israel).
  if (cc && cc !== '1' && cc !== '7' && /^\(?0\)?[\s-]?[1-9]/.test(s)) {
    const national = KEEPS_ZERO.has(cc) ? all : all.replace(/^0/, '');
    return e164(cc + national);
  }
  return null;
}

/**
 * International display form of a number we can dial: "81 (3) 5412-6200" → "+81 3 5412 6200",
 * "011 (509) 2812-9000" → "+509 2812 9000", "06-6949-1605" (Japan) → "+81 6 6949 1605". The printed digit
 * groups are kept where they line up with the national number; otherwise the national number is shown whole.
 * Null when the number isn't an international `tel:` (short codes, local-only lines, unparseable text).
 */
export function displayPhone(raw: string, href: string | null): string | null {
  if (!href?.startsWith('tel:+')) return null;
  const d = href.slice(5);
  const code = [3, 2, 1].map((n) => d.slice(0, n)).find((c) => CODES.has(c));
  if (!code) return null;
  const national = d.slice(code.length);
  if (national.length < 4) return null;
  const groups = raw
    .replace(/\([^)]*[A-Za-zÀ-ÿ][^)]*\)/g, ' ')
    .replace(/\s*(?:ext\.?|poste|x)\s*\d.*$/i, '')
    .match(/\d+/g) ?? [];
  const out: string[] = [];
  let need = national.length;
  while (need > 0 && groups.length) {
    const g = groups.pop()!;
    if (g.length <= need) {
      out.unshift(g);
      need -= g.length;
    } else {
      out.unshift(g.slice(g.length - need));
      need = 0;
    }
  }
  const tidy = need === 0 && out.join('') === national && out.every((g) => g.length > 0) ? out.join(' ') : national;
  return `+${code} ${tidy}`;
}

/**
 * Canada's own lines (the Emergency Watch and Response Centre's numbers) in the same international form as
 * every other number on the card: "+1-613-686-3658" → "+1 613 686 3658", "613-944-1310" → "+1 613 944 1310".
 * The official pages print them in several styles; the printed form stays in the link's tooltip.
 */
export function canadaPhone(printed: string): string {
  const d = digitsOf(printed);
  return displayPhone(printed, e164(d.length === 10 ? `1${d}` : d)) ?? printed;
}

export type PhonePart = { text: string; href: string | null; /** International form to show, when it differs from the printed text. */ display?: string };

/**
 * Splits a printed value into its numbers and the text between them, so each alternative can dial on its
 * own: "+52 81-2088-3200/3201" → [+52 81-2088-3200 ↗][/3201]. Joining the parts' text gives back the input.
 */
export function phoneParts(raw: string, opts: { iso?: string; local?: boolean } = {}): PhonePart[] {
  const parts: PhonePart[] = [];
  let depth = 0;
  let buf = '';
  const push = (text: string, sep = false) => {
    if (!text) return;
    const core = text.trim();
    if (sep || !core) return void parts.push({ text, href: null });
    const lead = text.slice(0, text.indexOf(core));
    const trail = text.slice(text.indexOf(core) + core.length);
    // A bare suffix after a full number ("…3200/3201", "…47 55 77 / 78") is another line on the same
    // exchange: shown, not dialled. Short emergency numbers ("112 or 999") still dial.
    const suffix = !opts.local && digitsOf(core).length <= 5 && parts.some((p) => /\d/.test(p.text));
    if (lead) parts.push({ text: lead, href: null });
    const href = suffix ? null : telHref(core, opts);
    const display = !opts.local ? displayPhone(core, href) : null;
    parts.push({ text: core, href, ...(display && display !== core ? { display } : {}) });
    if (trail) parts.push({ text: trail, href: null });
  };
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    const rest = raw.slice(i);
    const sep = depth === 0 ? rest.match(/^(\s*\/\s*|\s+(?:and|et|or|ou)\s+)/i) : null;
    if (sep) {
      push(buf);
      push(sep[0], true);
      buf = '';
      i += sep[0].length - 1;
      continue;
    }
    buf += ch;
  }
  push(buf);
  return parts;
}
