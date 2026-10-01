'use client';
/**
 * Money-specific pieces (fields, links and live announcements come from `@/components/ui`:
 * MoneyInput / PercentInput, ExternalLink, LiveRegion):
 *   SplitBar     — stacked horizontal bar with a legend (text equivalent included)
 *   RatioGauge   — ratio bar with a limit marker (GDS / TDS)
 *   Fill         — progress fill that animates with a transform only (no layout work per keystroke)
 *   Legend       — the dot + label (+ amount) list under a bar or chart
 *   Hero         — the tinted verdict block at the top of each widget (not a live region: each widget has a LiveRegion)
 *   MoneySkeleton — loading state that takes its height from the real widget, laid out unseen (no layout jump)
 *   Dot / Bullet — legend swatch and list bullet
 *   Eyebrow / Rich — hero eyebrow and `*phrase*` emphasis
 */
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Fill classes for chart segments (tokens only). */
export const SWATCH = {
  ink: 'bg-ink/85',
  maple: 'bg-maple',
  pine: 'bg-pine',
  /** Money the government adds: a livelier green than pine, so it reads as a gift beside the ink of "you". */
  grant: 'bg-[color-mix(in_oklab,var(--pine)_68%,var(--a-green))]',
  glacier: 'bg-glacier',
  amber: 'bg-amber',
  violet: 'bg-aurora-violet',
  teal: 'bg-aurora-teal',
  rose: 'bg-aurora-rose',
  green: 'bg-aurora-green',
  /* Theme-aware mixes of the tokens, so ten budget lines stay tellable apart in light and dark. */
  glacierInk: 'bg-[color-mix(in_oklab,var(--glacier)_40%,var(--ink))]',
  plum: 'bg-[color-mix(in_oklab,var(--a-violet)_50%,var(--maple))]',
  orange: 'bg-[color-mix(in_oklab,var(--amber)_60%,var(--maple))]',
  gray: 'bg-ink-3/60',
  stone: 'bg-ink-3/30',
  /** Outlined: for "what's left", so it reads as unused space but stays visible in both themes. */
  outline: 'bg-transparent ring-[1.5px] ring-inset ring-ink-3/70',
} as const;
export type Swatch = keyof typeof SWATCH;

