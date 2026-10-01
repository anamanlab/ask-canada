'use client';
/**
 * The full dental checker: the 4 requirements as quick answers, an income slider over the co-payment tiers
 * and a live verdict, all recalculated on the device and kept on this device only.
 */
import { useState, type ReactNode } from 'react';
import { Check, CircleAlert, CircleHelp, Phone, RotateCcw, ShieldCheck, Smile, X } from 'lucide-react';
import { Badge, Button, ExternalLink, LinkButton, LiveRegion, MoneyInput, NumberTicker, Slider, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { checkDental, REQS, type DentalOutput, type DentalResult, type Req, type ReqState } from './dental';
import { answersOf, hasAnswers, INCOME_MAX, nbPeriod, useSavedAnswers, type Edits } from './dental-saved';
import { DentalTiers } from './DentalTiers';
import messages from './messages';
import { VerdictHero } from './shared';

const TONE = { likely: 'ok', not: 'no', maybe: 'open' } as const;
const ICON = { likely: Check, not: CircleAlert, maybe: CircleHelp } as const;
const KNOW = ['partner', 'renew', 'extra', 'provider', 'nihb', 'scam'] as const;
type YesNo = 'noPrivateCoverage' | 'filedTaxes' | 'residentForTax';
/** The slider moves in $500 steps (every tier boundary is on one); the field beside it takes any amount. */
const INCOME_STEP = 500;
const INCOME_TYPED_MAX = 999_999;

export default function DentalCheck({ data }: { data: DentalOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [saved, store] = useSavedAnswers();
  const [edits, setEdits] = useState<Edits>({});
  const answers = answersOf(data.input, saved, edits);
  const income = answers.familyIncome;
  const r = checkDental(answers);
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const done = REQS.length - r.unknown.length;
  // Not eligible for a reason other than income, with a percentage on show: it is what the plan *would* pay.
  // (Over the income limit there is no percentage, so nothing hypothetical to mark.)
  const hypothetical = r.covered != null && r.verdict === 'not' && r.failed.some((f) => f !== 'income');
  // Each tap or slider step re-renders before the next one arrives, so `edits` here is the latest; the same
  // merged value goes to the screen and to the device.
  const update = (patch: Edits) => {
    const next = { ...edits, ...patch };
    setEdits(next);
    store(answersOf(data.input, saved, next));
  };
  const set = (k: YesNo, v: boolean) => update({ [k]: answers[k] === v ? null : v });
  const reset = () => update({ noPrivateCoverage: null, filedTaxes: null, residentForTax: null, familyIncome: null });
  const why = verdictWhy(r, t);
  const yesNo = (k: YesNo, yesPasses: boolean) => {
    // `yesPasses`: whether "Yes" stores true. Coverage is asked positively ("Can you get private dental
    // insurance?"), so there Yes = has access = `noPrivateCoverage: false` (fails) and No passes.
    return (
      <>
        <Pill on={answers[k] === yesPasses} tone={yesPasses ? 'ok' : 'bad'} onClick={() => set(k, yesPasses)}>
          {t('dental.a.yes')}
        </Pill>
        <Pill on={answers[k] === !yesPasses} tone={yesPasses ? 'bad' : 'ok'} onClick={() => set(k, !yesPasses)}>
          {t('dental.a.no')}
        </Pill>
      </>
    );
  };

  return (
    <WidgetShell
      icon={Smile}
      tone="pine"
      title={t('dental.title')}
      subtitle={t('dental.subtitle', { period: nbPeriod(data.benefitPeriod) })}
      badge={
        <Badge icon={ShieldCheck} mono>
          {t('dental.badge')}
        </Badge>
      }
      sources={data.sources}
      handoff={
        r.verdict === 'not'
          ? { href: data.qualifyUrl, label: t('dental.handoff.rules'), note: t('dental.handoff.rulesNote') }
          : { href: data.applyUrl, label: t('dental.handoff.apply'), note: t('dental.handoff.applyNote') }
      }
      secondaryAction={
        <LinkButton href={`tel:+1${data.phone.replace(/\D/g, '').slice(1)}`} variant="secondary" size="lg" icon={Phone} className="max-sm:w-full">
          <bdi dir="ltr">{data.phone}</bdi>
        </LinkButton>
      }
      footnote={t('dental.footnote')}
      className="@container"
    >
      <VerdictHero tone={TONE[r.verdict]} icon={ICON[r.verdict]} title={t(`dental.verdict.${r.verdict}`)}>
        {why}
      </VerdictHero>
      {/* The only announcer: one calm sentence once the slider or the answers settle (the hero above isn't live). */}
      <LiveRegion text={t('dental.live', { verdict: t(`dental.verdict.${r.verdict}`), why, progress: t('dental.reqs.progress', { done, total: REQS.length }) })} />

      <WidgetSection title={t('dental.cover.title')}>
        {/* The tile is as tall as the slider and its legend, its copy centred. */}
        <div className="grid gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          {/* Hypothetical (a non-income requirement fails): a dashed tile, a quieter number and a warn badge say
              "not for you" while every line of text stays at full AA contrast (no opacity). */}
          <div className={cn('flex flex-col justify-center rounded-tile border bg-paper-2 px-4 py-4 transition-colors duration-200 @xl:px-5', hypothetical ? 'border-dashed border-hair-2' : 'border-hair')}>
            {r.covered != null ? (
              <>
                {hypothetical ? (
                  <Badge tone="warn" icon={CircleAlert} className="mb-3 self-start">
                    {t('dental.cover.ifLabel')}
                  </Badge>
                ) : null}
                <div>
                  <p className={cn("m-0 font-serif text-[52px] leading-none tracking-[-.03em] [font-variation-settings:'opsz'_72]", hypothetical ? 'text-ink-3' : 'text-ink')}>
                    <NumberTicker value={r.covered} format={(n) => fmt.number(Math.round(n) / 100, { style: 'percent' })} />
                  </p>
                  <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">{t('dental.cover.plan')}</p>
                  <p className="m-0 mt-1 text-[14px] font-semibold text-ink">
                    {r.copay ? t('dental.cover.copay', { pct: fmt.number(r.copay / 100, { style: 'percent' }) }) : t('dental.cover.none')}
                  </p>
                </div>
                {hypothetical ? <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-2">{t('dental.cover.ifNote', { n: String(REQS.indexOf(r.failed[0]) + 1) })}</p> : null}
              </>
            ) : income != null && income >= data.limit ? (
              <>
                <p className="m-0 font-serif text-[30px] leading-tight tracking-[-.02em] text-ink">{t('dental.cover.over')}</p>
                <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">{t('dental.cover.overSub', { limit: money(data.limit) })}</p>
              </>
            ) : (
              <>
                <p className="m-0 font-serif text-[30px] leading-tight tracking-[-.02em] text-ink">{t('dental.cover.unset')}</p>
                <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">{t('dental.cover.unsetSub')}</p>
              </>
            )}
          </div>
          <div>
            <Slider
              label={t('dental.income.label')}
              min={0}
              max={INCOME_MAX}
              step={INCOME_STEP}
              value={income ?? 0}
              onChange={(n) => update({ familyIncome: n })}
              format={(n) => (income == null ? t('dental.income.unset') : n >= INCOME_MAX ? t('dental.income.max', { amount: money(INCOME_MAX) }) : money(n))}
              // Until the person sets it, the thumb is parked at the start and dimmed: no value implied. Over the
              // limit, the filled track turns neutral: pine would read as success next to a "not eligible" verdict.
              className={cn(income == null && '[&_input]:opacity-60', income != null && income >= data.limit && '[&_input]:[--pine:var(--ink-3)]')}
            />
            <DentalTiers income={income} limit={data.limit} tiers={data.tiers} />
          </div>
        </div>
        {/* Under both columns: the slider explores, the field takes the exact figure ($79,600 and $80,000 are
            different tiers), and the line-23600 help sits beside it, so the tile above stays the height of the
            slider and its legend. */}
        <div className="mt-4 grid gap-x-5 gap-y-2 @xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)] @xl:items-end">
          <MoneyInput
            label={t('dental.income.exact')}
            value={income}
            // Whole dollars, rounded down: $89,999.99 is under the $90,000 limit, so it must never read as $90,000.
            onChange={(n) => update({ familyIncome: n == null ? null : Math.floor(n) })}
            max={INCOME_TYPED_MAX}
          />
          <p className="m-0 text-[13px] leading-snug text-ink-3 @xl:pb-1">{t('dental.income.hint')}</p>
        </div>
      </WidgetSection>

      <WidgetSection title={t('dental.reqs.title')} aside={<bdi className="font-mono text-[12px] text-ink-2">{t('dental.reqs.progress', { done, total: REQS.length })}</bdi>}>
        <ol className="m-0 grid list-none gap-2.5 p-0">
          <ReqRow n={1} req="coverage" state={r.reqs.coverage}>
            {yesNo('noPrivateCoverage', false)}
          </ReqRow>
          <ReqRow n={2} req="taxes" state={r.reqs.taxes}>
            {yesNo('filedTaxes', true)}
          </ReqRow>
          <ReqRow n={3} req="income" state={r.reqs.income}>
            <span className="text-[14px] font-medium text-ink-2">
              {income == null ? t('dental.req.income.set') : income < data.limit ? t('dental.req.income.under', { amount: money(income) }) : t('dental.req.income.over', { amount: money(income) })}
            </span>
          </ReqRow>
          <ReqRow n={4} req="resident" state={r.reqs.resident}>
            {yesNo('residentForTax', true)}
          </ReqRow>
        </ol>
        {hasAnswers(answers) && saved ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="m-0 text-[13px] leading-snug text-ink-3">{t('dental.saved.note')}</p>
            <Button variant="quiet" size="md" icon={RotateCcw} onClick={reset} className="-ms-3 @xl:ms-0 @xl:-me-3">
              {t('dental.saved.clear')}
            </Button>
          </div>
        ) : null}
      </WidgetSection>

      <WidgetSection title={t('dental.know.title')}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {KNOW.map((k) => {
            const link = k === 'provider' ? { href: data.providersUrl, label: t('dental.know.providerLink') } : k === 'nihb' ? { href: data.nihbUrl, label: t('dental.know.nihbLink') } : null;
            return (
              <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
                <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
                <span className="min-w-0">
                  {k === 'renew' ? t('dental.know.renew', { period: nbPeriod(data.benefitPeriod) }) : t(`dental.know.${k}`)}
                  {link ? (
                    <>
                      {' '}
                      <ExternalLink href={link.href}>{link.label}</ExternalLink>
                    </>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </WidgetSection>
    </WidgetShell>
  );
}

/** The line under the verdict: the co-payment, the requirement that fails, or how many answers are missing. */
function verdictWhy(r: DentalResult, t: ReturnType<typeof useMessages>): string {
  if (r.verdict === 'likely') return r.copay ? t('dental.verdict.likelyCopay', { pct: r.copay }) : t('dental.verdict.likelyFull');
  if (r.verdict === 'not') return t(`dental.why.${r.failed[0]}`);
  return r.unknown.length === REQS.length ? t('dental.verdict.maybeStart', { count: REQS.length }) : t('dental.verdict.maybeSub', { count: r.unknown.length });
}

/** Answer pill (Yes / No): filled pine when the answer meets the requirement, maple when it doesn't. 44px target. */
function Pill({ on, tone, onClick, children }: { on: boolean; tone: 'ok' | 'bad'; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'min-h-11 min-w-[64px] rounded-full border px-4 text-[14.5px] font-medium transition-[background-color,border-color,color,box-shadow] duration-200',
        on ? (tone === 'ok' ? 'border-pine bg-pine text-paper shadow-sm' : 'border-maple bg-maple text-paper shadow-sm') : 'border-hair-2 bg-card text-ink hover:border-ink-3',
      )}
    >
      {children}
    </button>
  );
}

function ReqRow({ n, req, state, children }: { n: number; req: Req; state: ReqState; children: ReactNode }) {
  const t = useMessages(messages);
  return (
    <li
      className={cn(
        'rounded-tile border px-4 py-3.5 transition-colors duration-200',
        state === 'fail' ? 'border-maple/30 bg-maple-wash' : state === 'pass' ? 'border-pine/25 bg-card' : 'border-hair bg-card',
      )}
    >
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            aria-hidden
            className={cn(
              'mt-px grid size-[26px] shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[12px] font-semibold',
              state === 'pass' && 'border-pine bg-pine text-paper',
              state === 'fail' && 'border-maple bg-maple text-paper',
              state === 'unknown' && 'border-hair-2 text-ink-2',
            )}
          >
            {state === 'pass' ? <Check className="size-3.5" strokeWidth={3} /> : state === 'fail' ? <X className="size-3.5" strokeWidth={3} /> : n}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[15px] font-medium leading-snug text-ink">{t(`dental.req.${req}.q`)}</p>
            <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-3">{t(`dental.req.${req}.hint`)}</p>
            <span className="sr-only">{t(`dental.state.${state}`)}</span>
          </div>
        </div>
        <div role="group" aria-label={t(`dental.req.${req}.q`)} className="flex shrink-0 gap-2 ps-[38px] @xl:ps-0">
          {children}
        </div>
      </div>
    </li>
  );
}
