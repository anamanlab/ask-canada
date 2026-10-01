/**
 * Small pure helpers shared by the renderers (client), the scripted answers and the tools (server), kept
 * apart from the parsers (parse-advisory.ts, parse-waits.ts) so the feed parsers never ship to the browser.
 */
import type { Lang, LocalEmergency, RegionalAdvisory } from './types';

/** "police" → "Police": feed labels and values start in lower case. */
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Distinct local numbers, each with every service it covers, core services first, then page order (Thailand: 191 police,
 * 1669 medical assistance, 199 firefighters; Japan: 110 police, 119 medical assistance and firefighters).
 * Shared by the scripted answer and the widget's checklist so both name the same numbers.
 */
export function emergencyGroups(e: Pick<LocalEmergency, 'numbers'>, max = 3): { number: string; labels: string[] }[] {
  const by = new Map<string, string[]>();
  for (const n of e.numbers) by.set(n.number, [...(by.get(n.number) ?? []), n.label.toLowerCase()]);
  // Police, medical help and firefighters before extras (tourist police, coast guard), which can't push them out.
  const core = (labels: string[]) => (labels.some((l) => !/touris/.test(l) && /police|ambulan|medic|médic|fire|pompier|incendie|emergenc|urgence/.test(l)) ? 0 : 1);
  return [...by.entries()]
    .map(([number, labels]) => ({ number, labels }))
    .sort((a, b) => core(a.labels) - core(b.labels))
    .slice(0, max);
}

/** "911", or "191 (police), 1669 (medical assistance), 199 (firefighters)" when there's no single number. */
export function emergencyText(e: Pick<LocalEmergency, 'primary' | 'numbers'>): string | undefined {
  if (e.primary) return e.primary;
  const groups = emergencyGroups(e);
  if (groups.length === 1) return groups[0].number;
  return groups.length ? groups.map((g) => `${g.number} (${g.labels.join(', ')})`).join(', ') : undefined;
}

/**
 * Short title for a regional advisory the feed leaves untitled. The reason sentence ("Avoid non-essential
 * travel to the following states due to high levels of violence and organized crime") restates the level,
 * so the title keeps what differs: "14 states: violence and organized crime". The full reason stays in the
 * expanded body. Falls back to the reason itself when it doesn't follow the usual pattern.
 */
export function regionTitle(r: Pick<RegionalAdvisory, 'title' | 'reason' | 'areas'>): string | null {
  if (r.title) return r.title;
  const n = r.areas.length;
  if (!n) return null;
  const en = r.reason.match(/\bthe following ([a-z][a-z ,]{0,60}?)(?:,? (?:due to|because of) (.+))?$/i);
  const fr = en ? null : r.reason.match(/\b(?:les|des) ([a-zéèêôÉ][a-zéèêôÉ ,]{0,60}?) suivant(?:e)?s(?:,? en raison (?:de la |du |des |de l’|de l'|d’|d')(.+))?$/i);
  const m = en ?? fr;
  if (!m) return null;
  const cause = (m[2] ?? '').replace(/^(?:high|elevated|significant) levels? of /i, '').replace(/[\s.;:]+$/, '');
  const head = `${n} ${m[1]}`;
  return cause ? (en ? `${head}: ${cause}` : `${head} : ${cause}`) : head;
}

const ZONE_OFFSET: Record<string, number> = { NDT: -2.5, NST: -3.5, ADT: -3, AST: -4, EDT: -4, EST: -5, CDT: -5, CST: -6, MDT: -6, MST: -7, PDT: -7, PST: -8 };
/** CBSA and the advisory feed print English zone abbreviations; French readers get the French ones (HAE, HAP…). */
const FR_ZONE: Record<string, string> = { NDT: 'HAT', NST: 'HNT', ADT: 'HAA', AST: 'HNA', EDT: 'HAE', EST: 'HNE', CDT: 'HAC', CST: 'HNC', MDT: 'HAR', MST: 'HNR', PDT: 'HAP', PST: 'HNP' };
const STAMP = /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*([A-Z]{3})?/;

/** CBSA stamp ("2026-09-30 07:47 ADT") → epoch ms, so stamps from different time zones compare. */
export function stampMs(s: string): number {
  const m = s.match(STAMP);
  if (!m) return 0;
  const off = ZONE_OFFSET[m[6] ?? 'EDT'] ?? -4;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - off * 3_600_000;
}

/**
 * A time of day in Canada.ca style: "4:14 a.m." / « 4 h 14 » (no leading zero in either language). Written
 * out rather than left to `Intl`, whose fr-CA pads the hour when a date is in the same pattern (« 04 h 14 »)
 * and whose output differs between the server's and the browser's ICU.
 */
function clockText(hour: number, minute: number, lang: Lang): string {
  const mm = String(minute).padStart(2, '0');
  return lang === 'fr' ? `${hour}\u00a0h\u00a0${mm}` : `${hour % 12 || 12}:${mm}\u00a0${hour < 12 ? 'a.m.' : 'p.m.'}`;
}
const zoneText = (zone: string | undefined, lang: Lang) => (!zone ? '' : ` ${lang === 'fr' ? (FR_ZONE[zone] ?? zone) : zone}`);
/** French writes the first of the month as an ordinal (« 1er octobre », Canada.ca style); `Intl` prints « 1 octobre ». */
export const frFirst = (date: string, lang: Lang) => (lang === 'fr' ? date.replace(/^1(?=\s)/, '1er') : date);
const dayText = (utc: Date, lang: Lang) =>
  frFirst(new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(utc), lang);

/**
 * A CBSA stamp for people: "2026-09-30 07:47 ADT" → "7:47 a.m. ADT" / « 7 h 47 HAA », in the crossing's own
 * zone as published. `date` adds the day ("Sep 30, 5:15 a.m. CDT"), for an estimate from another day.
 * One function for the scripted answer (server) and the board (client), so both print the same time.
 */
export function stampText(s: string, lang: Lang, { date = false }: { date?: boolean } = {}): string {
  const m = s.match(STAMP);
  if (!m) return s;
  const time = `${clockText(+m[4], +m[5], lang)}${zoneText(m[6], lang)}`;
  return date ? `${dayText(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])), lang)}, ${time}` : time;
}

/**
 * The advisory feed's "updated" time (ISO with offset), in Ottawa time like the feed's own pages:
 * "Sep 29, 4:14 a.m. EDT" / « 29 sept., 4 h 14 HAE ». The date alone when the time can't be read.
 */
export function updatedText(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const day = dayText(new Date(Date.UTC(+get('year'), +get('month') - 1, +get('day'))), lang);
  return `${day}, ${clockText(+get('hour') % 24, +get('minute'), lang)}${zoneText(get('timeZoneName') || undefined, lang)}`;
}