export function Dot({ tone, className }: { tone: Swatch; className?: string }) {
  return <i aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', SWATCH[tone], className)} />;
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
      <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

type Segment = { key: string; label: string; value: number; tone: Swatch; display?: string };
/** A legend line. Without a `tone` the line has no swatch (a roll-up such as "5 other costs"), aligned with the rest. */
export type LegendItem = { key: string; label: string; tone?: Swatch; display?: string };

/**
 * Progress fill for a rounded track. The fill is always full width and slides in from the start edge
 * (`translate` only, so the compositor animates it and the rounded end cap never distorts). `value` is 0–1.
 */
export function Fill({ value, className }: { value: number; className?: string }) {
  const p = `${Math.min(1, Math.max(0, value)) * 100}%`;
  return (
    <span className="absolute inset-0 overflow-hidden rounded-full" aria-hidden>
      <span
        className={cn(
          'block h-full w-full rounded-full transition-transform duration-500 ease-out [translate:calc(var(--fill)_-_100%)_0] motion-reduce:transition-none rtl:[translate:calc(100%_-_var(--fill))_0]',
          className,
        )}
        style={{ '--fill': p } as CSSProperties}
      />
    </span>
  );
}

/** `grid`: amounts aligned at the end in one, two or three columns, for long lists; otherwise an inline, wrapping row. */
export function Legend({ items, grid = false, className }: { items: LegendItem[]; grid?: boolean; className?: string }) {
  return (
    <ul className={cn('m-0 list-none gap-x-4 gap-y-1.5 p-0 text-[13px] text-ink-2', grid ? 'grid grid-cols-1 gap-x-6 @md:grid-cols-2 @xl:grid-cols-3' : 'flex flex-wrap', className)}>
      {items.map((s) => (
        <li key={s.key} className={cn('gap-2', grid ? 'flex min-w-0 items-start' : 'inline-flex items-center')}>
          {s.tone ? <Dot tone={s.tone} className={grid ? 'mt-[5px]' : undefined} /> : <span className="size-2.5 shrink-0" aria-hidden />}
          <bdi className={grid ? 'min-w-0' : undefined}>{s.label}</bdi>
          {s.display ? <span className={cn('font-medium tabular-nums text-ink', grid && 'ms-auto whitespace-nowrap')}>{s.display}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Stacked bar with its legend. `grid`: the column legend, used only when there are more than three segments
 * (with two or three, columns leave the amounts far from their labels, so the legend stays inline).
 * Each segment is a full-width layer slid to where it starts and painted over the one before, so the bar
 * re-divides with a transform only: moving a slider animates it without any layout work. The outlined
 * segment ("what's left", always last) is see-through, so it is placed instead of layered.
 */
export function SplitBar({
  segments,
  label,
  legend = true,
  grid = false,
  className,
  height = 'h-3.5',
}: {
  segments: Segment[];
  label: string;
  legend?: boolean;
  grid?: boolean;
  className?: string;
  height?: string;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const visible = segments.filter((s) => s.value > 0);
  const starts = visible.map((_, i) => `${(visible.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * 100}%`);
  return (
    <div className={className}>
      <div className={cn('relative w-full overflow-hidden rounded-full bg-paper-2', height)} role="img" aria-label={`${label}: ${visible.map((s) => `${s.label} ${s.display ?? ''}`.trim()).join(', ')}`}>
        {visible.map((s, i) =>
          s.tone === 'outline' ? (
            // The track colour first, to cover the layers underneath; then the outline, inset by the 3px gap.
            <span key={s.key} className={cn('absolute inset-y-0 end-0 flex bg-paper-2', i > 0 && 'ps-[3px]')} style={{ insetInlineStart: starts[i] }}>
              <span className={cn('h-full flex-1 rounded-e-full', SWATCH[s.tone])} />
            </span>
          ) : (
            <span
              key={s.key}
              className="absolute inset-0 flex transition-transform duration-500 ease-out [translate:var(--at)_0] motion-reduce:transition-none rtl:[translate:calc(var(--at)_*_-1)_0]"
              style={{ '--at': starts[i] } as CSSProperties}
            >
              {i > 0 ? <span className="h-full w-[3px] shrink-0 bg-paper-2" /> : null}
              <span className={cn('h-full min-w-0 flex-1', SWATCH[s.tone])} />
            </span>
          ),
        )}
      </div>
      {legend ? <Legend className="mt-3" items={segments} grid={grid && segments.length > 3} /> : null}
    </div>
  );
}

export function RatioGauge({ label, value, limit, scale = 60, display, limitLabel, note, quiet }: { label: ReactNode; value: number; limit: number; scale?: number; display: string; limitLabel: string; note?: ReactNode; /** Under the limit, show the value in ink instead of green: it repeats the gauge beside it and is not a second pass. */ quiet?: boolean }) {
  const over = value > limit;
  const at = (limit / scale) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-medium text-ink">{label}</span>
        <span className={cn('font-serif text-[22px] leading-none tracking-[-.02em] tabular-nums', over ? 'text-maple-ink' : quiet ? 'text-ink' : 'text-pine')}>{display}</span>
      </div>
      <div className="relative mt-2.5 h-2.5 rounded-full bg-ink/10" aria-hidden>
        <Fill value={value / scale} className={over ? 'bg-maple' : quiet ? 'bg-ink-3' : 'bg-pine'} />
        <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-ink rtl:translate-x-1/2" style={{ insetInlineStart: `${at}%` }} />
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[11px] text-ink-3" aria-hidden>
        <span className="absolute -translate-x-1/2 whitespace-nowrap rtl:translate-x-1/2" style={{ insetInlineStart: `${at}%` }}>
          {limitLabel}
        </span>
      </div>
      {note ? <p className="m-0 mt-1 text-[12.5px] leading-snug text-ink-3">{note}</p> : null}
    </div>
  );
}

export function Hero({ tone, children, className }: { tone: 'pine' | 'maple' | 'glacier' | 'amber'; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-3 overflow-hidden rounded-card border px-5 py-5 sm:mx-4 sm:px-6',
        tone === 'pine' && 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--a-green)_22%,transparent),color-mix(in_oklab,var(--a-teal)_16%,transparent)_48%,color-mix(in_oklab,var(--a-violet)_12%,transparent))]',
        tone === 'glacier' && 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--a-teal)_22%,transparent),color-mix(in_oklab,var(--a-violet)_14%,transparent)_55%,color-mix(in_oklab,var(--a-rose)_10%,transparent))]',
        tone === 'amber' && 'border-amber/20 bg-[linear-gradient(135deg,var(--amber-wash),color-mix(in_oklab,var(--a-rose)_14%,transparent))]',
        tone === 'maple' && 'border-maple/20 bg-[linear-gradient(135deg,var(--maple-wash),color-mix(in_oklab,var(--a-rose)_16%,transparent))]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Loading state. `children` is the real widget, built from the tool input (see ./preview): it is laid out
 * unseen and inert, and its box is the skeleton's box. So the height is the finished widget's own, in every
 * language and for every input, and nothing moves when the answer arrives.
 * On top of it: the real header, then shimmer blocks that share the height in the proportions of `blocks`
 * (the hero first, then one per section; rough is fine, only the outer box has to be exact).
 */
export function MoneySkeleton({
  title,
  subtitle,
  icon,
  tone,
  label,
  top = false,
  blocks,
  actions = 2,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  tone: WidgetTone;
  label: string;
  /** A control above the hero (the goal switch). */
  top?: boolean;
  blocks: readonly number[];
  /** Buttons in the footer row: 1 (handoff only) or 2 (handoff + secondary action). */
  actions?: 1 | 2;
  children: ReactNode;
}) {
  const [hero, ...sections] = blocks;
  return (
    <div className="relative">
      <div className="invisible" inert aria-hidden>
        {children}
      </div>
      <Card as="section" aurora aria-busy="true" className="@container absolute inset-0 flex flex-col text-start">
        <header className="flex shrink-0 items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
          <WidgetIcon icon={icon} tone={tone} />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
            {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
          </div>
        </header>
        <div role="status" className="flex min-h-0 flex-1 flex-col">
          <span className="sr-only">{label}</span>
          {top ? <Skeleton className="mx-5 mb-4 h-[52px] w-auto shrink-0 rounded-[14px] sm:mx-6" /> : null}
          <div className="flex min-h-0 px-3 sm:px-4" style={{ flex: `${hero} 1 0` }}>
            <Skeleton className="w-full rounded-card" />
          </div>
          {sections.map((weight, i) => (
            <div key={i} className={cn('flex min-h-0 flex-col px-5 pt-5 sm:px-6', i > 0 && 'mt-5 border-t border-hair')} style={{ flex: `${weight} 1 0` }} aria-hidden>
              <Skeleton className="mb-3.5 h-3 w-32 shrink-0" />
              <Skeleton className="min-h-0 w-full flex-1 rounded-tile" />
            </div>
          ))}
          <div className="mt-5 flex shrink-0 flex-wrap items-center gap-2.5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
            <Skeleton className="h-11 w-full rounded-chip sm:w-56" />
            {actions === 2 ? <Skeleton className="h-11 w-full rounded-chip sm:w-40" /> : null}
            <Skeleton className="h-3.5 w-full sm:ms-auto sm:w-48" />
            <Skeleton className="mt-1 h-3.5 w-full" />
          </div>
          <div className="h-14 shrink-0 bg-paper-2" aria-hidden />
        </div>
      </Card>
    </div>
  );
}

/** Mono uppercase eyebrow used inside heroes. Isolated: it often starts with an amount ("$1,000 of pay…"). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
      <bdi>{children}</bdi>
    </p>
  );
}

/** Renders `*phrase*` as the maple serif italic used for emphasis across the app. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <em key={i} className="font-serif italic text-maple">
            {p}
          </em>
        ) : (
          p
        ),
      )}
    </>
  );
}
