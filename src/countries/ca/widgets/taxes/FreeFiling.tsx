'use client';
/**
 * Free ways to file: free tax clinic eligibility (income by family size + simple situation), SimpleFile,
 * certified NETFILE software, pre-filled returns, what to bring, and the official clinic finder.
 */
import { useId, useState } from 'react';
import { Check, CircleAlert, HandHeart, Laptop, MailOpen, Sparkles } from 'lucide-react';
import { Badge, Checklist, Disclosure, LinkButton, Notice, Select, WidgetError, WidgetSection, WidgetShell, useChecklist } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { freeFilingArgs } from './args';
import { buildFreeFiling } from './build';
import { freeFiling, type Complexity } from './calc/free-filing';
import { NETFILE, PREFILLED, PROVINCES, type ProvinceCode } from './data';
import { URLS, localizeSources, source } from './urls';
import { MoneyField } from './fields';
import { ComplexityChips, FamilySize, LimitsTable, MAX_FAMILY, Way } from './FreeFilingParts';
import messages from './messages';
import { AnswerLang, SHELL, Verdict, useDateFmt } from './shared';
import { TaxSkeleton } from './skeleton';
import type { FreeFilingArgs, FreeFilingResult } from './types';

export function FreeFiling(props: WidgetProps<FreeFilingArgs, FreeFilingResult>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <FreeFilingView {...props} />
    </AnswerLang>
  );
}

