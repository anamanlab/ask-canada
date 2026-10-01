/**
 * Server-side Job Bank fetchers (tools/jobs.ts and scenarios/jobs.ts only). Every call goes through the
 * shared `fetchJson` / `fetchText` (timeout, Next data cache, zod at the boundary) and returns null on any
 * failure, so the tool can fall back gracefully.
 *
 * The tool call's abort signal is deliberately not passed down: the scripted answer text and the tool share
 * one request per turn (see `once`), and aborting one caller must not fail the other. The timeouts bound it.
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson, fetchText } from '@/lib/server/fetch-json';
import { CANADIAN_POSTAL, JB, PROVINCE_CODES, fold, jobBankSearchUrl, provinceFrom, type Lang, type Province, type SearchFilters, type SearchLocation } from './data';
import { parseOutlook, parseRegionNames, parseSearchResults, parseWages } from './jobbank';
import { occupationByProfile, occupationFromTitle, occupationNames } from './occupations';
import type { OccupationNames } from './types';

/** Job Bank can be slow: past these, the widget falls back to the offline hero and the deep link. */
const SEARCH_TIMEOUT = 3500;
const WAGES_TIMEOUT = 4000;

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; AskCanada/1.0; +https://canada.ryancampbell.com)' };

/** A Job Bank HTML page, or null when it didn't answer in time. */
async function page(url: string, revalidate: number, timeout: number): Promise<string | null> {
  const res = await fetchText(url, { revalidate, timeout, headers: HEADERS });
  return res.ok ? res.data : null;
}

/* ---------------------------------------------------------------- Job Bank's Solr suggest endpoints */

/** The Solr envelope; each doc is checked on its own, so one odd row never discards the rest. */
const SolrDocs = z.object({ response: z.object({ docs: z.array(z.unknown()) }) });

const CityDoc = z.object({
  doctype: z.literal('C'),
  name: z.string().min(1),
  city_id: z.coerce.string().min(1),
  province_cd: z.enum(PROVINCE_CODES as [Province, ...Province[]]),
  /** "1" for the city itself, "0" for a neighbourhood of it. */
  mothercity_ind: z.coerce.number().catch(0),
});

const TitleDoc = z.object({
  title: z.string().min(1),
  noc21_code: z.coerce.string().min(1),
  noc_job_title_concordance_id: z.coerce.string().min(1),
});

/** The docs of a suggest query that fit `schema` (in Job Bank's order); null when the request failed. */
async function suggest<S extends z.ZodType>(url: string, schema: S, timeout: number): Promise<z.output<S>[] | null> {
  const res = await fetchJson(url, SolrDocs, { revalidate: 86_400, timeout, headers: HEADERS });
  if (!res.ok) return null;
  return res.data.response.docs.flatMap((d) => {
    const doc = schema.safeParse(d);
    return doc.success ? [doc.data] : [];
  });
}

/* ---------------------------------------------------------------- one answer per turn */

/**
 * The scripted answer text and the tool resolve the same place and run the same search a moment apart.
 * Both go through this short-lived promise cache, so they always share one result (including a timeout),
 * and the heading can never disagree with the widget underneath it.
 */
const TURN_TTL = 90_000;
type Located = { loc: SearchLocation; unresolved?: string };
/** What each family of lookups resolves to, so a value read back from the cache keeps its type. */
type Families = {
  loc: Located;
  search: Awaited<ReturnType<typeof searchNow>>;
  occ: ResolvedOccupation | null;
  wages: Awaited<ReturnType<typeof fetchWagesNow>>;
  outlook: Awaited<ReturnType<typeof fetchOutlookNow>>;
};
type Entry<T> = { at: number; value: Promise<T>; settled?: { v: T } };
type TurnCache = { [K in keyof Families]: Map<string, Entry<Families[K]>> };
declare global {
  var __jobsTurnCaches: TurnCache | undefined;
}
// On globalThis, so the scenario and the tool share it even when the dev server loads this module twice.
const turnCache: TurnCache = (globalThis.__jobsTurnCaches ??= { loc: new Map(), search: new Map(), occ: new Map(), wages: new Map(), outlook: new Map() });

