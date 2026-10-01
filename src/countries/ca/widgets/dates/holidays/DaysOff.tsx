'use client';
import { cn } from '@/lib/cn';
import { addDays, fromISO, isWeekend } from '@/lib/dates/business-days';
import { useMessages } from '@/lib/i18n/widget';
import type { HolidayItem } from '../data';
import messages from '../messages';
import { useDate, Ord } from '../parts';
import { dayOff } from '../select';

/** The run of days off around the next holiday (weekend + holiday), e.g. Sat · Sun · Mon. */
export function DaysOff({ next, lw, off, today, rangeShown }: { next: HolidayItem; lw: { start: string; end: string; days: number } | null; off: Set<string>; today: string; rangeShown?: boolean }) {
  const t = useMessages(messages);
  const fmtDate = useDate();
  const day = dayOff(next);
  // Show the long weekend, or the holiday's week (Mon–Fri around it) when it's midweek.
  const start = lw?.start ?? addDays(day, -Math.min(2, (fromISO(day).getDay() + 6) % 7));
  const end = lw?.end ?? addDays(start, 4);
  const days: string[] = [];
  for (let d = start; d <= end && days.length < 7; d = addDays(d, 1)) days.push(d);
  const labels = days.filter((d) => isWeekend(d) || off.has(d)).map((d) => fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' }));
  return (
    <div className="mt-4">
      <p className="m-0 mb-2 text-[13px] font-medium text-ink-2">
        {lw ? (
          <>
            <b className="font-semibold text-ink">
              <bdi>{t('hol.lw', { count: lw.days })}</bdi>
            </b>
            {rangeShown ? null : (
              <>
                {' '}
                {/* One unbreakable unit: the range never splits ("du 10 oct. au" / "12 oct."); on its own line in a phone-width column. */}
                <span className="whitespace-nowrap font-normal @max-md:block">
                  <span aria-hidden className="@max-md:hidden">
                    ·{' '}
                  </span>
                  <bdi>
                    <Ord>{t('hol.lw.range', { start: fmtDate(lw.start, { month: 'short', day: 'numeric' }), end: fmtDate(lw.end, { month: 'short', day: 'numeric' }) })}</Ord>
                  </bdi>
                </span>
              </>
            )}
          </>
        ) : (
          t('hol.midweek')
        )}
      </p>
      {/* One picture with one text alternative (the days off), not a list of hidden items. */}
      <div role="img" className="flex gap-1.5" aria-label={t('hol.strip', { list: labels.join(', ') })}>
        {days.map((d) => {
          const holiday = off.has(d);
          const weekend = isWeekend(d);
          const isOff = holiday || weekend;
          return (
            <span
              key={d}
              aria-hidden
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center rounded-[12px] border px-1 py-1.5',
                holiday ? 'border-transparent bg-maple-ink text-paper' : isOff ? 'border-hair bg-card text-ink' : 'border-dashed border-hair-2 text-ink-3',
                d === today && !holiday && 'border-solid border-ink',
              )}
            >
              <span className={cn('font-mono text-[10.5px] font-medium uppercase tracking-[.06em]', holiday ? 'text-paper' : 'text-ink-3')}>
                {fmtDate(d, { weekday: 'short' }).replace('.', '')}
              </span>
              <span className="font-serif text-[20px] leading-tight [font-variation-settings:'opsz'_36]">{Number(d.slice(8))}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