function FreeFilingView({ part }: WidgetProps<FreeFilingArgs, FreeFilingResult>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('free.error.title')} message={t('error.body')} fallback={{ href: URLS.clinics[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The widget itself, built from the input so far and drawn as a skeleton: same layout, so nothing jumps.
    return (
      <TaxSkeleton label={t('loading')}>
        <Free initial={buildFreeFiling(freeFilingArgs(part.input, lang))} />
      </TaxSkeleton>
    );
  }
  return <Free initial={part.output} />;
}

const BRING = ['id', 'sin', 'slips', 'receipts', 'noa'] as const;

function Free({ initial }: { initial: FreeFilingResult }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const df = useDateFmt();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const i0 = initial.input;
  const provinceId = useId();
  const [size, setSize] = useState<number>(Math.min(MAX_FAMILY, i0.familySize ?? 1));
  const [income, setIncome] = useState<number | null>(i0.familyIncome ?? null);
  const [complex, setComplex] = useState<Complexity[]>(i0.complex ?? []);
  // The question may not say where the person lives: they can add it here (SimpleFile limit, Quebec's program).
  const [province, setProvince] = useState<ProvinceCode | null>(i0.province ?? null);
  const r = freeFiling({ province, familySize: size, familyIncome: income, personalIncome: size === 1 ? income : null, age65: i0.age65, complex });
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const qc = r.quebec;
  const limit = { limit: money(r.threshold ?? 0), count: size };
  const bring = useChecklist('taxes:clinic-bring', t('free.bring.label'), BRING.length);

  const verdict =
    r.clinic === 'yes' ? (
      <Verdict tone="ok" icon={Check} title={t(qc ? 'free.v.yesQc' : 'free.v.yes')} sub={t('free.v.yesSub', limit)} />
    ) : r.clinic === 'income' ? (
      <Verdict tone="info" icon={Laptop} title={t('free.v.income')} sub={t('free.v.incomeSub', limit)} />
    ) : r.clinic === 'complex' ? (
      <Verdict tone="info" icon={CircleAlert} title={t('free.v.complex')} sub={t('free.v.complexSub')} />
    ) : (
      <Verdict tone="neutral" icon={HandHeart} title={t('free.v.unknown')} sub={t('free.v.unknownSub')} />
    );

  // The primary button follows the verdict: over the income limit or a complex return → certified software
  // (the clinic stays one tap away when only income ruled it out); otherwise the clinic finder.
  const clinicLink = { href: qc ? URLS.quebecClinics[lang] : URLS.clinicFinder[lang], label: t(qc ? 'free.handoffQc' : 'free.handoff') };
  const handoff =
    r.clinic === 'income' || r.clinic === 'complex'
      ? { href: URLS.software[lang], label: t('free.handoffSoftware'), note: t('free.handoffSoftwareNote') }
      : { ...clinicLink, note: t(qc ? 'free.handoffQcNote' : 'free.handoffNote') };

  // Two buttons leave no room beside them (French least of all): the note then leads the footnote instead.
  const twoActions = r.clinic === 'income';
  // The sources follow the province on screen: Revenu Québec's program page leads for Quebec, and only there.
  const federal = localizeSources(initial.sources, lang).filter((s) => s.url !== URLS.quebecClinics[lang]);
  const sources = qc ? [source('quebecClinics', lang), ...federal] : federal;

  return (
    <WidgetShell
      icon={HandHeart}
      tone="pine"
      title={t('free.title')}
      subtitle={t('free.subtitle')}
      sources={sources}
      handoff={twoActions ? { href: handoff.href, label: handoff.label } : handoff}
      secondaryAction={
        twoActions ? (
          <LinkButton href={clinicLink.href} external variant="secondary" className="max-sm:w-full">
            {clinicLink.label}
          </LinkButton>
        ) : null
      }
      footnote={`${twoActions ? `${handoff.note} ` : ''}${t(qc ? 'free.footnoteQc' : 'free.footnote')}`}
      className={SHELL}
    >
      {verdict}

      <WidgetSection title={t('free.check.title')}>
        <div className="grid gap-4">
          <FamilySize value={size} onChange={setSize} />
          <div className="grid items-start gap-4 @xl:grid-cols-2">
            <MoneyField label={t('free.check.income')} hint={t('free.check.incomeHint', limit)} value={income} onChange={setIncome} />
            {/* Same anatomy as MoneyField (label, control, hint after it) so the two columns line up. */}
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={provinceId} className="text-[14px] font-medium leading-snug text-ink">
                {t('free.check.province')}
              </label>
              <Select
                id={provinceId}
                aria-describedby={`${provinceId}-h`}
                value={province ?? ''}
                onChange={(e) => setProvince((e.target.value as ProvinceCode) || null)}
                className="min-h-12"
                options={[{ value: '', label: t('est.in.provincePick') }, ...PROVINCES.map((c) => ({ value: c, label: t(`prov.${c}`) }))]}
              />
              <p id={`${provinceId}-h`} className="m-0 text-[12.5px] leading-snug text-ink-3">
                {t('free.check.provinceHint')}
              </p>
            </div>
          </div>
          <ComplexityChips value={complex} onChange={setComplex} />
        </div>
      </WidgetSection>

      <WidgetSection title={t('free.ways.title')}>
        <ul className="m-0 grid list-none gap-2.5 p-0 @xl:grid-cols-2">
          <Way
            icon={HandHeart}
            tone="pine"
            title={t(qc ? 'free.way.clinicQc' : 'free.way.clinic')}
            badge={r.clinic === 'yes' ? <Badge tone="ok">{t('free.way.likely')}</Badge> : null}
            body={t('free.way.clinicBody')}
            href={qc ? URLS.quebecClinics[lang] : URLS.clinics[lang]}
            link={t('free.way.clinicLink')}
            featured={r.clinic === 'yes' || r.clinic === 'unknown'}
          />
          <Way
            icon={MailOpen}
            tone="glacier"
            title={t('free.way.simple')}
            badge={r.simpleFile === 'maybe' ? <Badge tone="info">{t('free.way.maybe')}</Badge> : null}
            body={
              r.simpleFileLimit != null && province
                ? t(i0.age65 ? 'free.way.simpleBody65' : 'free.way.simpleBody', { limit: money(r.simpleFileLimit), province: t(`prov.${province}`) })
                : t('free.way.simpleBodyGeneric')
            }
            href={URLS.simpleFile[lang]}
            link={t('free.way.simpleLink')}
            // A province picked here changes this card's limit: show it, even on a phone.
            featured={r.simpleFile === 'maybe' || province !== (i0.province ?? null)}
          />
          <Way
            icon={Laptop}
            tone="glacier"
            title={t('free.way.software')}
            body={t('free.way.softwareBody', { closes: df(NETFILE.closes, { month: 'long', day: 'numeric', year: 'numeric' }), last: String(NETFILE.lastYear) })}
            href={URLS.software[lang]}
            link={t('free.way.softwareLink')}
            featured={r.clinic === 'income' || r.clinic === 'complex'}
          />
          <Way
            icon={Sparkles}
            tone="amber"
            title={t('free.way.prefilled')}
            badge={<Badge tone="warn">{t('free.way.new')}</Badge>}
            body={t('free.way.prefilledBody', { month: df(`${PREFILLED.starts}-15`, { month: 'long', year: 'numeric' }), millions: PREFILLED.invitations / 1_000_000 })}
            href={URLS.howFile[lang]}
            link={t('free.way.prefilledLink')}
            featured={false}
          />
        </ul>
      </WidgetSection>

      {qc ? (
        <div className="px-5 pt-5 sm:px-6">
          <Notice tone="info" title={t('free.qc.title')}>
            {t('free.qc.body')}
          </Notice>
        </div>
      ) : null}

      {/* Reference material, folded and mounted on first open: the hint above already gives this person's own
          limit. Revenu Québec publishes the same suggested limits as the CRA (see data.ts), so Quebec gets the
          table too. */}
      <div className="mx-5 mt-5 sm:mx-6">
        {r.clinic !== 'complex' ? (
          <Disclosure title={t('free.bring.title')} summary={t('free.bring.progress', { done: bring.value.length, total: BRING.length })} lazy>
            <Checklist
              label={t('free.bring.label')}
              items={BRING.map((id) => ({ id, title: t(`free.bring.${id}`), detail: t(`free.bring.${id}Detail`) }))}
              value={bring.value}
              onChange={bring.onChange}
            />
          </Disclosure>
        ) : null}
        <Disclosure title={t('free.limits.title')} lazy>
          <LimitsTable thresholds={r.thresholds} size={size} />
        </Disclosure>
      </div>
    </WidgetShell>
  );
}
