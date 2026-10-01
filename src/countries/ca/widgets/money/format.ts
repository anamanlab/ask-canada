'use client';
/** Number formats shared by the four money widgets, in the page locale: whole dollars, percentages, interest rates. */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

export function useMoneyFormat() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return {
    /** Rounded to the dollar: "$1,200" / "1 200 $". */
    money: (n: number) => fmt.money(n, { cents: 'never' }),
    /** "39%" / "39 %"; `digits` caps the decimals. */
    pct: (n: number, digits?: number) => t('pct', { n: fmt.number(n, digits == null ? undefined : { maximumFractionDigits: digits }) }),
    /** Interest rates always show two decimals (6.20%, 4.45%). */
    rate: (n: number) => t('pct', { n: fmt.number(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }),
  };
}
