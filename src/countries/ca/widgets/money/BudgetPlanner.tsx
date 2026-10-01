'use client';
/**
 * Monthly budget planner (FCAC "Making a budget"): take-home pay, expenses by category and savings, what's
 * left, where the money goes, and the 3-to-6-month emergency fund target. Saved only on this device.
 * Amounts are whole dollars, in the fields as everywhere else in the widget.
 */
import { useState } from 'react';
import {
  Baby,
  Bookmark,
  BookmarkCheck,
  Bus,
  CreditCard,
  House,
  Lightbulb,
  PiggyBank,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, LiveRegion, MoneyInput, Notice, NumberTicker, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { BUDGET_CATEGORIES, planBudget, type BudgetCategory, type BudgetInput } from './calc/budget';
import { BUDGET } from './data';
import { useMoneyFormat } from './format';
import { BUDGET_TONE, BudgetSplit } from './BudgetSplit';
import { budgetLinks, L, sourcesIn, URLS } from './links';
import messages from './messages';
import type { BudgetOutput } from './output';
import { budgetPreview } from './preview';
import { Dot, Eyebrow, Fill, Hero, MoneySkeleton } from './shared';

const ICON: Record<BudgetCategory, LucideIcon> = {
  housing: House,
  utilities: Lightbulb,
  food: ShoppingBasket,
  transport: Bus,
  childcare: Baby,
  debt: CreditCard,
  insurance: ShieldCheck,
  phone: Wifi,
  personal: Sparkles,
  other: Wallet,
};
export function BudgetPlanner({ part }: WidgetProps<BudgetInput, BudgetOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('bud.error')} fallback={{ href: URLS.budgetPlanner[L(locale)], label: t('bud.handoff') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <Loading input={part.input} />;
  }
  return <Budget data={part.output} />;
}

/** The budget for the amounts the tool was called with, unseen under the skeleton: hero, money in, money out, emergency fund. */
function Loading({ input }: { input: unknown }) {
  const t = useMessages(messages);
  return (
    <MoneySkeleton title={t('bud.title')} subtitle={t('bud.subtitle')} icon={Wallet} tone="amber" label={t('loading')} blocks={[6, 3, 10, 4]}>
      <Budget key={JSON.stringify(input)} data={budgetPreview(input)} />
    </MoneySkeleton>
  );
}

type Draft = { income?: number; expenses: Partial<Record<BudgetCategory, number>>; savings?: number; emergencySaved?: number };

const amount = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : undefined);

const record = (x: unknown): Record<string, unknown> => (typeof x === 'object' && x !== null ? { ...x } : {});

/** A budget read back from this device: whatever is stored there, only known lines with real amounts are kept. */
function draftFrom(stored: unknown): Draft {
  const s = record(stored);
  const lines = record(s.expenses);
  const expenses: Draft['expenses'] = {};
  for (const c of BUDGET_CATEGORIES) {
    const n = amount(lines[c]);
    if (n != null) expenses[c] = n;
  }
  return { income: amount(s.income), expenses, savings: amount(s.savings), emergencySaved: amount(s.emergencySaved) };
}

/** Same budget? An empty line and a line at 0 are the same thing. */
function sameDraft(a: Draft, b: Draft): boolean {
  const same = (x?: number, y?: number) => (x ?? 0) === (y ?? 0);
  return same(a.income, b.income) && same(a.savings, b.savings) && same(a.emergencySaved, b.emergencySaved) && BUDGET_CATEGORIES.every((c) => same(a.expenses[c], b.expenses[c]));
}

