/** Locale-bound formatters (isomorphic): `fmt` from `useLocale()` on the client and `getT()` on the server. */
import { formatCurrency, formatDate, formatMoney, formatNumber, formatTime, type MoneyOptions } from './format';

export type Formatters = ReturnType<typeof makeFormatters>;

export function makeFormatters(intl: string, currency: string) {
  return {
    currency: (n: number, opts?: Intl.NumberFormatOptions) => formatCurrency(n, intl, currency, opts),
    /** Money in the pack currency: `fmt.money(163.5)` "$163.50", `fmt.money(1200, { cents: 'never' })` "$1,200". */
    money: (n: number, opts?: MoneyOptions) => formatMoney(n, intl, currency, opts),
    number: (n: number, opts?: Intl.NumberFormatOptions) => formatNumber(n, intl, opts),
    date: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => formatDate(d, intl, opts),
    /** The time of day of an ISO timestamp, e.g. `fmt.time('2026-11-04T12:30Z')` -> "10:30". */
    time: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => formatTime(d, intl, opts),
  };
}
