'use client';
/**
 * The days calculator's one chart: the 5-year window (PR start, time before PR, trips) with the totals as
 * its legend, so the parts always add up to the number in the ring. Pointing at a trip on the timeline
 * lights up its row in the list, and the other way round. Two sr-only sentences are the text equivalent.
 * When time before PR is over its cap, only the days that earned credit keep the full hatch.
 */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { cn } from '@/lib/cn';
import messages from './messages';
import { RULES } from './data';
import { dayNum, type PresenceResult } from './presence';
import { formatDays as days } from './shared';

const HATCH = 'bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--pine)_45%,transparent)_0_2px,color-mix(in_oklab,var(--pine)_15%,transparent)_2px_4px)]';
/** Time before PR on the timeline: the days that earn credit, and (fainter) the days past the 365-day cap. */
const BAND = 'bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--pine)_40%,transparent)_0_4px,color-mix(in_oklab,var(--pine)_14%,transparent)_4px_8px)]';
const BAND_FAINT = 'bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--pine)_16%,transparent)_0_4px,color-mix(in_oklab,var(--pine)_5%,transparent)_4px_8px)]';
/** Days in Canada before PR that fill the cap (730 half days = 365). */
const CAP_DAYS = RULES.tempCap / RULES.tempFactor;
/** From @xl the legend is one row that spans the timeline: as many columns as it has items (2 to 4). */
const LEGEND_COLS: Record<number, string> = { 2: '@xl:grid-cols-2', 3: '@xl:grid-cols-3', 4: '@xl:grid-cols-4' };

