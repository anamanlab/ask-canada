'use client';
/**
 * Mortgage stress test: the payment at the minimum qualifying rate, GDS/TDS against the 39% / 44% limits,
 * the minimum down payment, the CMHC premium when the down payment is under 20%, the highest price that
 * passes, and live Bank of Canada rates. Every number is editable and recomputed on the device.
 * Verdicts are honest about missing inputs: without the rate, property tax or heating, a pass is only a
 * "maybe" (each missing input can only make the result worse), never a confident "you pass".
 */
import { useRef, useState } from 'react';
import { Check, CircleAlert, House, Info, PenLine } from 'lucide-react';
import { Button, LiveRegion, Notice, NumberTicker, Stat, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { stressTest, type MortgageInput } from './calc/mortgage';
import { MORTGAGE } from './data';
import { useMoneyFormat } from './format';
import { listAnd } from './intl';
import { L, mortgageLinks, sourcesIn, URLS } from './links';
import messages from './messages';
import { MortgageLoan, MortgageRates } from './MortgageDetails';
import { MortgageNumbers } from './MortgageNumbers';
import type { MortgageOutput } from './output';
import { mortgagePreview } from './preview';
import { Eyebrow, Hero, MoneySkeleton, RatioGauge } from './shared';

export function MortgageStressTest({ part }: WidgetProps<MortgageInput, MortgageOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('mtg.error')} fallback={{ href: URLS.qualifier[L(locale)], label: t('mtg.handoff') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <Loading input={part.input} />;
  }
  return <StressTest data={part.output} />;
}

/** The test for the numbers the tool was called with, unseen under the skeleton. Without an income and a price there is no test yet. */
function Loading({ input }: { input: unknown }) {
  const t = useMessages(messages);
  const data = mortgagePreview(input);
  const ready = data.result.income > 0 && data.result.price > 0;
  return (
    <MoneySkeleton title={t('mtg.title')} subtitle={t('mtg.subtitle')} icon={House} tone="maple" label={t('loading')} blocks={ready ? [5, 14, 9, 5, 3] : [5, 9, 3]} actions={1}>
      <StressTest key={JSON.stringify(input)} data={data} />
    </MoneySkeleton>
  );
}

const HERO_ICON = { pass: Check, fail: CircleAlert, maybe: Info } as const;
const HERO_TONE = { pass: 'pine', fail: 'maple', maybe: 'glacier' } as const;
const ICON_BG = {
  pass: 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]',
  fail: 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
  maybe: 'bg-glacier shadow-[0_0_0_6px_var(--glacier-wash)]',
} as const;

