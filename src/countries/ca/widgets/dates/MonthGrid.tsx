'use client';
/**
 * Month calendar for the key dates: up to four program-colour dots per day, a maple tint for holidays, an ink ring for today,
 * previous / next / "Today" within the months that have dates. The core CalendarGrid has four tones, no month
 * navigation and no holiday tint, so this one stays local. Each marked day is a button (selects it); the grid is
 * a table with weekday headers, and every marked day carries its full label for screen readers.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addMonths } from '@/lib/dates/business-days';
import { useMessages } from '@/lib/i18n/widget';
import type { Tone } from './data';
import messages from './messages';
import { DOT, useDate } from './parts';

export type GridMark = { date: string; tones: Tone[]; holiday?: boolean; label: string };

/**
 * The disc behind a day with a payment or deadline ("tap me"). A tint of `--ink`, not `bg-paper-2`: on the card that
 * token is nearly the card's own colour in dark mode (about 1.05:1), so the disc vanished there.
 */
const MARKED = 'bg-[color-mix(in_oklab,var(--ink)_9%,transparent)]';
/**
 * A hairline of maple around a holiday's wash, on the day and on its legend swatch: in dark mode `bg-maple-wash` is
 * close to the card's own colour, and the 14px swatch all but vanished.
 */
const HOLIDAY_RING = 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--maple)_40%,transparent)]';

/**
 * Today: a 2px ring in ink, on the day and on its legend swatch. Ink, not maple: a holiday is a maple wash with a maple
 * hairline and a red numeral, and a maple ring beside it made Thanksgiving read as "today".
 */
const TODAY_RING = 'shadow-[inset_0_0_0_2px_var(--ink)]';

const pad = (n: number) => String(n).padStart(2, '0');
const shiftMonth = (ym: string, n: number) => addMonths(`${ym}-01`, n).slice(0, 7);

export function MonthGrid({
  month,
  marks,
  today,
  selected,
  onSelect,
  onMonth,
  min,
  max,
  weekStartsOn = 0,
}: {
  month: string;
  marks: GridMark[];
  today: string;
  selected?: string | null;
  onSelect: (iso: string | null) => void;
  /** Show another month (the caller also clears the chosen day). */
  onMonth: (ym: string) => void;
  min: string;
  max: string;
  weekStartsOn?: 0 | 1;
}) {
  const t = useMessages(messages);
  const fmtDate = useDate();
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const days = new Date(y, m, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const byDate = new Map(marks.map((mk) => [mk.date, mk]));
  // The ISO string, not the local `Date` above: the title never depends on the reader's time zone.
  const title = fmtDate(`${month}-01`, { month: 'long', year: 'numeric' });
  const wk = Array.from({ length: 7 }, (_, i) => {
    // February 1, 2026 is a Sunday.
    const d = `2026-02-${pad(1 + ((i + weekStartsOn) % 7))}`;
    return { short: fmtDate(d, { weekday: 'narrow' }), long: fmtDate(d, { weekday: 'long' }) };
  });
  const todayMonth = today.slice(0, 7);

  return (
    <div className="text-start">
      {/* A long month («Septembre 2026») beside «Aujourd’hui» and the arrows: in a 320px-wide page (or at 400% zoom)
          they don't fit on one line, so the controls are one group that drops under the title instead of pushing the
          table wider than the card (WCAG 1.4.10). */}
      <div className="mb-2 flex flex-wrap items-center gap-x-1">
        <p className="m-0 min-w-0 pe-3 font-serif text-[19px] capitalize leading-tight tracking-[-.015em] text-ink @md:text-[21px]">
          {title}
        </p>
        <span className="ms-auto flex shrink-0 items-center gap-1">
        {month !== todayMonth && todayMonth >= min && todayMonth <= max ? (
          <button
            type="button"
            onClick={() => onMonth(todayMonth)}
            className="min-h-11 shrink-0 rounded-full px-1.5 text-[13.5px] font-medium text-ink-2 hover:bg-hair hover:text-ink @md:px-2.5"
          >
            {t('month.today')}
          </button>
        ) : null}
        <IconButton label={t('month.prev')} icon={ChevronLeft} className="flip-rtl" disabled={month <= min} onClick={() => onMonth(shiftMonth(month, -1))} />
        <IconButton label={t('month.next')} icon={ChevronRight} className="flip-rtl" disabled={month >= max} onClick={() => onMonth(shiftMonth(month, 1))} />
        </span>
      </div>
      <table className="w-full table-fixed border-collapse text-center" aria-label={t('grid.label', { month: title })}>
        <thead>
          <tr>
            {wk.map((d, i) => (
              <th key={i} scope="col" abbr={d.long} className="pb-1.5 font-mono text-[11px] font-medium uppercase text-ink-3">
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((day, c) => {
                if (!day) return <td key={c} />;
                const iso = `${month}-${pad(day)}`;
                const mk = byDate.get(iso);
                const isToday = iso === today;
                const isSel = iso === selected;
                const past = iso < today;
                const label = fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' }) + (mk ? ` — ${mk.label}` : '');
                const inner = (
                  <>
                    <span className={cn('tabular-nums', mk?.holiday && !isSel && 'text-maple-ink')}>{day}</span>
                    {mk?.tones.length ? (
                      <span className="absolute bottom-[12%] start-1/2 flex -translate-x-1/2 gap-[3px] rtl:translate-x-1/2" aria-hidden>
                        {[...new Set(mk.tones)].slice(0, 4).map((tone, i) => (
                          <span key={i} className={cn('size-[5px] rounded-full', isSel ? 'bg-paper' : DOT[tone])} />
                        ))}
                      </span>
                    ) : null}
                  </>
                );
                const cls = cn(
                  'relative mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full text-[15px] transition-[background-color,color,box-shadow] duration-150',
                  isSel ? 'bg-ink font-semibold text-paper' : mk ? 'font-semibold text-ink' : past ? 'text-ink-3' : 'text-ink-2',
                  !isSel && mk?.holiday && 'bg-maple-wash',
                  !isSel && mk?.holiday && !isToday && HOLIDAY_RING,
                  !isSel && mk && !mk.holiday && MARKED,
                  isToday && !isSel && TODAY_RING,
                  mk && past && !isSel && 'opacity-70',
                );
                return (
                  <td key={c} className="p-[1px]">
                    {mk ? (
                      <button
                        type="button"
                        aria-label={label}
                        aria-pressed={isSel}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => onSelect(isSel ? null : iso)}
                        className={cn(cls, !isSel && 'hover:bg-[color-mix(in_oklab,var(--ink)_15%,transparent)]')}
                      >
                        {inner}
                      </button>
                    ) : (
                      <span className={cls} aria-current={isToday ? 'date' : undefined}>
                        {inner}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-x-3 gap-y-1.5 p-0 text-[12.5px] text-ink-2" aria-hidden>
        {month === todayMonth ? (
          <li className="inline-flex items-center gap-1.5">
            <span className={cn('size-3.5 rounded-full', TODAY_RING)} />
            {t('grid.legendToday')}
          </li>
        ) : null}
        <li className="inline-flex items-center gap-1.5">
          <span className={cn('size-3.5 rounded-full bg-maple-wash', HOLIDAY_RING)} />
          {t('grid.legendHoliday')}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className={cn('grid size-3.5 place-items-center rounded-full', MARKED)}>
            <span className="size-[5px] rounded-full bg-ink-2" />
          </span>
          {t('grid.legendDate')}
        </li>
      </ul>
    </div>
  );
}
