'use client';
/**
 * TFSA vs RRSP vs FHSA: the same pre-tax pay followed into each account, with the person's own tax rate
 * now and when the money comes out, plus a plain comparison table of the rules and 2026 limits.
 * General information only (the footnote says so); the ranking is arithmetic, not advice.
 */
import { useState, type ReactNode } from 'react';
import { Calculator, Check, Landmark, RotateCcw, type LucideIcon } from 'lucide-react';
import { Button, ExternalLink, LiveRegion, NumberTicker, Segmented, Slider, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AccountRules, ORDER } from './AccountRules';
import { compareAccounts, type AccountId, type CompareInput, type Goal } from './calc/accounts';
import { ACCOUNTS } from './data';
import { useMoneyFormat } from './format';
import { isolate } from './intl';
import { compareLinks, L, sourcesIn, URLS } from './links';
import messages from './messages';
import type { CompareOutput } from './output';
import { comparePreview } from './preview';
import { Eyebrow, Hero, MoneySkeleton, Rich } from './shared';

export function AccountCompare({ part }: WidgetProps<CompareInput, CompareOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('cmp.error')} fallback={{ href: URLS.savingFuture[L(locale)], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <Loading input={part.input} />;
  }
  return <Compare data={part.output} />;
}

/** The comparison for the goal the tool was called with, unseen under the skeleton: goal switch, hero and cards, rates, rules. */
function Loading({ input }: { input: unknown }) {
  const t = useMessages(messages);
  return (
    <MoneySkeleton title={t('cmp.title')} subtitle={t('cmp.subtitle', { year: String(ACCOUNTS.year) })} icon={Landmark} tone="glacier" label={t('loading')} top blocks={[10, 5, 14]}>
      <Compare key={JSON.stringify(input)} data={comparePreview(input)} />
    </MoneySkeleton>
  );
}

const GOALS: readonly Goal[] = ['home', 'retirement', 'anything'];
/**
 * Status pill for the three cards. Unlike `Badge` (one line, truncated), its text wraps, so the long French
 * labels ("Plus élevé, à rembourser") are never cut on a narrow card.
 */
const PILL = { ok: 'bg-pine-wash text-pine', info: 'bg-glacier-wash text-glacier', neutral: 'bg-paper-2 text-ink-2' } as const;
function Pill({ tone = 'neutral', icon: Icon, children }: { tone?: keyof typeof PILL; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-chip px-2.5 py-1 text-[12.5px] font-medium leading-tight', PILL[tone])}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2} /> : null}
      <span className="min-w-0">{children}</span>
    </span>
  );
}

