/**
 * Scripted scenarios for life events: what the answers read out of the question (a date, a province), the tool
 * input built from it, citations, and the patterns several scenarios share. The scenarios themselves are in
 * scenarios/life-events.ts; their texts are in scenario-replies.ts.
 */
import { addMonths } from '@/lib/dates/business-days';
import { todayInCanada } from '../../data/holidays';
import { PAGES, type EventId, type PageKey } from './data';

export type Lang = 'en' | 'fr';
export type Ctx = { text: string; lang: Lang; timeZone?: string };

const u = (key: PageKey, lang: Lang) => PAGES[key].url[lang];
/** Citation `[n](url "Page title")` in both languages, so the source card shows the page's real title. */
const cite = (n: number, key: PageKey, lang: Lang) => `[${n}](${u(key, lang)} "${PAGES[key].title[lang].replace(/"/g, '”')}")`;
export const c = (n: number, key: PageKey) => ({ en: cite(n, key, 'en'), fr: cite(n, key, 'fr') });

/* ------------------------------------------------------------------ dates in the question */

const MONTHS: [RegExp, number][] = [
  [/^(january|jan|janvier|janv)$/i, 1],
  [/^(february|feb|février|fevrier|févr)$/i, 2],
  [/^(march|mar|mars)$/i, 3],
  [/^(april|apr|avril)$/i, 4],
  [/^(may|mai)$/i, 5],
  [/^(june|jun|juin)$/i, 6],
  [/^(july|jul|juillet)$/i, 7],
  [/^(august|aug|août|aout)$/i, 8],
  [/^(september|sept|sep|septembre)$/i, 9],
  [/^(october|oct|octobre)$/i, 10],
  [/^(november|nov|novembre)$/i, 11],
  [/^(december|dec|décembre|decembre|déc)$/i, 12],
];
const MONTH_WORD =
  'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec|janvier|janv|février|fevrier|févr|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|déc';
const monthOf = (w: string) => MONTHS.find(([re]) => re.test(w))?.[1];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A calendar date mentioned in the question ("on March 3", "le 3 mars 2026", "2026-03-03", "yesterday").
 * Without a year, picks the nearest past (`past`) or upcoming (`future`) occurrence.
 */
