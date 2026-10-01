'use client';
/** What the four estimators share: the shell frame, the hero figure, breakdown rows, tiles and "typical" values. */
import { useState, type ReactNode } from 'react';
import { Baby, Info, Landmark, LifeBuoy, PiggyBank } from 'lucide-react';
import { LiveRegion, NumberTicker, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { EstimatorOutput } from '../build';
import messages from '../messages';
import { isolate, useFooterSources } from '../parts';

export type Program = EstimatorOutput['program'];
export type Out<P extends Program> = Extract<EstimatorOutput, { program: P }>;

export const ICON = { ccb: Baby, ei: LifeBuoy, oas: Landmark, cpp: PiggyBank } as const;
export const TONE = { ccb: 'pine', ei: 'glacier', oas: 'glacier', cpp: 'amber' } as const;

/**
 * Which values are still typical defaults (not given by the person, not moved yet): shown quieter with a
 * "Typical" marker, so a default never reads as their own figure.
 */
export function useTypical(given: string[] | undefined) {
  const [moved, setMoved] = useState<Set<string>>(() => new Set());
  const typical = (key: string, ...alt: string[]) => ![key, ...alt].some((k) => given?.includes(k) || moved.has(k));
  const touch = (key: string) => setMoved((m) => (m.has(key) ? m : new Set(m).add(key)));
  return { typical, touch };
}

export function Frame({ program, data, children, handoff, secondary }: { program: Program; data: EstimatorOutput; children: ReactNode; handoff: { href: string; label: string; note: string }; secondary?: ReactNode }) {
  const t = useMessages(messages);
  const sources = useFooterSources(data.sources, data.lead);
  return (
    <WidgetShell
      icon={ICON[program]}
      tone={TONE[program]}
      title={t(`est.${program}.title`)}
      subtitle={isolate(t(`est.${program}.subtitle`))}
      sources={sources}
      handoff={handoff}
      secondaryAction={secondary}
      footnote={<bdi>{t('est.estimateNote')}</bdi>}
      className="@container"
    >
      {children}
    </WidgetShell>
  );
}

/** `approx`: the figure is a typical one, not theirs yet: prefixed with ≈ and set quieter, never read as their amount. */
export function Hero({ value, format, unit, sub, aside, tone = 'pine', approx = false }: { value: number; format: (n: number) => string; unit: string; sub: string; aside?: ReactNode; tone?: 'pine' | 'maple' | 'glacier' | 'amber'; approx?: boolean }) {
  const wash = {
    pine: 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_14%,transparent),color-mix(in_oklab,var(--glacier)_10%,transparent))]',
    maple: 'border-maple/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_10%,transparent),color-mix(in_oklab,var(--a-rose)_12%,transparent))]',
    glacier: 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--a-violet)_10%,transparent))]',
    amber: 'border-amber/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_12%,transparent),color-mix(in_oklab,var(--a-rose)_10%,transparent))]',
  }[tone];
  return (
    <div className={cn('mx-3 rounded-card border px-5 py-5 @xl:mx-4', wash)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        {/* One settled sentence for screen readers: the figure ticks and changes with every slider step. */}
        <LiveRegion text={`${approx ? '≈ ' : ''}${format(value)} ${unit}. ${sub}`} />
        <div className="min-w-0">
          <p
            className={cn(
              "m-0 flex flex-wrap items-baseline gap-x-2.5 font-serif leading-none tracking-[-.03em] [font-variation-settings:'opsz'_72]",
              approx ? 'text-[40px] text-ink-2' : 'text-[48px] text-ink',
            )}
          >
            <bdi dir="ltr">
              {approx ? <span className="me-2 align-[.08em] text-[.7em] text-ink-3">≈</span> : null}
              <NumberTicker value={value} format={format} />
            </bdi>
            <span className="font-sans text-[16px] font-medium tracking-[-.005em] text-ink-3">
              <bdi>{unit}</bdi>
            </span>
          </p>
          <p className="m-0 mt-2 text-[14.5px] text-ink-2">
            <bdi>{sub}</bdi>
          </p>
        </div>
        {aside}
      </div>
    </div>
  );
}

export function Row({ label, value, note, tone }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: 'minus' | 'plus' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-hair py-2.5 first:border-t-0">
      <dt className="min-w-0 text-[14px] text-ink-2">
        <bdi>{label}</bdi>
        {note ? (
          <span className="block text-[12.5px] text-ink-3">
            <bdi>{note}</bdi>
          </span>
        ) : null}
      </dt>
      <dd className={cn('m-0 whitespace-nowrap font-mono text-[14px] tabular-nums', tone === 'minus' ? 'text-maple-ink' : tone === 'plus' ? 'text-pine' : 'text-ink')}>
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  );
}

export function Tile({ label, value, note }: { label: ReactNode; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
      <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">
        <bdi>{label}</bdi>
      </p>
      <p className="m-0 mt-1.5 font-serif text-[22px] leading-tight tracking-[-.015em] text-ink tabular-nums">{value}</p>
      {note ? (
        <p className="m-0 mt-1 text-[12.5px] leading-snug text-ink-3">
          <bdi>{note}</bdi>
        </p>
      ) : null}
    </div>
  );
}

/** Short facts under an estimate, each with the info mark. */
export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 mt-4 grid list-none gap-2 p-0 text-[14px] leading-snug text-ink-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden />
          <bdi>{item}</bdi>
        </li>
      ))}
    </ul>
  );
}
