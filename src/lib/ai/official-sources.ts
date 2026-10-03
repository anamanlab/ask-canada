/**
 * Official-source retrieval (core, country-agnostic; the allowlist comes from the active pack).
 *
 *   fetchOfficialPage(url)      server fetch of an allowlisted official page -> title, "date modified",
 *                               main content as plain text (HTML comments, scripts and chrome removed).
 *   searchOfficialSources(q)    search of official pages -> [{ title, url, snippet }]: the pack's offline
 *                               index of curated pages, optionally a site-restricted web search
 *                               (SEARCH_FALLBACK=duckduckgo). With the Anthropic provider the route also
 *                               exposes Anthropic's native web search restricted to the allowlist.
 *
 * Results are cached in memory for an hour and via fetch revalidation. No personal data is sent: the
 * query is the (already PII-redacted) topic the model searches for.
 */
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { pack } from '@/countries/active';
import { searchLocalSources } from '@/countries/active.server';

/** Identifies this service to the official sites it reads; derived from the pack so it is never a stale brand string. */
const BOT = `${pack.brand.name.replace(/\s+/g, '')}Bot/1.0`;
const UA = `${BOT} (+https://github.com/; official-source retrieval)`;
const TTL = 60 * 60 * 1000;
/** Official pages answer in 1 to 4 seconds; past this the model links the page instead of quoting it. */
const PAGE_TIMEOUT = 7000;
const cache = new Map<string, { at: number; value: unknown }>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.value as T);
  return fn().then((value) => {
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 300) cache.delete(cache.keys().next().value as string);
    return value;
  });
}

export function isAllowed(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.replace(/^www\./, '');
    return pack.sources.allowlist.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&#8217;/g, '’')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));

export function extractPage(html: string) {
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const title =
    decode(noComments.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '') ||
    decode(noComments.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '');
  const modified =
    noComments.match(/<time[^>]*property="dateModified"[^>]*>\s*([\d-]{10})/i)?.[1] ??
    noComments.match(/name="dcterms\.modified"[^>]*content="([\d-]{10})/i)?.[1] ??
    null;
  const main = noComments.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? noComments;
  const text = decode(
    main
      .replace(/<(script|style|nav|noscript|svg|form)[\s\S]*?<\/\1>/gi, '')
      .replace(/<(h[1-6])[^>]*>/gi, '\n\n## ')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<(p|div|tr|br|section|dt|dd)[^>]*>/gi, '\n')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, t: string) => `${t.replace(/<[^>]+>/g, '')} (${href})`)
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
  return { title, modified, text };
}

export async function fetchOfficialPage(url: string, signal?: AbortSignal) {
  if (!isAllowed(url)) return { ok: false as const, url, error: 'Only official government pages can be fetched.' };
  return cached(`page:${url}`, async () => {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'text/html' },
        redirect: 'follow',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(PAGE_TIMEOUT)]) : AbortSignal.timeout(PAGE_TIMEOUT),
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { ok: false as const, url, error: `The page returned ${res.status}.` };
      if (!isAllowed(res.url)) return { ok: false as const, url, error: 'The page redirected outside official sites.' };
      const { title, modified, text } = extractPage(await res.text());
      const checked = new Date().toISOString().slice(0, 10);
      return {
        ok: true as const,
        url: res.url,
        title,
        modified,
        content: text.slice(0, 14000),
        truncated: text.length > 14000,
        sources: [{ title: title || res.url, url: res.url, checked, updated: modified ?? undefined }],
      };
    } catch {
      return { ok: false as const, url, error: 'The page could not be reached. Link it instead of quoting it.' };
    }
  });
}

/**
 * Portable search: first the pack's offline index of curated official pages (private, deterministic),
 * then — only if SEARCH_FALLBACK=duckduckgo — a site-restricted web search.
 */
export async function searchOfficial(query: string, lang: string = 'en') {
  const local = await searchLocalSources(query, lang as 'en' | 'fr').catch(() => []);
  if (local.length || process.env.SEARCH_FALLBACK !== 'duckduckgo') {
    return { results: local, note: local.length ? undefined : 'No curated page matched. Try fetchOfficialPage on the official page you know.' };
  }
  const domains = pack.sources.allowlist;
  const q = `${query} ${domains.map((d) => `site:${d}`).join(' OR ')}`;
  const kl = lang === 'fr' ? 'ca-fr' : lang === 'pt' ? 'br-pt' : lang === 'es' ? 'es-es' : 'ca-en';
  return cached(`search:${lang}:${q}`, async () => {
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=${kl}`, {
        headers: { 'user-agent': `Mozilla/5.0 (compatible; ${BOT})` },
        signal: AbortSignal.timeout(6000),
      });
      const html = await res.text();
      const results: { title: string; url: string; snippet: string }[] = [];
      const re = /class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      for (const m of html.matchAll(re)) {
        let url = decode(m[1]);
        const u = url.match(/uddg=([^&]+)/);
        if (u) url = decodeURIComponent(u[1]);
        if (!isAllowed(url)) continue;
        results.push({ url, title: decode(m[2].replace(/<[^>]+>/g, '').trim()), snippet: decode(m[3].replace(/<[^>]+>/g, '').trim()) });
        if (results.length >= 6) break;
      }
      return { results };
    } catch {
      return { results: [], note: 'Search is unavailable right now.' };
    }
  });
}

export const officialSourceTools = {
  fetchOfficialPage: tool({
    description:
      `Fetch an official government page (only allowlisted official domains) and return its title, "date modified" and main text. Use it to verify fees, dates, eligibility and wording before you state them, and cite the URL you fetched. Prefer the exact task page (e.g. a ${pack.officialHomeLabel} service page) over home pages.`,
    inputSchema: z.object({ url: z.string().url().describe('Full https URL of an official page.') }),
    execute: async ({ url }, { abortSignal }) => fetchOfficialPage(url, abortSignal),
  }),
  searchOfficialSources: tool({
    description:
      'Search official government websites only. Returns up to 6 results (title, url, snippet). Use it to find the right official page when you are not sure of the URL, then fetch it with fetchOfficialPage.',
    inputSchema: z.object({
      query: z.string().min(2).max(160).describe('What to look for, in plain words (no personal details).'),
      lang: z.enum(['en', 'fr', 'pt', 'es']).optional(),
    }),
    execute: async ({ query, lang }) => searchOfficial(query, lang),
  }),
};
