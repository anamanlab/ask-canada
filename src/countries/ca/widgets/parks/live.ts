/**
 * Live Parks Canada and NRCan data for the `parks` tools (server only: imported by tools/parks.ts and the
 * scripted scenarios, never by the renderers). The requests themselves (timeouts, cache windows, validation)
 * are in upstream.ts; here every failure degrades to a shape the widget renders honestly (with the official
 * page as the fallback).
 */
import 'server-only';
import { todayInCanada } from '../../data/holidays';
import { classifyBulletin, parseBulletinDate, sortBulletins } from './bulletins';
import { HOTSPOT_RADIUS_KM, PARKS, type Landscape, type Lang, type Park, type Province } from './data';
import { URLS, parkUrls } from './urls';
import {
  distanceKm,
  matchPark,
  matchProvince,
  type Bulletin,
  type CampingOutput,
  type ConditionsOutput,
  type Danger,
  type FinderOutput,
  type FireStatus,
  type NationalRow,
  type Origin,
} from './model';
import type { PassesOutput } from './pass-model';
import { campingOutput, finderOutput, nationalConditionsOutput, parkConditionsOutput, passesOutput, type PassesInput } from './outputs';
import { geocode, num, page, wfs, type Features } from './upstream';

const PERIMETER_RADIUS_KM = 25;
const PERIMETER_ACTIVE_DAYS = 7;

/* ------------------------------------------------------------------ fire (CWFIS) */

type Point = { lat: number; lng: number };
const isDanger = (n: number): n is Danger => n === 0 || n === 1 || n === 2 || n === 3 || n === 4;

async function dangerAt(p: Point, signal?: AbortSignal): Promise<{ ok: boolean; danger: Danger | null }> {
  const features = await wfs('public:fdr_current_shp', `INTERSECTS(the_geom,SRID=4326;POINT(${p.lng.toFixed(4)} ${p.lat.toFixed(4)}))`, 'GRIDCODE', signal);
  if (!features) return { ok: false, danger: null };
  const codes = features.map((f) => num(f.properties?.GRIDCODE)).filter(isDanger);
  return { ok: true, danger: codes.length ? codes.reduce((a, b) => (b > a ? b : a)) : null };
}

/** The coordinates of the hotspot features that carry them. */
const hotspotPoints = (features: Features['features']): Point[] =>
  features.map((f) => ({ lat: num(f.properties?.lat), lng: num(f.properties?.lon) })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

async function hotspotsAround(p: Point, radiusKm: number, signal?: AbortSignal) {
  const dLat = radiusKm / 111 + 0.05;
  const dLng = radiusKm / (111 * Math.cos((p.lat * Math.PI) / 180)) + 0.05;
  const cql = `lat BETWEEN ${(p.lat - dLat).toFixed(3)} AND ${(p.lat + dLat).toFixed(3)} AND lon BETWEEN ${(p.lng - dLng).toFixed(3)} AND ${(p.lng + dLng).toFixed(3)}`;
  const features = await wfs('public:hotspots_last24hrs', cql, 'lat,lon', signal);
  if (!features) return null;
  const kms = hotspotPoints(features)
    .map((s) => distanceKm(p, s))
    .filter((d) => d <= radiusKm);
  return { count: kms.length, nearestKm: kms.length ? Math.round(Math.min(...kms)) : null };
}

async function perimetersAround(p: Point, radiusKm: number, today: string, signal?: AbortSignal) {
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - PERIMETER_ACTIVE_DAYS);
  const cql = `DWITHIN(geometry,SRID=4326;POINT(${p.lng.toFixed(4)} ${p.lat.toFixed(4)}),${radiusKm * 1000},meters) AND lastdate > '${since.toISOString().slice(0, 19)}Z'`;
  const features = await wfs('public:m3_polygons_current', cql, 'lastdate', signal);
  if (!features) return null;
  const last = features.flatMap((f) => (f.properties?.lastdate ? [f.properties.lastdate] : [])).sort().pop() ?? null;
  return { count: features.length, nearestKm: null, lastSeen: last ? last.slice(0, 10) : null };
}

export async function fireFor(p: Point, today: string, signal?: AbortSignal): Promise<{ live: boolean; fire: FireStatus | null }> {
  const [d, h, m] = await Promise.all([dangerAt(p, signal), hotspotsAround(p, HOTSPOT_RADIUS_KM, signal), perimetersAround(p, PERIMETER_RADIUS_KM, today, signal)]);
  if (!d.ok && !h && !m) return { live: false, fire: null };
  return { live: true, fire: { danger: d.danger, hotspots: h, perimeters: m, radiusKm: HOTSPOT_RADIUS_KM, perimeterRadiusKm: PERIMETER_RADIUS_KM } };
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

async function nationalFire(signal?: AbortSignal): Promise<{ live: boolean; rows: NationalRow[] }> {
  const [dangers, spots] = await Promise.all([
    pool(PARKS, 8, (p) => dangerAt(p, signal)),
    wfs('public:hotspots_last24hrs', 'lat > 41.5 AND lon < -52', 'lat,lon', signal),
  ]);
  const pts = spots ? hotspotPoints(spots) : [];
  const live = dangers.some((d) => d.ok) || !!spots;
  const rows = PARKS.map((p, i) => ({
    id: p.id,
    danger: dangers[i].danger,
    hotspots: pts.filter((s) => distanceKm(p, s) <= HOTSPOT_RADIUS_KM).length,
  }));
  return { live, rows };
}

/* ------------------------------------------------------------------ bulletins (parks.canada.ca) */

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;/g, '’')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Items (title, link, date) in a bulletins page: one park's page, or one park's block on the national page. */
export function parseBulletinItems(html: string, lang: Lang): Bulletin[] {
  const host = lang === 'fr' ? 'https://parcs.canada.ca' : 'https://parks.canada.ca';
  const items: Bulletin[] = [];
  const re = /<a href="([^"]+)">\s*<h4[^>]*>([\s\S]*?)<\/h4>\s*<\/a>\s*(?:<span class="text-muted small">([\s\S]*?)<\/span>)?/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const title = decode(m[2]);
    if (!title) continue;
    const url = m[1].startsWith('http') ? m[1] : `${host}${m[1].replace(/^\/(en|fr)\//, '/')}`;
    if (items.some((i) => i.url === url)) continue;
    items.push({ title, url, date: parseBulletinDate(decode(m[3] ?? '')), kind: classifyBulletin(title) });
  }
  return items;
}

