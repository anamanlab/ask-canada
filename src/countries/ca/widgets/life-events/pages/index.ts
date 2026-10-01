/**
 * Life events: every official page (EN + FR, with the sentence each step relies on), one table per event, merged
 * here. Plain tables, and heavy: the tool uses them on the server, and the checklist only downloads them with the
 * planner (planner.ts) when someone switches events or changes the date. The checklist structure built on these
 * pages is in data.ts; the small constants the widget needs at first render live in facts.ts.
 *
 * Each event's file opens with what was verified on its pages (all fetched on 2026-09-30).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { LINKS, type Lang } from '../facts';
import { BABY } from './baby';
import { DEATH } from './death';
import { JOB_LOSS } from './job-loss';
import { MARRIAGE } from './marriage';
import { MOVING } from './moving';
import { RETIRING } from './retiring';
import { CHECKED, type Bi, type Page } from './shared';

export type { Bi };

export const PAGES = {
  lifeEvents: {
    url: LINKS.lifeEvents,
    title: { en: 'Manage life events', fr: 'Gérer les événements de la vie' },
    updated: '2026-07-16',
  },
  ...MOVING,
  ...BABY,
  ...MARRIAGE,
  ...JOB_LOSS,
  ...RETIRING,
  ...DEATH,
} satisfies Record<string, Page>;

export type PageKey = keyof typeof PAGES;

/** Anchors on a page (the `#…` part is the same in both languages on these pages). */
export const withHash = (key: PageKey, hash: string): Bi => ({ en: `${PAGES[key].url.en}#${hash}`, fr: `${PAGES[key].url.fr}#${hash}` });

export function pageSource(key: PageKey, lang: Lang): ToolSource {
  const p: Page = PAGES[key];
  return { title: p.title[lang], url: p.url[lang], checked: CHECKED, updated: p.updated, ...(p.quote ? { quote: p.quote[lang] } : {}) };
}
