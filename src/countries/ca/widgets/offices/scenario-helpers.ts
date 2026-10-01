/**
 * Parsing and wording helpers for the offices scenarios (server-safe, no React): the place, coordinates and
 * need a message names, times and distances as the answer words them, and the office an answer names (the
 * same lookup the widget runs: first 3 characters of a postal code, official office list, live ESDC status).
 */
import { isOperating, officeStatus, type OfficeStatus } from './hours';
import { findOffices } from './live';
import { defaultOffice, fsaOf, isPassportOffice, listFor } from './search';
import type { AppointmentFocus, Need, ResultOffice } from './types';

export type Ctx = { text: string; lang: 'en' | 'fr' };
export type L = 'en' | 'fr';

export const NB = ' ';
/** A hyphen the heading never breaks after ("pick-up", not "pick- / up"): hyphen + word joiner. */
export const NBH = '-\u2060';
const POSTAL = /\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])(?:[ -]?(\d[ABCEGHJ-NPRSTV-Z]\d))?\b/i;
const NOT_PLACES = /^(canada|service canada|person|personne|me|moi|mon|ma|my|the|le|la)$/i;
/** "(45.42, -75.70)": a location the person shared through the widget (already rounded to about 1 km). */
const COORDS = /\((-?\d{1,2}\.\d{1,4}),\s*(-?\d{1,3}\.\d{1,4})\)/;

/**
 * Unicode-aware version of a pattern: JavaScript's `\b` and `\w` only know ASCII letters, so `\boù\b` or
 * `fermé\b` never match before a space. Every pattern below goes through this, so accented French words get
 * real word boundaries.
 */
const WORD = '[\\p{L}\\p{N}_]';
const BOUNDARY = `(?:(?<!${WORD})(?=${WORD})|(?<=${WORD})(?!${WORD}))`;
export const u = (re: RegExp) => new RegExp(re.source.replace(/\\b/g, BOUNDARY).replace(/\\w/g, WORD), 'iu');

/** The postal code or place the person named ("near Moncton", "à Trois-Rivières", "K1A 0B1"), if any. */
export function placeOf(text: string): string | undefined {
  const m = text.match(POSTAL);
  if (m && /\d/.test(m[1])) return `${m[1]}${m[2] ? ` ${m[2]}` : ''}`.toUpperCase();
  const p = text.match(
    /(?:^|[\s,(])(?:near|in|around|close to|by|à|au|près de|proche de|dans)\s+((?:\p{Lu}[\p{L}'’.-]*)(?:[\s-](?:\p{Lu}[\p{L}'’.-]*|de|du|des|la|le|sur|sous))*(?:,\s*[A-Z]{2}\b)?)/u,
  );
  const place = p?.[1]?.replace(/[\s-]+(de|du|des|la|le|sur|sous)$/i, '').trim();
  return place && !NOT_PLACES.test(place) ? place : undefined;
}

/** Shared coordinates in the message, if valid for Canada. */
function coordsOf(text: string): { latitude: number; longitude: number } | undefined {
  const m = text.match(COORDS);
  if (!m) return undefined;
  const latitude = Number(m[1]);
  const longitude = Number(m[2]);
  return latitude >= 41 && latitude <= 84 && longitude >= -142 && longitude <= -52 ? { latitude, longitude } : undefined;
}

/** What to show the person: postal codes are reduced to their first 3 characters. */
const shown = (place: string) => fsaOf(place) ?? place;

/** The person named a passport office (not just "somewhere to apply"). */
const ASKED_OFFICE = /\bpassport offices?\b|\bbureaux? des passeports\b/i;

export function passportNeed(text: string): Need {
  if (/\b(urgent|urgence|rush|tomorrow|demain|next business day|jour ouvrable suivant)\b/i.test(text)) return 'passport-urgent';
  if (/\bexpress\b/i.test(text)) return 'passport-express';
  return 'passport';
}

export function focusOf(text: string): AppointmentFocus {
  if (/\bbiom[eé]tri/i.test(text)) return 'biometrics';
  if (/\bpasse?port\b/i.test(text)) return 'passport';
  return 'other';
}

