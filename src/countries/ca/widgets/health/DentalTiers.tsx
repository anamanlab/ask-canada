'use client';
/** Co-payment tiers as a bar, with the current income marked. Text equivalent in the sr-only list. */
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { INCOME_MAX } from './dental-saved';
import messages from './messages';

const TIER_CLS = ['bg-pine', 'bg-glacier', 'bg-amber'];
const OVER_CLS = 'bg-[repeating-linear-gradient(-45deg,var(--maple)_0_3px,transparent_3px_7px)] opacity-50';

/**
 * A phrase with its amounts isolated left to right ("$70,000", « 79 999 $ »). The phrase itself takes the
 * direction of its own words (a plain <bdi>): a right-to-left locale reads "from … to …" in its order, and the
 * English fallback on a right-to-left page still reads "$70,000 to $79,999".
 */
function Amounts({ text, amounts }: { text: string; amounts: string[] }) {
  const parts: string[] = [];
  let rest = text;
  for (const a of amounts) {
    const i = rest.indexOf(a);
    if (i < 0) continue;
    parts.push(rest.slice(0, i), a);
    rest = rest.slice(i + a.length);
  }
  parts.push(rest);
  return (
    <bdi>
      {parts.map((p, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr" className="whitespace-nowrap">
            {p}
          </bdi>
        ) : (
          p
        ),
      )}
    </bdi>
  );
}

export function DentalTiers({ income, limit, tiers }: { income?: number; limit: number; tiers: { below: number; copay: number }[] }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const bands: { from: number; to: number; copay: number | null; cls: string }[] = [
    ...tiers.map((tier, i) => ({ from: i === 0 ? 0 : tiers[i - 1].below, to: tier.below, copay: tier.copay, cls: TIER_CLS[i] ?? 'bg-amber' })),
    { from: limit, to: INCOME_MAX, copay: null, cls: OVER_CLS },
  ];
  const pct = (n: number) => (Math.min(n, INCOME_MAX) / INCOME_MAX) * 100;
  return (
    <div className="mt-1">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
        {bands.map((b) => (
          <span
            key={b.from}
            className={cn('absolute inset-y-0', b.cls, income != null && (income < b.from || income >= b.to) && b.copay != null && 'opacity-35')}
            style={{ insetInlineStart: `${pct(b.from)}%`, width: `calc(${pct(b.to) - pct(b.from)}% - 2px)` }}
          />
        ))}
      </div>
      {/* Phones: one tier per line (label, then its range, never broken inside the range); wider: 2 × 2. */}
      <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-x-3 gap-y-1 p-0 @sm:grid-cols-2 @sm:gap-y-2" aria-hidden>
        {bands.map((b) => {
          const here = income != null && income >= b.from && (b.copay == null ? true : income < b.to);
          return (
            <li key={b.from} className={cn('flex min-w-0 items-start gap-2 rounded-field px-1.5 py-1 transition-colors', here && 'bg-paper-2')}>
              <span className={cn('mt-[5px] size-2 shrink-0 rounded-full', b.cls, b.copay == null && 'opacity-100')} />
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 leading-tight @sm:block">
                <span className="text-[12.5px] font-semibold text-ink @sm:block">{b.copay == null ? t('dental.tier.none') : t('dental.tier.pay', { pct: b.copay })}</span>
                <span className="whitespace-nowrap text-[12px] text-ink-3 @sm:block @sm:whitespace-normal">
                  {b.copay == null ? (
                    <Amounts text={t('dental.tier.from', { amount: money(limit) })} amounts={[money(limit)]} />
                  ) : b.from === 0 ? (
                    <Amounts text={t('dental.tier.under', { amount: money(b.to) })} amounts={[money(b.to)]} />
                  ) : (
                    <Amounts text={t('dental.tier.range', { from: money(b.from), to: money(b.to - 1) })} amounts={[money(b.from), money(b.to - 1)]} />
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <ul className="sr-only">
        {tiers.map((tier, i) => (
          <li key={tier.below}>{t('dental.tier.sr', { from: money(i === 0 ? 0 : tiers[i - 1].below), to: money(tier.below - 1), pct: tier.copay })}</li>
        ))}
        <li>{t('dental.tier.srOver', { limit: money(limit) })}</li>
      </ul>
    </div>
  );
}
