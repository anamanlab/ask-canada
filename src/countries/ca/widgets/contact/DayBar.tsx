'use client';
/** The 24-hour day bar: today's agent and automated windows in the viewer's own time, with a "now" needle. */
import type { Holiday } from '@/lib/dates/business-days';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useTimeFmt } from './clock';
import type { Hours } from './data';
import { dayFraction, daySegments, wallClock, zonedToInstant } from './hours';
import messages from './messages';

const atHour = (now: number, tz: string, hh: number) => zonedToInstant(wallClock(now, tz).date, hh * 60, tz);
const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

/**
 * Today at a glance: a 24-hour track in the viewer's time, with the agent window (solid), the automated
 * window (lighter) and a labelled "now" needle. Every bar carries the same clock labels (midnight, 6 a.m., noon,
 * 6 p.m., midnight; narrow cards keep midnight and noon). The legend appears once per card, built from what the
 * bar actually draws: "Agents" on the first bar (`legend`), "Automated line" on the first bar that draws one (`legendAuto`). A day with no agent window (weekend,
 * holiday) is hatched and labelled "Closed today", so it reads as closed on purpose, not as missing data.
 * Logical positioning, so it mirrors in right-to-left layouts.
 */
export function DayBar({
  agents,
  automated,
  now,
  tz,
  holidays,
  label,
  legend,
  legendAuto,
}: {
  /** The first bar of the card: it introduces the "Agents" swatch. */
  legend?: boolean;
  /** This bar introduces the "Automated line" swatch (the first bar in the card that draws one). */
  legendAuto?: boolean;
  agents?: Hours;
  automated?: Hours;
  now: number;
  tz: string;
  holidays: Holiday[];
  label: string;
}) {
  const t = useMessages(messages);
  const { time } = useTimeFmt(tz);
  const segA = daySegments(agents, now, tz, holidays);
  const segB = daySegments(automated, now, tz, holidays);
  const pos = Math.min(1, Math.max(0, dayFraction(now, tz)));
  // Keep the "Now" label inside the track near either end.
  const align = pos < 0.14 ? 'start' : pos > 0.86 ? 'end' : 'center';
  const closed = !!agents && segA.length === 0;
  // The closed label sits in the half of the track away from the "now" needle.
  const closedSide = pos < 0.5 ? 'end' : 'start';
  const showAgents = segA.length > 0 && !!legend;
  const showAuto = segB.length > 0 && !!legendAuto;
  return (
    <div className="relative mt-3 pb-1 pt-5" role="img" aria-label={label}>
      <span
        className={cn('absolute top-0 flex w-0', align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : 'justify-start')}
        style={{ insetInlineStart: pct(pos) }}
        aria-hidden
      >
        <bdi className="shrink-0 whitespace-nowrap text-[11.5px] font-semibold leading-none text-ink">{t('bar.now', { time: time(now) })}</bdi>
      </span>
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-paper-3',
          // Dark: paper tones are a shade apart on the navy card, so the track and the hatch use the hairline colour (and a hairline edge).
          closed
            ? 'h-[18px] bg-[repeating-linear-gradient(135deg,var(--paper-3)_0_5px,var(--paper-2)_5px_10px)] dark:bg-transparent dark:bg-[repeating-linear-gradient(135deg,var(--hair-2)_0_5px,transparent_5px_10px)] dark:shadow-[inset_0_0_0_1px_var(--hair-2)]'
            : 'h-2.5 dark:bg-hair-2',
        )}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <span key={f} className="absolute inset-y-0 w-px bg-card/70" style={{ insetInlineStart: pct(f) }} aria-hidden />
        ))}
        {segB.map((s) => (
          // Opaque base so the hatching of a closed day doesn't show through the automated window.
          <span key={`b${s.from}`} className="absolute inset-y-0 bg-paper-3" style={{ insetInlineStart: pct(s.from), width: pct(s.to - s.from) }} aria-hidden>
            <span className="absolute inset-0 bg-pine/40" />
          </span>
        ))}
        {segA.map((s) => (
          <span key={`a${s.from}`} className="absolute inset-y-0 rounded-full bg-pine" style={{ insetInlineStart: pct(s.from), width: pct(s.to - s.from) }} aria-hidden />
        ))}
        {closed ? (
          <span
            className={cn('absolute inset-y-0 flex w-1/2 items-center px-2', closedSide === 'end' ? 'end-0 justify-end' : 'start-0 justify-start')}
            aria-hidden
          >
            <bdi className="whitespace-nowrap rounded-chip bg-card px-2 text-[11px] font-medium leading-[14px] text-ink-2">{segB.length ? t('bar.agentsClosed') : t('bar.closedToday')}</bdi>
          </span>
        ) : null}
      </div>
      {/* Zero-width anchors + flex alignment: correct in LTR, RTL and LTR content inside an RTL page. */}
      <span className={cn('absolute flex w-0 justify-center', closed ? 'top-[18px]' : 'top-[16px]')} style={{ insetInlineStart: pct(pos) }} aria-hidden>
        <span className={cn('w-[3px] shrink-0 rounded-full bg-ink shadow-[0_0_0_2px_var(--card)]', closed ? 'h-[22px]' : 'h-[18px]')} />
      </span>
      <DayTicks tz={tz} now={now} />
      {showAgents || showAuto ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] leading-none text-ink-2" aria-hidden>
          {showAgents ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-full bg-pine" />
              {t('bar.legendAgents')}
            </span>
          ) : null}
          {showAuto ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-full bg-pine/40" />
              {t('bar.legendAuto')}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Clock labels under the track: midnight, noon, midnight, plus 6 a.m. and 6 p.m. on wider cards. */
function DayTicks({ tz, now }: { tz: string; now: number }) {
  const { time } = useTimeFmt(tz);
  const t = useMessages(messages);
  // Label the quarter marks with real clock times in the viewer's zone. Narrow cards keep only midnight,
  // noon and midnight so labels never touch; the ends are pinned inside the track.
  const labels = [0, 6, 12, 18, 24].map((hh) => ({ hh, f: hh / 24, text: hh === 12 ? t('bar.noon') : hh === 0 || hh === 24 ? t('bar.midnight') : time(atHour(now, tz, hh)) }));
  return (
    <div className="relative mt-1.5 h-4 text-[11px] leading-4 text-ink-3" aria-hidden>
      {labels.map((l, i) => (
        <span
          key={l.hh}
          className={cn(
            'absolute top-0 flex w-0',
            i === 0 ? 'justify-start' : i === labels.length - 1 ? 'justify-end' : 'justify-center',
            (l.hh === 6 || l.hh === 18) && 'hidden @lg:flex',
          )}
          style={{ insetInlineStart: `${l.f * 100}%` }}
        >
          <bdi className="shrink-0 whitespace-nowrap">{l.text}</bdi>
        </span>
      ))}
    </div>
  );
}
