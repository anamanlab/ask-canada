/**
 * Reads what a question already says (province, amounts, filing date, plan asked about), in English or French,
 * for the scripted answers in scenarios/taxes.ts. Pure: the answer text and the tool input are built from the
 * same reading, so the heading and the widget always agree.
 *   estimatorInput('I made $65,000 in Ontario and $10,400 was deducted')  → { province: 'ON', employmentIncome: 65000, taxDeducted: 10400 }
 *   refundInput('I filed online 3 weeks ago')                              → { method: 'online', filedOn: '…' }
 */
import { todayInCanada } from '../../../data/holidays';
import { filingTimeliness } from '../calc/refund';
import type { ProvinceCode } from '../data';
import { amountsIn, incomeAndTaxIn } from '../parse';

export type Lang = 'en' | 'fr';

const PROVINCE_WORDS: [RegExp, ProvinceCode][] = [
  [/\b(ontario|ont\.?)\b/i, 'ON'],
  [/\b(qu[ée]bec)\b/i, 'QC'],
  [/\b(british columbia|colombie-britannique|b\.?c\.?|vancouver|victoria)\b/i, 'BC'],
  [/\b(alberta|calgary|edmonton)\b/i, 'AB'],
  [/\b(manitoba|winnipeg)\b/i, 'MB'],
  [/\b(saskatchewan|regina|saskatoon)\b/i, 'SK'],
  [/\b(nova scotia|nouvelle-[ée]cosse|halifax)\b/i, 'NS'],
  [/\b(new brunswick|nouveau-brunswick|moncton|fredericton)\b/i, 'NB'],
  [/\b(newfoundland|terre-neuve|st\.? john['’]s)\b/i, 'NL'],
  [/\b(prince edward island|[îi]le-du-prince-[ée]douard|p\.?e\.?i\.?|charlottetown)\b/i, 'PE'],
  [/\b(yukon|whitehorse)\b/i, 'YT'],
  [/\b(northwest territories|territoires du nord-ouest|yellowknife)\b/i, 'NT'],
  [/\b(nunavut|iqaluit)\b/i, 'NU'],
  [/\b(toronto|ottawa|hamilton|london|mississauga)\b/i, 'ON'],
  [/\b(montr[ée]al|laval|gatineau|sherbrooke)\b/i, 'QC'],
];
const provinceIn = (text: string) => PROVINCE_WORDS.find(([re]) => re.test(text))?.[1];

export function estimatorInput(text: string) {
  return { province: provinceIn(text), ...incomeAndTaxIn(text) };
}

export const PROVINCE_IN: Record<ProvinceCode, { en: string; fr: string }> = {
  AB: { en: 'in Alberta', fr: 'en Alberta' },
  BC: { en: 'in British Columbia', fr: 'en Colombie-Britannique' },
  MB: { en: 'in Manitoba', fr: 'au Manitoba' },
  NB: { en: 'in New Brunswick', fr: 'au Nouveau-Brunswick' },
  NL: { en: 'in Newfoundland and Labrador', fr: 'à Terre-Neuve-et-Labrador' },
  NS: { en: 'in Nova Scotia', fr: 'en Nouvelle-Écosse' },
  NT: { en: 'in the Northwest Territories', fr: 'dans les Territoires du Nord-Ouest' },
  NU: { en: 'in Nunavut', fr: 'au Nunavut' },
  ON: { en: 'in Ontario', fr: 'en Ontario' },
  PE: { en: 'in Prince Edward Island', fr: 'à l’Île-du-Prince-Édouard' },
  QC: { en: 'in Quebec', fr: 'au Québec' },
  SK: { en: 'in Saskatchewan', fr: 'en Saskatchewan' },
  YT: { en: 'in Yukon', fr: 'au Yukon' },
};

const refundMethod = (text: string): 'paper' | 'online' | undefined =>
  /\b(paper|mail(ed)?|by post|papier|par la poste)\b/i.test(text) ? 'paper' : /\b(online|netfile|efile|e-file|en ligne|impôtnet|impotnet|simplefile)\b/i.test(text) ? 'online' : undefined;

const MONTHS = ['jan|janv|january|janvier', 'feb|févr|fevr|february|février|fevrier', 'mar|march|mars', 'apr|avr|april|avril', 'may|mai', 'jun|june|juin', 'jul|july|juil|juillet', 'aug|august|août|aout', 'sep|sept|september|septembre', 'oct|october|octobre', 'nov|november|novembre', 'dec|déc|december|décembre|decembre'];
/** "filed on March 15" / "le 15 mars" / "3 weeks ago" / "il y a 3 semaines" → the most recent matching past date. */
function filedOnIn(text: string, today: string): string | undefined {
  const ago = text.match(/\b(\d{1,2})\s*(weeks?|semaines?|days?|jours?)\s*ago\b|\bil y a\s*(\d{1,2})\s*(semaines?|jours?)\b/i);
  if (ago) {
    const n = Number(ago[1] ?? ago[3]);
    const unit = (ago[2] ?? ago[4]).toLowerCase();
    const days = /^(week|semaine)/.test(unit) ? n * 7 : n;
    const t = new Date(`${today}T12:00:00`);
    t.setDate(t.getDate() - days);
    return t.toISOString().slice(0, 10);
  }
  for (let m = 0; m < 12; m++) {
    const re = new RegExp(`\\b(?:(${MONTHS[m]})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?|(\\d{1,2})(?:er)?\\s+(${MONTHS[m]})\\.?)\\b`, 'i');
    const hit = text.match(re);
    if (!hit) continue;
    const day = Number(hit[2] ?? hit[3]);
    if (day < 1 || day > 31) continue;
    let y = Number(today.slice(0, 4));
    const iso = (yy: number) => `${yy}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (iso(y) > today) y -= 1;
    return iso(y);
  }
  return undefined;
}

export function roomInput(text: string) {
  const focus = /\b(fhsa|celiapp|first home savings)\b/i.test(text) ? 'fhsa' : /\b(rrsp|reer|registered retirement)\b/i.test(text) ? 'rrsp' : 'tfsa';
  const born = text.match(/\b(?:born in|born|née? en|naissance en)\s*(19\d{2}|20[0-2]\d)\b/i)?.[1];
  const age = text.match(/\b(?:i['’]?m|i am|j['’]ai)\s*(\d{2})\b(?:\s*(?:years|ans|yo))?/i)?.[1];
  const resident = text.match(/\b(?:moved to canada|came to canada|arrived in canada|immigrated|arrivée? au canada|arrivé(?:e)? en)\s*(?:in|en)?\s*(20[0-2]\d)\b/i)?.[1];
  return {
    focus: focus as 'tfsa' | 'rrsp' | 'fhsa',
    birthYear: born ? Number(born) : undefined,
    age: !born && age ? Number(age) : undefined,
    residentSince: resident ? Number(resident) : undefined,
  };
}

export const selfEmployed = (text: string) => /\b(self-employed|self employed|freelanc\w*|own business|sole proprietor|travailleu(r|se) autonome|à mon compte|entreprise individuelle)\b/i.test(text);

/** Long date; French uses Canada.ca style for the first of the month ("1er mars 2027"). */
export const d = (iso: string, lang: Lang, o: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) => {
  const out = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', o).format(new Date(`${iso}T12:00:00`));
  return lang === 'fr' ? out.replace(/^1 /, '1er ') : out;
};

/** Whole dollars in the answer's language: "$65,000" / "65 000 $". */
export const dollars = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n);

/*
 * Refund status: what the question says, and the answer's verdict for it (same computation as the widget).
 * The answer text and the tool input read ONE clock (the capital region's date): `vars` isn't given the reader's
 * time zone, so "3 weeks ago" resolved once here is the filing date both the heading and the widget show.
 */
export function refundInput(text: string) {
  const filedOn = filedOnIn(text, todayInCanada());
  // "I'm self-employed" + a date between April 30 and June 15: that return was on time.
  const onTime = filedOn && selfEmployed(text) && filingTimeliness(filedOn).selfEmployedWindow ? true : undefined;
  return {
    method: refundMethod(text),
    filedOn,
    abroad: /\b(outside canada|abroad|à l[’']étranger|hors du canada|extérieur du canada)\b/i.test(text) || undefined,
    onTime,
  };
}

/** "family of 4 with $58,000 in Nova Scotia" → the free-filing checker's input. */
export function freeFilingInput(text: string) {
  const size = text.match(/\b(?:family of|famille de)\s*(\d{1,2})\b/i)?.[1];
  return { province: provinceIn(text), familySize: size ? Number(size) : undefined, familyIncome: amountsIn(text)[0] };
}
