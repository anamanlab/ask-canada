/**
 * Reading a weather question and wording its scripted answer: the place or province in the question, and the
 * small formatting helpers the prose builders share (temperatures, clock times, alert titles, French "à/au/aux").
 */
import { isStale, type Lang, type Province } from './data';
import { splitProvince } from './places';
import type { Alert } from './types';

export type Ctx = { text: string; lang: Lang; timeZone?: string };
/** Records what the answer turned out to be about (a place or a province), for the follow-up questions. */
export type Note = (name: string, flag?: boolean) => void;

/* ------------------------------------------------------------------ reading the question */

const TIME_WORDS =
  /\s+(?:today|tonight|tomorrow|(?:this|on the|over the|next)\s+(?:week(?:-?end)?|morning|afternoon|evening)|right now|now|on (?:mon|tues|wednes|thurs|fri|satur|sun)day|aujourd['’]hui|ce soir|cette nuit|demain|cette semaine|(?:ce|cette|en|la|durant la|pendant la)\s+(?:week-?end|fin de semaine)|en ce moment|maintenant)\b.*$/i;
const NOT_A_PLACE = /^(?:me|my area|my location|here|home|canada|the canada|ici|chez moi|moi|mon secteur|ma région|ma region|le canada|my city|my town|ma ville)$/i;

const QUESTION = /^(?:what|how|is|are|the|any|where|when|will|can|should|do|does|quel|quelle|est|y a|wildfires?|forest fires?|fires?|smoke|current|local|today|tomorrow)\b/i;

/** Which part of the forecast a question is about: tomorrow, the weekend, the week ahead, or (null) now. */
export function askedWhen(text: string): 'tomorrow' | 'weekend' | 'week' | null {
  if (/\b(week-?end|fin de semaine|fds)\b/i.test(text)) return 'weekend';
  if (/\b(tomorrow|demain)\b/i.test(text)) return 'tomorrow';
  if (/\b(week|semaine|7[- ]day|next (?:few )?days|prochains jours|7 jours)\b/i.test(text)) return 'week';
  return null;
}

/** "Will it rain?" / "Va-t-il neiger?": the precipitation a question asks about, if any. */
export function askedPrecip(text: string): 'rain' | 'snow' | null {
  if (/\b(snow(?:ing|s)?|neiger(?:a|ait)?|neige)\b/i.test(text)) return 'snow';
  if (/\b(rain(?:ing|s|y)?|showers?|umbrella|pleuvoir|pleuvra|pleut|pluie|averses?|parapluie)\b/i.test(text)) return 'rain';
  return null;
}

/** The place in a question ("weather in Kelowna tomorrow" → "Kelowna"), or undefined. */
export function placeFrom(text: string): string | undefined {
  const t = text.replace(/[?!.]+\s*$/, '').trim();
  const pick = (s?: string) => {
    const v = s?.replace(TIME_WORDS, '').replace(/^(?:the|la|le|les|l['’])\s+/i, '').replace(/\s+(?:area|region|secteur|région)$/i, '').trim();
    if (!v || v.length < 2 || v.length > 60 || NOT_A_PLACE.test(v) || QUESTION.test(v)) return undefined;
    if (splitProvince(v).name === '') return undefined;
    return v;
  };
  const patterns = [
    /\b(?:in|for|at|near|around|over)\s+(?!me\b|my\b|the next\b)([\p{L}\d][\p{L}\d .,'’-]*)$/iu,
    /(?:^|\s)(?:à|a|au|aux|en|pour|dans|près de|pres de|sur)\s+(?!moi\b|chez\b)([\p{L}\d][\p{L}\d .,'’-]*)$/iu,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    const v = pick(m?.[1]);
    if (v) return v;
  }
  // "Ottawa weather", "Kelowna air quality", "météo Québec"
  const before = t.match(/^(?:what(?:'|’)?s|how(?:'|’)?s|is|the)?\s*([\p{Lu}][\p{L} .'’-]{1,40}?)\s+(?:weather|forecast|air quality|aqhi|smoke)\b/u);
  if (before && !QUESTION.test(before[1])) return pick(before[1]);
  const after = t.match(/\b(?:weather|forecast|météo|meteo|prévisions?)\s+([\p{Lu}][\p{L} .'’-]{1,40})$/u);
  return pick(after?.[1]);
}

const PROVINCE_WORDS: [RegExp, Province][] = [
  [/\balberta\b/i, 'ab'],
  [/\b(british columbia|colombie-britannique|b\.?c\.?)\b/i, 'bc'],
  [/\bmanitoba\b/i, 'mb'],
  [/\b(new brunswick|nouveau-brunswick)\b/i, 'nb'],
  [/\b(newfoundland|labrador|terre-neuve)\b/i, 'nl'],
  [/\b(nova scotia|nouvelle-[ée]cosse)\b/i, 'ns'],
  [/\b(northwest territories|territoires du nord-ouest|n\.?w\.?t\.?)\b/i, 'nt'],
  [/\bnunavut\b/i, 'nu'],
  [/\bontario\b/i, 'on'],
  [/\b(prince edward island|[îi]le-du-prince-[ée]douard|p\.?e\.?i\.?)\b/i, 'pe'],
  [/\b(province of quebec|province de qu[ée]bec|au qu[ée]bec|in quebec)\b/i, 'qc'],
  [/\bsaskatchewan\b/i, 'sk'],
  [/\byukon\b/i, 'yt'],
];
export const provinceIn = (text: string) => PROVINCE_WORDS.find(([re]) => re.test(text))?.[1];
/**
 * A province named the way a sentence needs it ("in Nova Scotia", "en Nouvelle-Écosse", "au Québec",
 * "à l’Île-du-Prince-Édouard"), plus two of its Environment Canada forecast places for follow-ups.
 */
export const PROVINCE_SAY: Record<Province, { en: string; fr: string; places: [string, string] }> = {
  ab: { en: 'in Alberta', fr: 'en Alberta', places: ['Calgary', 'Red Deer'] },
  bc: { en: 'in British Columbia', fr: 'en Colombie-Britannique', places: ['Vancouver', 'Kelowna'] },
  mb: { en: 'in Manitoba', fr: 'au Manitoba', places: ['Winnipeg', 'Brandon'] },
  nb: { en: 'in New Brunswick', fr: 'au Nouveau-Brunswick', places: ['Moncton', 'Fredericton'] },
  nl: { en: 'in Newfoundland and Labrador', fr: 'à Terre-Neuve-et-Labrador', places: ['St. John’s', 'Gander'] },
  ns: { en: 'in Nova Scotia', fr: 'en Nouvelle-Écosse', places: ['Halifax', 'Sydney, NS'] },
  nt: { en: 'in the Northwest Territories', fr: 'dans les Territoires du Nord-Ouest', places: ['Yellowknife', 'Inuvik'] },
  nu: { en: 'in Nunavut', fr: 'au Nunavut', places: ['Iqaluit', 'Rankin Inlet'] },
  on: { en: 'in Ontario', fr: 'en Ontario', places: ['Toronto', 'Ottawa'] },
  pe: { en: 'in Prince Edward Island', fr: 'à l’Île-du-Prince-Édouard', places: ['Charlottetown', 'Summerside'] },
  qc: { en: 'in Quebec', fr: 'au Québec', places: ['Montréal', 'Gatineau'] },
  sk: { en: 'in Saskatchewan', fr: 'en Saskatchewan', places: ['Saskatoon', 'Regina'] },
  yt: { en: 'in Yukon', fr: 'au Yukon', places: ['Whitehorse', 'Dawson, YT'] },
};
/** "… in Nova Scotia?" — a whole province, not a place. */
export const PROVINCE_TAIL =
  /\b(?:in|for|across|throughout|à|au|en|dans|pour)\s+(?:the\s+)?(?:province of\s+|la province de\s+)?(?:alberta|british columbia|colombie-britannique|manitoba|new brunswick|nouveau-brunswick|newfoundland(?: and labrador)?|terre-neuve(?:-et-labrador)?|labrador|nova scotia|nouvelle-[ée]cosse|northwest territories|territoires du nord-ouest|nunavut|ontario|prince edward island|[îi]le-du-prince-[ée]douard|saskatchewan|yukon|qu[ée]bec province)\b[\s?.!]*$/i;

/* ------------------------------------------------------------------ formatting */

export const intl = (lang: Lang) => (lang === 'fr' ? 'fr-CA' : 'en-CA');
export const deg = (t: number | null | undefined, lang: Lang) => (t == null ? '—' : `${new Intl.NumberFormat(intl(lang)).format(Math.round(t) || 0).replace('-', '−')}°`);
export const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const base = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');
export const alertTitle = (a: Alert, lang: Lang) => {
  if (!a.colour || a.type === 'statement' || a.type === 'other') return a.name;
  const colour = { en: { yellow: 'yellow', orange: 'orange', red: 'red' }, fr: { yellow: 'jaune', orange: 'orange', red: 'rouge' } }[lang][a.colour];
  const type = { en: { warning: 'warning', watch: 'watch', advisory: 'advisory' }, fr: { warning: 'avertissement', watch: 'veille', advisory: 'avis' } }[lang][a.type];
  return lang === 'fr' ? `${type} ${colour} – ${lower(a.hazard)}` : `${colour} ${type} – ${lower(a.hazard)}`;
};
export const list = (items: string[], lang: Lang) => new Intl.ListFormat(intl(lang), { type: 'conjunction' }).format(items);
/** A clock time in the place's zone, minutes only when not zero: "12 p.m.", "6:30 a.m." / "12 h", "18 h 27". */
export const clock = (iso: string, tz: string, lang: Lang) =>
  new Intl.DateTimeFormat(intl(lang), { hour: 'numeric', minute: '2-digit', timeZone: tz })
    .format(new Date(iso))
    .replace(/(^|\s)0(\d)(?=\s?h)/, '$1$2')
    .replace(/:00(?=\s)/, '')
    .replace(/(\d)\s?h\s?00(?!\d)/, '$1 h');
/** Same rule as the widgets (data.ts `isStale`): a reading past the freshness window is the latest, not "now". */
export const staleObs = (observedAt: string | undefined, fetchedAt: string) => Boolean(observedAt) && isStale(observedAt!, fetchedAt);

/** "à Kelowna", "au Pas" (Le Pas), "aux Escoumins" (Les Escoumins). */
export const aFr = (name: string) => (/^Le\s/.test(name) ? `au ${name.slice(3)}` : /^Les\s/.test(name) ? `aux ${name.slice(4)}` : `à ${name}`);
export const presDeFr = (name: string) => (/^Le\s/.test(name) ? `près du ${name.slice(3)}` : /^Les\s/.test(name) ? `près des ${name.slice(4)}` : `près de ${name}`);
