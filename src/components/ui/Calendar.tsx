/**
 * CalendarGrid + DateTile.
 *
 * <CalendarGrid month="2026-10" events={[{ date: '2026-10-12', label: 'Thanksgiving', tone: 'maple' }]}
 *   today="2026-09-29" onSelect={(iso) => …} weekStartsOn={0} />
 *   - Locale-aware month/weekday names; events are listed under the grid for screen readers.
 * <DateTile date="2026-10-12" tone="maple" />  the tear-off calendar tile (month band + day number).
 */
'use client';
import { cn } from '@/lib/cn';
import { dateFormat, parseISODate } from '@/lib/i18n/format';
import { useLocale } from '@/lib/i18n/provider';

export type CalendarEvent = { date: string; label: string; tone?: 'maple' | 'pine' | 'glacier' | 'amber' };

const dotTone = { maple: 'bg-maple', pine: 'bg-pine', glacier: 'bg-glacier', amber: 'bg-amber' };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function CalendarGrid({
  month,
  events = [],
  today,
  onSelect,
  selected,
  weekStartsOn = 0,
  className,
}: {
  month: string;
  events?: CalendarEvent[];
  today?: string;
  onSelect?: (iso: string) => void;
  selected?: string;
  weekStartsOn?: 0 | 1;
  className?: string;
}) {
  const { intl } = useLocale();
  const first = parseISODate(`${month}-01`);
  const y = first.getFullYear();
  const m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1, 12))];
  while (cells.length % 7) cells.push(null);
  const wk = Array.from({ length: 7 }, (_, i) =>
    dateFormat(intl, { weekday: 'narrow' }).format(new Date(2026, 1, 1 + ((i + weekStartsOn) % 7), 12)),
  );
  const wkLong = Array.from({ length: 7 }, (_, i) =>
    dateFormat(intl, { weekday: 'long' }).format(new Date(2026, 1, 1 + ((i + weekStartsOn) % 7), 12)),
  );
  const byDate = new Map<string, CalendarEvent[]>();
  events.forEach((e) => byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]));
  const title = dateFormat(intl, { month: 'long', year: 'numeric' }).format(first);
  const monthEvents = events.filter((e) => e.date.startsWith(month));
  return (
    <div className={cn('text-start', className)}>
      <p className="m-0 mb-3 font-serif text-[20px] capitalize tracking-[-.01em] text-ink">{title}</p>
      <table className="w-full table-fixed border-collapse text-center" role="grid" aria-label={title}>
        <thead>
          <tr>
            {wk.map((d, i) => (
              <th key={i} scope="col" abbr={wkLong[i]} className="pb-2 font-mono text-[11px] font-medium uppercase text-ink-3">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
                if (!d) return <td key={c} />;
                const k = iso(d);
                const ev = byDate.get(k);
                const isToday = k === today;
                const isSel = k === selected;
                const label = dateFormat(intl, { dateStyle: 'full' }).format(d) + (ev ? ` — ${ev.map((e) => e.label).join(', ')}` : '');
                const inner = (
                  <>
                    <span className="tabular-nums">{d.getDate()}</span>
                    {ev ? (
                      <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5" aria-hidden>
                        {ev.slice(0, 3).map((e, i) => (
                          <span key={i} className={cn('size-1 rounded-full', dotTone[e.tone ?? 'maple'])} />
                        ))}
                      </span>
                    ) : null}
                  </>
                );
                const cls = cn(
                  'relative mx-auto grid size-10 place-items-center rounded-full text-[14px] transition-colors',
                  isToday && 'font-semibold text-maple',
                  isSel && 'bg-ink text-paper',
                  !isSel && ev && 'bg-paper-2 font-medium text-ink',
                  !isSel && !ev && 'text-ink-2',
                );
                return (
                  <td key={c} className="p-0.5">
                    {onSelect ? (
                      <button type="button" aria-label={label} aria-pressed={isSel} onClick={() => onSelect(k)} className={cn(cls, 'hover:bg-hair')}>
                        {inner}
                      </button>
                    ) : (
                      <span aria-label={label} className={cls}>
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
      {monthEvents.length ? (
        <ul className="sr-only">
          {monthEvents.map((e) => (
            <li key={e.date + e.label}>
              {dateFormat(intl, { dateStyle: 'long' }).format(parseISODate(e.date))}: {e.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DateTile({ date, tone = 'maple', className }: { date: string; tone?: 'maple' | 'pine' | 'glacier'; className?: string }) {
  const { intl } = useLocale();
  const d = parseISODate(date);
  const band = { maple: 'bg-maple', pine: 'bg-pine', glacier: 'bg-glacier' }[tone];
  return (
    <span className={cn('inline-block w-[46px] shrink-0 overflow-hidden rounded-[12px] border border-hair bg-card text-center shadow-sm', className)} aria-hidden>
      <b className={cn('block py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] text-white', band)}>
        {dateFormat(intl, { month: 'short' }).format(d).replace('.', '')}
      </b>
      <span className="block font-serif text-[22px] leading-[1.25] text-ink [font-variation-settings:'opsz'_36]">{d.getDate()}</span>
    </span>
  );
}
