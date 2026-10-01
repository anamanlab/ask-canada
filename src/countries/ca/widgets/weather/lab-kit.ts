/**
 * Shared by the lab fixture files (lab-forecast.ts, lab-alerts.ts, lab-air.ts): the tool-part builder and the
 * AQHI reading as the live feed returns it. Every builder takes its language as an argument (fixtures.ts
 * builds the English and the French sets), so the same module yields the same data on the server and in the
 * browser.
 */
import type { WidgetPart } from '@/lib/widgets/types';
import type { Lang } from './data';
import { PERIODS as P, aqhiFcst, aqhiObs } from './fixture-alerts';
import { NOW } from './fixture-city';
import { parseAqhi } from './model';
import { toLite } from './nearest';
import { cityById } from './places';

let n = 0;
export const part = (toolName: string, state: WidgetPart['state'], output?: unknown, input: unknown = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-wx-${++n}`,
  state,
  input,
  output: state === 'output-available' ? output : undefined,
  ...(state === 'output-error' ? { errorText: 'Upstream timeout' } : {}),
});

/** Forecast locations by id, named in `lang`. */
export const lite = (ids: string[], lang: Lang) =>
  ids.flatMap((id) => {
    const row = cityById(id);
    return row ? [toLite(row, lang)] : [];
  });
export const hoursAfter = (d: Date, h: number) => new Date(d.getTime() + h * 3600_000);
export const minutesAfter = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/**
 * An AQHI reading + forecast as the live feed returns it at `now`: observed an hour earlier, forecast issued
 * at the latest 6 a.m. or 5 p.m. local (so periods start "Today" after 6 a.m.).
 */
export const aqhi = (
  id: string,
  name: [string, string?],
  km: number,
  obs: number | null,
  periods: [keyof typeof P, number, number?][],
  { lang, now = NOW, tz = 'America/Toronto' }: { lang: Lang; now?: Date; tz?: string },
) =>
  parseAqhi(obs != null ? aqhiObs(obs, 1, now) : undefined, aqhiFcst(periods.map(([k, v, s]) => [P[k], v, s]), now, tz), { id, name: (lang === 'fr' && name[1]) || name[0], km }, lang, tz);