function once<K extends keyof Families>(family: K, key: string, run: () => Promise<Families[K]>): Promise<Families[K]> {
  const cache: Map<string, Entry<Families[K]>> = turnCache[family];
  const now = Date.now();
  for (const [k, v] of cache) if (now - v.at > TURN_TTL) cache.delete(k);
  const hit = cache.get(key);
  if (hit) return hit.value;
  const value = run();
  const entry: Entry<Families[K]> = { at: now, value };
  value.then((v) => (entry.settled = { v }), () => undefined);
  cache.set(key, entry);
  return value;
}

const locKey = (input: string | undefined, lang: Lang) => `${lang}|${(input ?? '').trim().toLowerCase()}`;

/** The place this turn already resolved (sync), e.g. to word follow-up questions; undefined if not yet known. */
export function resolvedLocation(input: string | undefined, lang: Lang): Located | undefined {
  return turnCache.loc.get(locKey(input, lang))?.settled?.v;
}

/* ---------------------------------------------------------------- locations */

/** "Toronto" | "Halifax, NS" | "K1A 0B1" | "Quebec" → a Job Bank location (or Canada-wide when unknown). */
export function resolveLocation(input: string | undefined, lang: Lang): Promise<Located> {
  return once('loc', locKey(input, lang), () => resolveLocationNow(input, lang));
}

async function resolveLocationNow(input: string | undefined, lang: Lang): Promise<Located> {
  const raw = input?.trim();
  if (!raw || /^(canada|all of canada|partout au canada|tout le canada|anywhere|nationwide)$/i.test(raw)) return { loc: { kind: 'canada' } };
  const prov = provinceFrom(raw);
  if (prov) return { loc: { kind: 'province', province: prov } };
  if (CANADIAN_POSTAL.test(raw)) return { loc: { kind: 'postal', postal: raw.replace(/\s+/g, '').toUpperCase() } };
  const [cityPart, provPart] = raw.split(/,\s*/);
  const wantProv = provinceFrom(provPart);
  const q = encodeURIComponent(cityPart);
  const cities = await suggest(`${JB.en}/core/ta-cityprovsuggest_${lang}/select?q=${q}&fq=NOT%20postalcode_cnt:0&wt=json&rows=10`, CityDoc, 2500);
  if (cities?.length) {
    const exact = cities.filter((d) => fold(d.name) === fold(cityPart));
    const pool = (exact.length ? exact : cities).filter((d) => !wantProv || d.province_cd === wantProv);
    const best = pool.toSorted((a, b) => b.mothercity_ind - a.mothercity_ind)[0];
    if (best) return { loc: { kind: 'city', name: best.name, province: best.province_cd, cityId: best.city_id } };
  }
  if (wantProv) return { loc: { kind: 'province', province: wantProv }, unresolved: raw };
  return { loc: { kind: 'canada' }, unresolved: raw };
}

/* ---------------------------------------------------------------- search */

/** `timeout` is longer for searches that run in the background (follow-up chips), which nobody waits on. */
export function searchJobBank(lang: Lang, q: string, loc: SearchLocation, filters: SearchFilters, timeout = SEARCH_TIMEOUT) {
  const url = jobBankSearchUrl(lang, q, loc, filters, 'M');
  return once('search', url, () => searchNow(lang, url, timeout));
}

/**
 * A search this turn already finished (sync): the total, `null` when Job Bank didn't answer, or undefined
 * when it hasn't run or is still running. Follow-up chips use it to skip searches with no postings.
 */
