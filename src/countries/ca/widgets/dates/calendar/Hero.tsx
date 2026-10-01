'use client';
/**
 * The calendar's hero: the next date that matters (payments issued the same day share it), with a countdown, and the
 * one other date followed when there's only one ("Then Old Age Security"), instead of a lone tile under it.
 */
import { CalendarPlus, ChevronRight, Info } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { BigDate, Countdown, Mark, cap, useRel, Ord } from '../parts';
import type { CalEvent } from '../types';
import { toneOf, type EventText } from './text';

export function Hero({
  group,
  today,
  following,
  noMorePayments,
  then,
  text,
  onAdd,
  onJump,
}: {
  /** The next date's events (empty when nothing is coming up). */
  group: CalEvent[];
  today: string;
  /** What they follow, for the empty state's wording. */
  following: { programs: boolean; any: boolean };
  /** Programs are followed but none has a published payment left. */
  noMorePayments: boolean;
  /** The only other date followed, shown as a second line that opens its day in the calendar. */
  then?: CalEvent;
  text: EventText;
  onAdd: (events: CalEvent[], id: string) => void;
  onJump: (iso: string) => void;
}) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const rel = useRel();
  const hero = group.at(0);
  return (
    <div
      className="relative mx-3 overflow-hidden rounded-[22px] border border-hair bg-[linear-gradient(135deg,color-mix(in_oklab,var(--a-teal)_20%,transparent),color-mix(in_oklab,var(--a-violet)_14%,transparent)_55%,color-mix(in_oklab,var(--a-rose)_14%,transparent))] px-4 py-4 sm:mx-4 sm:px-5 sm:py-5"
    >
      {hero ? (
        <div className="flex items-center gap-4 sm:gap-5">
          <BigDate date={hero.date} tone={toneOf(hero)} />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
              {hero.kind === 'payment' ? t('next.payment') : hero.kind === 'tax' ? t('next.deadline') : t('next.holiday')}
            </p>
            <p className="m-0 mt-1 text-balance font-serif text-[22px] leading-[1.12] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] @md:text-[25px]">
              {new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(group.map(text.name))}
            </p>
            <p className="m-0 mt-1.5 text-[15px] leading-snug text-ink-2">
              <Ord>{cap(text.long(hero.date))}</Ord>
              <Countdown>{rel(today, hero.date)}</Countdown>
            </p>
          </div>
          <IconButton
            label={t('action.addOne', { name: text.name(hero), date: text.long(hero.date) })}
            icon={CalendarPlus}
            className="hidden bg-card/70 shadow-sm @md:inline-grid"
            onClick={() => onAdd(group, hero.id)}
          />
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-ink-2 shadow-sm" aria-hidden>
            <Info className="size-[18px]" strokeWidth={2} />
          </span>
          <div>
            <p className="m-0 font-serif text-[21px] leading-tight tracking-[-.015em] text-ink">{following.any ? t('next.none.title') : t('next.pick')}</p>
            {following.programs ? <p className="m-0 mt-1 text-[14.5px] text-ink-2">{t('next.none.body')}</p> : null}
          </div>
        </div>
      )}
      {hero?.kind === 'payment' ? <p className="m-0 mt-3.5 text-[13px] leading-snug text-ink-2">{t('next.arrive')}</p> : null}
      {/* Who a deadline applies to ("Only if you pay your taxes by instalments"), or how an expected date is set. */}
      {hero?.kind === 'tax' ? <p className="m-0 mt-3.5 text-[13px] leading-snug text-ink-2"><Ord>{text.sub(hero)}</Ord></p> : null}
      {hero && noMorePayments ? (
        <p className="m-0 mt-3.5 flex items-start gap-2 text-[13px] leading-snug text-ink-2">
          <Info className="mt-px size-4 shrink-0 text-glacier" aria-hidden strokeWidth={2} />
          <span>
            <b className="font-semibold text-ink">{t('next.none.title')}.</b> {t('next.none.body')}
          </span>
        </p>
      ) : null}
      {hero?.onTimeBy ? <p className="m-0 mt-3.5 text-[13px] leading-snug text-ink-2"><Ord>{t('tax.onTime', { date: text.long(hero.onTimeBy) })}</Ord></p> : null}
      {then ? (
        <button
          type="button"
          onClick={() => onJump(then.date)}
          className="-mb-1.5 mt-3 flex min-h-11 w-full items-center gap-2.5 border-t border-ink/10 pt-1.5 text-start text-[14px] leading-snug text-ink-2 transition-colors hover:text-ink"
        >
          <Mark kind={then.kind} tone={toneOf(then)} />
          <span className="min-w-0 flex-1">
            {t('next.then', { name: text.shortName(then) })}
            <span className="whitespace-nowrap">
              {' · '}
              <b className="font-semibold text-ink"><Ord>{text.short(then.date)}</Ord></b>
            </span>{' '}
            <span className="whitespace-nowrap">· {rel(today, then.date)}</span>
          </span>
          <ChevronRight className="flip-rtl size-4 shrink-0 text-ink-3" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
