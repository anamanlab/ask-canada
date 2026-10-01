'use client';
/**
 * The timeline graphic (wide containers; phones get the stepper): a tall track of solid, tinted segments, each
 * labelled right on it when its name fits ("Processing", "Online renewal window"), with labelled pins above.
 * Only a segment too short for its name (the few days of mail delivery) and the closed-day shading fall back
 * to a one-line key under the axis.
 *
 * Pin labels are placed in px from the measured width: each keeps its pin inside its span, is clamped to the
 * track, and drops below the bar when it would touch the previous one (French labels run ~20% longer, so fixed
 * % thresholds aren't enough). Widths come from the real advance of the label font (a hidden probe holding the
 * labels themselves), so a fallback font or text-only zoom keeps the placement right.
 * Decorative: the timeline's sr-only sentence carries the same dates.
 */
import { cn } from '@/lib/cn';
import { useElementSize } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { axisPos, type Axis } from './axis';
import { ordinal, sentenceCase } from './shared';

export type PinSpec = { key: string; at: number; label: string; tone: 'ink' | 'maple' | 'glacier'; solid?: boolean };

/**
 * A stretch of the track between two axis positions (0–100).
 * - `label` is written on the segment when it fits (between `labelFrom` and `labelTo`, the stretch no other
 *   segment is drawn over); otherwise `legend` names it in the key under the axis.
 * - `veil`: on a day axis, shade the weekends and holidays it spans ("2 to 9 business days" skips them).
 */
export type Segment = {
  key: string;
  from: number;
  to: number;
  className: string;
  label: string;
  labelClassName: string;
  labelFrom?: number;
  labelTo?: number;
  legend: string;
  minWidth?: number;
  veil?: boolean;
};

/** Pin labels and segment names share one type: the interface sans, a size up from the old mono captions. */
const LABEL_TYPE = 'font-sans text-[12.5px] font-semibold leading-none tabular-nums';
/** The sans' average advance at 12.5px: used for server rendering and until the probe is measured. */
const CH = 6.7;
/** Room kept on each side of a name written on a segment. */
const SEGMENT_PAD = 10;
/** The axis-break mark's width at a cut start, with its inset. */
const BREAK_ROOM = 18;
const TRACK_TOP = 16;
const TRACK_H = 28;
const ROW_H = 19;
/** Extra room under labels that dropped below the bar, so they don't crowd the tick labels. */
const DROP_CLEARANCE = 6;
const GAP = 12;
const ROWS = 3; // above the bar, then up to two lines below it
/** A weekend or holiday on the day axis, and its key: a step darker than the track on both themes. */
const CLOSED_DAY = 'bg-hair-2 dark:bg-[color-mix(in_oklab,var(--ink)_26%,var(--card))]';
/**
 * The same days over a segment: a shade of ink, so the segment darkens where a day isn't counted, as the empty
 * track does, and a name written on it stays readable.
 */
const CLOSED_OVER_BAR = 'bg-[color-mix(in_oklab,var(--ink)_20%,transparent)] dark:bg-[color-mix(in_oklab,var(--card)_38%,transparent)]';
const TONE_BG = { ink: 'bg-ink', maple: 'bg-maple', glacier: 'bg-glacier' };
const TONE_TEXT = { ink: 'text-ink', maple: 'text-maple-ink', glacier: 'text-glacier' };
const KEY = 'inline-block h-2.5 w-[18px] rounded-[4px]';

function place(pins: PinSpec[], W: number, widthOf: (label: string) => number) {
  const ends = Array<number>(ROWS).fill(-Infinity);
  return [...pins]
    .sort((a, b) => a.at - b.at)
    .map((p) => {
      const w = widthOf(p.label);
      const x = (p.at / 100) * W;
      let x0 = x - w / 2;
      if (p.at < 6) x0 = x - 4;
      else if (p.at > 94) x0 = x - w + 4;
      x0 = Math.max(0, Math.min(W - w, x0));
      // First row where it fits as is, or nudged right while still over its pin; else the emptiest row.
      let row = -1;
      for (let r = 0; r < ROWS && row < 0; r++) {
        const need = ends[r] + GAP;
        if (x0 >= need) row = r;
        else if (need - x0 <= w / 2 - 6 && need + w <= W) {
          x0 = need;
          row = r;
        }
      }
      if (row < 0) {
        row = ends.indexOf(Math.min(...ends));
        x0 = Math.min(W - w, Math.max(x0, ends[row] + GAP));
      }
      ends[row] = x0 + w;
      return { ...p, x0, row };
    });
}

