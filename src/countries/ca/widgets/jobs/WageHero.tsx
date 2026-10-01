'use client';
/**
 * The wage explorer's headline panel: where (a menu, or the tile map), per hour or per year, the median on
 * its own, the low-to-high bar that springs to the chosen place, and three facts that put the figure in context.
 */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LiveRegion, NumberTicker, Segmented, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Province } from './data';
import messages from './messages';
import { OutlookMeter, useProvinceName, yearly } from './parts';
import { ProvinceTiles } from './ProvinceTiles';
import type { WageRow, WagesOutput } from './types';

type ProvinceRow = WagesOutput['provinces'][number];
export type Per = 'hour' | 'year';

type Props = {
  /** Provinces with a median, highest first. */
  ranked: ProvinceRow[];
  national?: WageRow;
  province?: ProvinceRow;
  onSelect: (p: Province | undefined) => void;
  per: Per;
  onPer: (per: Per) => void;
  /** Job Bank's figures are hourly, so a yearly estimate can be offered. */
  canYear: boolean;
  pos: (n: number | null) => number;
};

/** One fact under the headline: a quiet label over a strong value. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-ink/10 py-2.5 @md:block @md:border-s @md:border-t-0 @md:py-0 @md:ps-5 @md:first:border-s-0 @md:first:ps-0">
      <dt className="text-[12.5px] text-ink-2">{label}</dt>
      <dd className="m-0 text-end text-[15px] font-semibold leading-snug text-ink @md:mt-1 @md:text-start">{children}</dd>
    </div>
  );
}

export function WageHero({ ranked, national, province, onSelect, per, onPer, canYear, pos }: Props) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const reduce = useReducedMotion();
  const provinceName = useProvinceName();
  const row = province ?? national;
  const estimate = per === 'year' && canYear;
  const inYears = per === 'year' || !canYear;
  /** A wage in the chosen unit (hourly figures become a yearly estimate). */
  const inUnit = (n: number) => (estimate ? yearly(n) : n);
  // NumberTicker tweens through fractional values, so the cents are always explicit.
  const money = (n: number) => fmt.money(inYears ? Math.round(n) : n, { cents: inYears ? 'never' : 'always' });
  const show = (n: number | null | undefined) => (n == null ? '—' : money(inUnit(n)));
  const perLabel = t('pay.unit', { period: inYears ? 'year' : 'hour' });
  const place = province ? provinceName(province.code) : t('wages.canada');
  const nat = national?.median ?? null;
  const diff = province?.median != null && nat ? (province.median - nat) / nat : null;
  const outlook = province?.outlook;
  const [top, bottom] = [ranked[0], ranked[ranked.length - 1]];
  const spring = reduce ? { duration: 0 } : ({ type: 'spring', stiffness: 140, damping: 22 } as const);

  return (
    <div className="rounded-tile border border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_13%,transparent),color-mix(in_oklab,var(--a-teal)_12%,transparent)_55%,color-mix(in_oklab,var(--a-green)_10%,transparent))] p-4 @md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          aria-label={t('wages.where')}
          value={province?.code ?? 'ca'}
          onChange={(e) => onSelect(ranked.find((p) => p.code === e.target.value)?.code)}
          className="min-w-[210px] bg-card font-medium"
          options={[{ value: 'ca', label: t('wages.canada') }, ...ranked.map((p) => ({ value: p.code, label: provinceName(p.code) }))]}
        />
        {canYear ? (
          <Segmented
            label={t('wages.perLabel')}
            value={per}
            onChange={onPer}
            className="w-[224px] [&>button]:text-[13.5px]"
            options={[
              { value: 'hour', label: t('wages.perHour') },
              { value: 'year', label: t('wages.perYear') },
            ]}
          />
        ) : null}
      </div>

      {/* One calm sentence for screen readers, once the choice settles; the animated figures below are visual only. */}
      <LiveRegion delay={400} text={row?.median != null ? t('wages.srLive', { place, median: show(row.median), per: perLabel, low: show(row.low), high: show(row.high) }) : ''} />

      <div className="mt-7 grid items-center gap-x-8 gap-y-6 @2xl:grid-cols-[minmax(0,1fr)_332px]">
        <div>
          <p className="m-0 text-[13.5px] font-medium text-ink-2" aria-hidden>
            {/* Job Bank publishes this wage by the hour: the yearly figure is ours, and the label says so. */}
            {estimate ? t('wages.medianYear') : t('wages.median')}
          </p>
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-hidden>
            <span className="font-serif text-[64px] leading-[.95] tracking-[-.04em] text-ink [font-variation-settings:'opsz'_72] @md:text-[72px]">
              {row?.median != null ? <NumberTicker value={inUnit(row.median)} format={money} /> : '—'}
            </span>
            <span className="text-[16px] font-medium text-ink-2">{perLabel}</span>
          </p>
        </div>
        {ranked.length ? <ProvinceTiles rows={ranked} selected={province?.code} onSelect={onSelect} show={show} /> : null}
      </div>

      {row?.low != null && row.high != null ? (
        <div className="mt-7 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4" aria-hidden>
          <Bound label={t('wages.low')} value={show(row.low)} />
          {/* Only `transform` animates. The whole track is mirrored in RTL, so inside it "left" is the inline start. */}
          <div className="relative h-3 rounded-full bg-card/80 ring-1 ring-ink/5 rtl:-scale-x-100">
            <span className="absolute inset-0 overflow-hidden rounded-full">
              {/* A window whose right edge sits at the high wage… */}
              <motion.span className="absolute inset-0 overflow-hidden rounded-full" initial={false} animate={{ x: `${pos(row.high) - 100}%` }} transition={spring}>
                {/* …and, inside it, a full-width bar whose left edge sits at the low wage: both caps stay round. */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-pine bg-[linear-gradient(90deg,color-mix(in_oklab,var(--card)_45%,var(--pine)),var(--pine))] bg-no-repeat"
                  style={{ backgroundSize: `${Math.max(1, pos(row.high) - pos(row.low))}% 100%` }}
                  initial={false}
                  animate={{ x: `${pos(row.low) + 100 - pos(row.high)}%` }}
                  transition={spring}
                />
              </motion.span>
            </span>
            <motion.span className="absolute inset-0" initial={false} animate={{ x: `${pos(row.median)}%` }} transition={spring}>
              <span className="absolute left-0 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-ink shadow-md" />
            </motion.span>
          </div>
          <Bound label={t('wages.high')} value={show(row.high)} end />
        </div>
      ) : null}

      <dl className="m-0 mt-6 grid @md:grid-cols-3 @md:border-t @md:border-ink/10 @md:pt-5">
        {canYear && row?.median != null ? (
          estimate ? (
            <Fact label={t('wages.fact.hour')}>{fmt.money(row.median, { cents: 'always' })}</Fact>
          ) : (
            <Fact label={t('wages.fact.year')}>{t('wages.fact.about', { amount: fmt.money(yearly(row.median), { cents: 'never' }) })}</Fact>
          )
        ) : null}
        {diff != null ? (
          <Fact label={t('wages.fact.vs')}>
            <span dir="auto" className={cn(Math.abs(diff) < 0.1 ? 'text-ink' : diff > 0 ? 'text-pine' : 'text-maple-ink')}>
              {Math.abs(diff) < 0.005 ? t('wages.fact.same') : t('wages.fact.vsValue', { pct: fmt.number(Math.abs(diff), { style: 'percent', maximumFractionDigits: 0 }), dir: diff > 0 ? 'above' : 'below' })}
            </span>
          </Fact>
        ) : null}
        {outlook ? (
          <Fact label={t('wages.fact.outlook')}>
            <OutlookMeter stars={outlook.stars} label={t(`outlook.short.${outlook.stars}`)} strong />
          </Fact>
        ) : null}
        {!province && ranked.length > 1 ? (
          <>
            <Fact label={t('wages.fact.top')}>{t('wages.fact.place', { province: provinceName(top.code), amount: show(top.median) })}</Fact>
            <Fact label={t('wages.fact.bottom')}>{t('wages.fact.place', { province: provinceName(bottom.code), amount: show(bottom.median) })}</Fact>
          </>
        ) : null}
      </dl>
    </div>
  );
}

/** "Low $29.00" / "High $55.00" at either end of the headline bar. */
function Bound({ label, value, end }: { label: string; value: string; end?: boolean }) {
  return (
    <span className={cn('text-[12.5px] leading-tight text-ink-2', end && 'text-end')}>
      <span className="block">{label}</span>
      <b className="block text-[14px] font-semibold tabular-nums text-ink">{value}</b>
    </span>
  );
}
