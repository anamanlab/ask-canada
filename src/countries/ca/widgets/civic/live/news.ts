/** civicNews builder (SERVER ONLY): the canada.ca news centre feed (api.io.canada.ca), newest first. */
import 'server-only';
import { z } from 'zod';
import { CHECKED, NEWS_TYPES, SOURCES, torontoToday, type Lang, type NewsType } from '../data';
import { departmentOf } from '../build/departments';
import { filterNews } from '../build/news';
import { TEASER_MAX, clip, curly } from '../build/text';
import type { NewsItem, NewsOutput } from '../types';
import { decode, getJson } from './http';

const NEWS_API = 'https://api.io.canada.ca/io-server/gc/news';

const text = z.string().nullish();
const Entry = z.object({ link: text, teaser: text, publishedDate: text, title: text });
type Entry = z.output<typeof Entry>;
const Feed = z.object({ feed: z.object({ entry: z.array(Entry).nullish() }).nullish() });

/** The latest news: enough of each type to fill the list after merging. */
const LATEST_PICK = 60;
/**
 * A topic search looks back 90 days: each type asks for about that many items and no more (measured
 * 2026-10-01: 400 news releases reach back 5 weeks, 400 media advisories 3 months; 150 statements or
 * backgrounders cover 3 to 4 months; 60 speeches or readouts cover more than a year). About half the bytes of
 * asking 400 of everything, with the same results.
 */
const TOPIC_PICK: Record<NewsType, number> = { newsreleases: 400, mediaadvisories: 400, statements: 150, backgrounders: 150, speeches: 60, readouts: 60 };
/** How much of a teaser a topic search reads. */
const TEASER_SEARCH = 320;
/** The whole lookup answers within this, with the lists that have arrived (none: the official page instead). */
const DEADLINE_MS = 6000;

export async function buildNews(
  { topic, type, limit = 6, lang }: { topic?: string; type?: NewsType; limit?: number; lang: Lang },
  signal?: AbortSignal,
): Promise<NewsOutput> {
  const base: NewsOutput = { lang, items: [], live: false, checked: CHECKED, sources: [SOURCES.news(lang, { live: false })], ...(topic ? { query: topic } : {}), ...(type ? { type } : {}) };
  const types = type ? [type] : NEWS_TYPES;
  // Each list lands here as it arrives, so the deadline below can answer with the ones that made it.
  const arrived: { e: Entry; t: NewsType }[][] = [];
  const all = Promise.all(
    types.map(async (t) => {
      const pick = topic ? TOPIC_PICK[t] : LATEST_PICK;
      const res = await getJson(`${NEWS_API}/${lang}/v2?sort=publishedDate&orderBy=desc&pick=${pick}&format=json&type=${t}`, Feed, { revalidate: 900, timeout: 4500, signal });
      if (res.ok) arrived.push((res.data.feed?.entry ?? []).map((e) => ({ e, t })));
    }),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const started = Date.now();
  await Promise.race([all, new Promise<void>((resolve) => (timer = setTimeout(resolve, DEADLINE_MS)))]);
  clearTimeout(timer);
  const ok = [...arrived];
  if (ok.length < types.length) console.warn(`[civicNews] ${ok.length}/${types.length} feeds after ${Date.now() - started} ms (lang=${lang}, topic=${topic ?? '-'})`);
  if (!ok.length) return base;
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const { e, t } of ok.flat()) {
    if (!e.link || !e.title || !e.publishedDate || seen.has(e.link)) continue;
    if (!/^https:\/\/(www\.)?canada\.ca\//.test(e.link)) continue;
    seen.add(e.link);
    items.push({
      title: curly(decode(e.title).trim()),
      // Long enough to search by topic; cut to the displayed length once the list is chosen.
      teaser: curly(clip(decode(e.teaser ?? '').replace(/\s+/g, ' ').trim(), TEASER_SEARCH)),
      url: e.link,
      published: e.publishedDate,
      type: t,
      department: departmentOf(e.link, lang),
    });
  }
  items.sort((a, b) => b.published.localeCompare(a.published));
  // Topic searches look back 90 days at most (some item types go back years).
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const recent = topic ? items.filter((i) => i.published.slice(0, 10) >= cutoff) : items;
  const since = recent.at(-1)?.published.slice(0, 10);
  const n = Math.max(1, Math.min(12, limit));
  const shown = filterNews(recent, topic, n).map((i) => ({ ...i, teaser: clip(i.teaser, TEASER_MAX) }));
  return { ...base, items: shown, live: true, checked: torontoToday(), sources: [SOURCES.news(lang)], ...(topic && since ? { since } : {}) };
}
