'use client';
/**
 * Small pieces shared by the travel renderers: the UI language, feed text isolation, sources in the UI's
 * language, risk-level colours and meter, and the "show all" toggle with its focus handling. Phone links, local numbers and the
 * offices list are in HelpParts.tsx.
 */
import { useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang, Names, RiskLevel, SourcesIn, Urls } from './types';
import messages from './messages';

/** The language this widget's own words are in: French for a French UI, English otherwise (the catalog's fallback). */
export function useUiLang(): Lang {
  return useLocale().locale === 'fr' ? 'fr' : 'en';
}

/**
 * A destination's name in the UI's language. The feed answers in the question's language, which can differ
 * from the UI's ("Mexique" asked from an English page): chrome sentences and level names follow the UI,
 * so a card never reads "In Japon, call…".
 */
export const nameIn = (c: { name: string; names?: Names }, L: Lang) => c.names?.[L] ?? c.name;

/** A destination's official page in the UI's language (the feed's own link when we don't have both). */
export const urlIn = (c: { url: string; urls?: Urls }, L: Lang) => c.urls?.[L] ?? c.url;

/**
 * The feed's prose in the UI's language. travel.gc.ca publishes every destination in English and French,
 * and the tool returns both (`prose`), so a French question in an English UI (or the reverse) never mixes
 * languages on one card. Returns the language the prose is actually in: the tool's own only when a
 * snapshot lacks the other side.
 */
export function proseIn<T extends { prose?: Partial<Record<Lang, object>> }>(c: T, from: Lang, L: Lang): { c: T; lang: Lang } {
  const p = from === L ? undefined : c.prose?.[L];
  return p ? { c: { ...c, ...p } as T, lang: L } : { c, lang: from };
}

/**
 * Text straight from a feed (travel.gc.ca, CBSA), which only publishes English and French. Isolated and
 * tagged with its language, so it reads left-to-right inside a right-to-left page ("Due to crime." never
 * becomes ".Due to crime") and screen readers pronounce it in the right language.
 */
export function Feed({ lang, children, className }: { lang: Lang; children: ReactNode; className?: string }) {
  return (
    <bdi lang={lang} className={className}>
      {children}
    </bdi>
  );
}

/**
 * The widget's sources in the UI's language. The tool answers in the question's language, so a French
 * question in an English UI would otherwise put "Je déclare : …" under an English card. The tool returns
 * the list in both languages (`sourcesIn`); an answer saved before that keeps its own list.
 */
export function useSources(out: { sources: ToolSource[]; sourcesIn?: SourcesIn }): ToolSource[] {
  const L = useUiLang();
  return out.sourcesIn?.[L] ?? out.sources;
}

/**
 * A live card's subtitle. The shell shows its header badge from the `sm` breakpoint up; below it the badge
 * moves into the subtitle line, which shortens to make room, so "Live" is in the header at every width.
 *   subtitle={<LiveSubtitle short="Mexico" full="Mexico · travel.gc.ca" badge={badge} />}   badge={badge}
 */
export function LiveSubtitle({ short, full, badge }: { short: ReactNode; full: ReactNode; badge: ReactNode }) {
  return (
    <>
      <span className="max-sm:hidden">{full}</span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
        <span className="min-w-0">{short}</span>
        <span className="shrink-0">{badge}</span>
      </span>
    </>
  );
}

/** Solid fill per level (meter segments, dots). Tokens only; level 3 mixes maple and amber. */
export const LEVEL_FILL: Record<RiskLevel, string> = {
  1: 'bg-pine',
  2: 'bg-amber',
  3: 'bg-[color-mix(in_oklab,var(--maple)_62%,var(--amber))]',
  4: 'bg-maple',
};
/** Text colour per level (the level's name in the hero). */
export const LEVEL_INK: Record<RiskLevel, string> = {
  1: 'text-pine',
  2: 'text-amber',
  3: 'text-maple-ink',
  4: 'text-maple-ink',
};
const LEVEL_WASH: Record<RiskLevel, string> = {
  1: 'bg-pine-wash',
  2: 'bg-amber-wash',
  3: 'bg-[color-mix(in_oklab,var(--maple)_9%,var(--amber-wash))]',
  4: 'bg-maple-wash',
};

/** Four-segment meter: filled up to the level, the current one taller, each segment numbered so it reads on its own. */
export function RiskMeter({ level, className }: { level: RiskLevel; className?: string }) {
  const t = useMessages(messages);
  return (
    <div className={cn('flex items-end gap-1.5', className)} role="img" aria-label={t('level.of', { level })}>
      {([1, 2, 3, 4] as RiskLevel[]).map((n) => (
        <span key={n} aria-hidden className="flex w-9 flex-col items-center gap-1 sm:w-11">
          <span className={cn('block w-full rounded-full', n === level ? 'h-2.5' : 'h-1.5', n <= level ? LEVEL_FILL[n] : 'bg-hair-2', n < level && 'opacity-45')} />
          <span className={cn('font-mono text-[10.5px] leading-none', n === level ? 'font-semibold text-ink' : 'text-ink-3')}>{n}</span>
        </span>
      ))}
    </div>
  );
}

/** Small pill with the level's dot and wording. */
export function LevelPill({ level, children, className }: { level: RiskLevel; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-chip px-2.5 py-1 text-[12.5px] font-medium leading-tight text-ink', LEVEL_WASH[level], className)}>
      <span className={cn('size-2 shrink-0 rounded-full', LEVEL_FILL[level])} aria-hidden />
      <span className="min-w-0">{children}</span>
    </span>
  );
}

/**
 * State for a list that starts short ("Show all 10"). Expanding moves keyboard focus to the first newly
 * revealed item, so a screen reader continues from there instead of staying on the toggle below the list;
 * collapsing leaves focus on the toggle. Spread `revealed(i)` on the item at index `i`:
 *   const more = useShowAll<HTMLLIElement>(LIMIT);
 *   <li {...more.revealed(i)} className={REVEAL_FOCUS}>…</li>   <ShowAll open={more.open} onToggle={more.toggle} … />
 * Local until core's Disclosure has a list-continuation variant (it is a titled <section> with its own
 * panel; these lists continue in place, inside one <ul>).
 */
export function useShowAll<T extends HTMLElement>(initial: number) {
  const [open, setOpen] = useState(false);
  // Set by the toggle, used up by the first revealed item when it mounts: focus moves once, on expanding only.
  const wantsFocus = useRef(false);
  const toggle = () => {
    wantsFocus.current = !open;
    setOpen(!open);
  };
  const focusOnMount = (el: T | null) => {
    if (!el || !wantsFocus.current) return;
    wantsFocus.current = false;
    el.focus();
  };
  const revealed = (i: number) => (open && i === initial ? { ref: focusOnMount, tabIndex: -1 } : {});
  return { open, toggle, revealed };
}
/** Focus ring for an item `useShowAll` moves focus to (shown for keyboard users only). */
export const REVEAL_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/** "Show all 10" / "Show fewer" under a list that starts short (key points, offices, crossings); see `useShowAll`. */
export function ShowAll({ open, onToggle, more, fewer, className }: { open: boolean; onToggle: () => void; more: string; fewer: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn('mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-[14px] font-medium text-ink-2 hover:text-ink', className)}
    >
      <ChevronDown className={cn('size-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
      <bdi>{open ? fewer : more}</bdi>
    </button>
  );
}
