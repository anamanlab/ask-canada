'use client';
/**
 * "Where your money goes": the stacked bar of a month's pay and its legend. From @md up the legend lists every
 * line; on a phone it keeps the three biggest costs, rolls the rest into one line, then savings and what's left,
 * so the first field stays within reach (every line and its amount is in "Money out" right below).
 */
import { useMessages } from '@/lib/i18n/widget';
import { BUDGET_CATEGORIES, type BudgetCategory, type BudgetResult } from './calc/budget';
import { useMoneyFormat } from './format';
import messages from './messages';
import { Legend, SplitBar, type LegendItem, type Swatch } from './shared';

// Neighbours in the bar never share a hue; only phone and "other" are neutral. Savings is pine, so no green here.
export const BUDGET_TONE: Record<BudgetCategory, Swatch> = {
  housing: 'glacier',
  utilities: 'glacierInk',
  food: 'amber',
  transport: 'violet',
  childcare: 'plum',
  debt: 'maple',
  insurance: 'orange',
  phone: 'gray',
  personal: 'rose',
  other: 'stone',
};

/** Biggest costs named in the phone legend before the rest are rolled up. */
const TOP = 3;

export function BudgetSplit({ r, className }: { r: BudgetResult; className?: string }) {
  const t = useMessages(messages);
  const { money } = useMoneyFormat();
  const costs = BUDGET_CATEGORIES.filter((c) => r.expenses[c] > 0).map((c) => ({ key: c, label: t(`bud.cat.${c}`), value: r.expenses[c], tone: BUDGET_TONE[c], display: money(r.expenses[c]) }));
  const rest = [
    ...(r.savings > 0 ? [{ key: 'savings', label: t('bud.savings'), value: r.savings, tone: 'pine' as const, display: money(r.savings) }] : []),
    ...(r.left > 0 ? [{ key: 'left', label: t('bud.left'), value: r.left, tone: 'outline' as const, display: money(r.left) }] : []),
  ];
  const segments = [...costs, ...rest];
  if (!segments.length) return null;

  // One more line than TOP is listed as itself: a roll-up of a single line would save nothing.
  const rolled = costs.length > TOP + 1;
  const biggest = rolled ? [...costs].sort((a, b) => b.value - a.value).slice(0, TOP) : costs;
  const others = costs.filter((c) => !biggest.includes(c));
  const short: LegendItem[] = [
    ...biggest,
    ...(others.length ? [{ key: 'others', label: t('bud.split.others', { count: others.length }), display: money(others.reduce((s, c) => s + c.value, 0)) }] : []),
    ...rest,
  ];
  const grid = segments.length > 3;

  return (
    <div className={className}>
      <SplitBar label={t('bud.split.label')} segments={segments} legend={false} />
      {rolled ? (
        <>
          <Legend className="mt-3 @md:hidden" items={short} grid />
          <Legend className="mt-3 hidden @md:grid" items={segments} grid />
        </>
      ) : (
        <Legend className="mt-3" items={segments} grid={grid} />
      )}
    </div>
  );
}