/** Axis break: something lies further out (or back) than the axis shows. */
function Break({ side }: { side: 'start' | 'end' }) {
  return (
    <svg
      className={cn('absolute h-[22px] w-[10px] text-ink-2 rtl:-scale-x-100', side === 'start' ? 'start-[11px]' : 'end-[11px]')}
      style={{ top: TRACK_TOP + (TRACK_H - 22) / 2 }}
      viewBox="0 0 10 22"
      fill="none"
    >
      <path d="M5 0 L1.5 5.5 L8.5 11 L1.5 16.5 L5 22" stroke="var(--card)" strokeWidth="4" />
      <path d="M5 0 L1.5 5.5 L8.5 11 L1.5 16.5 L5 22" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Gantt({ axis, pins, segments, closedLabel }: { axis: Axis; pins: PinSpec[]; segments: Segment[]; closedLabel: string }) {
  const { fmt, locale } = useLocale();
  const [ref, { w: W }] = useElementSize<HTMLDivElement>({ w: 680, h: 0 });
  // Every label this chart may draw, as one run of text: its width over its length is the font's real advance
  // for these very characters.
  const sample = [...pins.map((p) => p.label), ...segments.map((s) => s.label)].join('');
  const [probe, { w: probeW }] = useElementSize<HTMLSpanElement>({ w: CH * sample.length, h: 0 });
  const ch = sample.length ? probeW / sample.length || CH : CH;
  const widthOf = (label: string) => Math.ceil(label.length * ch * 1.05) + 4;
  const placed = place(pins, W, widthOf);
  const rows = Math.max(...placed.map((p) => p.row));
  const days = axis.scale === 'days';
  const dayW = 100 / axis.ticks.length;
  const month = (iso: string) => sentenceCase(fmt.date(iso, { month: 'short' }).replace('.', ''), locale);
  // Day numbers: every day while the columns are wide enough, else every other day (and each 1st).
  const sparse = axis.ticks.length > 24;
  // Month names: every month while the columns are wide enough, else every other one (« Juill » and « Août » touch at 16).
  const everyOther = axis.ticks.length > 12;
  // A segment carries its own name when a stretch of it is wide enough: clear of the segments drawn over it
  // (`labelFrom`/`labelTo`) and of every pin's line, taking the widest such stretch.
  const named = segments.map((s) => {
    const from = Math.max(s.from, s.labelFrom ?? s.from);
    const to = Math.min(s.to, s.labelTo ?? s.to);
    const cuts = [from, ...pins.map((p) => p.at).filter((at) => at > from && at < to).sort((a, b) => a - b), to];
    const best = cuts.slice(1).reduce((widest, end, i) => (end - cuts[i] > widest.to - widest.from ? { from: cuts[i], to: end } : widest), { from, to: from });
    // At a cut axis start the name begins after the break mark.
    const pad = SEGMENT_PAD + (axis.brokenStart && best.from === 0 ? BREAK_ROOM : 0);
    return { ...s, labelAt: best.from, pad, fits: ((best.to - best.from) / 100) * W >= widthOf(s.label) + pad + SEGMENT_PAD };
  });
  const keyed = named.filter((s) => !s.fits && s.to > s.from);
  return (
    <div className="hidden @xl:block" aria-hidden>
      <div ref={ref} className="relative mt-9" style={{ height: (days ? 96 : 78) + rows * ROW_H + (rows ? DROP_CLEARANCE : 0) }}>
        <span ref={probe} className={cn('invisible absolute whitespace-nowrap', LABEL_TYPE)}>
          {sample}
        </span>
        {/* On the dark theme paper-2 is nearly the card's own tone: a light mix keeps the empty track a full-width axis. */}
        <div
          className={cn(
            'absolute inset-x-0 overflow-hidden rounded-[10px] bg-paper-2 dark:bg-[color-mix(in_oklab,var(--ink)_11%,var(--card))]',
            axis.brokenStart && 'rounded-s-none',
            axis.brokenEnd && 'rounded-e-none',
          )}
          style={{ top: TRACK_TOP, height: TRACK_H }}
        >
          {axis.closed.map((d) => (
            <span key={d} className={cn('absolute inset-y-0', CLOSED_DAY)} style={{ insetInlineStart: `${axisPos(axis, d)}%`, width: `${dayW}%` }} />
          ))}
          {named.map((s) => {
            const w = Math.max(0, s.to - s.from);
            return (
              <span key={s.key} className={cn('absolute inset-y-0 overflow-hidden', s.className)} style={{ insetInlineStart: `${s.from}%`, width: `${w}%`, minWidth: s.minWidth }}>
                {s.veil && w > 0
                  ? axis.closed.map((d) => {
                      const at = axisPos(axis, d);
                      return at + dayW <= s.from || at >= s.to ? null : (
                        <span key={d} className={cn('absolute inset-y-0', CLOSED_OVER_BAR)} style={{ insetInlineStart: `${((at - s.from) / w) * 100}%`, width: `${(dayW / w) * 100}%` }} />
                      );
                    })
                  : null}
              </span>
            );
          })}
          {named.map((s) =>
            s.fits ? (
              <span
                key={s.key}
                className={cn('absolute inset-y-0 flex items-center whitespace-nowrap', LABEL_TYPE, s.labelClassName)}
                style={{ insetInlineStart: `calc(${s.labelAt}% + ${s.pad}px)` }}
              >
                {s.label}
              </span>
            ) : null,
          )}
        </div>
        {axis.brokenEnd ? <Break side="end" /> : null}
        {axis.brokenStart ? <Break side="start" /> : null}
        {placed.map((p) => (
          <span key={p.key}>
            <span
              className={cn('absolute top-0 w-0.5 -translate-x-1/2 rounded-full rtl:translate-x-1/2', TONE_BG[p.tone], !p.solid && p.tone === 'maple' && 'opacity-70')}
              style={{ insetInlineStart: `${p.at}%`, height: p.row === 0 ? TRACK_TOP + TRACK_H + 6 : TRACK_TOP + TRACK_H + 4 + (p.row - 1) * ROW_H }}
            />
            <span
              // A card-coloured halo keeps a label readable when another pin's line runs past it.
              className={cn('absolute z-[1] whitespace-nowrap bg-card shadow-[0_0_0_3px_var(--card)]', LABEL_TYPE, p.row === 0 && '-top-[5px]', TONE_TEXT[p.tone])}
              style={{ insetInlineStart: p.x0, ...(p.row > 0 ? { top: TRACK_TOP + TRACK_H + 8 + (p.row - 1) * ROW_H } : null) }}
            >
              {ordinal(p.label)}
            </span>
          </span>
        ))}
        <div className="absolute inset-x-0 bottom-0 grid text-[12px] font-medium text-ink-3" style={{ gridTemplateColumns: `repeat(${axis.ticks.length}, 1fr)` }}>
          {axis.ticks.map((tick, i) =>
            days ? (
              <span key={tick} className={cn('border-s border-hair pt-2 ps-1 leading-none', i === 0 && 'border-transparent', axis.closed.includes(tick) ? 'text-ink-3' : 'text-ink-2')}>
                <span className="block h-3 tabular-nums">{!sparse || i % 2 === 0 || tick.endsWith('-01') ? Number(tick.slice(8)) : ''}</span>
                <span className="mt-1 block h-3 whitespace-nowrap text-[11.5px] text-ink-3">{i === 0 || tick.endsWith('-01') ? month(tick) : ''}</span>
              </span>
            ) : (
              <span key={tick} className={cn('border-s pt-2 ps-1.5 leading-none', i === 0 ? 'border-transparent' : 'border-hair-2')}>
                {!everyOther || i % 2 === 0 ? month(tick) : ' '}
              </span>
            ),
          )}
        </div>
      </div>
      {keyed.length || days ? (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-2">
          {keyed.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-2">
              <i className={cn(KEY, s.className)} />
              <bdi>{s.legend}</bdi>
            </span>
          ))}
          {days ? (
            <span className="inline-flex items-center gap-2">
              <i className={cn(KEY, CLOSED_DAY)} />
              <bdi>{closedLabel}</bdi>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