export const finder =
  (need: Need | ((text: string) => Need)) =>
  ({ text, lang }: Ctx) => {
    const n = typeof need === 'function' ? need(text) : need;
    const c = coordsOf(text);
    const passportOffice = n === 'passport' && ASKED_OFFICE.test(text) ? true : undefined;
    return c ? { ...c, need: n, passportOffice, lang } : { location: placeOf(text), need: n, passportOffice, lang };
  };

export const EXCLUDE_ABROAD = u(/\b(abroad|outside (of )?canada|overseas|embassy|consulate|à l[’']étranger|hors du canada|ambassade|consulat|lost|stolen|perdu|volé)\b/i);

const KIND_WORD = {
  passport: { en: 'passport office', fr: 'le bureau des passeports' },
  'scc-passport': { en: 'Service Canada Centre', fr: 'le Centre Service Canada' },
  scc: { en: 'Service Canada Centre', fr: 'le Centre Service Canada' },
  outreach: { en: 'outreach site', fr: 'le site de services mobiles réguliers' },
} as const;

/* ---------- Time and wording helpers (French times never break: "8 h 30") ---------- */

export const clock = (hhmm: string, lang: L) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { hour: 'numeric', minute: m ? '2-digit' : undefined, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2026, 0, 1, h, m)))
    .replace(/[\s ]/g, NB);
};
export const weekdayName = (iso: string, lang: L) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

export function whenText(next: NonNullable<OfficeStatus['next']>, lang: L) {
  const time = clock(next.time, lang);
  if (lang === 'fr') return next.inDays === 0 ? `aujourd’hui à ${time}` : next.inDays === 1 ? `demain à ${time}` : `${weekdayName(next.date, lang)} à ${time}`;
  return next.inDays === 0 ? `today at ${time}` : next.inDays === 1 ? `tomorrow at ${time}` : `${weekdayName(next.date, lang)} at ${time}`;
}

const kmText = (km: number, lang: L) =>
  `${new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', km < 100 ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(km)}${NB}km`;

/** Ends a sentence once ("… 4 p.m." already ends with a period). */
export const end = (x: string) => (/\.$/.test(x) ? x : `${x}.`);

/** "It's open now until 4 p.m." / "It's closed today for … and reopens tomorrow at 8:30 a.m." */
function statusSentence(s: OfficeStatus, lang: L): string {
  const fr = lang === 'fr';
  const when = s.next ? whenText(s.next, lang) : '';
  switch (s.state) {
    case 'open':
    case 'closing-soon':
      return fr ? `Il est ouvert en ce moment, jusqu’à ${clock(s.until ?? '16:00', lang)}.` : end(`It’s open now until ${clock(s.until ?? '16:00', lang)}`);
    case 'lunch':
      return fr ? `Il est fermé pour le dîner jusqu’à ${clock(s.until ?? '13:00', lang)}.` : end(`It’s closed for lunch until ${clock(s.until ?? '13:00', lang)}`);
    case 'holiday':
      return fr
        ? `Il est fermé aujourd’hui pour un jour férié (${s.holiday?.name.fr}), comme tous les bureaux de Service Canada, et rouvre ${when}, heure locale.`
        : `It’s closed today for a public holiday (${s.holiday?.name.en}), like every Service Canada office, and reopens ${when} local time.`;
    case 'temp-closed':
      return fr ? 'Il est temporairement fermé : consultez la page du bureau avant de vous déplacer.' : 'It’s temporarily closed, so check the office page before you go.';
    case 'no-schedule':
      return '';
    default:
      return fr ? `Il est fermé en ce moment et ouvre ${when}, heure locale.` : `It’s closed now and opens ${when} local time.`;
  }
}

/** "the *Toronto* passport office" (+ " at 74 Victoria Street") / "le bureau des passeports *Toronto*". */
export function describe(n: Nearest, lang: L, mark: '*' | '**', opts: { kind?: boolean; street?: boolean } = {}) {
  const { kind = true, street = false } = opts;
  const name = `${mark}${n.name}${mark}`;
  const at = street && n.street ? (lang === 'fr' ? `, au ${n.street}` : ` at ${n.street}`) : '';
  if (lang === 'fr') return `${kind ? `${n.kind} ` : ''}${name}${at}`;
  return `${kind ? `the ${name} ${n.kind}` : name}${at}`;
}