function StressTest({ data }: { data: MortgageOutput }) {
  const t = useMessages(messages);
  const { fmt, locale, intl } = useLocale();
  const lang = L(locale);
  const links = mortgageLinks(lang);
  const init = data.result;
  const [v, setV] = useState<MortgageInput>({
    income: init.income || undefined,
    price: init.price || undefined,
    downPayment: init.downIsMinimum ? undefined : init.downPayment,
    rate: data.input.rate,
    amortization: init.amortization,
    propertyTax: init.propertyTax || undefined,
    heating: init.heating || undefined,
    condoFees: init.condoFees || undefined,
    debts: init.debts || undefined,
    firstTimeBuyer: init.firstTimeBuyer,
    newBuild: init.newBuild,
  });
  const set = <K extends keyof MortgageInput>(k: K) => (x: MortgageInput[K]) => setV((s) => ({ ...s, [k]: x }));
  const r = stressTest(v);
  // Costs, debts and loan options start folded away; the "add property tax and heating" notice opens them.
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  // "Add costs" opens the panel and asks for the caret in its first field; the field takes focus as it is
  // attached (the panel mounts on first open). Opening it by hand leaves focus on the toggle.
  const [focusCosts, setFocusCosts] = useState(false);
  const onMore = (open: boolean) => {
    setFocusCosts(false);
    setMore(open);
  };
  const openMore = () => {
    setFocusCosts(true);
    setMore(true);
    moreRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const { money, pct, rate } = useMoneyFormat();
  const ready = r.income > 0 && r.price > 0;
  const conv = pct(MORTGAGE.conventionalDown * 100, 0);
  const limits = { gds: pct(MORTGAGE.gdsMax, 0), tds: pct(MORTGAGE.tdsMax, 0) };
  const missing = listAnd(r.missing.map((m) => t(`mtg.missing.${m}`)), intl);
  const floorFail = r.rateMissing && (r.reason === 'gds' || r.reason === 'tds');
  // Anything missing (rate, property tax, heating) can only lower the price and raise the income needed,
  // so on every verdict those figures are bounds, not estimates.
  const rough = r.missing.length > 0;
  const costsWhich = r.missing.includes('propertyTax') ? (r.missing.includes('heating') ? 'both' : 'propertyTax') : 'heating';
  const showMax = r.maxPrice != null && r.maxPrice > 0;
  const showIncome = r.verdict === 'fail' && !!r.incomeNeeded;
  const rates = data.rates;
  const Icon = HERO_ICON[r.verdict];

  return (
    <WidgetShell
      icon={House}
      tone="maple"
      title={t('mtg.title')}
      subtitle={t('mtg.subtitle')}
      sources={sourcesIn(data, lang)}
      handoff={{ href: links.qualifier, label: t('mtg.handoff'), note: t('mtg.handoffNote') }}
      footnote={t('mtg.footnote')}
      className="@container [text-wrap:pretty]"
    >
      {ready ? (
        <LiveRegion
          text={`${t('mtg.sr', { gds: pct(r.gds, 1), tds: pct(r.tds, 1), qual: rate(r.qualifyingRate), gdsMax: limits.gds, tdsMax: limits.tds })} ${t(
            r.verdict === 'pass' ? 'mtg.verdict.srPass' : r.verdict === 'fail' ? 'mtg.verdict.srFail' : 'mtg.verdict.srMaybe',
          )}`}
        />
      ) : null}
      {ready ? (
        <Hero tone={HERO_TONE[r.verdict]}>
          {/* Phones: the icon sits beside the verdict line only and the body takes the hero's full width.
              Wider: the icon is a column and everything aligns after it. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 @md:gap-x-3.5">
            <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-card @md:size-9', ICON_BG[r.verdict])} aria-hidden>
              <Icon className="size-4 @md:size-[18px]" strokeWidth={2.5} />
            </span>
            <p className="m-0 self-center font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">
              <bdi>{t(`mtg.verdict.${r.verdict}`, { price: money(r.price) })}</bdi>
            </p>
            <div className="col-span-2 min-w-0 @md:col-span-1 @md:col-start-2">
              <p className="m-0 mt-2 text-[15px] leading-snug text-ink-2 @md:mt-1.5">
                {r.verdict === 'maybe'
                  ? t('mtg.maybe.body', { missing, gds: pct(r.gds, 1), qual: rate(r.qualifyingRate), limit: limits.gds })
                  : r.reason
                    ? t(floorFail ? `mtg.reason.${r.reason}Floor` : `mtg.reason.${r.reason}`, {
                        min: money(r.minDown),
                        gds: pct(r.gds, 1),
                        tds: pct(r.tds, 1),
                        qual: rate(r.qualifyingRate),
                        limit: r.reason === 'tds' ? limits.tds : limits.gds,
                        pct: conv,
                        cap: money(MORTGAGE.insuredCap),
                      })
                    : t('mtg.reason.pass', { gds: pct(r.gds, 1), tds: pct(r.tds, 1) })}
                {r.verdict === 'fail' && r.downIsMinimum && (r.reason === 'gds' || r.reason === 'tds') ? ` ${t('mtg.reason.moreDown')}` : null}
              </p>
              {showMax ? (
                <p className="m-0 mt-3 text-[14.5px] text-ink-2">
                  {t(rough ? 'mtg.max.preMaybe' : 'mtg.max.pre')}{' '}
                  <b className="font-serif text-[22px] font-normal tracking-[-.02em] text-ink">
                    <NumberTicker value={r.maxPrice ?? 0} format={money} />
                  </b>
                  <span className="text-ink-3"> {t('mtg.max.post', { down: money(r.downPayment) })}</span>
                </p>
              ) : null}
              {showIncome ? (
                <p className="m-0 mt-1 text-[13.5px] text-ink-2">{t(rough ? 'mtg.incomeNeededMin' : 'mtg.incomeNeeded', { income: money(r.incomeNeeded ?? 0) })}</p>
              ) : null}
              {r.verdict === 'fail' && rough && (showMax || showIncome) ? (
                <p className="m-0 mt-1.5 flex gap-1.5 text-[12.5px] leading-snug text-ink-3">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  {t('mtg.fail.missingNote', { missing, count: r.missing.length })}
                </p>
              ) : null}
            </div>
          </div>
        </Hero>
      ) : (
        <Hero tone="glacier">
          <Eyebrow>{t('mtg.empty.eyebrow')}</Eyebrow>
          <p className="m-0 mt-2 font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [text-wrap:balance]">{t('mtg.empty.title')}</p>
          <p className="m-0 mt-1.5 text-[15px] text-ink-2">{t('mtg.empty.body', { floor: rate(MORTGAGE.floor), buffer: fmt.number(MORTGAGE.buffer) })}</p>
        </Hero>
      )}

      {ready ? (
        <WidgetSection title={t('mtg.test.title')}>
          <div className="grid grid-cols-2 gap-2.5 @xl:grid-cols-3">
            <Stat
              className="col-span-2 @xl:col-span-1"
              label={t('mtg.stat.qual')}
              value={rate(r.qualifyingRate)}
              note={
                r.rate == null
                  ? t('mtg.stat.qualNoRate')
                  : r.bufferApplies
                    ? t('mtg.stat.qualBuffer', { rate: rate(r.rate), buffer: fmt.number(MORTGAGE.buffer) })
                    : t('mtg.stat.qualFloor', { rate: rate(r.rate), floor: rate(MORTGAGE.floor), buffer: fmt.number(MORTGAGE.buffer) })
              }
            />
            <Stat
              label={t('mtg.stat.payment')}
              value={r.payment == null ? <span className="text-ink-3">{t('none')}</span> : <NumberTicker value={Math.round(r.payment)} format={money} />}
              note={r.rate == null ? t('mtg.stat.paymentNoRate') : t('mtg.stat.paymentNote', { rate: rate(r.rate) })}
            />
            <Stat label={t('mtg.stat.qualPayment')} value={<NumberTicker value={Math.round(r.qualifyingPayment)} format={money} />} note={t('mtg.stat.qualPaymentNote')} />
          </div>
          <div className="mt-5 grid gap-5 @xl:grid-cols-2 @xl:gap-x-8">
            <RatioGauge label={t('mtg.gds')} value={r.gds} limit={MORTGAGE.gdsMax} display={pct(Math.min(r.gds, 999), 1)} limitLabel={t('mtg.limit', { n: limits.gds })} note={t('mtg.gdsNote')} />
            <RatioGauge label={t('mtg.tds')} value={r.tds} limit={MORTGAGE.tdsMax} display={pct(Math.min(r.tds, 999), 1)} limitLabel={t('mtg.limit', { n: limits.tds })} note={t(r.debts > 0 ? 'mtg.tdsNote' : 'mtg.tdsSame')} quiet={r.debts === 0} />
          </div>
          <div className="mt-4 grid gap-2.5">
            {r.rateMissing ? (
              <Notice tone="info" title={t('mtg.noRate.title')}>
                {t('mtg.noRate.body', { floor: rate(MORTGAGE.floor), buffer: fmt.number(MORTGAGE.buffer) })}
              </Notice>
            ) : null}
            {r.costsMissing ? (
              <Notice tone="warn" title={t('mtg.costs.title', { which: costsWhich })}>
                {t('mtg.costs.body', { which: costsWhich })}
                {more ? null : (
                  <Button variant="secondary" size="sm" icon={PenLine} className="mt-2.5 flex" onClick={openMore}>
                    {t('mtg.costs.add', { which: costsWhich })}
                  </Button>
                )}
              </Notice>
            ) : null}
            {r.amortizationAdjusted ? (
              <Notice tone="info" title={t('mtg.amort30.title', { years: MORTGAGE.amortLong })}>
                {t('mtg.amort30.body', { pct: conv, short: MORTGAGE.amortDefault })}
              </Notice>
            ) : null}
          </div>
        </WidgetSection>
      ) : null}

      <MortgageNumbers v={v} set={set} r={r} more={more} onMore={onMore} moreRef={moreRef} focusCosts={focusCosts} />

      {ready && r.downOk ? <MortgageLoan r={r} /> : null}
      <MortgageRates rates={rates} href={links.boc} />
    </WidgetShell>
  );
}
