/**
 * What each scripted travel answer matches (EN + FR), and what a question says about the trip itself
 * (length, spending). Patterns only: the answers are in the *-copy.ts files beside this one.
 */
import { DESTINATION_PATTERN } from '../countries';
import type { AbsenceTier } from '../types';

const TRAVEL_WORDS = String.raw`(travel\w*|trip|go(ing)?|visit\w*|vacation|holiday|head(ed|ing)? to|fly(ing)?)`;
export const SAFETY = [
  new RegExp(String.raw`\b(safe|safety|dangerous|advisory|advisories|risk\w*|warnings?)\b.*\b${TRAVEL_WORDS}\b`, 'i'),
  new RegExp(String.raw`\b${TRAVEL_WORDS}\b.*\b(safe|dangerous|advisory|advisories|warnings?|risk level)\b`, 'i'),
  /\btravel advi(ce|sory|sories)\b/i,
  /\b(is|are) (it|there) safe (in|to go to|to visit)\b/i,
  /\bcan (i|we) (travel|go) to\b/i,
  /\b(puis-je|peut-on|pouvons-nous|est-ce que je peux)\b.*\b(voyager|aller)\b/i,
  /\b(sécuritaire|sûr|sans danger|dangereux|avertissements?|conseils? aux voyageurs|risques?)\b.*\b(voyag\w*|aller|visiter|vacances|séjour)\b/i,
  /\b(voyag\w*|aller|visiter|vacances|séjour)\b.*\b(sécuritaire|sûr|sans danger|dangereux|risques?|avertissements?)\b/i,
  /\bconseils aux voyageurs\b/i,
];

const PLACE = DESTINATION_PATTERN;
export const ENTRY = [
  new RegExp(String.raw`\b(visas?|e-?ta|entry requirements?|passport\b.*\bvalid\w*)\b.*\b(for|to|in|into|visit\w*)\s+(the\s+)?${PLACE}\b`, 'i'),
  new RegExp(String.raw`\b${PLACE}\b.*\b(visas?|entry requirements?)\b`, 'i'),
  new RegExp(String.raw`\b(visas?|exigences d.entr[ée]e|passeport\b.*\bvalide)\b.*\b(pour|au|aux|en|à|a)\s+(l[ae]\s+|l['’]|les\s+)?${PLACE}\b`, 'i'),
];

/*
 * Lost or stolen passport abroad. Order-free (lookaheads): "My passport was stolen in Mexico" and
 * "I lost my passport in Japan, who do I call?" both match. A place must be named (any destination name or
 * alias, e.g. "in Paris", « au Japon ») or the text must say abroad / on my trip, so "I lost my passport"
 * at home still goes to the passport answers. Unicode-aware boundaries: \b fails next to « é ».
 */
