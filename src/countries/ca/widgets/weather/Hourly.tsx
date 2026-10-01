'use client';
/** The forecast's "Next 24 hours" strip. */
import { Sunrise, Sunset } from 'lucide-react';
import { WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { useLocalTime, useTemp } from './format';
import { SkyIcon } from './icons';
import messages from './messages';
import type { Current, Hour } from './types';

type Sun = { rise: string; set: string } | null;
type Slot = { kind: 'now'; c: Current } | { kind: 'hour'; h: Hour } | { kind: 'sun'; at: string; rise: boolean };

/** "Now", then each forecast hour, with sunrise and sunset slotted in where they fall. */
function slotsOf(hours: Hour[], sun: Sun, now: Current | null): Slot[] {
  const out: Slot[] = [];
  const sunBetween = (from: string, to: string) => {
    if (!sun) return;
    for (const [at, rise] of [
      [sun.rise, true],
      [sun.set, false],
    ] as const) {
      if (Date.parse(at) > Date.parse(from) && Date.parse(at) <= Date.parse(to)) out.push({ kind: 'sun', at, rise });
    }
  };
  if (now && now.temp != null) {
    out.push({ kind: 'now', c: now });
    if (hours[0]) sunBetween(now.observedAt, hours[0].at);
  }
  hours.forEach((h, i) => {
    out.push({ kind: 'hour', h });
    const next = hours[i + 1];
    if (next) sunBetween(h.at, next.at);
  });
  return out;
}

/**
 * The next 24 hours. When there is a fresh observation, the first slot is "Now" and shows exactly what the
 * hero shows (observed temperature, sky, day/night); forecast hours follow, each labelled with its own hour.
 */
export function Hourly({ hours: all, sun, tz, now, fetchedAt }: { hours: Hour[]; sun: Sun; tz: string; now: Current | null; fetchedAt: string }) {
  const t = useMessages(messages);
  const temp = useTemp();
  const time = useLocalTime(tz);
  const { fmt } = useLocale();
  const { ref: stripRef, maskStyle } = useScrollEdges<HTMLDivElement>();
  // Hours already over when we fetched (an older copy of the forecast) aren't "next".
  const hours = all.filter((h) => !(Date.parse(h.at) + 3600_000 <= Date.parse(fetchedAt)));
  if (!hours.length) return null;
  const slots = slotsOf(hours, sun, now);
  const pct = (v: number) => t('unit.pct', { v: fmt.number(v) });
  // Each slot's own sentence for screen readers (the visual cell is icon, number and a tiny label).
  const srHour = (h: Hour) => t(h.pop ? 'hourly.srHourPop' : 'hourly.srHour', { time: time.hour(h.at), temp: temp(h.temp), condition: h.condition, pop: pct(h.pop ?? 0) });
  const cell = 'flex w-[58px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-[14px] py-2.5';
  const label = 'whitespace-nowrap text-[12.5px] font-medium text-ink-2';
  return (
    <WidgetSection title={t('hourly.title')}>
      {/* Scrollable strip: focusable so keyboard users can scroll it. A real list: every hour shown, and sunrise and
          sunset, is one item with its own sentence for screen readers. */}
      <div
        ref={stripRef}
        style={maskStyle}
        role="group"
        tabIndex={0}
        aria-label={t('hourly.label')}
        className="-mx-5 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink sm:-mx-6 sm:px-5"
      >
        <ol className="m-0 flex w-max list-none snap-x gap-1 p-0 pe-8">
          {slots.map((s, i) =>
            s.kind === 'now' ? (
              // Sized to its word ("Maintenant" is wider than an hour), never narrower than the hour cells.
              <li key="now" className={cn(cell, 'w-auto min-w-[58px] bg-paper-2 px-2.5')}>
                <span className="sr-only">{t('hourly.srNow', { temp: temp(s.c.temp), condition: s.c.condition })}</span>
                <span className="contents" aria-hidden>
                  <span className={cn(label, 'text-ink')}>{t('hourly.now')}</span>
                  <SkyIcon sky={s.c.sky} night={s.c.night} className="size-6" />
                  <span className="h-4" />
                  <span className="font-serif text-[19px] leading-none tracking-[-.02em] text-ink">{temp(s.c.temp)}</span>
                </span>
              </li>
            ) : s.kind === 'hour' ? (
              <li key={s.h.at} className={cell}>
                <span className="sr-only">{srHour(s.h)}</span>
                <span className="contents" aria-hidden>
                  <span className={label}>
                    <bdi>{time.hour(s.h.at)}</bdi>
                  </span>
                  <SkyIcon sky={s.h.sky} night={s.h.night} className="size-6" />
                  <span className="h-4 whitespace-nowrap font-mono text-[11px] text-glacier">{s.h.pop && s.h.pop >= 20 ? pct(s.h.pop) : ''}</span>
                  <span className="font-serif text-[19px] leading-none tracking-[-.02em] text-ink">{temp(s.h.temp)}</span>
                </span>
              </li>
            ) : (
              <li key={`sun-${i}`} className={cell}>
                <span className="sr-only">{t(s.rise ? 'hourly.srRise' : 'hourly.srSet', { time: time.time(s.at) })}</span>
                <span className="contents" aria-hidden>
                  <span className={label}>
                    <bdi>{time.time(s.at)}</bdi>
                  </span>
                  {s.rise ? <Sunrise className="size-6 text-[var(--wx-sun)]" strokeWidth={1.7} /> : <Sunset className="size-6 text-[var(--wx-dusk)]" strokeWidth={1.7} />}
                  <span className="h-4" />
                  <span className="text-[12.5px] font-medium leading-none text-ink-2">{s.rise ? t('sun.rise') : t('sun.set')}</span>
                </span>
              </li>
            ),
          )}
        </ol>
      </div>
    </WidgetSection>
  );
}
