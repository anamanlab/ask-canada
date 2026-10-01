/**
 * Forms finder, tool side: the search (./forms-search) plus the official search pages and the sources, in the
 * answer's language and in the other official language.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { otherLang, type Dept, type Lang } from './data';
import { hitSources, searchForms, type FormSearch } from './forms-search';
import { sources } from './sources';
import { url, type UrlKey } from './urls';

export type FormsOutput = FormSearch & {
  /** Official search pages for anything not in our catalogue. */
  more: { key: UrlKey; href: string }[];
  sources: ToolSource[];
  /** The same sources in the other official language, for a card shown in that language. */
  altSources: ToolSource[];
  /** Pages the card cites after a new search on the device (the lists, passports, provinces, PDF help). */
  pages: ToolSource[];
  altPages: ToolSource[];
};

const MORE: UrlKey[] = ['craForms', 'scForms', 'irccForms'];
const PAGES: UrlKey[] = ['passports', 'provinces', 'departments', ...MORE, 'craPdfHelp'];

export function findForms(query: string, lang: Lang, dept?: Dept | null): FormsOutput {
  const base = searchForms(query, lang, dept);
  const alt = otherLang(lang);
  // Nothing matched: the card points to whoever issues it (see FormsFinder), so the answer cites that page.
  const elsewhere: UrlKey | null = base.results.length || base.passport ? null : base.provincial ? 'provinces' : 'departments';
  // Every page an answer can cite: the faster online option of the top results and the PDF help page.
  const online = base.results.slice(0, 3).flatMap((r) => (r.online ? [r.online.key] : []));
  const srcKeys: UrlKey[] = [...(base.passport ? (['passports'] as UrlKey[]) : []), ...(elsewhere ? [elsewhere] : []), ...online, ...MORE, 'craPdfHelp'];
  return {
    ...base,
    more: MORE.map((k) => ({ key: k, href: url(k, lang) })),
    // Cite the form pages we actually returned first.
    sources: [...hitSources(base.results), ...sources(srcKeys, lang)],
    altSources: [...hitSources(base.results, true), ...sources(srcKeys, alt)],
    pages: sources(PAGES, lang),
    altPages: sources(PAGES, alt),
  };
}
