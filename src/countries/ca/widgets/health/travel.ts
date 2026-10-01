/**
 * Travel health notices (pure, isomorphic): the output types and the wording helpers the renderer and the
 * scenarios share. The parser for the notice table on travel.gc.ca / voyage.gc.ca and destination matching
 * are in ./travel-parse.ts, the live fetch in ./live-travel.ts; neither is imported by the renderer.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './facts';

/** See a travel health clinic or a health care provider about 6 weeks (42 days) before leaving. */
export const CLINIC_LEAD_DAYS = 42;

export type ThnLevel = 1 | 2 | 3 | 4;

export type ThnNotice = {
  id: string;
  level: ThnLevel;
  title: string;
  /** Places the notice names ("All Countries" / "Tous les pays" for global notices). */
  locations: string[];
  global: boolean;
  /** Last update, YYYY-MM-DD. */
  updated: string;
  url: string;
};

/** The links and sources that change with the language. */
export type TravelLinks = {
  urls: { notices: string; vaccines: string; clinic: string; advisories: string };
  sources: ToolSource[];
};

export type TravelOutput = TravelLinks & {
  lang: Lang;
  live: boolean;
  /**
   * Why there are no live notices: travel.gc.ca couldn't be reached, or it answered and its notice table
   * couldn't be read (the page changed). Absent when live.
   */
  offline?: 'unreachable' | 'unreadable';
  fetchedAt: string;
  /** What the person asked about, and the destination it matched (in the answer language). */
  query: string | null;
  destination: string | null;
  /** True when a destination was asked about but isn't in travel.gc.ca's list of destinations. */
  unknownDestination: boolean;
  /** Notices for the destination (or every notice when no destination). Highest level first. */
  notices: ThnNotice[];
  /** For a destination: how many of its notices name it (the rest apply to every destination). */
  specific?: number;
  totalNotices: number;
  highestLevel: ThnLevel | 0;
  travelDate: string | null;
  /** About 6 weeks (42 days) before the trip: when to see a travel health clinic. */
  clinicBy: string | null;
  /** The same links and sources in the other official language, and the destination's name in it. */
  alt?: TravelLinks & { destination?: string | null };
};

/** Names that stay capitalized mid-sentence (places and people the diseases are named after). */
const PROPER = /^(Ebola|Zika|Marburg|Oropouche|Nipah|Lassa|Rift|West|Lyme|Chagas|Japanese|Japonaise|Middle|Hendra)\b/;
/** Masculine disease names in French (the rest take "la", or "l’" before a vowel). */
const FR_MASC = /^(chikungunya|paludisme|chol[ée]ra|virus|zika|typhus|t[ée]tanos|sida|charbon|syndrome|coronavirus)\b/i;

/**
 * The disease a notice is about, ready to go mid-sentence: "Chikungunya: Advice for travellers" → "chikungunya",
 * "Rougeole : Conseils à l’intention des voyageurs" → "la rougeole" (FR gets its article, and `de` its
 * contraction: "du chikungunya", "de la rougeole", "de l’influenza").
 */
export function topicOf(title: string, lang: Lang): { topic: string; topicDe: string } {
  const bare = title
    .replace(/\s*:\s*(advice for travell?ers|conseils? (?:à|a) l['’]intention des voyageurs|conseils aux voyageurs)\s*$/i, '')
    .trim();
  const keepCase = PROPER.test(bare) || /^\p{Lu}{2}/u.test(bare);
  const word = keepCase ? bare : bare.charAt(0).toLocaleLowerCase(lang) + bare.slice(1);
  if (lang !== 'fr') return { topic: word, topicDe: word };
  if (/^[aeiouyéèêâîôûœh]/i.test(word)) {
    return { topic: `l’${word}`, topicDe: `de l’${word}` };
  }
  return FR_MASC.test(word) ? { topic: `le ${word}`, topicDe: `du ${word}` } : { topic: `la ${word}`, topicDe: `de la ${word}` };
}

/**
 * A notice's short name, as a label: "Chikungunya: Advice for travellers" → "Chikungunya", and "Ebola disease in
 * Democratic Republic of the Congo" → "Ebola disease" when the place is the destination already shown.
 */
export function noticeName(title: string, destination?: string | null): string {
  const bare = title.replace(/\s*:\s*(advice for travell?ers|conseils? (?:à|a) l['’]intention des voyageurs|conseils aux voyageurs)\s*$/i, '').trim();
  const m = bare.match(/^(.+?)\s+(?:in|en|au|aux|à|dans)\s+(.+)$/iu);
  const words = (destination ?? '').toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 4);
  const name = m && words.some((w) => m[2].toLowerCase().includes(w)) ? m[1] : bare;
  return name.charAt(0).toLocaleUpperCase() + name.slice(1);
}
