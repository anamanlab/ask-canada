/** News ranking for civicNews (pure). */
import type { NewsItem } from '../types';
import { matchesTopic, topicTerms } from './text';

/** Filters and ranks news items by a topic (all dates kept newest-first within equal scores). */
export function filterNews(items: NewsItem[], query: string | undefined, limit: number): NewsItem[] {
  const terms = topicTerms(query);
  const score = (withDept: boolean) =>
    items
      .map((it) => ({ it, score: matchesTopic(`${it.title} ${it.teaser}${withDept ? ` ${it.department ?? ''}` : ''}`, terms) }))
      .filter((x) => x.score > 0);
  // Words in the headline or summary first; a department name ("Health Canada") only when nothing else matches.
  let ranked = score(false);
  if (!ranked.length) ranked = score(true);
  // A topic search favours items that match more of the words, then the newest.
  ranked.sort((a, b) => (terms.length > 1 ? b.score - a.score : 0) || b.it.published.localeCompare(a.it.published));
  return ranked.slice(0, limit).map((x) => x.it);
}
