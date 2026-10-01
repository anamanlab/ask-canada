'use client';
/**
 * RESP planner: what the family puts in, what the government adds (CESG, additional CESG, Canada Learning
 * Bond) and assumed growth, year by year until the end of the year the child turns 17.
 * Recomputes instantly on the device with the same pure function the tool uses (calc.planResp).
 */
import { useState } from 'react';
import { Bookmark, BookmarkCheck, GraduationCap, Smartphone } from 'lucide-react';
import { Badge, Button, LiveRegion, NumberTicker, Segmented, Slider, Toggle, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import type { RespOutput } from './output';
import { clbThreshold, planResp, type IncomeTier, type RespInput } from './calc/resp';
import { CHECKED, RESP } from './data';
import { useMoneyFormat } from './format';
import { isolate } from './intl';
import { L, respLinks, sourcesIn, URLS } from './links';
import messages from './messages';
import { respPreview } from './preview';
import { RespScale } from './RespScale';
import { RespDetails } from './RespSteps';
import { RespTips } from './RespTips';
import { Eyebrow, Hero, MoneySkeleton, SplitBar } from './shared';

export function RespPlanner({ part }: WidgetProps<RespInput, RespOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('resp.error')} fallback={{ href: URLS.respAmounts[L(locale)], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <Loading input={part.input} />;
  }
  return <Planner data={part.output} />;
}

/** The planner for the numbers the tool was called with, unseen under the skeleton: hero, plan and tips, chart. */
function Loading({ input }: { input: unknown }) {
  const t = useMessages(messages);
  const today = useToday(CHECKED);
  return (
    <MoneySkeleton title={t('resp.title')} subtitle={t('resp.subtitle')} icon={GraduationCap} tone="pine" label={t('loading')} blocks={[5, 12, 8]}>
      <Planner key={JSON.stringify(input)} data={respPreview(input, today)} />
    </MoneySkeleton>
  );
}

/** Growth choices, in percent; a rate the person gave the assistant is added to them. */
const GROWTH: readonly number[] = [0, 3, 5];
/** The most the yearly slider goes to. */
const ANNUAL_MAX = 7500;
const TIERS: readonly IncomeTier[] = ['low', 'middle', 'high'];
/** Family sizes the Canada Learning Bond limits distinguish (ESDC: 1 to 3, 4, 5; more than 5 → call). */
const KIDS = ['few', 'four', 'five', 'more'] as const;
type Kids = (typeof KIDS)[number];
const kidsOf = (children: number): Kids => (children <= 3 ? 'few' : children === 4 ? 'four' : children === 5 ? 'five' : 'more');
const COUNT: Record<Kids, number> = { few: 1, four: 4, five: 5, more: 6 };

/** What the person set, as kept on this device. `year` lets a plan reopened in a later year age the child. */
type Plan = { age: number; year: number; annual: number; tier: IncomeTier; income?: number; growth: number; kids: Kids; under: boolean };

const finite = (x: unknown, min: number, max: number): number | undefined => (typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : undefined);

/** A plan read back from this device: null unless every required field is there and in range. */
function planFrom(stored: unknown): Plan | null {
  if (typeof stored !== 'object' || stored === null) return null;
  const s: Record<string, unknown> = { ...stored };
  const age = finite(s.age, 0, 17);
  const annual = finite(s.annual, 0, RESP.lifetimeContribution);
  const growth = finite(s.growth, 0, 10);
  const tier = TIERS.find((k) => k === s.tier);
  if (age == null || annual == null || growth == null || !tier) return null;
  return {
    age: Math.round(age),
    year: finite(s.year, 2000, 2200) ?? 0,
    annual,
    tier,
    income: finite(s.income, 0, 100_000_000),
    growth,
    kids: KIDS.find((k) => k === s.kids) ?? 'few',
    under: s.under === true,
  };
}

const samePlan = (a: Plan, b: Plan) =>
  a.age === b.age && a.annual === b.annual && a.tier === b.tier && a.income === b.income && a.growth === b.growth && a.kids === b.kids && a.under === b.under;

/** Narrow containers: the label over a full-width control (44px targets). Wider: one row. */
const ROW = 'flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between @md:gap-3';

function Planner({ data }: { data: RespOutput }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const lang = L(locale);
  // The projection starts this year on the reader's calendar: an answer reopened in a later year moves on,
  // and so does the child's age until the person sets it.
  const year = Math.max(data.year, Number(useToday(data.today ?? `${data.year}-07-01`).slice(0, 4)));
  const [ageSet, setAge] = useState<number>();
  const age = ageSet ?? Math.min(RESP.cesgLastAge, data.result.childAge + (year - data.year));
  const [annual, setAnnual] = useState(data.result.annual);
  const [tier, setTier] = useState<IncomeTier>(data.result.tier);
  const [income, setIncome] = useState<number | undefined>(data.input.familyIncome);
  const [growth, setGrowth] = useState(data.result.growth);
  const [kids, setKids] = useState<Kids>(kidsOf(data.result.children));
  const [under, setUnder] = useState(data.input.clbUnderLimit === true);
  const children = kids === 'few' ? Math.min(3, data.result.children) : COUNT[kids];
  // The bond's limit for 4 or 5 children sits inside the middle band, so the band alone can't settle it.
  const limit = clbThreshold(children);
  const askUnder = tier === 'middle' && income == null && (kids === 'four' || kids === 'five') && limit != null;
  const r = planResp({ childAge: age, annual, familyIncome: income, incomeTier: tier, children, growth, clbUnderLimit: askUnder && under }, year);
  const [saved, save] = useDeviceItem<unknown>('money:resp', { label: t('resp.saved.label'), kind: 'plan' });
  const now: Plan = { age: r.childAge, year, annual: r.annual, tier: r.tier, income, growth: r.growth, kids, under: askUnder && under };
  const kept = planFrom(saved);
  // A plan kept in an earlier year is compared (and reopened) with the child at this year's age.
  const stored = kept && { ...kept, age: Math.min(RESP.cesgLastAge, kept.age + Math.max(0, kept.year ? year - kept.year : 0)), year };
  const isSaved = stored != null && samePlan(stored, now);
  const open = (p: Plan) => {
    setAge(p.age);
    setAnnual(p.annual);
    setTier(p.tier);
    setIncome(p.income);
    setGrowth(p.growth);
    setKids(p.kids);
    setUnder(p.under);
  };

  const { money, pct } = useMoneyFormat();
  const endYear = year + (RESP.cesgLastAge - r.childAge);
  const growthOptions = GROWTH.includes(growth) ? GROWTH : [...GROWTH, growth];
  const ageText = (n: number) => (n === 0 ? t('resp.age.newborn') : isolate(t('resp.age.value', { count: n })));

  return (
    <WidgetShell
      icon={GraduationCap}
      tone="pine"
      title={t('resp.title')}
      subtitle={t('resp.subtitle')}
      badge={
        <Badge icon={Smartphone} mono>
          {t('badge.device')}
        </Badge>
      }
      sources={sourcesIn(data, lang)}
      handoff={{ href: respLinks(lang).open, label: t('resp.handoff'), note: t('resp.handoffNote') }}
      secondaryAction={
        <Button
          icon={isSaved ? BookmarkCheck : Bookmark}
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => save(now, { detail: t('resp.saved.detail', { total: money(r.totals.balance), gov: money(r.totals.government) }) })}
        >
          {isSaved ? t('action.saved') : stored ? t('action.update') : t('action.save')}
        </Button>
      }
      footnote={t('resp.footnote', { growth: fmt.number(r.growth) })}
      className="@container [text-wrap:pretty]"
    >
      <LiveRegion text={t('resp.sr', { total: money(r.totals.balance), year: String(endYear), gov: money(r.totals.government) })} />
      <Hero tone="pine">
        <Eyebrow>{t('resp.hero.eyebrow', { year: String(endYear) })}</Eyebrow>
        <p className="m-0 mt-2 font-serif text-[46px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72] @md:text-[54px]">
          <NumberTicker value={Math.round(r.totals.balance)} format={money} />
        </p>
        <p className="m-0 mt-2.5 text-[15.5px] leading-snug text-ink-2">
          {r.totals.government > 0 ? (
            <>
              {t('resp.hero.govPre')} <b className="font-semibold text-pine">{money(r.totals.government)}</b>
              {r.totals.you > 0 ? ` ${t('resp.hero.govPost', { pct: Math.round((r.totals.government / r.totals.you) * 100) })}` : ` ${t('resp.hero.govFree')}`}
            </>
          ) : r.tooOld ? (
            t('resp.hero.tooOld')
          ) : (
            t('resp.hero.none', { rate: pct(RESP.cesgRate * 100), max: money(RESP.cesgMatchedPerYear) })
          )}
          {r.totals.additional > 0 ? ` ${t('resp.hero.extra', { extra: money(r.totals.additional) })}` : null}
        </p>
        <SplitBar
          className="mt-5"
          label={t('resp.split.label')}
          segments={[
            { key: 'you', label: t('resp.split.you'), value: r.totals.you, tone: 'ink', display: money(r.totals.you) },
            { key: 'cesg', label: t('resp.split.cesg'), value: r.totals.cesg + r.totals.additional, tone: 'grant', display: money(r.totals.cesg + r.totals.additional) },
            ...(r.totals.clb > 0 ? [{ key: 'clb', label: t('resp.split.clb'), value: r.totals.clb, tone: 'amber' as const, display: money(r.totals.clb) }] : []),
            { key: 'growth', label: t('resp.split.growth', { pct: pct(r.growth) }), value: r.totals.growth, tone: 'glacier', display: money(r.totals.growth) },
          ]}
        />
      </Hero>

      <WidgetSection
        title={t('resp.plan.title')}
        aside={
          stored && !isSaved ? (
            <Button variant="quiet" size="sm" icon={BookmarkCheck} className="-my-2.5" onClick={() => open(stored)}>
              {t('resp.saved.open')}
            </Button>
          ) : null
        }
      >
        <div className="grid gap-5 @xl:grid-cols-2 @xl:gap-x-8">
          <div>
            <Slider label={t('resp.age.label')} min={0} max={RESP.cesgLastAge} value={age} onChange={setAge} format={ageText} />
            <RespScale min={ageText(0)} max={ageText(RESP.cesgLastAge)} />
          </div>
          <div>
            <Slider label={t('resp.annual.label')} min={0} max={ANNUAL_MAX} step={100} value={annual} onChange={setAnnual} format={money} />
            <RespScale
              min={money(0)}
              max={money(ANNUAL_MAX)}
              mark={{ at: RESP.cesgMatchedPerYear / ANNUAL_MAX, label: t('resp.annual.full'), reached: annual >= RESP.cesgMatchedPerYear }}
            />
            <p className="m-0 mt-2 text-[12.5px] text-ink-3">{t('resp.annual.monthly', { amount: money(annual / 12) })}</p>
          </div>
        </div>
        <div className="mt-5">
          <p className="m-0 mb-2 text-[14px] font-medium text-ink">
            {t('resp.income.label')}
          </p>
          {/* Stacked on narrow containers so each tier stays on two short lines. */}
          <Segmented
            label={t('resp.income.label')}
            className="flex-col @md:flex-row"
            value={tier}
            onChange={(v) => {
              setTier(v);
              setIncome(undefined);
            }}
            options={TIERS.map((k) => ({
              value: k,
              label: t(`resp.income.${k}`, { low: money(RESP.additional.lowMax), mid: money(RESP.additional.midMax) }),
              sub: <bdi>{t(`resp.income.${k}.sub`, { rate: pct((k === 'low' ? RESP.additional.lowRate : RESP.additional.midRate) * 100), on: money(RESP.additional.on) })}</bdi>,
            }))}
          />
        </div>
        {/* Only the middle band needs the family size: the Learning Bond limit rises with 4 or 5 children. */}
        {r.tier === 'middle' ? (
          <div className="mt-5">
            <div className={ROW}>
              <p className="m-0 text-[14px] font-medium text-ink">{t('resp.kids.label')}</p>
              <Segmented label={t('resp.kids.label')} value={kids} onChange={setKids} className="w-full @md:w-[300px]" options={KIDS.map((k) => ({ value: k, label: <bdi dir="ltr">{t(`resp.kids.${k}`)}</bdi> }))} />
            </div>
            {askUnder ? <Toggle className="mt-3" label={t('resp.kids.under', { limit: money(limit) })} description={t('resp.kids.underNote', { count: children })} checked={under} onChange={setUnder} /> : null}
          </div>
        ) : null}
        <div className={cn('mt-5', ROW)}>
          <p className="m-0 text-[14px] font-medium text-ink">{t('resp.growth.label')}</p>
          <Segmented
            label={t('resp.growth.label')}
            value={String(growth)}
            onChange={(v) => setGrowth(Number(v))}
            className="w-full @md:w-[240px]"
            options={growthOptions.map((g) => ({ value: String(g), label: pct(g) }))}
          />
        </div>
        <RespTips r={r} />
      </WidgetSection>

      <RespDetails r={r} />
    </WidgetShell>
  );
}
