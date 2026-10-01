/**
 * Last-known data, built from snapshot.ts with no network (isomorphic). The tools fall back to it when a feed is
 * down (the widget then says "Last known" instead of "Live"); the lab fixtures are built from it.
 */
import { PAUSED, type Lang } from './data';
import { cleanDrawName, drawKind, type DrawsData } from './draws';
import { COUNTRY_TIMES_SNAPSHOT, DRAWS_SNAPSHOT, POOL_SNAPSHOT, QUEBEC_SNAPSHOT, TIMES_SNAPSHOT, TIMES_UPDATED_SNAPSHOT, WAITING_SNAPSHOT } from './snapshot';
import { parseDuration, QUEBEC_SPLIT, TIME_KEYS, TIME_META, type TimeKey, type TimeRow, type TimesData } from './times';

/** Rows with one time for everyone (visitor visas, super visas and permits are tables by country instead). */
export const ROW_KEYS = TIME_KEYS.filter((k) => !TIME_META[k].byCountry);

/** The Quebec figure (sponsorship rows) and the paused flag for a row. */
export const rowExtras = (key: TimeKey, quebec: string | undefined): Pick<TimeRow, 'quebec' | 'status'> => ({
  ...(QUEBEC_SPLIT.includes(key) ? { quebec: parseDuration(quebec) } : {}),
  ...(PAUSED[key] ? { status: 'paused' as const } : {}),
});

export function snapshotDraws(lang: Lang, count = 10): DrawsData {
  return {
    draws: DRAWS_SNAPSHOT.slice(0, count).map((r) => ({
      number: r.number,
      date: r.date,
      name: cleanDrawName((lang === 'fr' ? r.fr : r.en) ?? r.en),
      names: { en: cleanDrawName(r.en), fr: cleanDrawName(r.fr ?? r.en) },
      kind: drawKind(r.en),
      size: r.size,
      crs: r.crs,
    })),
    pool: POOL_SNAPSHOT,
    live: false,
  };
}

export function snapshotTimes(): TimesData {
  return {
    rows: ROW_KEYS.map((key) => ({
      key,
      value: parseDuration(TIMES_SNAPSHOT[key]),
      ...(WAITING_SNAPSHOT[key] ? { waiting: WAITING_SNAPSHOT[key] } : {}),
      ...rowExtras(key, QUEBEC_SNAPSHOT[key]),
    })),
    countries: { ...COUNTRY_TIMES_SNAPSHOT },
    updated: { ...TIMES_UPDATED_SNAPSHOT },
    live: false,
    down: ['pr', 'ext', 'country', 'other'],
  };
}
