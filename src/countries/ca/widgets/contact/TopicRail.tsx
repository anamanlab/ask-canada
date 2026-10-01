'use client';
/**
 * The directory's topic chips: one quiet row at every width (nothing orphaned on a second line). It scrolls
 * sideways when the topics don't fit; a fade marks the side with more, and mouse users get a small scroll button.
 * One choice at a time, so it is a radio group: a single Tab stop, arrow keys move (and choose) between topics.
 */
import { useCallback, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dirOf, useMediaQuery, useRovingFocus, useScrollEdges } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import type { Topic } from './data';
import messages from './messages';

type Filter = Topic | 'all';

/** Room kept clear at the reading end of the rail for its fade (and the scroll button that sits on it). */
const FADE = 64;

/** Bring a chip inside the rail's gutter, clear of the fade. Horizontal only: it never moves the page. */
function reveal(row: HTMLElement, chip: HTMLElement) {
  if (row.scrollWidth <= row.clientWidth) return;
  const pad = parseFloat(getComputedStyle(row).paddingInlineStart) || 0;
  const r = row.getBoundingClientRect();
  const c = chip.getBoundingClientRect();
  // The fade sits at the reading end (right in LTR, left in RTL); the other side only needs the gutter.
  const [right, left] = dirOf(row) === 'rtl' ? [pad, pad + FADE] : [pad + FADE, pad];
  const delta = c.right > r.right - right ? c.right - (r.right - right) : c.left < r.left + left ? c.left - (r.left + left) : 0;
  if (delta) row.scrollLeft += delta;
}

export function TopicRail({ topics, value, onChange }: { topics: readonly Filter[]; value: Filter; onChange: (topic: Filter) => void }) {
  const t = useMessages(messages);
  const { ref: edgesRef, start, end, maskStyle, scrollBy } = useScrollEdges<HTMLDivElement>();
  /** Mouse or trackpad (not touch): only then does the rail get a scroll button; touch users swipe. */
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const row = useRef<HTMLDivElement | null>(null);
  const selected = useRef<HTMLElement | null>(null);
  const roving = useRovingFocus({ count: topics.length, index: topics.indexOf(value), onMove: (i) => onChange(topics[i]) });
  const railRef = useCallback(
    (el: HTMLDivElement | null) => {
      row.current = el;
      if (!el) return;
      // The card can open on a topic far along the rail ("Fraud"): start with it in view.
      if (selected.current) reveal(el, selected.current);
      return edgesRef(el);
    },
    [edgesRef],
  );

  return (
    <div className="relative mt-3">
      <div
        ref={railRef}
        className="flex scroll-px-5 gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        style={maskStyle}
        role="radiogroup"
        aria-label={t('filter.label')}
      >
        {topics.map((f, i) => {
          const item = roving.itemProps(i);
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={value === f}
              tabIndex={item.tabIndex}
              onKeyDown={item.onKeyDown}
              ref={(el) => {
                item.ref(el);
                if (value === f) selected.current = el;
              }}
              // Arrow keys move focus along the rail: keep the focused chip clear of the fade.
              onFocus={(e) => row.current && reveal(row.current, e.currentTarget)}
              onClick={() => onChange(f)}
              className="group flex min-h-11 shrink-0 items-center focus-visible:outline-none"
            >
              <span
                className={cn(
                  'inline-flex h-8 items-center whitespace-nowrap rounded-full border px-[11px] text-[13px] font-medium transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink',
                  // One filled pill for the chosen topic; the others are quiet labels, so the row doesn't compete with the answer.
                  value === f ? 'border-ink bg-ink text-paper' : 'border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink',
                )}
              >
                {t(`topic.${f}`)}
              </span>
            </button>
          );
        })}
        {/* Room past the last chip so it can scroll clear of the fade. */}
        <span className={cn('shrink-0', start || end ? 'w-8' : 'w-0')} aria-hidden />
      </div>
      {end && finePointer ? (
        <>
          {/*
            An opaque strip under the scroll button, so no chip fragment shows on either side of it. Gradients
            have no logical direction (no "to inline-end"), so this is the one place with an explicit rtl: variant.
          */}
          <span
            className="pointer-events-none absolute inset-y-0 end-0 hidden w-20 bg-[linear-gradient(to_right,transparent,var(--card)_28px)] rtl:bg-[linear-gradient(to_left,transparent,var(--card)_28px)] @xl:block"
            aria-hidden
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            title={t('filter.more')}
            onClick={() => scrollBy(1)}
            className="absolute inset-y-0 end-3 my-auto hidden size-8 place-items-center rounded-full border border-hair-2 bg-card text-ink-2 shadow-sm hover:text-ink @xl:grid"
          >
            <ChevronRight className="size-4 flip-rtl" strokeWidth={2.2} />
          </button>
        </>
      ) : null}
    </div>
  );
}