export function dateIn(text: string, when: 'past' | 'future', today: string): string | undefined {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  if (/\b(today|aujourd[’']hui)\b/i.test(text)) return today;
  if (/\b(yesterday|hier)\b/i.test(text)) {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const en = text.match(new RegExp(`\\b(${MONTH_WORD})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, 'i'));
  const fr = text.match(new RegExp(`\\b(\\d{1,2})(?:er)?\\s+(${MONTH_WORD})\\.?(?:\\s+(20\\d{2}))?\\b`, 'i'));
  let m: number | undefined;
  let d: number | undefined;
  let y: number | undefined;
  if (en) [m, d, y] = [monthOf(en[1]), Number(en[2]), en[3] ? Number(en[3]) : undefined];
  else if (fr) [m, d, y] = [monthOf(fr[2]), Number(fr[1]), fr[3] ? Number(fr[3]) : undefined];
  if (!m || !d || d > 31) return undefined;
  const [ty] = today.split('-').map(Number);
  if (y) return `${y}-${pad(m)}-${pad(d)}`;
  const same = `${ty}-${pad(m)}-${pad(d)}`;
  if (when === 'past') return same <= today ? same : `${ty - 1}-${pad(m)}-${pad(d)}`;
  return same >= today ? same : `${ty + 1}-${pad(m)}-${pad(d)}`;
}

/** "next month", "le mois prochain": a date one month out (for moving). */
const relativeFuture = (text: string, today: string) => (/\bnext month\b|\ble mois prochain\b/i.test(text) ? addMonths(today, 1) : undefined);

const REGIONS: [RegExp, string][] = [
  [/\b(quebec|québec)\b/i, 'QC'],
  [/\bontario\b/i, 'ON'],
  [/\b(british columbia|b\.c\.|colombie-britannique)\b/i, 'BC'],
  [/\balberta\b/i, 'AB'],
  [/\bmanitoba\b/i, 'MB'],
  [/\bsaskatchewan\b/i, 'SK'],
  [/\b(nova scotia|nouvelle-écosse)\b/i, 'NS'],
  [/\b(new brunswick|nouveau-brunswick)\b/i, 'NB'],
  [/\b(prince edward island|p\.e\.i\.|île-du-prince-édouard)\b/i, 'PE'],
  [/\b(newfoundland|terre-neuve)\b/i, 'NL'],
  [/\byukon\b/i, 'YT'],
  [/\bnunavut\b/i, 'NU'],
  [/\b(northwest territories|territoires du nord-ouest)\b/i, 'NT'],
];
const regionIn = (text: string) => REGIONS.find(([re]) => re.test(text))?.[1];

export const call =
  (event: EventId | undefined, when: 'past' | 'future' | 'none' = 'past') =>
  ({ text, lang, timeZone }: Ctx) => {
    const today = todayInCanada(new Date(), timeZone);
    const date = event && when !== 'none' ? (dateIn(text, when, today) ?? (event === 'moving' ? relativeFuture(text, today) : undefined)) : undefined;
    const region = regionIn(text);
    return { ...(event ? { event } : {}), ...(date ? { date } : {}), ...(region ? { region } : {}), lang, timeZone };
  };

/** The closing line of an answer: invites a date, or confirms the one the person gave. */
export const dateLine =
  (event: EventId, when: 'past' | 'future', ask: Record<Lang, string>, got: Record<Lang, string>) =>
  ({ text, lang }: { text: string; lang: Lang }) => ({
    dateLine:
      (dateIn(text, when, todayInCanada()) ?? (event === 'moving' ? relativeFuture(text, todayInCanada()) : undefined)) ? got[lang] : ask[lang],
  });

/** A date the person mentioned: "March 3", "3 mars", "2026-03-03", "today", "yesterday". */
export const DATE = String.raw`(\b(${MONTH_WORD})\.?\s+\d{1,2}\b|\b\d{1,2}(er)?\s+(${MONTH_WORD})\b|\b20\d{2}-\d{2}-\d{2}\b|\b(today|yesterday|hier)\b|\baujourd[’']hui)`;
/** Both must appear, in any order. */
export const both = (a: string, b: string) => new RegExp(`^(?=[\\s\\S]*(${a}))(?=[\\s\\S]*(${b}))`, 'i');

export const JOB_LOSS = String.raw`\b((lost|lose|losing) (my |our )?job|laid off|got fired|been fired|was fired|let go|job loss|(perdu|perte de|perdre) (mon |d[’'] ?)?emploi|(mis|mise) à pied|congédiée?)`;
/** A job-loss message that asks for the checklist itself, or gives the last day (the generic EI answer covers the rest). */
export const JOB_LOSS_PLAN = String.raw`${DATE}|\blast day\b|\bdernier jour\b|\bchecklist\b|\bliste\b|\bsteps\b|(^|\s)étapes\b|\bwho (do|should) (i|we) (tell|notify)\b|\bqui (dois|devons)[- ](je|nous) aviser\b`;
export const FINAL_RETURN = String.raw`\bfinal (tax |income tax )?return\b|\bdéclaration (de revenus )?finale\b`;

export const HOW_MUCH = /\b(how much|estimate|calculat\w*|amount)\b|\b(combien|estim\w*|calcul\w*|montant)\b/i;
/** EI maternity or parental benefits ("maternité" ends in a non-ASCII letter, so no trailing \b there). */
export const PARENTAL = String.raw`\b(parental(e|es|s)?\b|maternity\b|maternit[ée])`;
export const HOW_MUCH_LONG = String.raw`${HOW_MUCH.source}|\bhow (long|many weeks)\b|\bcombien de (temps|semaines)\b|\bdurée\b`;
export const ALL = { en: 'Show me all life event checklists', fr: 'Voir toutes les listes pour les événements de la vie' };
export const ALLOWANCE_Q = { en: 'Can a surviving partner aged 60 to 64 get the Allowance for the Survivor?', fr: 'Un conjoint survivant de 60 à 64 ans peut-il recevoir l’Allocation au survivant?' };
export const GIS_Q = { en: 'Who can get the Guaranteed Income Supplement?', fr: 'Qui peut recevoir le Supplément de revenu garanti?' };

/* ------------------------------------------------------------------ death (shared by the dated and undated answers) */

export const DEATH = [
  /\b(died|passed away|has passed|passing of|death of|deceased|lost my (mother|father|mom|dad|husband|wife|partner|spouse))\b/i,
  /\bsomeone (dies|died)\b/i,
  /\bquelqu['’]un (meurt|décède|est mort)/i,
  /\bcpp death benefit\b/i,
  /\bprestation de décès du RPC\b/i,
  /(décédée?s?|décès|\best mort|\best morte|\bnous a quittés)(?![a-z])/i,
];
export const DEATH_EXCLUDE = [/\b(kill|suicid\w*|want to die|wanna die|end my life|end it all|me tuer|mourir|en finir)\b/i];

/** What people say for the three everyday events (EN + FR); the scenarios keep their own exclusions. */
export const MOVING = [
  /\b(i['’]?m|i am|we['’]?re|we are|just|recently|i|we)\s+(moving|moved|relocating|relocated)\b/i,
  /\bchang\w* (of |my |our )*address\b/i,
  /\b(my|our) new address\b/i,
  /\bmoving\b.*\b(checklist|who|tell|notify|update)\b/i,
  /\b(who|which departments?)\b.*\b(tell|notify|inform)\b.*\b(mov\w*|address)\b/i,
  /\bdéménag\w*/i,
  /\bemménag\w*/i,
  /\bchangement d[’']adresse\b/i,
  /\bchanger (mon |notre |d[’'])adresse\b/i,
  /\bnouvelle adresse\b/i,
];
export const BABY = [
  /\b(having|had|expecting|just had|welcom\w*)\s+(a |our |my |twins|a new )?(baby|child|son|daughter)\b/i,
  /\bnew ?born\b/i,
  /\bbaby\b.*\b(due|born|arriv\w*|coming|checklist)\b/i,
  /\b(i['’]?m|she['’]?s|my (wife|partner) is|we['’]?re) pregnant\b/i,
  /\b(bébé|nouveau-né)/i,
  /\b(je suis|elle est|nous sommes) enceinte\b/i,
  /\b(attend(s|ons)|avons eu|a eu|vien(s|t|nent|ons) d[’']avoir) (un|une|des) (bébé|enfant|jumeaux)/i,
  /\bnaissance de (mon|ma|notre) (bébé|enfant|fils|fille)/i,
];
export const MARRIAGE = [
  /\b(got|getting|just got|are getting|we got|recently) married\b/i,
  /\b(my|our) (wedding|marriage)\b/i,
  /\bchang\w* (my |our |her |his )?(last |family |legal |maiden |married )?name\b/i,
  /\bname change\b/i,
  /\bcommon[- ]law\b/i,
  /\bmarital status\b/i,
  /\b(nous|je) (nous )?(sommes|suis) mari[ée]e?s?(?![a-z])/i,
  /\b(mariage|se marier|nous marier|me marier)\b/i,
  /\bchang\w* (de |mon |notre )?nom\b/i,
  /\bconjoints? de fait\b/i,
  /(^|\s)état civil\b/i,
];
