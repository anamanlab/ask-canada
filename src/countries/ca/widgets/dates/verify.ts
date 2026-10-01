/**
 * Key dates: checks a holiday list against what was verified on the official pages. The tools run it on the live
 * feed (a feed that fails falls back to the verified snapshot) and the unit test runs it on the snapshot itself.
 */
import { PROVINCES, type HolidayItem } from './data';
import { STAT_COUNTS } from './fallback';
import { holidayName } from './names';
import { holidaysFor } from './select';

/**
 * What's wrong with a year's holidays (empty when nothing is): a province whose number of statutory holidays differs
 * from its official list (`STAT_COUNTS`), or two holidays in one province sharing a name in English or French (N.L.'s
 * Memorial Day on July 1 once read « Jour du Souvenir », the same as November 11).
 */
export function holidayProblems(all: HolidayItem[], year: number): string[] {
  const out: string[] = [];
  for (const p of PROVINCES) {
    const { stat, government } = holidaysFor(all, p, year);
    if (stat.length !== STAT_COUNTS[p]) out.push(`${p} ${year}: ${stat.length} statutory holidays, expected ${STAT_COUNTS[p]}`);
    for (const lang of ['en', 'fr'] as const) {
      const names = [...stat, ...government].map((h) => holidayName(h, p, lang));
      const twice = names.find((n, i) => names.indexOf(n) !== i);
      if (twice) out.push(`${p} ${year}: two holidays named “${twice}” (${lang})`);
    }
  }
  return out;
}
