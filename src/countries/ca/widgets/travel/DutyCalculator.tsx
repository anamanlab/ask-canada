'use client';
/**
 * Personal exemption calculator for coming home to Canada (DutyFree renders it). The person changes how
 * long they were away and what they spent; the verdict, gauge and rules update instantly.
 */
import { useState } from 'react';
import { Cigarette, Info, Package, PlaneLanding, ShoppingBag, Wine } from 'lucide-react';
import { ExternalLink, MoneyInput, Notice, Segmented, Slider, Toggle, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { ALCOHOL, ARRIVECAN_HOURS, BIS, CURRENCY_REPORT, EXEMPTION, TOBACCO, URLS } from './data';
import { DutyVerdict } from './DutyVerdict';
import { computeExemption, TIERS } from './exemption';
import messages from './messages';
import { useSources, useUiLang } from './shared';
import type { AbsenceTier, DutyFreeOutput } from './types';

/** The most the amount field accepts (the tool's own input limit). */
const MAX_SPENT = 1_000_000;

export function DutyCalculator({ initial }: { initial: DutyFreeOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // Links and sources follow the UI, even when the question (and so the tool) was in the other language.
  const L = useUiLang();
  const sources = useSources(initial);
  const [tier, setTier] = useState<AbsenceTier>(initial.result.tier);
  // Whole dollars throughout (slider, field, verdict), so the three never disagree on cents.
  const [spent, setSpent] = useState(() => Math.round(initial.result.spent));
  const [alcohol, setAlcohol] = useState(initial.result.alcohol);
  const [tobacco, setTobacco] = useState(initial.result.tobacco);
  const r = computeExemption({ tier, spent, alcohol, tobacco });
  // The slider's range grows with the amount: typing $2,400, or dragging to the end, extends it.
  const [max, setMax] = useState(() => Math.max(2000, Math.ceil(initial.result.spent / 500) * 500));
  const setAmount = (n: number) => {
    const v = Math.min(MAX_SPENT, Math.max(0, Math.round(n)));
    setSpent(v);
    if (v >= max) setMax(Math.min(MAX_SPENT, v === max ? max * 2 : Math.ceil(v / 500) * 500 + 500));
  };

  return (
    <WidgetShell
      icon={ShoppingBag}
      tone="glacier"
      title={t('duty.title')}
      subtitle={t('duty.subtitle')}
      sources={sources}
      handoff={{ href: URLS.estimator[L], label: t('duty.handoff'), note: t('duty.handoffNote') }}
      footnote={
        // The footnote slot is a <p>: spans only, laid out as a label/number list (each row a 44px target).
        <span className="block">
          <span className="block font-medium text-ink-2">{t('duty.bis')}</span>
          {/* Wide: two label + number pairs side by side, each number right after its label. */}
          <span className="mt-1 grid gap-x-8 @xl:flex @xl:flex-wrap">
            {[
              { k: 'duty.bisHome', n: BIS.tollFree },
              { k: 'duty.bisAbroad', n: BIS.abroad },
            ].map(({ k, n }) => (
              <a
                key={k}
                href={n.href}
                className="group flex min-h-11 items-center justify-between gap-3 border-b border-hair text-ink-3 no-underline last:border-b-0 @xl:justify-start @xl:gap-2 @xl:border-b-0"
              >
                <span className="min-w-0">{t(k)}</span>
                <bdi dir="ltr" className="shrink-0 whitespace-nowrap font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] group-hover:text-ink">
                  {n.label}
                </bdi>
              </a>
            ))}
          </span>
        </span>
      }
      className="@container"
    >
      <DutyVerdict r={r} />

      <WidgetSection title={t('duty.away')}>
        <Segmented
          label={t('duty.away')}
          value={tier}
          onChange={setTier}
          // In a phone-width column the group is a grid of content-sized columns (Segmented lays out as a
          // row, a column or a grid), one per tier, so "7 days +" / « 7 jours + » stays on one line and every
          // segment keeps the same two-line height.
          className="@max-md:grid @max-md:grid-cols-[repeat(4,auto)]"
          options={TIERS.map((k) => ({
            value: k,
            label: <bdi>{t(`tier.${k}`)}</bdi>,
            sub: EXEMPTION[k] ? fmt.money(EXEMPTION[k]) : t('tier.noneShort'),
          }))}
        />
        <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-3">{t(`tier.${tier}.rule`, { amount: fmt.money(EXEMPTION[tier]) })}</p>
      </WidgetSection>

      <WidgetSection title={t('duty.goods')}>
        <Slider label={t('duty.spent')} min={0} max={max} step={10} value={Math.min(spent, max)} onChange={setAmount} format={fmt.money} />
        {/* Exact amount, typed: for values past the slider's end. Whole dollars, like the slider and the
            verdict: "1 340,50" is read the French way and rounded, so the field and the headline always match. */}
        <MoneyInput
          inline
          className="mt-1"
          label={<span className="block text-end text-[13.5px] text-ink-3">{t('duty.amountLabel')}</span>}
          value={spent}
          cents={false}
          max={MAX_SPENT}
          onChange={(n) => setAmount(n ?? 0)}
        />
        <div className="mt-2 grid gap-1 @xl:grid-cols-2 @xl:gap-x-6">
          <Toggle label={t('duty.alcohol')} checked={alcohol} onChange={setAlcohol} />
          <Toggle label={t('duty.tobacco')} checked={tobacco} onChange={setTobacco} />
        </div>
        {(alcohol || tobacco) && !r.alcoholTobaccoIncluded ? (
          <Notice tone="warn" className="mt-3" title={t('duty.atNotIncluded.title')}>
            {t(tier === 'under24' ? 'duty.atNotIncluded.under24' : 'duty.atNotIncluded.h24')}
          </Notice>
        ) : null}
      </WidgetSection>

      <Limits alcohol={alcohol} tobacco={tobacco} />

      <WidgetSection title={t('rules.title')}>
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {[
            r.canShipLater ? 'rules.shipLater' : tier === 'under24' ? null : 'rules.withYou',
            'rules.declareAll',
            'rules.perPerson',
            'rules.noCombine',
            'rules.cash',
          ]
            .filter((k): k is string => !!k)
            .map((k) => (
              <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
                {k === 'rules.shipLater' ? (
                  <Package className="mt-px size-4 shrink-0 text-pine" aria-hidden strokeWidth={1.9} />
                ) : (
                  <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
                )}
                <span>{t(k, { amount: fmt.money(CURRENCY_REPORT) })}</span>
              </li>
            ))}
        </ul>
        <div className="mt-4 grid gap-2.5">
          <Notice tone="info" icon={PlaneLanding} title={t('tip.arrivecan.title')}>
            {t('tip.arrivecan.body', { hours: ARRIVECAN_HOURS })}{' '}
            <ExternalLink href={URLS.arrivecan[L]}>{t('tip.arrivecan.link')}</ExternalLink>
          </Notice>
          <Notice tone="info" icon={Info} title={t('tip.surtax.title')}>
            {t('tip.surtax.body')}{' '}
            <ExternalLink href={URLS.surtaxes[L]}>{t('tip.surtax.link')}</ExternalLink>
          </Notice>
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}

/** Alcohol and tobacco limits (48 hours or more); the card for what the person is bringing is outlined. */
function Limits({ alcohol, tobacco }: { alcohol: boolean; tobacco: boolean }) {
  const t = useMessages(messages);
  return (
    <WidgetSection title={t('limits.title')}>
      <p className="m-0 -mt-1.5 mb-3 text-[13.5px] leading-snug text-ink-3">{t('limits.when')}</p>
      <div className="grid gap-3 @xl:grid-cols-2">
        <div className={cn('rounded-[16px] border px-4 py-3.5', alcohol ? 'border-ink/25 bg-card' : 'border-hair bg-card')}>
          <p className="m-0 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Wine className="size-4 text-maple" aria-hidden strokeWidth={1.9} />
            {t('limits.alcohol')}
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-ink-3">{t('limits.alcoholOne')}</p>
          <ul className="m-0 mt-2.5 grid list-none gap-2 p-0">
            {ALCOHOL.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="min-w-0 text-ink-2">
                  <span className="block">{t(`limits.${a.id}`)}</span>
                  <span className="block text-[12.5px] leading-snug text-ink-3">{t(`limits.${a.id}.about`)}</span>
                </span>
                <span className="shrink-0 font-mono text-[13px] font-medium text-ink">
                  <bdi>{t('limits.litres', { n: a.litres })}</bdi>
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2.5 text-[12.5px] leading-snug text-ink-3">{t('limits.age')}</p>
        </div>
        <div className={cn('rounded-[16px] border px-4 py-3.5', tobacco ? 'border-ink/25 bg-card' : 'border-hair bg-card')}>
          <p className="m-0 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Cigarette className="size-4 text-amber" aria-hidden strokeWidth={1.9} />
            {t('limits.tobaccoTitle')}
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-ink-3">{t('limits.tobaccoAll')}</p>
          <ul className="m-0 mt-2.5 grid list-none gap-2 p-0">
            {TOBACCO.map((x) => (
              <li key={x.id} className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="min-w-0 text-ink-2">
                  {t(`limits.${x.id}`)}
                  {x.id === 'vaping' ? <span className="block text-[12.5px] leading-snug text-ink-3">{t('limits.vaping.about')}</span> : null}
                </span>
                <span className="shrink-0 text-end font-mono text-[13px] font-medium text-ink">
                  <bdi>{t(`limits.${x.id}.amount`, { n: x.amount })}</bdi>
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2.5 text-[12.5px] leading-snug text-ink-3">{t('limits.stamped')}</p>
        </div>
      </div>
    </WidgetSection>
  );
}