export function WindowChart({
  result,
  prDate,
  tempStart,
  active,
  onActive,
  onReveal,
}: {
  result: PresenceResult;
  prDate: string;
  tempStart: string | null;
  /** The trip (by id) under the pointer or with focus, here or in the trip list. */
  active: string | null;
  onActive: (id: string | null) => void;
  /** Bring this trip's row in the list into view (a tap or click on the timeline). */
  onReveal: (id: string) => void;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const s = dayNum(result.window.start);
  const e = dayNum(result.window.end) + 1;
  const span = e - s;
  const at = (day: number) => Math.max(0, Math.min(100, ((day - s) / span) * 100));
  const pos = (iso: string) => at(dayNum(iso));
  const prPos = pos(prDate);
  const tempPos = tempStart ? pos(tempStart) : null;
  // Only trips that cost days in this window: a same-day or next-day trip has no full day away, so it isn't drawn.
  const inWindow = result.trips.filter((tr) => tr.valid && tr.daysInWindow > 0 && tr.returned >= result.window.start && tr.left <= result.window.end);
  const years: { at: number; label: string }[] = [];
  for (let y = Number(result.window.start.slice(0, 4)) + 1; y <= Number(result.window.end.slice(0, 4)); y++) {
    years.push({ at: pos(`${y}-01-01`), label: String(y) });
  }
  // Over the cap: the most recent 730 days in Canada before PR are the ones that earned the 365. Count back from the
  // PR date, skipping full days away, to find where that credited stretch starts; earlier time is drawn fainter.
  let creditedPos = tempPos;
  if (result.temp.capped && tempStart) {
    const away = result.trips.filter((tr) => tr.valid).map((tr) => [dayNum(tr.left), dayNum(tr.returned)] as const);
    const lo = Math.max(s, dayNum(tempStart));
    let need = CAP_DAYS;
    let d = dayNum(prDate) - 1;
    for (; d >= lo && need > 0; d--) if (!away.some(([a, b]) => d > a && d < b)) need--;
    creditedPos = at(d + 1);
  }
  const short = (iso: string) => fmt.date(iso, { month: 'short', year: 'numeric' });
  const away = result.pr.absent + result.temp.absent;
  const n = (v: number) => days(fmt, v);
  // The legend carries the totals. One rounding rule everywhere (exact half days), so the parts add up to the ring.
  const legend = [
    { dot: 'bg-pine/80', label: t('presence.meter.pr'), value: n(result.pr.present) },
    result.temp.calendar > 0 ? { dot: HATCH, label: t(result.temp.capped ? 'presence.meter.tempCapped' : 'presence.meter.temp', { max: fmt.number(RULES.tempCap) }), value: n(result.temp.credit) } : null,
    away > 0 ? { dot: 'bg-maple', label: t('presence.meter.away'), value: fmt.number(away) } : null,
    // Not drawn on the timeline, so a hollow dot.
    result.shortfall > 0
      ? { dot: 'border-[1.5px] border-ink-3', label: t('presence.meter.need'), value: n(result.shortfall) }
      : { dot: 'border-[1.5px] border-pine', label: t('presence.meter.over'), value: n(result.surplus) },
  ].filter((x) => x != null);
  return (
    <div className="px-5 pt-7 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">{t('presence.window.title')}</p>
        <p className="m-0 text-[13px] tabular-nums text-ink-3">
          <bdi>
            {t('presence.window.range', {
              start: short(result.window.start),
              end: short(result.window.end),
            })}
          </bdi>
        </p>
      </div>
      <div className="relative mt-2.5 h-[68px]" aria-hidden>
        {/* PR marker: its own label row above the bar, so it never runs into the year labels below. */}
        {prPos > 0 && prPos < 100 ? (
          <>
            <span
              className={cn('absolute top-0 whitespace-nowrap text-[12px] font-semibold leading-none tabular-nums text-ink', prPos > 80 ? '-translate-x-full rtl:translate-x-full' : '')}
              style={{
                insetInlineStart: prPos > 80 ? `calc(${prPos}% + 1px)` : `${prPos}%`,
              }}
            >
              {t('presence.window.prStart', { date: short(prDate) })}
            </span>
            <span className="absolute top-[15px] h-[36px] w-0.5 rounded-full bg-ink" style={{ insetInlineStart: `calc(${prPos}% - 1px)` }} />
          </>
        ) : null}
        <div className="absolute inset-x-0 top-[18px] h-[30px] overflow-hidden rounded-field bg-paper-2">
          {tempPos != null && creditedPos != null && tempPos < prPos ? (
            <>
              {creditedPos > tempPos ? <span className={cn('absolute inset-y-0', BAND_FAINT)} style={{ insetInlineStart: `${tempPos}%`, width: `${creditedPos - tempPos}%` }} /> : null}
              <span className={cn('absolute inset-y-0', BAND)} style={{ insetInlineStart: `${creditedPos}%`, width: `${prPos - creditedPos}%` }} />
            </>
          ) : null}
          <span className="absolute inset-y-0 bg-pine/80" style={{ insetInlineStart: `${prPos}%`, insetInlineEnd: 0 }} />
          {years.map((y) => (
            <span key={y.label} className="absolute inset-y-0 w-px bg-card/70" style={{ insetInlineStart: `${y.at}%` }} />
          ))}
          {inWindow.map((tr) => {
            const a = pos(tr.left);
            const b = pos(tr.returned);
            const on = active != null && tr.id === active;
            return (
              <span
                key={tr.id}
                // A wider, invisible hit area: the trip itself can be a few pixels wide.
                className={cn(
                  'absolute inset-y-0 transition-[background-color,box-shadow] duration-150 before:absolute before:inset-y-0 before:-inset-x-2 motion-reduce:transition-none',
                  on ? 'z-10 bg-ink shadow-[0_0_0_2px_var(--card)]' : 'bg-maple shadow-[0_0_0_1px_var(--card)]',
                )}
                style={{
                  insetInlineStart: `${a}%`,
                  width: `max(4px, ${b - a}%)`,
                }}
                // A mouse or pen highlights on hover. A finger has no hover: a tap selects the trip and brings its
                // row into view; a second tap lets it go.
                onPointerEnter={(e) => (e.pointerType === 'touch' ? undefined : onActive(tr.id ?? null))}
                onPointerLeave={(e) => (e.pointerType === 'touch' ? undefined : onActive(null))}
                onClick={(e) => {
                  if (!tr.id) return;
                  const touch = (e.nativeEvent as PointerEvent).pointerType === 'touch';
                  if (touch && on) return onActive(null);
                  onActive(tr.id);
                  onReveal(tr.id);
                }}
              />
            );
          })}
          {/* A hairline edge so the unfilled track stays visible in dark mode (WCAG 1.4.11). */}
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-hair-2 ring-inset" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3.5 text-[12px] leading-none tabular-nums text-ink-3">
          {years.map((y) => (
            <span key={y.label} className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${y.at}%` }}>
              {/* Skip labels at the edges and next to the PR marker. */}
              {y.at > 4 && y.at < 96 && Math.abs(y.at - prPos) > 3.5 ? y.label : ''}
            </span>
          ))}
        </div>
      </div>
      {/* Each item spans two rows of a shared grid, so every value sits on the same line whatever its label's length. */}
      <dl className={cn('m-0 mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5', LEGEND_COLS[legend.length])}>
        {legend.map((item) => (
          <Legend key={item.label} {...item} />
        ))}
      </dl>
      <p className="sr-only">
        {t('presence.window.sr', {
          start: fmt.date(result.window.start, { dateStyle: 'long' }),
          end: fmt.date(result.window.end, { dateStyle: 'long' }),
          pr: fmt.date(prDate, { dateStyle: 'long' }),
          trips: inWindow.length,
        })}{' '}
        {t('presence.meter.sr', {
          total: n(result.total),
          need: fmt.number(result.required),
          pr: n(result.pr.present),
          temp: n(result.temp.credit),
          away: fmt.number(away),
        })}
      </p>
    </div>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="row-span-2 grid min-w-0 grid-rows-subgrid gap-y-0.5">
      <dt className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-2">
        <i className={cn('mt-[5px] inline-block size-2.5 shrink-0 self-start rounded-full', dot)} aria-hidden />
        <span className="min-w-0">{label}</span>
      </dt>
      <dd className="m-0 ms-[18px] self-end font-serif text-[22px] tabular-nums leading-tight text-ink">
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  );
}
