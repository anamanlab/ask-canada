'use client';
/**
 * Refund / balance-owing estimator for the 2026 return: federal + provincial brackets, credits, CPP/EI,
 * live recalculation as the person edits, bracket chart, and a what-if for RRSP contributions.
 */
import { useId, useState } from 'react';
import { Bookmark, BookmarkCheck, Calculator, CircleDollarSign, RefreshCw } from 'lucide-react';
import { Badge, Button, Disclosure, ExternalLink, LiveRegion, Notice, Select, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { estimatorArgs } from './args';
import { buildEstimate } from './build';
import { returnDates } from './calc/deadlines';
import { estimate } from './calc/estimate';
import { startWhatIf, whatIfDelta, whatIfKey, type WhatIf } from './calc/what-if';
import { FEDERAL, FHSA, PROVINCES, RATES_YEAR, type ProvinceCode } from './data';
import { URLS, localizeSources } from './urls';
import { BigNumber, BracketBar, HowItAddsUp, RrspWhatIf } from './EstimatorParts';
import { MoneyField } from './fields';
import messages from './messages';
import { AnswerLang, SHELL, Verdict, useDateFmt } from './shared';
import { TaxSkeleton } from './skeleton';
import type { EstimatorInput, EstimatorResult } from './types';

export function TaxEstimator(props: WidgetProps<EstimatorInput, EstimatorResult>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <TaxEstimatorView {...props} />
    </AnswerLang>
  );
}

