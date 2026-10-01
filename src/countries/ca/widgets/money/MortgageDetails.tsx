'use client';
/**
 * The lower sections of the stress test:
 *   MortgageLoan  — price − down payment + CMHC premium = the mortgage
 *   MortgageRates — live Bank of Canada rates, or a link to its rates page when they could not be fetched
 */
import { Info } from 'lucide-react';
import { Badge, ExternalLink, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { downShare, type MortgageResult } from './calc/mortgage';
import { MORTGAGE } from './data';
import { useMoneyFormat } from './format';
import messages from './messages';
import type { LiveRates } from './rates';

const SERIES = ['posted5y', 'prime', 'policy'] as const;

export function MortgageLoan({ r }: { r: MortgageResult }) {
  const t = useMessages(messages);
  const { money, pct, rate } = useMoneyFormat();
  const conv = pct(MORTGAGE.conventionalDown * 100, 0);
  return (
    <WidgetSection title={t('mtg.loan.title')}>
      <dl className="m-0 grid gap-0 text-[14.5px]">
        <Line k={t('mtg.loan.price')} v={money(r.price)} />
        <Line k={t('mtg.loan.down', { pct: pct(downShare(r), 1) })} v={t('mtg.loan.minus', { amount: money(r.downPayment) })} />
        {r.insured ? <Line k={t('mtg.loan.premium', { pct: rate(r.premiumRate * 100) })} v={t('mtg.loan.plus', { amount: money(r.premium) })} /> : null}
        <Line k={t('mtg.loan.total')} v={money(r.loan)} strong />
      </dl>
      {r.insured ? (
        <p className="m-0 mt-3 flex gap-2 text-[13px] leading-snug text-ink-3">
          <Info className="mt-px size-4 shrink-0" aria-hidden />
          {t('mtg.loan.insuredNote', { pct: conv })}
        </p>
      ) : (
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('mtg.loan.noInsurance', { pct: conv })}</p>
      )}
    </WidgetSection>
  );
}

export function MortgageRates({ rates, href }: { rates: LiveRates; href: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { rate } = useMoneyFormat();
  const live = (
    <Badge tone="live" mono>
      {t('mtg.rates.live')}
    </Badge>
  );
  return (
    <WidgetSection
      title={t('mtg.rates.title')}
      aside={rates.live ? <span className="hidden @md:inline-flex">{live}</span> : null}
    >
      {rates.live ? (
        <>
          {/* Phones: the badge sits under the title, so a longer title (French) never wraps beside it. */}
          <div className="-mt-1.5 mb-3 flex @md:hidden">{live}</div>
          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {SERIES.map((k) => {
              const x = rates[k];
              return (
                // Label on top, value pinned to the bottom: values line up even when a label wraps.
                <li key={k} className="flex min-w-0 flex-col justify-between gap-1 rounded-tile border border-hair bg-paper-2 px-3 py-3">
                  <p className="m-0 text-[12px] font-medium leading-tight text-ink-2">
                    <bdi>{t(`mtg.rates.${k}`)}</bdi>
                  </p>
                  <div>
                    <p className="m-0 font-serif text-[24px] leading-none tracking-[-.02em] text-ink tabular-nums">{x ? rate(x.value) : t('none')}</p>
                    {x ? <p className="m-0 mt-1 font-mono text-[11px] text-ink-3">{fmt.date(x.date, { month: 'short', day: 'numeric' })}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('mtg.rates.note')}</p>
        </>
      ) : (
        <p className="m-0 text-[14px] leading-snug text-ink-2">
          {t('mtg.rates.offline')}{' '}
          <ExternalLink href={href}>{t('mtg.rates.offlineLink')}</ExternalLink>
        </p>
      )}
    </WidgetSection>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 border-t border-hair py-2.5 first:border-t-0', strong && 'font-semibold text-ink')}>
      <dt className={cn('min-w-0', strong ? 'text-ink' : 'text-ink-2')}>{k}</dt>
      <dd className="m-0 shrink-0 tabular-nums text-ink">
        <bdi dir="ltr">{v}</bdi>
      </dd>
    </div>
  );
}