function Budget({ data }: { data: BudgetOutput }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const lang = L(locale);
  const [saved, save] = useDeviceItem<unknown>('money:budget', { label: t('bud.saved.label'), kind: 'plan' });
  // Start from what the person told the assistant; a budget saved on this device can be reopened.
  const [v, setV] = useState<Draft>(() => ({
    income: data.input.income,
    expenses: { ...(data.input.expenses ?? {}) },
    savings: data.input.savings,
    emergencySaved: data.input.emergencySaved,
  }));
  const r = planBudget(v);
  // The button says "Saved" only while what is on screen is what is stored; any edit brings "Update" back.
  const stored = saved == null ? null : draftFrom(saved);
  const isSaved = stored != null && sameDraft(stored, v);
  const canOpen = stored != null && !isSaved && !planBudget(stored).empty;
  const { money, pct } = useMoneyFormat();
  const setExp = (c: BudgetCategory) => (n: number | undefined) => setV((s) => ({ ...s, expenses: { ...s.expenses, [c]: n } }));

  const short = r.left < 0;
  const [lowM, highM] = BUDGET.emergencyMonths;
  const progress = r.emergency.low > 0 ? Math.min(1, r.emergencySaved / r.emergency.low) : 0;

  return (
    <WidgetShell
      icon={Wallet}
      tone="amber"
      title={t('bud.title')}
      subtitle={t('bud.subtitle')}
      badge={
        <Badge icon={Smartphone} mono>
          {t('badge.device')}
        </Badge>
      }
      sources={sourcesIn(data, lang)}
      handoff={{ href: budgetLinks(lang).planner, label: t('bud.handoff'), note: t('bud.handoffNote') }}
      secondaryAction={
        <Button
          icon={isSaved ? BookmarkCheck : Bookmark}
          size="lg"
          className="w-full sm:w-auto"
          disabled={r.empty}
          onClick={() => save(v, { detail: short ? t('bud.saved.short', { amount: money(-r.left) }) : t('bud.saved.left', { amount: money(r.left) }) })}
        >
          {isSaved ? t('action.saved') : stored ? t('action.update') : t('action.save')}
        </Button>
      }
      footnote={t('bud.footnote')}
      className="@container [text-wrap:pretty]"
    >
      {r.income > 0 ? <LiveRegion text={short ? t('bud.sr.short', { amount: money(-r.left) }) : t('bud.sr.left', { amount: money(r.left) })} /> : null}
      {r.income > 0 ? (
        <Hero tone={short ? 'maple' : 'pine'}>
          <Eyebrow>{t('bud.hero.eyebrow', { income: money(r.income) })}</Eyebrow>
          {/* Number and suffix are two flex items: when the suffix doesn't fit beside the number (French on a phone) it drops below whole. */}
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
            <span className="font-serif text-[44px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
              <NumberTicker value={Math.round(Math.abs(r.left))} format={money} />
            </span>
            <span className="whitespace-nowrap text-[15px] font-medium leading-snug tracking-[-.005em] text-ink-3">{short ? t('bud.hero.short') : t('bud.hero.left')}</span>
          </p>
          <p className="m-0 mt-2 text-[14.5px] leading-snug text-ink-2">
            {short ? t('bud.hero.shortBody') : r.savings > 0 ? t('bud.hero.saving', { rate: pct(r.savingsRate, 1) }) : t('bud.hero.noSaving')}
          </p>
          <BudgetSplit r={r} className="mt-5" />
        </Hero>
      ) : (
        <Hero tone="amber">
          <Eyebrow>{t('bud.empty.eyebrow')}</Eyebrow>
          <p className="m-0 mt-2 font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [text-wrap:balance]">{t('bud.empty.title')}</p>
          <p className="m-0 mt-1.5 text-[15px] text-ink-2">{t('bud.empty.body')}</p>
          {canOpen ? (
            <Button variant="glass" size="md" icon={BookmarkCheck} className="mt-4" onClick={() => setV(stored)}>
              {t('bud.empty.load')}
            </Button>
          ) : null}
        </Hero>
      )}

      <WidgetSection
        title={t('bud.in.title')}
        aside={
          canOpen && r.income > 0 ? (
            <Button variant="quiet" size="sm" icon={BookmarkCheck} className="-my-2.5" onClick={() => setV(stored)}>
              {t('bud.empty.load')}
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 @md:grid-cols-2">
          <MoneyInput label={t('bud.in.income')} value={v.income} onChange={(n) => setV((s) => ({ ...s, income: n }))} cents={false} max={10_000_000} unit={<bdi>{t('unit.month')}</bdi>} hint={t('bud.in.incomeHint')} />
          <MoneyInput label={t('bud.in.savings')} value={v.savings} onChange={(n) => setV((s) => ({ ...s, savings: n }))} cents={false} max={10_000_000} unit={<bdi>{t('unit.month')}</bdi>} />
        </div>
      </WidgetSection>

      <WidgetSection title={t('bud.out.title')} aside={<span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-ink-2"><bdi>{t('bud.out.total', { amount: money(r.spend) })}</bdi></span>}>
        {/* Each line: icon · name over its share of pay · amount. Every row is the same two-line height. */}
        <ul className="m-0 grid list-none gap-x-8 gap-y-3 p-0 @xl:grid-cols-2">
          {BUDGET_CATEGORIES.map((c) => {
            const Icon = ICON[c];
            const share = r.income > 0 && r.expenses[c] > 0 ? t('bud.pctOfPay', { pct: pct(r.shares[c], 0) }) : t('none');
            return (
              <li key={c} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-field bg-paper-2 text-ink-2" aria-hidden>
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
                <MoneyInput
                  inline
                  className="flex-1"
                  label={
                    <>
                      <span className="block leading-snug">{t(`bud.cat.${c}`)}</span>
                      <span className="block font-mono text-[11.5px] leading-snug tabular-nums text-ink-3" aria-hidden>
                        <bdi>{share}</bdi>
                      </span>
                    </>
                  }
                  value={v.expenses[c]}
                  onChange={setExp(c)}
                  cents={false}
                  max={10_000_000}
                  placeholder={fmt.number(0)}
                />
              </li>
            );
          })}
        </ul>
        {r.top && r.income > 0 ? (
          <p className="m-0 mt-4 flex items-start gap-2 text-[13.5px] leading-snug text-ink-2">
            <Dot tone={BUDGET_TONE[r.top]} className="mt-1" />
            {t('bud.top', { cat: t(`bud.catInline.${r.top}`), pct: pct(r.shares[r.top], 0) })}
          </p>
        ) : null}
      </WidgetSection>

      <WidgetSection title={t('bud.em.title')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="m-0 font-serif text-[28px] leading-none tracking-[-.02em] text-ink tabular-nums">
            {r.spend > 0 ? (
              <bdi dir="ltr">{t('range', { low: money(r.emergency.low), high: money(r.emergency.high) })}</bdi>
            ) : (
              t('none')
            )}
          </p>
          <span className="text-[13px] text-ink-3">
            <bdi>{t('bud.em.target', { low: lowM, high: highM })}</bdi>
          </span>
        </div>
        <div className="mt-4 grid gap-4 @md:grid-cols-2 @md:items-end">
          <MoneyInput label={t('bud.em.saved')} value={v.emergencySaved} onChange={(n) => setV((s) => ({ ...s, emergencySaved: n }))} cents={false} max={100_000_000} />
          <div>
            <div className="relative h-2.5 rounded-full bg-ink/10" aria-hidden>
              <Fill value={progress} className="bg-pine" />
            </div>
            <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">
              {r.spend === 0
                ? t('bud.em.needSpend')
                : r.emergency.monthsToLow === 0
                  ? t('bud.em.done', { months: fmt.number(r.emergency.monthsCovered, { maximumFractionDigits: 1 }) })
                  : r.emergency.monthsToLow == null
                    ? t('bud.em.never')
                    : t('bud.em.eta', { count: r.emergency.monthsToLow, low: lowM, per: money(r.savings + Math.max(0, r.left)) })}
            </p>
          </div>
        </div>
        {short ? (
          <Notice tone="warn" className="mt-4" icon={PiggyBank} title={t('bud.tip.short.title')}>
            {t('bud.tip.short.body')}
          </Notice>
        ) : null}
      </WidgetSection>
    </WidgetShell>
  );
}