function TaxEstimatorView({ part }: WidgetProps<EstimatorInput, EstimatorResult>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('est.error.title')} message={t('error.body')} fallback={{ href: URLS.rates[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The widget itself, built from the input so far and drawn as a skeleton: same layout, so nothing jumps.
    return (
      <TaxSkeleton label={t('loading')}>
        <Estimator initial={buildEstimate(estimatorArgs(part.input, lang))} />
      </TaxSkeleton>
    );
  }
  return <Estimator initial={part.output} />;
}

type Saved = { province: ProvinceCode; balance: number | null; total: number };
/** The most FHSA room a single year can hold: this year's limit plus the largest carry-forward. */
const FHSA_YEAR_MAX = FHSA.annual + FHSA.carryMax;

function Estimator({ initial }: { initial: EstimatorResult }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const df = useDateFmt();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const provinceId = useId();
  const due = returnDates(RATES_YEAR);
  const i0 = initial.estimate.input;
  // What the written answer above was computed from: once an input differs, the big number says it has moved on.
  const start = { emp: initial.incomeGiven ? i0.employmentIncome : null, other: i0.otherIncome || null, rrsp: i0.rrsp || null, fhsa: i0.fhsa || null };
  const [province, setProvince] = useState<ProvinceCode>(i0.province);
  // No province yet: federal figures only (the provincial part needs one), and the picker asks for it.
  const [picked, setPicked] = useState(initial.provinceGiven);
  const [emp, setEmp] = useState<number | null>(start.emp);
  const [other, setOther] = useState<number | null>(start.other);
  const [rrsp, setRrsp] = useState<number | null>(start.rrsp);
  const [fhsa, setFhsa] = useState<number | null>(start.fhsa);
  const [deducted, setDeducted] = useState<number | null>(i0.taxDeducted);
  const [saved, save] = useDeviceItem<Saved>('taxes:estimate', { label: t('est.saved.label'), kind: 'plan' });
  const [pressed, setPressed] = useState(false);
  const changed =
    province !== i0.province ||
    picked !== initial.provinceGiven ||
    (emp ?? 0) !== (start.emp ?? 0) ||
    (other ?? 0) !== (start.other ?? 0) ||
    (rrsp ?? 0) !== (start.rrsp ?? 0) ||
    (fhsa ?? 0) !== (start.fhsa ?? 0) ||
    deducted !== i0.taxDeducted;

  const est = estimate({ province, employmentIncome: emp ?? 0, otherIncome: other ?? 0, rrsp: rrsp ?? 0, fhsa: fhsa ?? 0, taxDeducted: deducted });
  const qc = province === 'QC';
  const fedOnly = qc || !picked;
  const hasIncome = (emp ?? 0) + (other ?? 0) > 0;
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const pct = (n: number) => fmt.number(n, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const provName = t(`prov.${province}`);
  const owed = fedOnly ? est.federal : est.total;
  const balance = picked ? est.balance : null;
  const avgRate = fedOnly ? est.federalAverageRate : est.averageRate;
  const rrspSaving = fedOnly ? est.rrspFederalSavingPer1000 : est.rrspSavingPer1000;
  // "Try +$1,000": the RRSP field and the big number are often off-screen on a phone, so confirm the change
  // right next to the button (what the RRSP is now and how the result moved).
  // The note belongs to the entries it was computed for: any later edit elsewhere withdraws it.
  const [tried, setTried] = useState<WhatIf | null>(null);
  const key = whatIfKey({ province, picked, emp, other, fhsa, deducted });
  const tryRrsp = () => {
    const next = (rrsp ?? 0) + 1000;
    setTried(startWhatIf(next, key, { balance, owed }));
    setRrsp(next);
  };
  // The saved estimate, compared with what is on screen: after an edit the button offers to update it.
  const current: Saved = { province, balance, total: owed };
  const saveState = !saved ? 'new' : saved.province === current.province && saved.balance === current.balance && saved.total === current.total ? 'saved' : 'stale';
  const delta = whatIfDelta(tried, { rrsp, key, balance, owed });
  const triedNote = delta ? t(`est.rrspTried.${delta.kind}`, { rrsp: money(rrsp ?? 0), amount: money(delta.amount) }) : null;

  const verdict = !hasIncome ? (
    <Verdict tone="neutral" icon={CircleDollarSign} title={t('est.v.empty')} sub={t('est.v.emptySub')} />
  ) : (
    <BigNumber
      tone={balance == null ? 'info' : balance >= 0 ? 'ok' : 'danger'}
      eyebrow={balance == null ? t(fedOnly ? 'est.v.taxQc' : 'est.v.tax') : balance >= 0 ? t(qc ? 'est.v.refundFed' : 'est.v.refund') : t(qc ? 'est.v.oweFed' : 'est.v.owe')}
      value={balance == null ? owed : Math.abs(balance)}
      sub={
        !picked
          ? t('est.v.pickSub')
          : balance == null
            ? t('est.v.taxSub')
            : balance >= 0
              ? t(qc ? 'est.v.refundSubQc' : 'est.v.refundSub', { deducted: money(deducted ?? 0), tax: money(owed) })
              : t('est.v.oweSub', { date: df(due.payDue, { month: 'long', day: 'numeric', year: 'numeric' }) })
      }
      // Only when there was an answer with numbers to differ from.
      note={changed && initial.incomeGiven ? t('est.v.changed') : undefined}
      rate={avgRate}
      rateLabel={t(fedOnly ? 'est.v.rateFed' : 'est.v.rate', { rate: pct(avgRate) })}
      rateShort={t(fedOnly ? 'est.v.rateShortFed' : 'est.v.rateShort')}
    />
  );

  return (
    <WidgetShell
      icon={Calculator}
      tone="pine"
      title={t('est.title')}
      subtitle={<bdi>{picked ? t('est.subtitle', { province: provName }) : t('est.loadingSub')}</bdi>}
      badge={
        <Badge mono>
          <bdi>{t('est.badge')}</bdi>
        </Badge>
      }
      sources={localizeSources(initial.sources, lang)}
      // Two buttons leave no room beside them (French least of all): the note then leads the footnote instead.
      handoff={{ href: URLS.software[lang], label: t('est.handoff'), note: hasIncome ? undefined : t('est.handoffNote') }}
      secondaryAction={
        hasIncome ? (
          <Button
            icon={saveState === 'saved' ? BookmarkCheck : saveState === 'stale' ? RefreshCw : Bookmark}
            size="lg"
            className="max-sm:w-full"
            onClick={() => {
              setPressed(true);
              save(
                current,
                {
                  detail:
                    balance == null
                      ? t('est.saved.detailTax', { amount: money(owed), province: picked ? provName : t('est.saved.federal') })
                      : balance >= 0
                        ? t('est.saved.detailRefund', { amount: money(balance), province: provName })
                        : t('est.saved.detailOwe', { amount: money(-balance), province: provName }),
                },
              );
            }}
          >
            {t(saveState === 'saved' ? 'action.saved' : saveState === 'stale' ? 'action.update' : 'action.save')}
          </Button>
        ) : null
      }
      footnote={hasIncome ? t('est.handoffLine') : t('est.footnoteShort')}
      className={SHELL}
    >
      {verdict}
      {/* Said once after the button is pressed (the button's own label changes too, which not every reader announces). */}
      <LiveRegion text={pressed && saveState === 'saved' ? t('action.saved') : ''} />

      <WidgetSection title={t('est.in.title')}>
        <div className="grid items-start gap-3.5 @xl:grid-cols-2">
          {/* Same anatomy as MoneyField (label, control, hint after it) so the two-column rows line up. */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={provinceId} className="flex items-center gap-2 text-[14px] font-medium leading-snug text-ink">
              {t('est.in.province')}
              {/* "Still needed" is a tag beside the label; the ring around the control is kept for keyboard focus. */}
              {picked ? null : <Badge tone="info">{t('est.in.needed')}</Badge>}
            </label>
            <Select
              id={provinceId}
              aria-describedby={picked ? undefined : `${provinceId}-h`}
              value={picked ? province : ''}
              onChange={(e) => {
                if (!e.target.value) return;
                setProvince(e.target.value as ProvinceCode);
                setPicked(true);
              }}
              className="min-h-12"
              options={[...(picked ? [] : [{ value: '', label: t('est.in.provincePick') }]), ...PROVINCES.map((c) => ({ value: c, label: t(`prov.${c}`) }))]}
            />
            {picked ? null : (
              <p id={`${provinceId}-h`} className="m-0 text-[12.5px] leading-snug text-ink-3">
                {t('est.in.provinceHint')}
              </p>
            )}
          </div>
          <MoneyField label={t('est.in.emp')} hint={t('est.in.empHint')} value={emp} onChange={setEmp} />
          <MoneyField label={t('est.in.deducted')} hint={t(qc ? 'est.in.deductedHintQc' : 'est.in.deductedHint')} value={deducted} onChange={setDeducted} />
          <MoneyField label={t('est.in.other')} hint={t('est.in.otherHint')} value={other} onChange={setOther} />
        </div>
        <div className="mt-3.5 grid items-start gap-3.5 @xl:grid-cols-2">
          <MoneyField label={t('est.in.rrsp')} hint={t('est.in.rrspHint', { date: df(due.rrsp, { month: 'long', day: 'numeric', year: 'numeric' }) })} value={rrsp} onChange={setRrsp} />
          {/* The calculation stops at the most FHSA room one year can hold, so the field does too. */}
          <MoneyField
            label={t('est.in.fhsa')}
            hint={t('est.in.fhsaHint', { max: money(FHSA_YEAR_MAX), annual: money(FHSA.annual), carry: money(FHSA.carryMax) })}
            value={fhsa}
            onChange={setFhsa}
            max={FHSA_YEAR_MAX}
            overNote={t('est.in.fhsaOver', { max: money(FHSA_YEAR_MAX) })}
          />
        </div>
      </WidgetSection>

      {hasIncome ? (
        <WidgetSection title={t('est.out.title')}>
          <HowItAddsUp est={est} picked={picked} />

          <BracketBar est={est} />

          <p className="m-0 mt-4 text-[13.5px] leading-snug text-ink-2">
            {t(qc ? 'est.out.payrollQc' : 'est.out.payroll', { cpp: money(est.cpp + est.cpp2), ei: money(est.ei), qpip: money(est.qpip) })}
          </p>
        </WidgetSection>
      ) : null}

      {hasIncome && rrspSaving > 0 ? <RrspWhatIf scope={qc ? 'qc' : fedOnly ? 'fed' : 'all'} saving={rrspSaving} note={triedNote} onTry={tryRrsp} /> : null}

      {qc ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" title={t('est.qc.title')}>
            {t('est.qc.body', { pct: fmt.number(FEDERAL.quebecAbatement, { style: 'percent', maximumFractionDigits: 1 }) })}{' '}
            <ExternalLink href={URLS.quebecRates[lang]}>{t('est.qc.link')}</ExternalLink>
          </Notice>
        </div>
      ) : null}

      {/* The scope of the estimate, one tap away: the footer keeps to one sentence under the buttons. */}
      <div className="mx-5 mt-5 sm:mx-6">
        <Disclosure title={t('est.scope.title')}>
          <p className="m-0 pb-2 text-[14px] leading-snug text-ink-2">{t('est.footnote')}</p>
        </Disclosure>
      </div>
    </WidgetShell>
  );
}