const B = String.raw`(?<![\p{L}\p{N}])`;
const E = String.raw`(?![\p{L}\p{N}])`;
const word = (src: string) => `${B}(?:${src})${E}`;
const LOSS_EN = String.raw`lost|lose|losing|stolen|stole|missing|misplaced|can.?t find|cannot find|pickpocket\w*|robbed`;
const ABROAD_EN = String.raw`abroad|overseas|outside (?:of )?canada|on (?:my|our|a|the) (?:trip|vacation|holiday|cruise|honeymoon)|while (?:i was |we were |i.m |we.re )?(?:travel\w*|away|on vacation)`;
// Not a bare « vol »: that's also a flight (« mon vol au Mexique »).
const LOSS_FR = String.raw`perdu[es]*|vol[ée][es]*|égar[ée][es]*|disparu[es]*|perte|je ne (?:le )?trouve plus`;
const ABROAD_FR = String.raw`à l.étranger|hors du canada|en voyage|pendant (?:mon|notre|le) (?:voyage|séjour)|en vacances|en croisière`;
export const LOST_ABROAD = [
  new RegExp(String.raw`^(?=.*${word('passports?')})(?=.*${word(LOSS_EN)})(?=.*(?:${word(ABROAD_EN)}|${word(String.raw`(?:in|at) (?:the )?${PLACE}`)}))`, 'iu'),
  new RegExp(
    String.raw`^(?=.*${word('passeports?')})(?=.*${word(LOSS_FR)})(?=.*(?:${word(ABROAD_FR)}|${word(String.raw`(?:au|aux|en|à|a|dans (?:l[ae]s?|l['’]))\s*(?:l[ae] |l['’]|les )?${PLACE}`)}))`,
    'iu',
  ),
];
/** "in Mexico", « au Japon » for the other emergencies (arrested, in hospital). */
const IN_PLACE = word(String.raw`(?:in|au|aux|en|à) (?:the |l[ae] |l['’]|les )?${PLACE}`);

export const EMERGENCY = [
    /\b(canadian )?(embassy|consulate|high commission)\b/i,
    /\b(emergency|help|trouble|stuck|stranded)\b.*\b(abroad|overseas|outside canada|while travel\w*|on (my )?(trip|vacation|holiday))\b/i,
    ...LOST_ABROAD,
    new RegExp(String.raw`^(?=.*${word('arrested|detained|in jail|in prison|hospital\\w*|in the hospital')})(?=.*(?:${word(ABROAD_EN)}|${IN_PLACE}))`, 'iu'),
    new RegExp(String.raw`^(?=.*${word('arrêté[es]*|détenu[es]*|en prison|hospitalisé[es]*|à l.hôpital')})(?=.*(?:${word(ABROAD_FR)}|${IN_PLACE}))`, 'iu'),
    /\bwho (do|should) (i|we) call\b.*\b(abroad|wrong|travel\w*)\b/i,
    /\bemergency watch\b/i,
    /\b(ambassade|consulat|haut-commissariat)\b/i,
    /\b(urgence|aide|probl[eè]me|bloqu[ée]e?s?)\b.*(?:^|\s)(à l.étranger|hors du canada|en voyage)(?=[\s?.!,]|$)/i,
    /\bqui (?:dois-je |devrais-je |puis-je |peut-on )?appeler\b/i,
];

/** "Who do I call if something goes wrong in Mexico?": a place is named, so it's an emergency abroad. */
export const EMERGENCY_IN_PLACE = [
    new RegExp(String.raw`^(?=.*${word('who (?:do|should|can) (?:i|we) (?:call|contact)|something goes wrong|goes wrong|go wrong|went wrong|get help')})(?=.*${IN_PLACE})`, 'iu'),
    // « Qui peut m’aider si j’ai un problème au Mexique? »
    new RegExp(String.raw`^(?=.*${word('qui peut m.aider|qui (?:dois-je|puis-je) appeler|un problème|en cas de problème')})(?=.*${IN_PLACE})`, 'iu'),
];

export const DUTY = [
      /\bduty[- ]?free\b/i,
      /\bpersonal exemptions?\b/i,
      /\bhow much (can|could) (i|we) (bring|take) (back|home|into canada)\b/i,
      /\b(bring|bringing|brought) back\b.*\b(alcohol|liquor|wine|beer|cigarettes?|tobacco|goods|purchases|shopping)\b/i,
      /\b(declare|declaring)\b.*\b(border|customs|purchases|goods)\b/i,
      /\b(cross[- ]border shopping|shopping (in|across) the (u\.?s\.?|states|border))\b/i,
      /\ben franchise\b/i,
      /\bexemptions? personnelles?\b/i,
      /\bcombien (puis-je|peut-on|pouvons-nous) rapporter\b/i,
      /\brapporter\b.*\b(alcool|vin|bi[eè]re|cigarettes?|tabac|achats|biens)\b/i,
      /\bd[ée]clarer\b.*\b(fronti[eè]re|douane|achats|biens)\b/i,
];

export const WAITS = [
      /\bborder\b.*\b(wait|waits|wait times?|line ?ups?|lines?|queues?|delays?|busy)\b/i,
      /\b(wait|waits|wait times?|line ?ups?|lines?|delays?)\b.*\b(border|crossing|bridge)\b/i,
      /\b(peace|ambassador|rainbow|blue water|thousand islands|queenston-lewiston|gordie howe) bridge\b.*\b(wait|line|busy|delay|now)\b/i,
      /\btemps d.attente\b.*\b(fronti[eè]re|pont|poste)\b/i,
      /\b(attente|file|bouchon|d[ée]lai)s?\b.*\b(fronti[eè]re|poste frontalier|douane)\b/i,
      /\bfronti[eè]re\b.*\b(attente|file|d[ée]lais?)\b/i,
      /\b(attente|file|d[ée]lais?)\b.*\bpont (peace|ambassador|rainbow|blue water|des mille-[iî]les|queenston-lewiston|(international )?gordie[- ]howe)\b/i,
];

export const REGISTER = [
      /\bregist(er|ration)\b.*\b(trip|travel|abroad)\b/i,
      /\bregistration of canadians abroad\b/i,
      /\broca\b/i,
      /\binscri(re|ption|vez)\b.*\b(voyage|étranger)\b/i,
      /\binscription des canadiens\b/i,
];

/** Trip length and spending from a question ("back from 3 days in Buffalo with $500 of stuff"). */
export function tripFromText(text: string): { hoursAway?: number; daysAway?: number; spent?: number; alcohol?: boolean; tobacco?: boolean; weekend?: boolean } {
  const t = text.toLowerCase();
  const out: ReturnType<typeof tripFromText> = {};
  const days = t.match(/(\d+)\s*(?:-|\s)?(?:days?|jours?|nights?|nuits?)\b/);
  const hours = t.match(/(\d+)\s*(?:h|hrs?|hours?|heures?)\b/);
  if (hours) out.hoursAway = Number(hours[1]);
  else if (days) out.daysAway = Number(days[1]);
  else if (/\b(two|2) weeks?\b|\bdeux semaines\b/.test(t)) out.daysAway = 14;
  else if (/\ba week\b|\bone week\b|\bune semaine\b/.test(t)) out.daysAway = 7;
  else if (/\bweek-?end\b|\bfin de semaine\b/.test(t)) {
    out.hoursAway = 48;
    out.weekend = true;
  }
  else if (/\bovernight\b|\bune nuit\b/.test(t)) out.hoursAway = 30;
  else if (/\b(same[- ]day|day trip|for the day|aller-retour|dans la (m[eê]me )?journ[ée]e)\b/.test(t)) out.hoursAway = 6;
  const cash = text.match(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d\s ,]*(?:[.,]\d{1,2})?)\s?(?:\$|dollars?\b)/i);
  if (cash) {
    const raw = (cash[1] ?? cash[2] ?? '').trim();
    const n = cash[1] ? Number(raw.replace(/,/g, '')) : Number(raw.replace(/[\s ]/g, '').replace(/,(\d{1,2})$/, '.$1').replace(/,/g, ''));
    if (Number.isFinite(n) && n > 0) out.spent = n;
  }
  if (/\b(alcohol|liquor|wine|beer|booze|spirits|whisky|alcool|vin|bi[eè]re|spiritueux)\b/.test(t)) out.alcohol = true;
  if (/\b(cigarettes?|cigars?|tobacco|vap(e|ing)|tabac|cigares?|vapotage)\b/.test(t)) out.tobacco = true;
  return out;
}

export const tierOf = (x: ReturnType<typeof tripFromText>): AbsenceTier | undefined =>
  x.hoursAway != null
    ? x.hoursAway < 24
      ? 'under24'
      : x.hoursAway < 48
        ? 'h24'
        : x.hoursAway >= 168
          ? 'd7'
          : 'h48'
    : x.daysAway != null
      ? x.daysAway >= 7
        ? 'd7'
        : x.daysAway >= 2
          ? 'h48'
          : x.daysAway >= 1
            ? 'h24'
            : 'under24'
      : undefined;
