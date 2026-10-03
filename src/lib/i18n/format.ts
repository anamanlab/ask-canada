/**
 * Message + value formatting (core, isomorphic).
 *
 * formatMessage supports a small, dependable ICU subset:
 *   "Hello {name}"                               -> simple placeholder
 *   "{count, plural, one {# day} other {# days}}" -> plural with `#` (locale-aware via Intl.PluralRules)
 *   "{kind, select, online {Online} other {Mail}}" -> select
 * Numbers inside placeholders are formatted with the active locale.
 */

export type MessageValues = Record<string, string | number | null | undefined>;
export type Messages = Record<string, string>;

/**
 * Intl formatters are costly to build (tens of microseconds each) and every widget formats on each render,
 * so one instance per locale + options is kept and reused.
 */
function cached<T>(cache: Map<string, T>, key: string, make: () => T): T {
  let v = cache.get(key);
  if (!v) {
    v = make();
    cache.set(key, v);
  }
  return v;
}
const pluralCache = new Map<string, Intl.PluralRules>();
const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();
const relativeCache = new Map<string, Intl.RelativeTimeFormat>();
const plural = (tag: string) => cached(pluralCache, tag, () => new Intl.PluralRules(tag));
/** A shared `Intl.NumberFormat` for these options. */
export const numberFormat = (intl: string, opts: Intl.NumberFormatOptions = {}) =>
  cached(numberCache, `${intl}|${JSON.stringify(opts)}`, () => new Intl.NumberFormat(intl, opts));
/** A shared `Intl.DateTimeFormat` for these options. */
export const dateFormat = (intl: string, opts: Intl.DateTimeFormatOptions = {}) =>
  cached(dateCache, `${intl}|${JSON.stringify(opts)}`, () => new Intl.DateTimeFormat(intl, opts));

/** Find the matching closing brace for the `{` at `start`. */
function matchBrace(s: string, start: number): number {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseOptions(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    let key = '';
    while (i < body.length && body[i] !== '{' && !/\s/.test(body[i])) key += body[i++];
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== '{') break;
    const end = matchBrace(body, i);
    if (end < 0) break;
    out[key] = body.slice(i + 1, end);
    i = end + 1;
  }
  return out;
}

export function formatMessage(template: string, values: MessageValues = {}, intl = 'en-CA'): string {
  let out = '';
  let i = 0;
  while (i < template.length) {
    const ch = template[i];
    if (ch !== '{') {
      out += ch;
      i++;
      continue;
    }
    const end = matchBrace(template, i);
    if (end < 0) {
      out += template.slice(i);
      break;
    }
    const inner = template.slice(i + 1, end);
    const [name, kind, ...rest] = inner.split(',');
    const key = name.trim();
    const v = values[key];
    if (!kind) {
      out += v == null ? '' : typeof v === 'number' ? numberFormat(intl).format(v) : String(v);
    } else {
      const options = parseOptions(rest.join(',').trim());
      const k = kind.trim();
      let chosen: string | undefined;
      if (k === 'plural') {
        const n = Number(v ?? 0);
        chosen = options[`=${n}`] ?? options[plural(intl).select(n)] ?? options.other;
        if (chosen != null) chosen = chosen.replace(/#/g, numberFormat(intl).format(n));
      } else {
        chosen = options[String(v)] ?? options.other;
      }
      out += chosen != null ? formatMessage(chosen, values, intl) : '';
    }
    i = end + 1;
  }
  return out;
}

/* ---------- Intl helpers (all locale-aware; en-CA "$1,234.56", fr-CA "1 234,56 $") ---------- */

export function formatCurrency(amount: number, intl: string, currency = 'CAD', opts: Intl.NumberFormatOptions = {}) {
  const whole = Number.isInteger(amount);
  return numberFormat(intl, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: whole && opts.minimumFractionDigits == null ? 0 : 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(amount);
}

/**
 * How `formatMoney` shows cents:
 * - `auto` (default): "$163.50", but whole amounts stay whole ("$120")
 * - `always`: "$120.00"
 * - `never`: rounded to the dollar ("$164")
 */
export type MoneyOptions = { cents?: 'auto' | 'always' | 'never'; compact?: boolean };

/**
 * Money for people: en-CA "$1,234.50" / fr-CA "1 234,50 $". `compact` shortens large amounts ("$1.2K" /
 * "1,2 k$", one decimal at most; none with `cents: 'never'`).
 */
export function formatMoney(amount: number, intl: string, currency = 'CAD', { cents = 'auto', compact }: MoneyOptions = {}) {
  if (compact) {
    return formatCurrency(amount, intl, currency, { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: cents === 'never' ? 0 : 1 });
  }
  const digits = cents === 'never' ? 0 : cents === 'always' || !Number.isInteger(amount) ? 2 : 0;
  return formatCurrency(amount, intl, currency, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatNumber(n: number, intl: string, opts: Intl.NumberFormatOptions = {}) {
  return numberFormat(intl, opts).format(n);
}

/** Parse `YYYY-MM-DD` as a local calendar date (no timezone drift). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export function formatDate(date: Date | string, intl: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return dateFormat(intl, opts).format(d);
}

/**
 * The time of day of an ISO timestamp, in the given locale.
 *
 * Not `formatDate`: that parses a bare `YYYY-MM-DD` as a *local* calendar date, which is
 * exactly right for a date and exactly wrong for an instant. A fetch timestamp carries a
 * time and a zone, so it is read as the moment it names.
 */
export function formatTime(date: Date | string, intl: string, opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFormat(intl, opts).format(d);
}

export function formatRelativeDays(days: number, intl: string) {
  return cached(relativeCache, intl, () => new Intl.RelativeTimeFormat(intl, { numeric: 'auto' })).format(days, 'day');
}
