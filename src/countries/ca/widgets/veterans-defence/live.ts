/**
 * LIVE Canadian Armed Forces careers from forces.ca (server only).
 *
 * forces.ca's own career browser reads https://forces.ca/api/v1/careers (about 2.6 MB of JSON with every
 * career's texts and media). We fetch it with a timeout, keep only the fields the matcher needs, and hold
 * the slim list in memory, refreshing it in the background after 6 hours (the payload is too large for
 * Next's fetch cache). Only when there has never been a good download (forces.ca slow or down on a cold
 * server) is the snapshot saved on 2026-09-30 used, and the widget says so.
 *
 * forces.ca leaves the intermediate certificate out of its TLS chain, which Node's fetch rejects, so this
 * uses node:https with Node's own root store plus that one public intermediate (see forces-cert.ts). That is
 * why it can't go through the shared `fetchJson` (global fetch, Next data cache); it keeps the same contract:
 * a hard timeout, the response validated with zod (careers-schema.ts), and it never throws to the tool.
 * Request for core: a `ca` (or undici dispatcher) option on `fetchJson`, plus a cache that takes a 2.6 MB
 * body; this file then shrinks to the slimming step.
 *
 * The fallback is never silent on the server: a failed download is logged once per cause, a TLS failure
 * names the pinned certificate, and so does a certificate within 60 days of its expiry.
 */
import 'server-only';
import { request } from 'node:https';
import { rootCertificates } from 'node:tls';
import { createGunzip } from 'node:zlib';
import type { CareerRecord, Category, Env } from './careers';
import { ApiCareer, ApiCareers, SNAPSHOT } from './careers-schema';
import { FORCES_CA_INTERMEDIATE, FORCES_CA_INTERMEDIATE_EXPIRES } from './forces-cert';

const API = 'https://forces.ca/api/v1/careers';
const TTL = 6 * 60 * 60 * 1000;
/** The payload is about 2.6 MB: give a slow link or a busy server time to finish. */
const TIMEOUT = 12 * 1000;

const CAT: Record<string, Category> = {
  health: 'health',
  comp: 'computing',
  engin: 'engineering',
  maint: 'maintenance',
  combat: 'combat',
  airc: 'aviation',
  naval: 'naval',
  trans: 'logistics',
  admin: 'administration',
  hosu: 'hospitality',
  safet: 'safety',
  publ: 'public-relations',
};
const ENV: Record<number, Env> = { 1: 'army', 2: 'air', 3: 'navy' };

const decode = (s: string) =>
  s
    .replace(/&middot;/g, '·')
    .replace(/&rsquo;/g, '’')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, '’')
    .trim();

const words = (list: ApiCareer['englishNocs']) => {
  const all = [...new Set((list ?? []).flatMap((n) => (n.title ? [n.title.toLowerCase()] : [])))].sort().join(' ');
  return all.length > 120 ? all.slice(0, 121).replace(/\s+\S*$/, '') : all;
};

/** The slim record the matcher needs, or null when the entry isn't a career we can read. */
function slimCareer(raw: unknown): CareerRecord | null {
  const parsed = ApiCareer.safeParse(raw);
  if (!parsed.success) return null;
  const c = parsed.data;
  return {
    slug: c.slug,
    slugFr: c.slugFr || c.slug,
    name: decode(c.name),
    nameFr: decode(c.nameFr || c.name),
    envs: (c.environments ?? []).map((e) => ENV[e.id]).filter((e): e is Env => !!e),
    fullTime: !!c.isFullTime,
    partTime: !!c.isPartTime,
    officer: !!c.isOfficer,
    minEd: Math.min(5, Math.max(1, Number(c.reqEd) || 1)),
    paidEd: !!c.paidEdOptions?.length,
    categories: (c.categories ?? []).map((k) => CAT[k.short]).filter((k): k is Category => !!k),
    signingBonus: !!c.hasSigningBonus,
    recruitingAllowance: !!c.hasRecruitingAllowance,
    priority: !!c.isFeatured,
    priorityPaidEdOnly: !!c.isFeatured && Number(c.featuredType) === 1,
    keywords: words(c.englishNocs),
    keywordsFr: words(c.frenchNocs),
  };
}

const CA = [...rootCertificates, FORCES_CA_INTERMEDIATE];

/**
 * GET a JSON document over HTTPS (gzip), with a hard deadline. The deadline rejects by itself: once a
 * response has started, destroying the request errors the response stream rather than the request, so
 * waiting for a request 'error' could hang forever.
 */
