'use client';
/**
 * The duty-free verdict: what the exemption is, whether duty applies and on how much, with a gauge of the
 * amount against the allowance.
 */
import { LiveRegion, NumberTicker } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { EXEMPTION } from './data';
import messages from './messages';
import type { ExemptionResult } from './types';

export function DutyVerdict({ r }: { r: ExemptionResult }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n);
  // Nothing entered yet: invite input instead of ruling on $0 of goods.
  const idle = r.spent === 0 && r.tier !== 'under24';
  const free = r.outcome === 'free';
  const cap = Math.max(r.allowance, 1);
  const scale = Math.max(r.spent, r.allowance, 200) * 1.08;
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const announcement = idle
    ? t('verdict.srUpTo', { allowance: money(r.allowance) })
    : free
      ? t('verdict.srFree', { allowance: money(r.allowance) })
      : r.allowance
        ? t('verdict.srDuty', { allowance: money(r.allowance), amount: money(r.dutiable) })
        : t('verdict.srNone', { amount: money(r.dutiable) });
  return (
    <div
      className={cn(
        'relative mx-3 overflow-hidden rounded-[22px] border px-5 py-5 sm:mx-4 sm:px-6',
        idle
          ? 'border-glacier/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_13%,transparent),color-mix(in_oklab,var(--pine)_6%,transparent)_65%,transparent)]'
          : free
          ? 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_13%,transparent),color-mix(in_oklab,var(--glacier)_10%,transparent)_60%,transparent)]'
          : r.outcome === 'over'
            ? 'border-amber/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_15%,transparent),color-mix(in_oklab,var(--glacier)_6%,transparent)_65%,transparent)]'
            : 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_11%,transparent),color-mix(in_oklab,var(--amber)_7%,transparent)_65%,transparent)]',
      )}
    >
      {/* One short, settled sentence for screen readers: never the ticker's in-between values. */}
      <LiveRegion text={announcement} />
      <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
        {idle ? t(`verdict.away.${r.tier}`) : r.allowance ? t('verdict.allowance', { amount: money(r.allowance) }) : t('verdict.noAllowance')}
      </p>
      <p className="m-0 mt-2 font-serif text-[30px] leading-[1.08] tracking-[-.025em] text-ink [font-variation-settings:'opsz'_48] @xl:text-[34px]">
        {idle ? (
          t('verdict.upTo', { amount: money(r.allowance) })
        ) : free ? (
          r.spent === 0 && r.tier === 'under24' ? (
            t('verdict.sameDayTitle')
          ) : (
            t('verdict.free')
          )
        ) : (
          <>
            {t('verdict.dutyOn')}{' '}
            <span className={r.outcome === 'over' ? 'text-amber' : 'text-maple-ink'} aria-hidden>
              {/* Whole dollars while it tweens, like every other amount in the calculator. */}
              <NumberTicker value={r.dutiable} format={(n) => money(Math.round(n))} />
            </span>
          </>
        )}
      </p>
      <p className="m-0 mt-1.5 max-w-[58ch] text-[15px] leading-[1.5] text-ink-2">
        {idle
          ? t('verdict.enter')
          : r.outcome === 'free'
          ? r.tier === 'under24'
            ? t('verdict.sameDay')
            : t('verdict.freeSub', { left: money(Math.max(0, r.allowance - r.spent)), allowance: money(r.allowance) })
          : r.outcome === 'over'
            ? t('verdict.overSub', { allowance: money(r.allowance), spent: money(r.spent) })
            : r.outcome === 'cliff'
              ? t('verdict.cliffSub', { spent: money(r.spent), amount: money(EXEMPTION.h24) })
              : t('verdict.noneSub')}
      </p>
      {r.allowance ? (
        <div className="mt-5" aria-hidden>
          <div className="relative h-3 rounded-full bg-paper-2">
            <span
              className={cn('absolute inset-y-0 start-0 rounded-full transition-[width] duration-500 motion-reduce:transition-none', free ? 'bg-pine' : r.outcome === 'over' ? 'bg-amber' : 'bg-maple')}
              style={{ width: pct(r.spent) }}
            />
            {r.outcome === 'over' ? (
              <span className="absolute inset-y-0 start-0 rounded-full bg-pine transition-[width] duration-500 motion-reduce:transition-none" style={{ width: pct(Math.min(r.spent, cap)) }} />
            ) : null}
            <span className="absolute -inset-y-1.5 w-0.5 rounded-full bg-ink" style={{ insetInlineStart: pct(r.allowance) }} />
          </div>
          <div className="relative mt-2 h-4 font-mono text-[11.5px] text-ink-3">
            {(r.allowance / scale) * 100 > 18 ? (
              <span className="absolute start-0">
                <bdi dir="ltr">{money(0)}</bdi>
              </span>
            ) : null}
            <span className="absolute whitespace-nowrap text-ink" style={{ insetInlineStart: `max(0px, calc(${pct(r.allowance)} - 1.4em))` }}>
              <bdi dir="ltr">{money(r.allowance)}</bdi>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