/** ", 2.1 km away" / ", à 2,1 km"; nothing when the location is only approximate (offline fallback). */
export const dist = (n: Nearest, lang: L) => (n.approx ? '' : lang === 'fr' ? `, à ${n.km}` : `, ${n.km} away`);

type Other = { name: string; km: string };
export type Nearest = {
  name: string;
  kind: string;
  street: string;
  km: string;
  approx: boolean;
  status: string;
  state: OfficeStatus['state'];
  /** The office's status right now (what `status` words), for answers that lead with it. */
  now: OfficeStatus;
  /** A true passport office (urgent, express and pick-up counters). */
  passportOffice: boolean;
  /** A nearer office under a posted temporary closure (so this one is named instead). */
  closed?: Other;
  /** Passport searches: a closer Service Canada Centre that also takes applications. */
  also?: Other & { mailOnly: boolean };
  /** Passport searches: the nearest true passport office, when the office named isn't one. */
  office?: Other;
};

const streetOf = (o: ResultOffice, lang: L) =>
  (o.lines[lang].find((l) => /^\d/.test(l)) ?? '')
    .replace(/,?\s*\(.*?\)/g, '')
    .split(/,\s*(?:suite|unit|bureau|floor|étage|local|pièce)(?![\p{L}])/iu)[0]
    .replace(/[,\s]+$/, '');

/**
 * The office the answer names for a need: the same one the widget opens first (the focused passport office,
 * else the nearest staffed office that is operating), or null if the place is unknown or the lookup is slow.
 */
export async function nearestFor(text: string, lang: L, need: Need): Promise<Nearest | null> {
  const coords = coordsOf(text);
  const location = coords ? undefined : placeOf(text);
  if (!coords && !location) return null;
  try {
    const out = await Promise.race([
      findOffices({ ...coords, location, need, passportOffice: need === 'passport' && ASKED_OFFICE.test(text), lang }),
      new Promise<null>((r) => setTimeout(() => r(null), 9000)),
    ]);
    if (!out || out.status !== 'ok') return null;
    const list = listFor(out.offices, need, out.focusId);
    const staffed = list.filter((o) => o.kind !== 'outreach');
    const base = staffed.length ? staffed : list;
    const now = new Date();
    // The live snapshot counts only while it is provably recent and dated today (see officeStatus).
    const statusOf = (o: ResultOffice) => officeStatus(o, now, o.live);
    const top = defaultOffice(base, (o) => isOperating(statusOf(o)), out.focusId);
    if (!top) return null;
    const s = statusOf(top);
    const other = (o: ResultOffice): Other => ({ name: o.short[lang], km: kmText(o.km, lang) });
    const first = base[0];
    const nearer = first.id !== top.id && first.km <= top.km ? first : undefined;
    const office = need === 'passport' && !isPassportOffice(top) ? out.offices.filter(isPassportOffice).sort((a, b) => a.km - b.km)[0] : undefined;
    return {
      name: top.short[lang],
      kind: KIND_WORD[top.kind][lang],
      street: streetOf(top, lang),
      km: kmText(top.km, lang),
      status: statusSentence(s, lang),
      state: s.state,
      now: s,
      approx: !out.geocoded && !coords,
      passportOffice: isPassportOffice(top),
      closed: nearer && statusOf(nearer).state === 'temp-closed' ? other(nearer) : undefined,
      also: nearer && isOperating(statusOf(nearer)) && !isPassportOffice(nearer) ? { ...other(nearer), mailOnly: nearer.pp?.join() === 'mail20' } : undefined,
      office: office ? other(office) : undefined,
    };
  } catch {
    return null;
  }
}

/** "The Arnprior centre, 1.0 km away, is temporarily closed. " (or nothing). */
export const closedNote = (n: Nearest, lang: L) =>
  !n.closed || n.approx
    ? ''
    : lang === 'fr'
      ? `Le centre **${n.closed.name}**, à ${n.closed.km}, est fermé temporairement. `
      : `The **${n.closed.name}** centre, ${n.closed.km} away, is temporarily closed. `;


export const where = (text: string, lang: L) => {
  if (coordsOf(text)) return lang === 'fr' ? 'de vous' : 'you';
  const p = placeOf(text);
  return p ? shown(p) : undefined;
};
