'use client';
/** Where recent Express Entry cut-offs sit on the CRS scale, by kind of round, with the person's score marked on each. */
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDir } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Draw, DrawKind } from './draws';
import messages from './messages';

type Lane = 'cec' | 'pnp' | 'general' | 'category';
const LANES: Lane[] = ['cec', 'pnp', 'general', 'category'];
const laneOf = (k: DrawKind): Lane => (k === 'cec' || k === 'pnp' ? k : k === 'general' || k === 'fsw' || k === 'fst' ? 'general' : 'category');
const LANE_TONE: Record<Lane, string> = { cec: 'bg-pine', pnp: 'bg-glacier', general: 'bg-ink', category: 'bg-amber' };

/**
 * Near-equal cut-offs in one lane (518 and 519) would sit on top of each other. Each dot stays on its lane's line
 * and is nudged a few pixels to the first free slot (on its value, just after it, just before it): a tight
 * cluster that still reads as separate rounds. The table below gives every exact value.
 */
function rowsFor(values: number[], gap: number) {
  const last: number[] = [];
  return values.map((v) => {
    let row = last.findIndex((x) => v - x >= gap);
    if (row === -1) row = last.length < 3 ? last.length : 0;
    last[row] = v;
    return row;
  });
}
const NUDGE_PX = [0, 11, -11];

/**
 * Recent cut-offs, one lane per kind of round (so a program's rounds line up and never pile up), with the
 * person's score as a maple mark on every lane's track, under one "You" pill. The scale starts at 300 or lower, so a low-cut-off round
 * (e.g. physicians at 198) is always drawn. A score beyond the top (a provincial nomination adds 600) sits at
 * the end with an arrow. The scale always runs left to right (100 → 800), also in a right-to-left page.
 * Text equivalent: the table of rounds.
 */
export function CutoffTrack({ score, draws, live }: { score: number | null; draws: Draw[]; live?: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [ref, dir] = useDir<HTMLDivElement>();
  const low = Math.min(...draws.map((x) => x.crs), score ?? Infinity);
  const min = Math.max(0, Math.min(300, Math.floor(low / 100) * 100));
  const top = Math.max(0, ...draws.map((x) => x.crs));
  const max = Math.min(900, Math.max(800, Math.ceil((top + 10) / 100) * 100));
  const pos = (n: number) => ((Math.max(min, Math.min(max, n)) - min) / (max - min)) * 100;
  const ticks = Array.from({ length: (max - min) / 100 + 1 }, (_, i) => min + i * 100);
  const dense = ticks.length > 6;
  const lanes = LANES.map((lane) => {
    const pts = draws.filter((x) => laneOf(x.kind) === lane).sort((x, y) => x.crs - y.crs);
    const rows = rowsFor(pts.map((x) => pos(x.crs)), 2);
    return { lane, pts: pts.map((x, i) => ({ x, at: pos(x.crs), dx: NUDGE_PX[rows[i]] })) };
  }).filter((l) => l.pts.length);
  const off = score != null && score > max;
  const sp = score != null ? pos(score) : 0;
  const LANE_H = 40;
  const TOP = score != null ? 30 : 4;
  const height = TOP + lanes.length * LANE_H;
  return (
    <div ref={ref} className="px-5 pt-7 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="m-0 text-[15px] font-semibold leading-snug tracking-[-.005em] text-ink">{t('crs.track.title')}</h4>
        {/* The shell's "Live" badge is hidden on phones: say it here, on the heading's own line (no extra height). */}
        {live ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium leading-snug text-pine sm:hidden">
            <i className="size-1.5 rounded-full bg-pine" aria-hidden />
            {t('live.on')}
          </span>
        ) : null}
      </div>
      {/* A number line reads left to right in every language (so start = left in here); only the lane names follow the page direction. */}
      <div dir="ltr" className="relative mt-3" style={{ height: height + 22 }} aria-hidden>
        {score != null ? (
          <span className="absolute top-0 w-0" style={{ insetInlineStart: `${sp}%` }}>
            <span
              className={cn(
                'absolute top-0 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-maple px-2 py-0.5 text-[12px] font-semibold tabular-nums text-paper',
                sp > 80 ? 'end-[-2px]' : sp < 12 ? 'start-[-2px]' : '-translate-x-1/2',
              )}
            >
              <bdi>{t('crs.track.you', { score: fmt.number(score) })}</bdi>
              {off ? <ArrowRight className="size-3" strokeWidth={2.6} /> : null}
            </span>
          </span>
        ) : null}
        {lanes.map(({ lane, pts }, i) => (
          <div key={lane} className="absolute inset-x-0" style={{ top: TOP + i * LANE_H, height: LANE_H }}>
            <span dir={dir} className="flex max-w-full items-center gap-1.5 text-[12.5px] leading-4 text-ink-2">
              <i className={cn('inline-block size-2 shrink-0 rounded-full', LANE_TONE[lane])} />
              <span className="truncate">{t(`crs.kind.${lane}`)}</span>
            </span>
            <div className="absolute inset-x-0 top-[24px] h-1 rounded-full bg-hair-2" />
            {/*
              The score marks each lane's track only (never the label above it), under the "You" pill. It is drawn
              first and reaches past the dots, which carry a card-coloured ring: a cut-off within a few points of
              the score stays a whole dot with the mark showing above and below it.
            */}
            {score != null ? <span className="absolute top-[17px] h-[18px] w-0.5 -translate-x-1/2 rounded-full bg-maple" style={{ insetInlineStart: `${sp}%` }} /> : null}
            {pts.map(({ x, at, dx }) => (
              <span
                key={x.number}
                className={cn('absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card', LANE_TONE[lane])}
                style={{ insetInlineStart: `calc(${at}% + ${dx}px)`, top: 26 }}
              />
            ))}
          </div>
        ))}
        <div className="absolute inset-x-0 h-4 text-[12px] tabular-nums text-ink-3" style={{ top: height + 4 }}>
          {ticks.map((n, i) => (
            <span
              key={n}
              className={cn(
                'absolute whitespace-nowrap',
                i === 0 ? 'start-0' : i === ticks.length - 1 ? 'end-0' : '-translate-x-1/2',
                // Narrow: both ends stay labelled (the scale's origin is never blank); between them, every 200 points.
                dense && i !== 0 && i !== ticks.length - 1 && n % 200 !== 0 && '@max-md:hidden',
              )}
              style={i === 0 || i === ticks.length - 1 ? undefined : { insetInlineStart: `${pos(n)}%` }}
            >
              {fmt.number(n)}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">{score != null ? t('crs.track.sr', { score, count: draws.length }) : t('crs.track.srNoScore', { count: draws.length })}</p>
    </div>
  );
}
