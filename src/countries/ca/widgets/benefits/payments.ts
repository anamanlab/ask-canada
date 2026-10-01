/**
 * Benefit payment dates. The tools read the official calendar live (server-side) from
 * https://www.canada.ca/en/services/benefits/calendar.html, where each program's dates sit in
 * `<details id="ccb-2026"><ul><li>October 20, 2026</li>…`. Parsing is pure and isomorphic; the fallback
 * list in ./data.ts is what that page said on the day we verified it.
 */
import { PAYMENT_DATES_FALLBACK, type PayKey } from './data';

export type PaymentDates = {
  /** Upcoming dates (ISO), soonest first, per program. */
  next: Partial<Record<PayKey, string[]>>;
  /** True when the dates came from the live page just now (or from its cache). */
  live: boolean;
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const IDS: Record<PayKey, string> = { ccb: 'ccb', cgeb: 'cgeb', cwb: 'cwb', cpp: 'cpp', oas: 'oas', cdb: 'cdb' };

const toISO = (text: string): string | null => {
  const m = text.replace(/&nbsp;| /g, ' ').match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1].toLowerCase());
  if (mo < 0) return null;
  return `${m[3]}-${String(mo + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
};

/** Every date listed for each program in the calendar page's HTML (all years). */
export function parseCalendar(html: string): Partial<Record<PayKey, string[]>> {
  const out: Partial<Record<PayKey, string[]>> = {};
  for (const [key, id] of Object.entries(IDS) as [PayKey, string][]) {
    const re = new RegExp(`<details[^>]*id="${id}-(\\d{4})"[^>]*>([\\s\\S]*?)</details>`, 'g');
    const dates: string[] = [];
    for (const block of html.matchAll(re)) {
      for (const li of block[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
        const iso = toISO(li[1].replace(/<[^>]+>/g, ''));
        if (iso) dates.push(iso);
      }
    }
    if (dates.length) out[key] = [...new Set(dates)].sort();
  }
  return out;
}

export function upcoming(all: Partial<Record<PayKey, string[]>>, today: string, limit = 3): Partial<Record<PayKey, string[]>> {
  const out: Partial<Record<PayKey, string[]>> = {};
  for (const [k, list] of Object.entries(all) as [PayKey, string[]][]) out[k] = list.filter((d) => d >= today).slice(0, limit);
  return out;
}

export function fallbackDates(today: string): PaymentDates {
  return { next: upcoming(PAYMENT_DATES_FALLBACK, today), live: false };
}
