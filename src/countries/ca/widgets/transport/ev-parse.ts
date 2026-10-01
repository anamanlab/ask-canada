/**
 * Electric Vehicle Affordability Program (EVAP): parsers for Transport Canada's vehicle list and funding pages
 * (server: live.ts fetches the HTML, these read it).
 */
import type { EvRow, Fuel } from './ev';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();

/** Rows from one page of the EVAP vehicle list (Drupal view table). */
export function parseEvList(html: string): EvRow[] {
  const body = html.slice(html.indexOf('<tbody'), html.indexOf('</tbody>'));
  if (!body) return [];
  const rows: EvRow[] = [];
  for (const tr of body.match(/<tr[\s>][\s\S]*?<\/tr>/g) ?? []) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (tds.length < 5) continue;
    const year = Number(strip(tds[0]).replace(/\D/g, ''));
    const fuel = strip(tds[4]).toUpperCase() as Fuel;
    if (!year || !['BEV', 'PHEV', 'FCEV'].includes(fuel)) continue;
    rows.push([year, strip(tds[1]), strip(tds[2]), strip(tds[3]), fuel, /canadian-maple-leaf/.test(tr) ? 1 : 0]);
  }
  return rows;
}

/** Number of pages in the list's pager (1 when there is none). */
export function evListPages(html: string): number {
  const nums = [...html.matchAll(/[?&]page=(\d+)/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

/** "As of September 1, 2026, there is $2.00B in remaining funds." (EN) / "En date du 1er septembre 2026, il reste 2,00 milliards…" (FR) */
export function parseFunds(text: string): { remaining: number; asOf: string } | null {
  const t = strip(text);
  const en = /As of ([A-Z][a-z]+) (\d{1,2}), (\d{4}), there is \$([\d.,]+)\s*(B|M|billion|million)/.exec(t);
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  if (en) {
    const mo = MONTHS.indexOf(en[1].toLowerCase()) + 1;
    const mult = /^b/i.test(en[5]) ? 1e9 : 1e6;
    const amount = Number(en[4].replace(/,/g, '')) * mult;
    if (!mo || !Number.isFinite(amount)) return null;
    return { remaining: Math.round(amount), asOf: `${en[3]}-${String(mo).padStart(2, '0')}-${en[2].padStart(2, '0')}` };
  }
  return null;
}
