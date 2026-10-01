/**
 * The one Veterans Affairs Canada rate that changes every quarter, read from the rates page itself (server
 * only): the Canadian Forces Income Support maximum and the date of its latest adjustment.
 *
 * The page says "The most recent adjustment took affect October 1" above a table whose first amount is the
 * Veteran or survivor maximum. Both are parsed from the page text, validated with zod (a plausible amount,
 * a real month and day, a sane "Date modified") and cached for six hours. Anything unexpected returns null
 * and the tool keeps the figures in facts.ts, which are re-verified by hand every quarter (see data.ts).
 */
import 'server-only';
import { z } from 'zod';
import { fetchText } from '@/lib/server/fetch-json';
import { URLS } from './data';
import { RATES } from './facts';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const Parsed = z.object({
  // A quarterly cost-of-living adjustment moves the maximum by a few dollars: refuse anything far from the last verified figure.
  cfisMax: z.number().min(RATES.cfisMax * 0.8).max(RATES.cfisMax * 1.5),
  month: z.number().int().min(0).max(11),
  day: z.number().int().min(1).max(31),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LiveRates = { cfisMax: number; cfisSince: string; updated: string; checked: string };

/** Page text without markup, comments or scripts, in one line. */
const textOf = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');

/** The live figures in a rates page (pure), or null when the page no longer reads as expected. */
function parseRates(html: string, today: string): LiveRates | null {
  const text = textOf(html);
  // "took affect" is the page's own spelling; accept the correct one too. The page writes "October 1" or "1 October".
  const m = /Canadian Forces Income Support are adjusted on a quarterly basis\. The most recent adjustment took (?:affect|effect) (?:on )?(?:([A-Z][a-z]+) (\d{1,2})|(\d{1,2}) ([A-Z][a-z]+))\b[\s\S]{0,400}?\$\s?([\d,]+\.\d{2})/.exec(text);
  const modified = /Date modified:\s*(\d{4}-\d{2}-\d{2})/.exec(text);
  if (!m || !modified) return null;
  const parsed = Parsed.safeParse({
    cfisMax: Number(m[5].replace(/,/g, '')),
    month: MONTHS.indexOf((m[1] ?? m[4]).toLowerCase()),
    day: Number(m[2] ?? m[3]),
    updated: modified[1],
  });
  if (!parsed.success) return null;
  const { cfisMax, month, day, updated } = parsed.data;
  // The page gives no year: it is the latest such date that is not after the day the page was modified.
  const mmdd = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const year = Number(updated.slice(0, 4));
  const cfisSince = `${year}-${mmdd}` <= updated ? `${year}-${mmdd}` : `${year - 1}-${mmdd}`;
  return { cfisMax, cfisSince, updated, checked: today };
}

export async function liveRates(signal?: AbortSignal): Promise<LiveRates | null> {
  const res = await fetchText(URLS.rates.en, { revalidate: 6 * 60 * 60, timeout: 4000, signal });
  if (!res.ok) return null;
  return parseRates(res.data, res.at.slice(0, 10));
}
