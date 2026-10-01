/**
 * Pure search helpers for the office finder (isomorphic): postal codes, distances, need filters,
 * the candidate pool and the map view. The office list is passed in (the tool uses the full dataset,
 * fixtures a small sample), so this module never pulls the dataset into the client bundle.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { officeSources } from './data';
import type { FinderOutput, Lang, Need, Office, Origin, PassportTier, ResultOffice } from './types';

/** First three characters of a Canadian postal code (FSA), if the text contains one. */
export function fsaOf(text: string): string | null {
  const m = text.toUpperCase().match(/\b([ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ])(?:[ -]?\d[ABCEGHJKLMNPRSTVWXYZ]\d)?\b/);
  return m ? m[1] : null;
}

/** Province/territory for an FSA's first letter (X is shared by NT and NU). */
export const PROV_BY_LETTER: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC', X: 'NT', Y: 'YT',
};

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const TIER_OF: Partial<Record<Need, PassportTier>> = { 'passport-urgent': 'urgent', 'passport-express': 'express' };

/** Does an office meet a need? */
export function meets(o: Office, need: Need): boolean {
  switch (need) {
    case 'any':
      // Passport-only offices don't offer the other programs.
      return o.kind !== 'passport';
    case 'passport':
      return Boolean(o.pp?.length);
    case 'biometrics':
      return Boolean(o.bio);
    default: {
      const tier = TIER_OF[need];
      return Boolean(tier && o.pp?.includes(tier));
    }
  }
}

/** The filter chips the finder offers, in order. */
export const NEEDS: Need[] = ['any', 'passport', 'passport-urgent', 'passport-express', 'biometrics'];
/** Needs served by passport and biometrics locations (booking handoff, passport finder link). */
export const PASSPORTISH: Need[] = ['passport', 'passport-urgent', 'passport-express', 'biometrics'];

const LIMIT: Record<Need, number> = { any: 6, passport: 6, 'passport-urgent': 4, 'passport-express': 4, biometrics: 5 };

/**
 * Nearest offices for one need. Scheduled outreach sites only make the list when they are closer than
 * the nearest staffed centre (they open a few days a month), and at most two of them.
 */
export function nearest(all: ResultOffice[], need: Need, limit = LIMIT[need]): ResultOffice[] {
  const pool = all.filter((o) => meets(o, need)).sort((a, b) => a.km - b.km);
  const firstCentre = pool.find((o) => o.kind !== 'outreach');
  const out: ResultOffice[] = [];
  let outreach = 0;
  for (const o of pool) {
    if (out.length >= limit) break;
    if (o.kind === 'outreach') {
      if (!firstCentre || o.km >= firstCentre.km || outreach >= 2) continue;
      outreach++;
    }
    out.push(o);
  }
  return out;
}

/** True passport offices: urgent, express and pick-up counters (a Service Canada Centre only mails the passport). */
export const isPassportOffice = (o: Pick<Office, 'kind'>) => o.kind === 'passport' || o.kind === 'scc-passport';

/** A passport office this much farther than the closest place to apply is still the better first answer. */
const FOCUS_EXTRA_KM = 10;

/**
 * For "passport" searches: the nearest true passport office, when it isn't already the closest result and
 * is either what the person asked for (`asked`) or within a short extra trip. The finder opens it first.
 */
export function passportFocus(all: ResultOffice[], need: Need, asked = false): ResultOffice | undefined {
  if (need !== 'passport') return undefined;
  const pool = all.filter((o) => meets(o, need)).sort((a, b) => a.km - b.km);
  const top = pool.find((o) => o.kind !== 'outreach') ?? pool[0];
  const po = pool.find(isPassportOffice);
  if (!po || !top || po.id === top.id) return undefined;
  return asked || po.km - top.km <= FOCUS_EXTRA_KM ? po : undefined;
}

/** The finder's rows for a need: the nearest offices, always including the focused office (last, if far). */
export function listFor(all: ResultOffice[], need: Need, focusId?: string | null): ResultOffice[] {
  const list = nearest(all, need);
  if (!focusId || list.some((o) => o.id === focusId)) return list;
  const focus = all.find((o) => o.id === focusId && meets(o, need));
  return focus ? [...list.slice(0, LIMIT[need] - 1), focus] : list;
}

/**
 * The office to open first: the focused one, else the nearest that is operating (no posted closure, visits
 * scheduled), else simply the nearest. A closed building is never the default destination.
 */
export function defaultOffice<T extends { id: string }>(list: T[], operating: (o: T) => boolean, focusId?: string | null): T | undefined {
  const focus = focusId ? list.find((o) => o.id === focusId) : undefined;
  if (focus && operating(focus)) return focus;
  return list.find(operating) ?? list[0];
}

/** Distances from the origin + the union of every chip's nearest list (nearest first). */
export function candidatePool(offices: Office[], origin: Pick<Origin, 'lat' | 'lng'>): ResultOffice[] {
  const withKm = offices.map((o) => ({ ...o, km: Math.round(km(origin, o) * 10) / 10 }));
  // Pre-sort once; each need only looks at the closest few hundred.
  withKm.sort((a, b) => a.km - b.km);
  const near = withKm.slice(0, 160);
  const ids = new Set<string>();
  for (const n of NEEDS) for (const o of nearest(near.some((x) => meets(x, n)) ? near : withKm, n)) ids.add(o.id);
  // The nearest true passport office is always a candidate (it may be the focus of a "passport office" search).
  const po = withKm.find(isPassportOffice);
  if (po) ids.add(po.id);
  return withKm.filter((o) => ids.has(o.id));
}

/**
 * The official pages behind a finder result, in `lang`: the finder page for the need, the office opened first
 * (when its status is live), then booking and call-back. The tool sends them with its output; the widget
 * derives the same list in the language on screen.
 */
export function finderSources(out: Pick<FinderOutput, 'need' | 'offices' | 'focusId'>, lang: Lang): ToolSource[] {
  const shown = listFor(out.offices, out.need, out.focusId);
  const top = shown.find((o) => o.id === out.focusId) ?? shown[0];
  return officeSources(lang, { kind: PASSPORTISH.includes(out.need) ? 'passport' : 'general', live: Boolean(top?.live), officeId: top?.id, officeName: top?.name[lang] });
}

/** A search string reduced for loose matching of place names ("Trois-Rivières" ~ "trois rivieres"). */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
