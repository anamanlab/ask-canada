/**
 * Reads the facts a business tool needs out of a plain question (EN + FR): provinces, money amounts,
 * currencies, origins, duty rates and intent. Pure and isomorphic; used by the scripted scenarios and unit-tested in
 * amount.test.mjs.
 */
import type { Need, Priority } from './calc';
import type { Currency, Province } from './data';

const PROVINCE_WORDS: [RegExp, Province][] = [
  [/\b(alberta|calgary|edmonton|red deer)\b/i, 'AB'],
  [/\b(british columbia|colombie-britannique|b\.?c\.?|vancouver|victoria|kelowna|surrey|burnaby)\b/i, 'BC'],
  [/\b(manitoba|winnipeg|brandon)\b/i, 'MB'],
  [/\b(new brunswick|nouveau-brunswick|moncton|fredericton|saint john)\b/i, 'NB'],
  [/\b(newfoundland|terre-neuve|labrador|st\.? john’?'?s)\b/i, 'NL'],
  [/\b(nova scotia|nouvelle-écosse|halifax|dartmouth)\b/i, 'NS'],
  [/\b(northwest territories|territoires du nord-ouest|yellowknife)\b/i, 'NT'],
  [/\b(nunavut|iqaluit)\b/i, 'NU'],
  [/\b(ontario|toronto|ottawa|hamilton|mississauga|brampton|sudbury|thunder bay|kitchener|waterloo)\b/i, 'ON'],
  // No \b before "î": JavaScript's \b only knows ASCII letters, so « à l’Île-du-Prince-Édouard » would never match.
  [/\b(prince edward island|prince-édouard|p\.?e\.?i\.?|charlottetown)\b/i, 'PE'],
  [/\b(qu[ée]bec|montr[ée]al|laval|gatineau|sherbrooke|trois-rivi[èe]res)\b/i, 'QC'],
  [/\b(saskatchewan|regina|saskatoon)\b/i, 'SK'],
  [/\b(yukon|whitehorse)\b/i, 'YT'],
];
export const provincesIn = (text: string): Province[] => PROVINCE_WORDS.filter(([re]) => re.test(text)).map(([, p]) => p);
export const provinceIn = (text: string) => provincesIn(text)[0];

/** Words right after a number that make it money, not a year: "2000 US dollars", "2000 in sales", "2000 worth". */
const MONEY_AFTER =
  /^\s?(?:(?:us|u\.s\.|american|canadian|cdn|can)\s)?(?:dollars?|bucks|euros?|yuan|rmb|renminbi|pesos?|yen|rupees?|roupies?|won|pounds?|livres?|usd|cad|eur|gbp|cny|mxn|jpy|inr|krw|\$|€|£)\b|^\s?(?:in|of|en|de)\s(?:sales|revenue|income|goods|products|merchandise|inventory|stock|ventes|revenus?|recettes|marchandises|produits)\b|^\s?(?:worth|in value|de valeur)\b|^\s?(?:dollars?|\$)/i;
/** Words right before a number that make it money: "worth 2000", "sold 2000", "valued at 2000", "US$2000". */
const MONEY_BEFORE =
  /(?:\$|€|£|\b(?:usd|cad|eur|gbp|cny|worth|valued at|value of|sales of|revenue of|sold|sell|selling|earn\w*|made|make|making|invoice\w*|import\w*|export\w*|ship\w*|bring\w*|vendu|vends?|gagn\w*|valeur de|ventes de|valant))\s*$/i;

/**
 * First money amount in the text: "$45,000", "45 000 $", "45k", "45000", "2000 US dollars".
 * A bare 1900–2100 is read as a year ("in 2025", "since 2019") unless money words sit right next to it.
 */
export function amountIn(text: string): number | undefined {
  const re = /\$?\s?(\d{1,3}(?:[,\s\u00a0\u202f]\d{3})+|\d{3,9}(?:\.\d{1,2})?|\d{1,4}(?:[.,]\d)?\s?k)\b\s?\$?/gi;
  for (const m of text.matchAll(re)) {
    const raw = m[1].toLowerCase().replace(/[\s\u00a0\u202f]/g, '');
    const n = raw.endsWith('k') ? Number(raw.slice(0, -1).replace(',', '.')) * 1000 : Number(raw.replace(/,/g, ''));
    if (!Number.isFinite(n) || n < 100) continue;
    const at = m.index ?? 0;
    const before = text.slice(Math.max(0, at - 16), at + (m[0].startsWith('$') ? 1 : 0));
    const after = text.slice(at + m[0].length, at + m[0].length + 24);
    const money = /[$k,]/i.test(m[0]) || MONEY_AFTER.test(after) || MONEY_BEFORE.test(before);
    const looksLikeYear = n >= 1900 && n <= 2100 && !money;
    if (!looksLikeYear) return Math.round(n);
  }
  return undefined;
}

/** The text names the United States (a country word; currency words are removed first by `originIn`). */
export const usIn = (text: string) => /\b(usa|united states|america|american|américain\w*|(?:from|in) the us)\b|états-unis|\bu\.s\.?(?!\w)/i.test(text) || /\bUS\b/.test(text);

const CURRENCY_WORDS: [RegExp, Currency][] = [
  [/\b(yuans?|rmb|cny|renminbis?)\b/i, 'CNY'],
  [/\b(pesos?|mxn)\b/i, 'MXN'],
  [/\b(yens?|jpy)\b/i, 'JPY'],
  [/\b(rupees?|roupies?|inr)\b/i, 'INR'],
  [/\b(wons?|krw)\b/i, 'KRW'],
  [/\b(pounds? sterling|british pounds?|livres? sterling|gbp)\b|£/i, 'GBP'],
  [/\b(euros?|eur)\b|€/i, 'EUR'],
  [/\b(us dollars?|american dollars?|dollars? américains?|usd)\b|\bus\s?\$|\$\s?us\b/i, 'USD'],
];
/** The text with its currency words removed, so "US dollars" or « dollars américains » never read as a place. */
const withoutCurrencies = (text: string) => CURRENCY_WORDS.reduce((s, [re]) => s.replace(new RegExp(re.source, 'gi'), ' '), text);

export type Origin = 'us' | 'china' | 'mexico' | 'europe' | 'uk' | 'japan' | 'india' | 'korea' | 'elsewhere';
/** Places other than the U.S. that goods come from. No \b after an accented ending (\b only knows ASCII letters). */
const ORIGIN_WORDS: [RegExp, Exclude<Origin, 'us'>][] = [
  [/\b(china|chinese|chine|chinois\w*|hong kong|shenzhen|alibaba)\b/i, 'china'],
  [/\b(mexico|mexican|mexique|mexicain\w*)\b/i, 'mexico'],
  [/\b(europe\w*|european union|union européenne|germany|german|allemagne|allemand\w*|france|french|français\w*|italy|italian|italie|italien\w*|spain|spanish|espagne|espagnol\w*|netherlands|pays-bas|portugal|poland|pologne)\b|\b(the eu|e\.u\.|l[’']ue)(?![\w.])/i, 'europe'],
  [/\b(u\.?k\.?|united kingdom|britain|british|england|royaume-uni|angleterre|britannique\w*)(?![\w.])/i, 'uk'],
  [/\b(japan|japanese|japon|japonais\w*)\b/i, 'japan'],
  [/\b(india|indian|inde|indien\w*)\b/i, 'india'],
  [/\b(korea|korean|corée|coréen\w*)(?!\w)/i, 'korea'],
  [/\b(vietnam|viêt nam|taiwan|taïwan|thailand|thaïlande|bangladesh|indonesia|indonésie|turkey|türkiye|turquie|brazil|brésil|pakistan|malaysia|malaisie|australia|australie|overseas|outre-mer)(?!\w)/i, 'elsewhere'],
];
/**
 * Where the goods come from, read from place words only: never from the invoice currency (suppliers in China
 * and elsewhere commonly invoice in U.S. dollars). A named place other than the U.S. wins over a mention of
 * the U.S.; undefined when no place is named.
 */
export function originIn(text: string): Origin | undefined {
  const places = withoutCurrencies(text);
  return ORIGIN_WORDS.find(([re]) => re.test(places))?.[1] ?? (usIn(places) ? 'us' : undefined);
}

/**
 * Invoice currency, only when the person states one: a named currency, a bare "$" (Canadian dollars), or
 * goods from the U.S. and nowhere else (U.S. dollars). Undefined otherwise. The currency never decides the origin.
 */
export const currencyIn = (text: string): Currency | 'CAD' | undefined =>
  CURRENCY_WORDS.find(([re]) => re.test(text))?.[1] ?? (/\$/.test(text) ? 'CAD' : originIn(text) === 'us' ? 'USD' : undefined);

/** A duty rate in the question: "6.5%", "8 percent", "6,5 pour cent". */
export const PCT = /(\d{1,2}(?:[.,]\d{1,2})?)\s?(%|percent|pour cent)/i;
export function dutyRateIn(text: string): number | undefined {
  const pct = text.match(PCT)?.[1];
  return pct ? Number(pct.replace(',', '.')) : undefined;
}
/** The text with its percentages removed, so "at 6.5%" is never read as an amount. */
export const withoutRates = (text: string) => text.replace(new RegExp(PCT.source, 'gi'), '');
/** Questions about what importing will cost ("How much duty will I pay…?", « Combien de droits… »). */
export const COST_Q = /\b(how much|cost\w*|calculat\w*|estimat\w*|what will i (owe|pay)|combien|coût\w*|calcul\w*|estim\w*|payer)\b/i;

/** The person is in a hurry to incorporate (express service). */
export const wantsExpress = (text: string) => /\b(fast|faster|fastest|quick\w*|urgent\w*|today|asap|express|vite|rapide\w*|aujourd[’']hui)\b/i.test(text);

const RIDESHARE = /\b(uber|lyft|taxi|rideshare|ride-share|ride sharing|covoiturage)\b/i;
const DELIVERY = /\b(deliver\w*|livraison|uber ?eats|doordash|skip the dishes)\b/i;
export const isRideshare = (text: string) => RIDESHARE.test(text) && !DELIVERY.test(text);

export const prioritiesIn = (text: string): Priority[] => {
  const out: Priority[] = [];
  if (/\b(liabilit\w*|protect\w*|personal assets|sued|lawsuit|house|responsabilit\w*|protéger|biens personnels|poursuivi)\b/i.test(text)) out.push('protect');
  if (/\b(simple|simplest|cheap\w*|easy|easiest|low cost|peu coûteux|facile|simple)\b/i.test(text)) out.push('simple');
  if (/\b(investors?|raise money|raise capital|shares|investisseurs?|actions|capital)\b/i.test(text)) out.push('invest');
  if (/\b(across canada|nationally|name protect\w*|partout au canada|nom protégé)\b/i.test(text)) out.push('name');
  return out;
};
export const partnersIn = (text: string) => /\b(partners?|co-?founders?|with (a|my) (friend|brother|sister|spouse|wife|husband)|two of us|associés?|cofondat\w*|à deux)\b/i.test(text);

export const needIn = (text: string): Need => {
  if (/\b(tariffs?|tarifs?|droits de douane|counter-?tariffs?|contre-mesures)\b/i.test(text)) return 'tariffs';
  if (/\b(export\w*|abroad|overseas|à l[’']étranger)\b/i.test(text)) return 'export';
  if (/\b(innovat\w*|r&d|research|technolog\w*|recherche|tech)\b/i.test(text)) return 'innovate';
  if (/\b(grow|growth|expand\w*|scale|croissance|croître|agrandir)\b/i.test(text)) return 'grow';
  return 'start';
};
