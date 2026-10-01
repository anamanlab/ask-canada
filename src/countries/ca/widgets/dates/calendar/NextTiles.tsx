'use client';
/**
 * "Next for each": the next date of every program, deadline and holiday followed (two or more: a single one is a line in
 * the hero). A tile jumps the calendar to its day.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { Mark, useRel, Ord } from '../parts';
import type { CalEvent } from '../types';
import { TILES_FOLDED, TILE_GRID, tileClass, tileSpans } from './layout';
import { toneOf, type EventText } from './text';

export function NextTiles({ items, today, selected, text, onJump }: { items: CalEvent[]; today: string; selected: string | null; text: EventText; onJump: (iso: string) => void }) {
  const t = useMessages(messages);
  const rel = useRel();
  // Phone-width column: two rows of tiles, the rest behind "Show N more".
  const [open, setOpen] = useState(false);
  const spans = tileSpans(items.length);
  return (
    <div className="px-5 pt-4 sm:px-6">
      <h4 className="m-0 mb-2.5 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">{t('next.others')}</h4>
      <ul className={cn('m-0 list-none p-0', TILE_GRID)}>
        {items.map((e, i) => (
          <li key={e.id} className={cn('min-w-0', tileClass(spans, i), !open && i >= TILES_FOLDED && '@max-md:hidden')}>
            <button
              type="button"
              onClick={() => onJump(e.date)}
              aria-label={`${text.name(e)}: ${text.long(e.date)}, ${rel(today, e.date)}`}
              className={cn(
                'flex h-full min-h-[76px] w-full flex-col items-start rounded-[14px] border bg-card px-3 py-2.5 text-start shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-hair-2 hover:shadow-md',
                selected === e.date ? 'border-ink' : 'border-hair',
              )}
            >
              <span className="flex items-start gap-2 text-[13px] font-medium leading-snug text-ink-2">
                <Mark kind={e.kind} tone={toneOf(e)} className="mt-[4px]" />
                <span className="min-w-0">{text.shortName(e)}</span>
              </span>
              <span className="mt-auto flex w-full flex-col pt-1.5">
                <span className="text-[16px] font-semibold leading-tight tracking-[-.01em] text-ink"><Ord>{text.short(e.date)}</Ord></span>
                <span className="whitespace-nowrap text-[12.5px] leading-snug text-ink-3">
                  {rel(today, e.date)}
                  {e.expected ? ` · ${t('tax.expected')}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {/* A real toggle that stays where it is: keyboard focus never falls off a button that removed itself. */}
      {items.length > TILES_FOLDED ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-hair bg-card text-[14px] font-medium text-ink shadow-sm transition-colors hover:border-hair-2 @md:hidden"
        >
          {open ? t('next.showFewer') : t('next.showAll', { count: items.length - TILES_FOLDED })}
          <ChevronDown className={cn('size-4 text-ink-3 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
