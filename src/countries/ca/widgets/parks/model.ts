/**
 * Pure, isomorphic computation and output types for the `parks` widget: name matching, distances and
 * fire-danger labels. Used by the renderers and the tools. The Discovery Pass calculator is in pass-model.ts,
 * ranking in rank.ts, bulletin parsing in bulletins.ts (server and fixtures only); the network is in live.ts.
 */
import {
  PARKS,
  PROVINCE_NAMES,
  RESERVATION,
  type Admission,
  type Designation,
  type Landscape,
  type Lang,
  type Park,
  type Province,
} from './data';
import type { ParkSource } from './urls';

/* ------------------------------------------------------------------ text */

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯᵁᵘ]/g, '')
    .replace(/[’'`.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const STOP = /\b(national|park|parks|reserve|parc|parcs|nationaux|national|reserve de|de|du|des|la|le|les|l|the|and|et|of|in|au|a|np|canada)\b/g;
const core = (s: string) => fold(s).replace(STOP, ' ').replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------------ geo */

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ------------------------------------------------------------------ parks */

export type ParkLite = {
  id: string;
  name: string;
  short: string;
  prov: Province;
  lat: number;
  lng: number;
  des: Designation;
  land: Landscape[];
  admission: Admission;
  camping: boolean;
  otentik: boolean;
  /** Straight-line distance from the origin, when one was given. */
  km?: number;
  url: string;
};

/** Best park for a free-text name ("Lake Louise", "parc de la Mauricie", "Keji"), or null. */
export function matchPark(query: string | undefined | null): Park | null {
  if (!query) return null;
  const q = fold(query);
  const qc = core(query);
  if (!q) return null;
  let best: { p: Park; score: number } | null = null;
  for (const p of PARKS) {
    const names = [p.id, p.short.en, p.short.fr, p.name.en, p.name.fr].map(fold);
    const cores = [p.short.en, p.short.fr, p.name.en, p.name.fr].map(core).filter(Boolean);
    let score = 0;
    if (names.includes(q) || (qc && cores.includes(qc))) score = 100;
    else if (qc && cores.some((c) => c.length >= 4 && (` ${qc} `.includes(` ${c} `) || c === qc))) score = 80;
    else if (p.aka?.some((a) => ` ${q} `.includes(` ${fold(a)} `))) score = 70;
    else if (qc.length >= 4 && cores.some((c) => c.startsWith(qc))) score = 50;
    if (score && (!best || score > best.score || (score === best.score && core(p.short.en).length > core(best.p.short.en).length))) best = { p, score };
  }
  return best?.p ?? null;
}

/** A province named in free text ("parks in Alberta", "en Colombie-Britannique"). */
export function matchProvince(text: string | undefined | null): Province | undefined {
  if (!text) return undefined;
  const q = ` ${fold(text)} `;
  for (const [prov, names] of Object.entries(PROVINCE_NAMES) as [Province, string[]][]) {
    if (names.some((n) => q.includes(` ${fold(n)} `))) return prov;
  }
  return undefined;
}

export type Filters = { province?: Province; landscape?: Landscape; camping?: boolean };
export type Origin = { label: string; lat: number; lng: number };

/* ------------------------------------------------------------------ fire + bulletins */

export type Danger = 0 | 1 | 2 | 3 | 4;
export const DANGER_KEYS = ['low', 'moderate', 'high', 'veryHigh', 'extreme'] as const;
export const dangerKey = (d: Danger | null | undefined) => (d == null ? 'none' : DANGER_KEYS[d]);
export const dangerTone = (d: Danger | null | undefined): 'ok' | 'info' | 'warn' | 'danger' | 'neutral' =>
  d == null ? 'neutral' : d <= 1 ? 'ok' : d === 2 ? 'warn' : 'danger';

export type FireStatus = {
  /** Fire danger class at the park (0 Low … 4 Extreme), or null outside the rated area / no data. */
  danger: Danger | null;
  hotspots: { count: number; nearestKm: number | null } | null;
  perimeters: { count: number; nearestKm: number | null; lastSeen: string | null } | null;
  radiusKm: number;
  perimeterRadiusKm: number;
};

export type BulletinKind = 'fireBan' | 'fire' | 'closure' | 'wildlife' | 'restricted' | 'info';
export type Bulletin = { title: string; date: string | null; url: string; kind: BulletinKind };

export type NationalRow = { id: string; danger: Danger | null; hotspots: number };

export type ConditionsOutput = {
  version: 1;
  lang: Lang;
  scope: 'park' | 'national';
  fetchedAt: string;
  park: ParkLite | null;
  fire: FireStatus | null;
  fireLive: boolean;
  bulletins: Bulletin[];
  bulletinsTotal: number;
  bulletinsLive: boolean;
  bulletinsUrl: string;
  fireBan: Bulletin | null;
  national: NationalRow[] | null;
  /** The park name the person asked about when it didn't match any park. */
  unknown?: string;
  sources: ParkSource[];
};

/* ------------------------------------------------------------------ finder + camping */

/** A park's place in a ranking: its id and, with a starting point, the straight-line distance in km. */
export type Ranked = { id: string; km?: number };

export type FinderOutput = {
  version: 1;
  lang: Lang;
  filters: Filters;
  origin: Origin | null;
  /** A place the person named that couldn't be located. */
  originUnknown?: string;
  matchedId: string | null;
  /** Park name that didn't match anything. */
  unknown?: string;
  /** The first parks that match the filters (the named park first), for the answer's text. */
  results: ParkLite[];
  total: number;
  /**
   * Every park in ranked order (nearest first from the place, or from the named park; otherwise west to east),
   * so the card filters by landscape, camping and province without ranking anything itself. Answers saved
   * before this field existed don't have it; the card then falls back to `results`.
   */
  order?: Ranked[];
  conditions: ConditionsOutput | null;
  sources: ParkSource[];
};

export type CampingOutput = {
  version: 1;
  lang: Lang;
  today: string;
  /**
   * `campgrounds`: reservable campgrounds, named in the answer's language. `firstCome`: campgrounds that can't
   * be reserved. `launch2026`: when most sites opened; `launchEarly`: a few sites that opened sooner.
   */
  park: (ParkLite & { campgrounds: string[]; firstCome?: string[]; backcountry: boolean; launch2026: string | null; launchEarly?: { date: string; what: string } }) | null;
  /** Parks with reservable campgrounds (when no park was named, or it has none), nearest first from the place or that park. */
  options: ParkLite[];
  unknown?: string;
  reservation: typeof RESERVATION;
  sources: ParkSource[];
};