export function settledSearchTotal(lang: Lang, q: string, loc: SearchLocation, filters: SearchFilters): number | null | undefined {
  const hit = turnCache.search.get(jobBankSearchUrl(lang, q, loc, filters, 'M'))?.settled;
  if (!hit) return undefined;
  return hit.v?.total ?? null;
}

async function searchNow(lang: Lang, url: string, timeout: number) {
  const html = await page(url, 900, timeout);
  if (!html || !html.includes('results-count')) return null;
  return { url, ...parseSearchResults(html, lang, 25) };
}

/* ---------------------------------------------------------------- occupations + wages */

export type ResolvedOccupation = { profileId: string; noc: string; title: string } & OccupationNames;

/** Catalog first (instant, curated), then Job Bank's own title search. */
export function resolveOccupation(query: string, lang: Lang): Promise<ResolvedOccupation | null> {
  return once('occ', `${lang}|${query.trim().toLowerCase()}`, () => resolveOccupationNow(query, lang));
}

async function resolveOccupationNow(query: string, lang: Lang): Promise<ResolvedOccupation | null> {
  const known = occupationFromTitle(query);
  if (known) return { profileId: known.profileId, noc: known.noc, title: known.title[lang], ...occupationNames(known) };
  const hit = (await suggest(`${JB.en}/core/ta-jobtitle_${lang}/select?q=${encodeURIComponent(query)}&wt=json&rows=5`, TitleDoc, 3500))?.[0];
  if (!hit) return null;
  const title = hit.title.charAt(0).toUpperCase() + hit.title.slice(1);
  // Job Bank's title may still be one the catalog knows (then both languages and its search keyword come along).
  const cat = occupationByProfile(hit.noc_job_title_concordance_id) ?? occupationFromTitle(title);
  return { profileId: hit.noc_job_title_concordance_id, noc: hit.noc21_code, title, ...(cat ? occupationNames(cat) : {}) };
}

/** Wages for one occupation; economic region names follow `lang` (cached per language). */
export function fetchWages(profileId: string, geo: Province | 'ca', lang: Lang = 'en') {
  const regionLang: Lang = geo === 'ca' ? 'en' : lang;
  return once('wages', `${profileId}|${geo}|${regionLang}`, () => fetchWagesNow(profileId, geo, regionLang));
}

async function fetchWagesNow(profileId: string, geo: Province | 'ca', lang: Lang) {
  // Numbers come from the English page (same figures in both languages). Region names come from both
  // pages, matched by Job Bank's geo id, so the widget can name them in either interface language.
  const id = encodeURIComponent(profileId);
  const [html, frHtml] = await Promise.all([
    page(`${JB.en}/marketreport/wages-occupation/${id}/${geo}`, 43_200, WAGES_TIMEOUT),
    geo !== 'ca' ? page(`${JB.fr}/rapportmarche/salaire-profession/${id}/${geo}`, 43_200, WAGES_TIMEOUT) : Promise.resolve(null),
  ]);
  if (!html || !html.includes('areaGroup')) return null;
  const parsed = parseWages(html);
  if (parsed.regions.length) {
    const fr = frHtml ? parseRegionNames(frHtml) : {};
    const withNames = parsed.regions.map((r) => ({ ...r, names: { en: r.name, fr: r.geo ? fr[r.geo] : undefined } }));
    // In French, only French names: a region we can't name in French is left out rather than shown in English.
    parsed.regions = lang === 'fr' ? withNames.flatMap((r) => (r.names.fr ? [{ ...r, name: r.names.fr }] : [])) : withNames;
  }
  return parsed;
}

export function fetchOutlook(profileId: string) {
  return once('outlook', profileId, () => fetchOutlookNow(profileId));
}

async function fetchOutlookNow(profileId: string) {
  const html = await page(`${JB.en}/marketreport/outlook-occupation/${encodeURIComponent(profileId)}/ca`, 43_200, WAGES_TIMEOUT);
  if (!html) return null;
  return parseOutlook(html);
}

export const catalogFallback = occupationByProfile;