function Compare({ data }: { data: CompareOutput }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const lang = L(locale);
  const { send } = useChatActions();
  const [goal, setGoal] = useState<Goal>(data.result.goal);
  // Until the person sets a rate, both rates are the same example value (a tie, never a verdict).
  const [touched, setTouched] = useState(false);
  const [rateNow, setRateNow] = useState(data.result.rateNow);
  const [rateLater, setRateLater] = useState(data.result.rateLater);
  const [years, setYears] = useState(data.result.years);
  const r = compareAccounts({ ...data.input, goal, rateNow, rateLater, years, firstHome: goal === 'home' ? (data.result.firstHome ?? true) : (data.result.firstHome ?? undefined) });
  const f = data.facts;
  const { money, pct } = useMoneyFormat();
  const fhsaFits = goal === 'home' && r.eligible.fhsa !== false && !r.fhsaTooLong;
  const links = compareLinks(lang);

  const example = data.result.exampleRates && !touched;
  const why = example ? 'example' : rateNow > rateLater ? 'higher' : rateNow < rateLater ? 'lower' : 'same';
  const tie = r.tied.length > 1;
  const tiedShown = ORDER.filter((a) => r.tied.includes(a));
  const setRate = (fn: (n: number) => void) => (n: number) => {
    setTouched(true);
    fn(n);
  };
  const fhsaLong = goal === 'home' && r.fhsaTooLong && r.eligible.fhsa !== false;
  // RRSP money through the Home Buyers' Plan is the most today but has to be paid back: never shown as a plain "most left".
  const hbpBest = goal === 'home' && r.hbp && r.best === 'rrsp' && !tie;
  const years15 = { years: f.fhsa.years };
  const outcomeText = (a: AccountId) =>
    a === 'fhsa' && fhsaLong ? t('cmp.fhsaLong.value', years15) : a === 'fhsa' && !fhsaFits ? t('cmp.notFit') : r.eligible[a] === false ? t('cmp.notEligible') : money(r.outcome[a]);
  const whyText =
    goal === 'home' && r.best === 'fhsa' && !tie
      ? t('cmp.why.fhsa', { years: f.hbp.repayYears })
      : goal === 'home' && r.best === 'rrsp' && r.hbp && fhsaLong && !tie
        ? t('cmp.why.hbp', { years: f.hbp.repayYears })
        : t(`cmp.why.${why}`, { now: pct(rateNow), later: pct(rateLater) });
  const cardNote = (a: AccountId, fits: boolean) => {
    if (a === 'fhsa' && fhsaLong) return t('cmp.card.fhsa.long');
    if (!fits) return t(`cmp.card.${a}.no`, { age: a === 'tfsa' ? f.tfsa.minAge : f.rrsp.closeAge, older: f.tfsa.contractAge });
    if (a === 'rrsp' && r.hbp) return t('cmp.card.rrspHbp', { years: f.hbp.repayYears });
    return t(`cmp.card.${a}`, { rateNow: pct(rateNow), rateLater: pct(rateLater) });
  };
  return (
    <WidgetShell
      icon={Landmark}
      tone="glacier"
      title={t('cmp.title')}
      subtitle={t('cmp.subtitle', { year: String(f.year) })}
      sources={sourcesIn(data, lang)}
      handoff={{ href: links.account, label: t('cmp.handoff'), note: t('cmp.handoffNote') }}
      secondaryAction={
        <Button variant="secondary" size="lg" icon={Calculator} className="w-full sm:w-auto" onClick={() => send(t(`cmp.askRoom.${goal}`))}>
          {t(`cmp.roomButton.${goal}`)}
        </Button>
      }
      footnote={t('cmp.footnote', { growth: fmt.number(r.growth) })}
      className="@container [text-wrap:pretty]"
    >
      <div className="px-5 sm:px-6">
        <Segmented
          label={t('cmp.goal.label')}
          value={goal}
          onChange={(g) => {
            setGoal(g);
            setYears(g === 'home' ? 5 : 25);
          }}
          options={GOALS.map((g) => ({
            value: g,
            label: t(`cmp.goal.${g}`),
            // Sub-labels only where there's room, so no option wraps and shifts on phones.
            sub: <span className="hidden @md:inline">{t(`cmp.goal.${g}.sub`)}</span>,
          }))}
        />
      </div>

      <LiveRegion
        text={t('cmp.sr', { amount: money(r.amount), count: r.years, tfsa: outcomeText('tfsa'), rrsp: outcomeText('rrsp'), fhsa: outcomeText('fhsa') })}
      />
      <Hero tone="glacier" className="mt-4">
        <Eyebrow>
          {example
            ? t('cmp.hero.eyebrowExample', { amount: money(r.amount), count: r.years, rate: pct(rateNow) })
            : t('cmp.hero.eyebrow', { amount: money(r.amount), count: r.years })}
        </Eyebrow>
        <p className="m-0 mt-2 font-serif text-[27px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">
          <Rich
            text={
              tie
                ? t('cmp.hero.tie', { a: t(`acct.${tiedShown[0]}.short`), b: t(`acct.${tiedShown[1]}.short`) })
                : t(`cmp.hero.best.${hbpBest ? 'hbp' : r.best}`)
            }
          />
        </p>
        <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">
          {whyText}
        </p>
        <ul className="m-0 mt-4 grid list-none gap-2 p-0 @xl:grid-cols-3" aria-label={t('cmp.cards.label')}>
          {ORDER.map((a) => {
            const fits = a === 'fhsa' ? fhsaFits : r.eligible[a] !== false;
            const best = fits && r.tied.includes(a);
            const repay = best && a === 'rrsp' && goal === 'home' && r.hbp;
            return (
              <li
                key={a}
                className={cn(
                  // Phones stack the cards: the winner goes first so it's above the fold. Wide: fixed TFSA · RRSP · FHSA order.
                  // Wide: each card spans three shared rows (label + badge, value, note), so the values line up
                  // across cards even when one badge wraps to a second line.
                  'relative rounded-tile border px-4 py-3.5 transition-[box-shadow,border-color] duration-300 @xl:row-span-3 @xl:grid @xl:grid-rows-subgrid @xl:gap-y-0',
                  best && 'order-first @xl:order-none',
                  best ? cn('bg-card shadow-md ring-1', repay ? 'border-glacier/40 ring-glacier/30' : 'border-pine/40 ring-pine/30') : fits ? 'border-hair bg-card' : 'border-dashed border-hair-2 bg-card/60',
                )}
              >
                {/* French badges run long: the row wraps and the badge text wraps rather than spilling past the card. */}
                <div className="flex min-h-6 flex-wrap content-start items-center justify-between gap-x-2 gap-y-1">
                  <span className="font-mono text-[12px] font-medium uppercase tracking-[.1em] text-ink-2">{t(`acct.${a}.short`)}</span>
                  {best ? (
                    <Pill tone={repay ? 'info' : 'ok'} icon={repay ? RotateCcw : Check}>
                      {repay ? t('cmp.bestHbp') : t('cmp.best')}
                    </Pill>
                  ) : !fits ? (
                    <Pill>
                      <bdi>{a === 'fhsa' ? (fhsaLong ? t('cmp.fhsaLong.badge', years15) : t('cmp.notFit')) : t('cmp.notEligible')}</bdi>
                    </Pill>
                  ) : null}
                </div>
                <p className="m-0 mt-1.5 font-serif text-[30px] leading-none tracking-[-.03em] text-ink">
                  {fits ? (
                    <NumberTicker value={Math.round(r.outcome[a])} format={money} />
                  ) : (
                    <span className="block text-[18px] leading-tight tracking-normal text-ink-2 [text-wrap:balance]">
                      {a === 'fhsa' ? (fhsaLong ? t('cmp.fhsaLong.value', years15) : t('cmp.fhsaOnly')) : t('cmp.notEligible')}
                    </span>
                  )}
                </p>
                <p className={cn('m-0 mt-1.5 text-[12.5px] leading-snug', fits ? 'text-ink-3' : 'text-ink-2')}>
                  {cardNote(a, fits)}
                </p>
              </li>
            );
          })}
        </ul>
      </Hero>

      <WidgetSection title={t('cmp.rates.title')}>
        <div className="grid gap-5 @xl:grid-cols-2 @xl:gap-x-8">
          <Slider label={t('cmp.rateNow')} min={0} max={54} value={rateNow} onChange={setRate(setRateNow)} format={pct} />
          <Slider label={t('cmp.rateLater')} min={0} max={54} value={rateLater} onChange={setRate(setRateLater)} format={pct} />
          <Slider className="@xl:col-span-2" label={t('cmp.years')} min={1} max={40} value={Math.max(1, years)} onChange={setYears} format={(n) => isolate(t('cmp.yearsValue', { count: n }))} />
        </div>
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">
          {t('cmp.rateHelp')}{' '}
          <ExternalLink href={links.rates}>{t('cmp.rateHelpLink')}</ExternalLink>
        </p>
      </WidgetSection>

      <AccountRules facts={f} goal={goal} fhsaCloseHref={links.fhsaClose} />
    </WidgetShell>
  );
}
