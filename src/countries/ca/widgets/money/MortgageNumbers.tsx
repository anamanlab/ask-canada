'use client';
/**
 * "Your numbers" for the stress test. The four inputs that decide the answer (income, price, down payment, rate)
 * are always shown; property tax, heating, condo fees, other debts, amortization and the buyer toggles sit one
 * tap away in a disclosure, so on a phone the verdict and the test stay close together.
 * The disclosure is controlled by the parent: the "Add property tax and heating" notice opens it with
 * `focusCosts`, which puts the caret in the first cost field as the panel comes on screen.
 */
import type { Ref } from 'react';
import { Disclosure, MoneyInput, PercentInput, Segmented, Toggle, WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { downShare, type MortgageInput, type MortgageResult } from './calc/mortgage';
import { MORTGAGE } from './data';
import { useMoneyFormat } from './format';
import messages from './messages';

type Setter = <K extends keyof MortgageInput>(k: K) => (x: MortgageInput[K]) => void;
type Years = MortgageResult['amortization'];
/** Segmented values are strings: the two amortizations, keyed both ways. */
const YEARS = { '25': MORTGAGE.amortDefault, '30': MORTGAGE.amortLong } as const;
const CHOICE = { 25: '25', 30: '30' } as const satisfies Record<Years, keyof typeof YEARS>;

/**
 * Callback ref for a field's label text: focuses the field the label belongs to (`label.control`), without the
 * jump a focus makes, since the opener is already scrolling the panel into view. Core's MoneyInput takes no
 * input ref or autoFocus yet; when it does, this goes.
 */
const focusField = (el: HTMLSpanElement | null) => {
  if (el?.parentElement instanceof HTMLLabelElement) el.parentElement.control?.focus({ preventScroll: true });
};

export function MortgageNumbers({
  v,
  set,
  r,
  more,
  onMore,
  moreRef,
  focusCosts,
}: {
  v: MortgageInput;
  set: Setter;
  r: MortgageResult;
  more: boolean;
  onMore: (open: boolean) => void;
  moreRef: Ref<HTMLDivElement>;
  /** The panel was opened by the "add costs" notice: its first field takes focus. */
  focusCosts: boolean;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { money, pct, rate } = useMoneyFormat();
  const conv = pct(MORTGAGE.conventionalDown * 100, 0);
  // Without a price, 30 years is only known to be allowed for a first home or a new build: don't offer it and
  // then take it away once a price is typed.
  const allow30 = r.price > 0 ? r.long30Allowed : !!(v.firstTimeBuyer || v.newBuild);
  const costs = r.missing.includes('propertyTax') ? (r.missing.includes('heating') ? 'both' : 'propertyTax') : r.missing.includes('heating') ? 'heating' : null;
  // Core right-aligns a value that has only a suffix ("5.5 %"). Where the money fields carry their sign in front
  // ("$120,000", value at the start), the rate lines up with them; in French all four already end-align.
  const signFirst = /^\D/.test(money(1));
  const unitYear = <bdi>{t('unit.year')}</bdi>;
  const unitMonth = <bdi>{t('unit.month')}</bdi>;

  return (
    <WidgetSection title={t('mtg.numbers.title')}>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
        <MoneyInput label={t('mtg.in.income')} value={v.income} onChange={set('income')} cents={false} max={10_000_000} hint={t('mtg.in.incomeHint')} />
        <MoneyInput label={t('mtg.in.price')} value={v.price} onChange={set('price')} cents={false} max={20_000_000} />
        <MoneyInput
          label={t('mtg.in.down')}
          value={v.downPayment}
          onChange={set('downPayment')}
          cents={false}
          max={20_000_000}
          hint={r.price > 0 ? t(r.downIsMinimum ? 'mtg.in.downAssumed' : 'mtg.in.downHint', { min: money(r.minDown), pct: pct(downShare(r), 1) }) : undefined}
        />
        <PercentInput
          label={t('mtg.in.rate')}
          value={v.rate}
          onChange={set('rate')}
          max={25}
          className={signFirst ? '[&_input]:text-start' : undefined}
          hint={t('mtg.in.rateHint', { floor: rate(MORTGAGE.floor), buffer: fmt.number(MORTGAGE.buffer) })}
        />
      </div>
      <div ref={moreRef} className="mt-5 scroll-mt-4">
        <Disclosure
          lazy
          open={more}
          onOpenChange={onMore}
          title={t('mtg.more.title')}
          summary={costs ? t('mtg.more.missing', { which: costs }) : t('mtg.more.done', { years: r.amortization })}
        >
          <div className="grid grid-cols-1 gap-4 pb-1 @md:grid-cols-2">
            <MoneyInput label={<span ref={focusCosts ? focusField : undefined}>{t('mtg.in.tax')}</span>} value={v.propertyTax} onChange={set('propertyTax')} cents={false} max={1_000_000} unit={unitYear} />
            <MoneyInput label={t('mtg.in.heat')} value={v.heating} onChange={set('heating')} cents={false} max={100_000} unit={unitMonth} />
            <MoneyInput label={t('mtg.in.condo')} value={v.condoFees} onChange={set('condoFees')} cents={false} max={100_000} unit={unitMonth} hint={t('mtg.in.condoHint')} />
            <MoneyInput label={t('mtg.in.debts')} value={v.debts} onChange={set('debts')} cents={false} max={1_000_000} unit={unitMonth} hint={t('mtg.in.debtsHint')} />
          </div>
          <div className="mt-5 grid gap-4 @md:grid-cols-2 @md:gap-x-6">
            <div>
              <p className="m-0 mb-2 text-[14px] font-medium text-ink">{t('mtg.in.amort')}</p>
              <Segmented
                label={t('mtg.in.amort')}
                value={CHOICE[r.amortization]}
                onChange={(x) => set('amortization')(YEARS[x])}
                options={[
                  { value: CHOICE[MORTGAGE.amortDefault], label: <bdi>{t('mtg.years', { count: MORTGAGE.amortDefault })}</bdi> },
                  { value: CHOICE[MORTGAGE.amortLong], label: <bdi>{t('mtg.years', { count: MORTGAGE.amortLong })}</bdi>, disabled: !allow30 },
                ]}
              />
              {allow30 ? null : <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-3">{t('mtg.in.amort30No', { pct: conv })}</p>}
            </div>
            <div className="flex flex-col justify-end gap-1">
              <Toggle
                label={t('mtg.in.first')}
                description={t('mtg.in.firstHint', { years: MORTGAGE.amortLong, pct: conv })}
                checked={!!v.firstTimeBuyer}
                onChange={set('firstTimeBuyer')}
              />
              <Toggle label={t('mtg.in.newBuild')} checked={!!v.newBuild} onChange={set('newBuild')} />
            </div>
          </div>
        </Disclosure>
      </div>
    </WidgetSection>
  );
}
