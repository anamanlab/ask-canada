/**
 * Live recalls and safety alerts for `healthRecalls` (server only): the newest notices on
 * recalls-rappels.canada.ca, or a search of the site, with the summary of the notices each filter leads with.
 * Every call has a timeout and a cache window, and the result is always renderable (live: false, never a throw).
 */
import 'server-only';
import type { FetchOptions } from '@/lib/server/fetch-json';
import type { Lang } from './data';
import { otherLang, recallLinks } from './links';
import { page, shared, type Memo } from './live-shared';
import type { RecallCategory, RecallItem, RecallsOutput } from './recalls';
import { broaderQueries, byDateDesc, cleanQuery, dedupe, detailPicks, parseNotice, parseSearchPage, searchUrlFor } from './recalls-parse';

/** Fresh full-text searches on the Recalls site take 4 to 10 s; cached ones answer in under a second. */
const SEARCH_TIMEOUT = 12_000;
/** A lone leading word with more matches than this is a common word ("baby"), not a brand ("Advil"). */
const BRAND_MAX = 40;
const recallMemo: Memo<RecallsOutput> = new Map();
/** Common allergens, as the allergen chips ask for them: warmed in the background so they answer fast. */
const ALLERGEN_QUERIES: Record<Lang, string[]> = {
  en: ['peanut', 'milk', 'egg', 'sesame', 'soy', 'gluten', 'tree nuts', 'mustard'],
  fr: ['arachide', 'lait', 'œuf', 'sésame', 'soja', 'gluten', 'noix', 'moutarde'],
};
const WARM_MS = 25 * 60_000;
let warmedAt = 0;

function warmAllergens(now: Date) {
  if (now.getTime() - warmedAt < WARM_MS) return;
  warmedAt = now.getTime();
  for (const lang of ['en', 'fr'] as const) {
    for (const q of ALLERGEN_QUERIES[lang]) void page(searchUrlFor(lang, q, 'all'), { timeout: 20_000, revalidate: 1800 });
  }
}

type RecallQuery = { query?: string | null; category?: RecallCategory | 'all'; lang: Lang };
/** How a page is read: the cached server fetch, or a stand-in for the tests. */
type Load = (url: string, o: FetchOptions) => Promise<string | null>;

/** Live recalls: the newest notices, or a search of the Recalls site. */
export function liveRecalls(input: RecallQuery, signal?: AbortSignal, now = new Date()): Promise<RecallsOutput> {
  const key = `${input.lang}|${input.category ?? 'all'}|${cleanQuery(input.query) ?? ''}`;
  const p = shared(recallMemo, key, now, signal, () => fetchRecalls(input, now));
  warmAllergens(now);
  return p;
}

export async function fetchRecalls(input: RecallQuery, now: Date, load: Load = page): Promise<RecallsOutput> {
  const { lang } = input;
  const category = input.category ?? 'all';
  const asked = cleanQuery(input.query);
  const result = (live: boolean, total: number, items: RecallItem[], query = asked, broadened?: RecallsOutput['broadened']): RecallsOutput => ({
    mode: asked ? 'search' : 'recent',
    query,
    category,
    lang,
    fetchedAt: now.toISOString(),
    live,
    total,
    items,
    ...(broadened ? { broadened } : {}),
    ...recallLinks(lang, live, query, category, broadened?.any),
    alt: recallLinks(otherLang(lang), live, query, category, broadened?.any),
  });
  // Search pages answer in ~0.5 s when cached upstream, but a fresh full-text query can take 4 to 10 s.
  const search = async (query: string | null, pages: number[], any = false) => {
    const html = await Promise.all(pages.map((p) => load(searchUrlFor(lang, query, category, p, any), { timeout: SEARCH_TIMEOUT, revalidate: 1800 })));
    const ok = html.flatMap((h) => (h == null ? [] : [parseSearchPage(h)]));
    return ok.length ? { total: ok[0].total, items: dedupe(ok.flatMap((r) => r.items)) } : null;
  };
  let found = await search(asked, asked ? [0] : [0, 1]);
  if (!found) return result(false, 0, []);
  let query = asked;
  let broadened: RecallsOutput['broadened'];
  if (asked && !found.items.length) {
    // The site searches several words as one exact phrase, so "Advil Caplets" finds nothing while "Advil" has
    // notices. Nothing for the phrase is never the answer on its own: search the brand word and any of the
    // words, and say which search the notices come from.
    const wider = broaderQueries(asked);
    const tries = await Promise.all(wider.map((b) => search(b.query, [0], b.any)));
    const pick = wider.findIndex((b, i) => {
      const hit = tries[i];
      return Boolean(hit?.items.length) && (b.any || b.brandLike || (hit?.total ?? 0) <= BRAND_MAX);
    });
    const hit = tries[pick];
    if (hit) {
      found = hit;
      query = wider[pick].query;
      broadened = { from: asked, ...(wider[pick].any ? { any: true } : {}) };
    }
  }
  let items = found.items;
  if (asked) items = byDateDesc(items);
  // The notices each filter leads with get their summary (what to do, affected products), not only the newest overall.
  const picks = detailPicks(items, query);
  const notices = await Promise.all(items.map((it) => (picks.has(it.url) ? load(it.url, { timeout: 4000, revalidate: 3600 }) : null)));
  items = items.map((it, i): RecallItem => {
    const html = notices[i];
    const details = html ? parseNotice(html) : {};
    return Object.keys(details).length ? { ...it, details } : it;
  });
  return result(true, found.total, items, query, broadened);
}
