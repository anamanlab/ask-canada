'use client';
/**
 * The import side of businessTrade: a duty + GST estimate that converts the invoice with the live Bank of
 * Canada rate (or asks for Canadian dollars when rates are down), then the steps to set up as an importer.
 */
import { useId } from 'react';
import { ExternalLink, LiveRegion, Notice, NumberInput, NumberTicker, PercentInput, Select, Stat, Stepper, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/i18n/format';
import type { TradeOutput } from './build';
import { importEstimate } from './calc';
import { CURRENCIES, IMPORT, type Currency } from './data';
import { STAT_CELL, STAT_GRID, useBiz, useSelectOnTab } from './shared';

/** What the person entered (kept by BusinessTrade, so it survives a switch to Export and back). */
export type ImportDraft = {
  amount: number;
  currency: Currency | 'CAD';
  duty: number | null;
};

/** An em dash in a tile that waits for the duty rate (hidden from screen readers, which hear the sentence instead). */
const DASH = (
  <span aria-hidden className="text-ink-3">
    —
  </span>
);

export function TradeImport({ data, draft, onChange, us }: { data: TradeOutput; draft: ImportDraft; onChange: (next: ImportDraft) => void; /** The person said the goods come from the U.S. */ us: boolean }) {
  const { t, fmt, intl, href } = useBiz();
  const curId = useId();
  const selectOnTab = useSelectOnTab();
  const { amount, currency, duty } = draft;
  const { fx, original } = data.import;
  const rate = currency === 'CAD' ? 1 : (fx?.rates[currency] ?? 1);
  const est = importEstimate({ amount, rate, dutyRate: duty ?? 0 });
  const empty = est.valueCad === 0;
  // No duty rate yet: GST alone would understate what's owed, so the duty and total tiles wait for the rate.
  const noDuty = duty == null;
  const cad = (n: number) => fmt.money(n, { cents: 'always' });
  const options: (Currency | 'CAD')[] = fx ? [...CURRENCIES.filter((c) => fx.rates[c]), 'CAD'] : ['CAD'];
  // Foreign amounts carry their currency code or symbol ("US$2,500", "2 500 $ US") so they never read as CAD.
  const foreign = (n: number, cur: string) => {
    try {
      return formatCurrency(n, intl, cur, { maximumFractionDigits: 2, currencyDisplay: 'symbol' });
    } catch {
      return `${fmt.number(n)} ${cur}`;
    }
  };

  return (
    <>
      <WidgetSection title={t('trade.estimate')} className="mt-5 border-t border-hair">
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 @xl:grid-cols-[minmax(0,1.3fr)_132px_minmax(0,1fr)]" {...selectOnTab}>
          {/* The currency select sits right beside the field, so the field shows no unit of its own. */}
          <NumberInput label={t('trade.amount')} value={amount || undefined} onChange={(n) => onChange({ ...draft, amount: n ?? 0 })} min={0} max={1e9} placeholder="0" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={curId} className="text-[14px] font-medium leading-snug text-ink">
              {t('trade.currency')}
            </label>
            <Select
              id={curId}
              value={currency}
              onChange={(e) => onChange({ ...draft, currency: options.find((c) => c === e.target.value) ?? 'CAD' })}
              disabled={options.length < 2}
              options={options.map((c) => ({ value: c, label: c }))}
              className="disabled:opacity-70"
            />
          </div>
          {/* Typed from the start edge like the invoice value beside it; the % stays at the end of the field. */}
          <PercentInput
            className="col-span-2 @xl:col-span-1 [&_input]:text-start"
            label={t('trade.duty')}
            value={duty ?? undefined}
            onChange={(n) => onChange({ ...draft, duty: n ?? null })}
            max={300}
            placeholder="0"
          />
        </div>

        {/* One closing line under the fields. Phones: where to find the duty rate first (right under its field), then the exchange rate. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 @xl:mt-2">
          <ExternalLink href={href('customsTariff')} standalone icon={false} className="w-full text-[13px] font-normal text-ink-2 hover:text-ink @xl:order-last @xl:ms-auto @xl:w-auto">
            {t('trade.duty.hint')}
          </ExternalLink>
          {/* The Bank of Canada line only when a rate is applied: a Canadian-dollar invoice needs none. */}
          {fx && currency !== 'CAD' ? (
            <p className="m-0 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[12px] text-ink-3">
              <span className="size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
              <span>{t('trade.fx.live', { date: fmt.date(fx.date, { month: 'short', day: 'numeric', year: 'numeric' }) })}</span>
              {/* Phones: the rate gets its own line (aligned under the date); wide: joined by a dot. */}
              <span aria-hidden className="hidden @xl:inline">·</span>
              <span className="w-full ps-3 text-ink-2 @xl:w-auto @xl:ps-0">
                <bdi dir="ltr">{t('trade.fx.rate', { currency, rate: fmt.number(rate, { maximumFractionDigits: 6 }) })}</bdi>
              </span>
            </p>
          ) : null}
        </div>
        {fx ? null : (
          <Notice tone="info" className="mt-2">
            <span className="block">{original ? t('trade.fx.offInvoice', { amount: foreign(original.amount, original.currency) }) : t('trade.fx.off')}</span>
            <ExternalLink href={href('fx')} standalone icon={false} className="decoration-current">
              {t('trade.fx.offLink')}
            </ExternalLink>
          </Notice>
        )}

        {/* No amount yet: one quiet prompt instead of four empty tiles. The tiles appear with the first figure. */}
        {empty ? (
          <p className="m-0 mt-4 rounded-tile border border-dashed border-hair-2 px-4 py-3.5 text-[14px] leading-snug text-ink-2">{t('trade.result.waiting')}</p>
        ) : (
          <div className={cn(STAT_GRID, 'mt-4 @xl:grid-cols-4')}>
            <Stat
              size="sm"
              className={STAT_CELL}
              label={t('trade.result.value')}
              value={<NumberTicker value={est.valueCad} format={cad} />}
              note={currency !== 'CAD' ? t('trade.result.invoice', { amount: foreign(amount, currency) }) : undefined}
            />
            <Stat
              size="sm"
              className={STAT_CELL}
              label={t('trade.result.duty')}
              value={noDuty ? DASH : <NumberTicker value={est.duty} format={cad} />}
              note={noDuty ? t('trade.duty.unknown') : fmt.number(duty / 100, { style: 'percent', maximumFractionDigits: 2 })}
            />
            <Stat
              size="sm"
              className={STAT_CELL}
              label={t('trade.result.gst', { rate: fmt.number(IMPORT.gstRate) })}
              value={<NumberTicker value={est.gst} format={cad} />}
              note={noDuty ? t('trade.result.gstBeforeDuty') : t('trade.result.gstNote')}
            />
            <Stat
              size="sm"
              className={STAT_CELL}
              label={t('trade.result.total')}
              value={noDuty ? DASH : <NumberTicker value={est.total} format={cad} />}
              note={noDuty ? t('trade.result.totalNoDuty') : t('trade.result.totalNote')}
              tone={noDuty ? undefined : 'ok'}
            />
          </div>
        )}
        <LiveRegion
          text={
            empty
              ? t('trade.result.waiting')
              : noDuty
                ? t('trade.result.srNoDuty', { gst: cad(est.gst), value: cad(est.valueCad) })
                : t('trade.result.sr', { duty: cad(est.duty), gst: cad(est.gst), total: cad(est.total), value: cad(est.valueCad) })
          }
        />
        <p className={cn('m-0 text-[13px] leading-snug text-ink-3', empty ? 'mt-2.5' : 'mt-1')}>{t('trade.estimate.note')}</p>
        {/* U.S. counter-tariffs only when the person said the goods come from the U.S.; otherwise the neutral all-countries page. */}
        <Notice tone={us ? 'warn' : 'info'} className="mt-3">
          <span className="block">{t(us ? 'trade.tariffs' : 'trade.tariffs.other')}</span>
          <ExternalLink href={href(us ? 'counterTariffs' : 'tariffResponses')} standalone icon={false} className="decoration-current">
            {t(us ? 'trade.tariffs.link' : 'trade.tariffs.other.link')}
          </ExternalLink>
        </Notice>
      </WidgetSection>

      <WidgetSection title={t('trade.import.steps')}>
        <Stepper
          steps={(['s1', 's2', 's3', 's4', 's5', 's6'] as const).map((s) => ({
            title: t(`trade.import.${s}`),
            detail: t(`trade.import.${s}.d`),
            state: 'upcoming',
          }))}
        />
      </WidgetSection>
    </>
  );
}