const stripComments = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '');

/** The national "Important bulletins" page, split by park path (`ab/banff`). */
export function parseBulletinsPage(html: string, lang: Lang): Map<string, Bulletin[]> {
  const index = new Map<string, Bulletin[]>();
  const parts = stripComments(html).split(/<h3[^>]*>\s*<a href="([^"]+)">[\s\S]*?<\/a>\s*<\/h3>/);
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].match(/\/pn-np\/([a-z]{2}\/[^/"]+)/)?.[1];
    if (!key) continue;
    index.set(key, [...(index.get(key) ?? []), ...parseBulletinItems(parts[i + 1] ?? '', lang)]);
  }
  return index;
}

/** A real bulletins page is long; an error page or an empty shell isn't. */
const MIN_PAGE_CHARS = 2000;

export async function bulletinsFor(p: Park, lang: Lang, signal?: AbortSignal): Promise<{ live: boolean; url: string; items: Bulletin[] }> {
  const url = parkUrls(p, lang).bulletins;
  // The park's own page is small and quick; the national page is the fallback.
  // (A park with no bulletins page of its own links the national page: only its block there is its own.)
  const own = url === URLS.bulletins[lang] ? null : await page(url, signal);
  if (own?.ok && own.data.length > MIN_PAGE_CHARS) return { live: true, url, items: sortBulletins(parseBulletinItems(stripComments(own.data), lang)) };
  const all = await page(URLS.bulletins[lang], signal);
  if (!all.ok || all.data.length < MIN_PAGE_CHARS) return { live: false, url, items: [] };
  return { live: true, url, items: sortBulletins(parseBulletinsPage(all.data, lang).get(p.path) ?? []) };
}

/* ------------------------------------------------------------------ tool outputs */

export type ConditionsInput = { park?: string; lang: Lang; timeZone?: string };

export async function buildConditions({ park: name, lang, timeZone }: ConditionsInput, signal?: AbortSignal): Promise<ConditionsOutput> {
  const today = todayInCanada(new Date(), timeZone);
  const fetchedAt = new Date().toISOString();
  const park = matchPark(name);
  if (!park) {
    const { live, rows } = await nationalFire(signal);
    return nationalConditionsOutput({ lang, fetchedAt, rows, live, unknown: name });
  }
  const [fire, bul] = await Promise.all([fireFor(park, today, signal), bulletinsFor(park, lang, signal)]);
  return parkConditionsOutput({ park, lang, fetchedAt, fire: fire.fire, fireLive: fire.live, bulletins: bul.items, bulletinsLive: bul.live, bulletinsUrl: bul.url });
}

export type FinderInput = {
  park?: string;
  near?: string;
  latitude?: number;
  longitude?: number;
  province?: Province;
  landscape?: Landscape;
  camping?: boolean;
  lang: Lang;
  timeZone?: string;
};

export async function buildFinder(input: FinderInput, signal?: AbortSignal): Promise<FinderOutput> {
  const { lang } = input;
  const matched = matchPark(input.park);
  const province = input.province ?? (!matched ? (matchProvince(input.park) ?? matchProvince(input.near)) : undefined);
  let origin: Origin | null = null;
  let originUnknown: string | undefined;
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    // Rounded to ~1 km: enough to rank parks, never a precise location.
    origin = { label: lang === 'fr' ? 'Votre position' : 'Your location', lat: Math.round(input.latitude * 100) / 100, lng: Math.round(input.longitude * 100) / 100 };
  } else if (input.near && !matchProvince(input.near)) {
    origin = await geocode(input.near, lang, signal);
    if (!origin) originUnknown = input.near;
  }
  const conditions = matched ? await buildConditions({ park: matched.id, lang, timeZone: input.timeZone }, signal) : null;
  return finderOutput({
    lang,
    matched,
    filters: { province, landscape: input.landscape, camping: input.camping || undefined },
    origin,
    originUnknown,
    unknown: input.park && !matched && !province ? input.park : undefined,
    conditions,
  });
}

export type { PassesInput };
export const buildPasses = (input: PassesInput): PassesOutput => passesOutput(input);

export type CampingInput = { park?: string; near?: string; lang: Lang; timeZone?: string };

export async function buildCamping(input: CampingInput, signal?: AbortSignal): Promise<CampingOutput> {
  const { lang } = input;
  const park = matchPark(input.park);
  const origin = !park && input.near ? await geocode(input.near, lang, signal) : null;
  return campingOutput({ lang, today: todayInCanada(new Date(), input.timeZone), park, origin, unknown: input.park && !park ? input.park : undefined });
}
