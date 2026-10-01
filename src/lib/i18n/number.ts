/**
 * Reading numbers people type (core, isomorphic).
 *
 *   parseLocaleNumber('1 234,56', 'fr-CA')  -> 1234.56
 *   parseLocaleNumber('5.5', 'fr-CA')       -> 5.5      (a dot typed on a French keyboard is still a decimal)
 *   parseLocaleNumber('1,234', 'en-CA')     -> 1234
 *   parseLocaleNumber('$1,234.50', 'en-CA') -> 1234.5
 *   parseLocaleNumber('abc', 'en-CA')       -> null
 *
 * Rules, in order:
 * - Spaces (incl. the narrow no-break space French uses for grouping), currency and percent signs are ignored.
 * - Both `.` and `,` present: the last one is the decimal separator, the other groups thousands.
 * - One kind, repeated ("1.234.567"): it groups thousands.
 * - One kind, once: the locale's own decimal separator is a decimal. The other one is a decimal too unless
 *   exactly three digits follow it ("1,234" in English, "1.234" in French group thousands).
 */
import { numberFormat } from './format';

const decimalOf = (intl: string) => numberFormat(intl).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.';

export function parseLocaleNumber(raw: string, intl: string): number | null {
  const s = raw
    .trim()
    .replace(/[\s  '$€£¥%]/g, '')
    .replace(/^−/, '-');
  if (!/^-?[\d.,]*\d[\d.,]*$/.test(s)) return null;
  const dots = s.split('.').length - 1;
  const commas = s.split(',').length - 1;
  let decimal: '.' | ',' | null = null;
  if (dots && commas) decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
  else if (dots + commas === 1) {
    const sep = dots ? '.' : ',';
    const after = s.length - s.indexOf(sep) - 1;
    decimal = sep === decimalOf(intl) || after !== 3 ? sep : null;
  }
  const group = decimal === '.' ? ',' : decimal === ',' ? '.' : /[.,]/;
  const normal = s.split(group).join('').replace(',', '.');
  const n = Number(normal);
  return normal === '' || normal === '-' || !Number.isFinite(n) ? null : n;
}