function getJson(url: string, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const fail = (e: unknown) => {
      clearTimeout(timer);
      req.destroy();
      reject(e);
    };
    const req = request(url, { ca: CA, headers: { accept: 'application/json', 'accept-encoding': 'gzip', 'user-agent': 'AskCanada/1.0 (+https://canada.ryancampbell.com)' } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return fail(new Error(`forces.ca ${res.statusCode}`));
      }
      res.on('error', fail);
      const stream = res.headers['content-encoding'] === 'gzip' ? res.pipe(createGunzip()) : res;
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('error', fail);
      stream.on('end', () => {
        clearTimeout(timer);
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
    });
    const timer = setTimeout(() => fail(new Error('forces.ca timed out')), timeoutMs);
    req.on('error', fail);
    req.end();
  });
}

/** Node's certificate-verification failures: the pinned intermediate no longer completes forces.ca's chain. */
const TLS_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);
const CERT_WARN_AHEAD = 60 * 24 * 60 * 60 * 1000;
const FIX = 'Replace FORCES_CA_INTERMEDIATE in widgets/veterans-defence/forces-cert.ts (the file says where it comes from).';
/** Each cause is logged once per server process, not once per request. */
const warned = new Set<string>();
function warnOnce(cause: string, message: string) {
  if (warned.has(cause)) return;
  warned.add(cause);
  console.warn(`[veterans-defence] ${message}`);
}

/** Why the live careers were not used, for the server log (people see the saved list and its date). */
function reportFailure(e: unknown) {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String(e.code) : '';
  const detail = e instanceof Error ? e.message : String(e);
  if (TLS_CODES.has(code)) warnOnce(`tls:${code}`, `forces.ca TLS check failed (${code}): careers fall back to the saved list until the pinned intermediate certificate is replaced. ${FIX}`);
  else warnOnce(`fetch:${detail}`, `forces.ca careers download failed (${detail}): using the last good list or the saved one.`);
}

function checkCertificateAge(now: number) {
  const left = Date.parse(FORCES_CA_INTERMEDIATE_EXPIRES) - now;
  if (left > CERT_WARN_AHEAD) return;
  const when = FORCES_CA_INTERMEDIATE_EXPIRES.slice(0, 10);
  warnOnce('cert-age', `the pinned forces.ca intermediate certificate ${left <= 0 ? 'expired' : 'expires'} on ${when}. ${FIX}`);
}

type CareerList = { careers: CareerRecord[]; live: boolean; asOf: string };

const snapshotCareers = (): CareerList => ({ careers: SNAPSHOT.careers, live: false, asOf: SNAPSHOT.fetchedAt });

/** The last good live list. Kept past the TTL: a stale live list beats the snapshot while a refresh runs. */
let memo: { at: number; careers: CareerRecord[] } | null = null;
/** One shared download at a time, never tied to any one caller's request. */
let inflight: Promise<CareerList> | null = null;
/** When the last download failed: wait a little before trying forces.ca again. */
let failedAt = 0;
const RETRY_AFTER = 30 * 1000;

const fromMemo = (m: NonNullable<typeof memo>): CareerList => ({ careers: m.careers, live: true, asOf: new Date(m.at).toISOString() });

function refresh(now: number): Promise<CareerList> {
  inflight ??= load(now).finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * The careers list: the last good live list when there is one (refreshed in the background once it is
 * older than the TTL: stale-while-revalidate), otherwise the shared download, otherwise the snapshot.
 * `signal` only lets this caller stop waiting: it never cancels the download other callers share.
 */
export async function liveCareers(signal?: AbortSignal, now = Date.now()): Promise<CareerList> {
  const recentFailure = now - failedAt < RETRY_AFTER;
  if (memo) {
    if (now - memo.at >= TTL && !recentFailure) void refresh(now);
    return fromMemo(memo);
  }
  if (recentFailure && !inflight) return snapshotCareers();
  return untilAborted(refresh(now), signal);
}

function untilAborted<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

async function load(now: number): Promise<CareerList> {
  checkCertificateAge(now);
  try {
    const body = ApiCareers.parse(await getJson(API, TIMEOUT));
    const careers = body.data.map(slimCareer).filter((c): c is CareerRecord => !!c);
    // A sudden near-empty list means the API changed shape: keep the known-good snapshot instead.
    if (careers.length < 40) throw new Error('forces.ca returned too few careers');
    careers.sort((a, b) => a.name.localeCompare(b.name));
    memo = { at: now, careers };
    failedAt = 0;
    return fromMemo(memo);
  } catch (e) {
    failedAt = Date.now();
    reportFailure(e);
    return memo ? fromMemo(memo) : snapshotCareers();
  }
}
