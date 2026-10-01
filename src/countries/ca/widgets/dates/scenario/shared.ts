/**
 * Shared by the `dates` scripted scenarios: what a question names (programs, province, holiday, month) and how the
 * answers word dates, places and citations. Facts: ../data.ts and ../fallback.ts (verified 2026-09-30).
 */
import { todayInCanada } from '../../../data/holidays';
import { PROGRAM_META, URLS, type HolidayItem, type Lang, type Program, type Province } from '../data';
import { HOLIDAYS_FALLBACK, PROGRAM_NAMES } from '../fallback';
import { mergePayments, provinceFromZone } from '../build';
import { fetchHolidays, fetchPayments } from '../feeds';
import { enArticle, frArticle, frFirst, inSentence } from '../names';

/* ------------------------------------------------------------------ detection */

const PROGRAM_RE: [Program, RegExp][] = [
  ['ccb', /\b(canada child benefit|child benefits?|CCB)\b|\ballocation canadienne pour enfants\b|\bACE\b/i],
  ['cgeb', /\b(GST|HST|groceries and essentials|CGEB)\b|\b(TPS|TVH|ACEBE)\b|épicerie et (les )?besoins essentiels/i],
  ['oas', /\b(old age security|OAS|GIS|guaranteed income supplement)\b|sécurité de la vieillesse|\bSV\b|\bSRG\b|supplément de revenu garanti/i],
  ['cpp', /\b(canada pension plan|CPP)\b|régime de pensions du canada|\bRPC\b|\b(ma|sa|notre|leur|la) rente( de retraite)?\b/i],
  ['cwb', /\b(workers benefit|CWB|ACWB)\b|allocation canadienne pour les travailleurs|\bA?ACT\b/i],
  ['cdb', /\b(canada disability benefit|CDB)\b|prestation canadienne pour les personnes handicapées|\bPCPH\b/i],
  ['vdp', /\bveterans?'?s? disability pension\b|pension d[’']invalidité (des vétérans|d[’']anciens combattants)/i],
  ['otb', /\b(ontario trillium|OTB)\b|trillium de l[’']ontario|\bPTO\b/i],
  ['acfb', /\b(alberta child and family benefit|ACFB)\b|enfants et familles de l[’']alberta|\bPEFA\b/i],
];
/** The Quebec Pension Plan, named ("QPP", « RRQ », « Régime de rentes du Québec », Retraite Québec). */
export const QPP_RE = /\b(quebec pension plan|QPP|RRQ)\b|régime de rentes du qu[ée]bec|retraite qu[ée]bec/i;
export const CPP_NAMED = /\b(canada pension plan|CPP|RPC)\b|régime de pensions du canada/i;
/** Programs named in the text; « rente » alone reads as the CPP, but not when the Quebec plan is the one named. */
export const programsIn = (text: string) =>
  PROGRAM_RE.filter(([p, re]) => re.test(text) && !(p === 'cpp' && QPP_RE.test(text) && !CPP_NAMED.test(text))).map(([p]) => p);

/** Province names and big cities (any case) and postal abbreviations (capitals only: "ON", not "on"). */
const PROVINCE_RE: [Province, RegExp, RegExp][] = [
  ['ON', /\b(ontario|toronto|ottawa|hamilton|mississauga|brampton|kitchener|windsor|sudbury|thunder bay)\b/i, /\bON\b/],
  ['QC', /\b(qu[ée]bec|montr[ée]al|laval|gatineau|sherbrooke|trois-rivi[èe]res|saguenay)\b/i, /\bQC\b/],
  ['BC', /\b(british columbia|colombie-britannique|vancouver|surrey|burnaby|kelowna)\b/i, /\bB\.?C\b/],
  ['AB', /\b(alberta|calgary|edmonton|red deer|lethbridge)\b/i, /\bAB\b/],
  ['MB', /\b(manitoba|winnipeg|brandon)\b/i, /\bMB\b/],
  ['SK', /\b(saskatchewan|regina|saskatoon)\b/i, /\bSK\b/],
  ['NS', /\b(nova scotia|nouvelle-[ée]cosse|halifax|dartmouth)\b/i, /\bNS\b/],
  ['NB', /\b(new brunswick|nouveau-brunswick|moncton|fredericton|saint john)\b/i, /\bNB\b/],
  ['NL', /\b(newfoundland|labrador|terre-neuve|st\.? john['’]s)\b/i, /\bNL\b/],
  ['PE', /\b(prince edward island|charlottetown)\b|[îi]le-du-prince-[ée]douard/i, /\b(PEI|P\.E\.I|PE)\b/],
  ['YT', /\b(yukon|whitehorse)\b/i, /\bYT\b/],
  ['NT', /\b(northwest territories|territoires du nord-ouest|yellowknife)\b/i, /\b(NWT|NT)\b/],
  ['NU', /\b(nunavut|iqaluit)\b/i, /\bNU\b/],
];
export const provinceIn = (text: string): Province | undefined => PROVINCE_RE.find(([, names, code]) => names.test(text) || code.test(text))?.[0];

/** Holiday names people use, mapped to the names in the data. */
const HOLIDAY_ALIASES: [RegExp, string][] = [
  [/\b(saint|st)[- .]?jean|f[êe]te nationale( du qu[ée]bec)?\b/i, 'Saint-Jean-Baptiste'],
  [/\btruth and reconciliation|vérité et (de )?la réconciliation|orange shirt|chandail orange\b/i, 'National Day for Truth and Reconciliation'],
  [/\bremembrance day|jour du souvenir\b/i, 'Remembrance Day'],
  [/\bboxing day|lendemain de no[ëe]l\b/i, 'Boxing Day'],
  [/\bchristmas|no[ëe]l\b/i, 'Christmas Day'],
  [/\bnew year|jour de l[’']an\b/i, 'New Year’s Day'],
  [/\bfamily day|(f[êe]te|jour) de la famille\b/i, 'Family Day'],
  [/\bgood friday|vendredi saint\b/i, 'Good Friday'],
  [/\beaster monday|lundi de p[âa]ques\b/i, 'Easter Monday'],
  [/\bvictoria day|may two-four|f[êe]te de (la reine|victoria)\b/i, 'Victoria Day'],
  [/\b(national )?patriots['’]? day|journ[ée]e (nationale )?des patriotes\b/i, 'National Patriots’ Day'],
  [/\bcanada day|f[êe]te du canada\b/i, 'Canada Day'],
  [/\bcivic holiday|congé civique|august long weekend\b/i, 'Civic Holiday'],
  [/\blabou?r day|f[êe]te du travail\b/i, 'Labour Day'],
  [/\bthanksgiving|action de gr[âa]ces?\b/i, 'Thanksgiving'],
  [/\blouis riel\b/i, 'Louis Riel Day'],
  [/\bislander day|f[êe]te des insulaires\b/i, 'Islander Day'],
  [/\bheritage day|(f[êe]te|jour) du patrimoine\b/i, 'Heritage Day'],
  [/\b(saint|st)\.?[- ]patrick/i, 'Saint Patrick’s Day'],
  [/\b(saint|st)\.?[- ]georges?\b/i, 'Saint George’s Day'],
  [/\bmemorial day\b/i, 'Memorial Day'],
  [/\borangem[ae]n|orangistes\b/i, 'Orangemen’s Day'],
  [/\bjune holiday|cong[ée] de juin\b/i, 'June Holiday'],
  [/\bdiscovery day|jour de la d[ée]couverte\b/i, 'Discovery Day'],
  [/\bnational indigenous peoples day|peuples autochtones\b/i, 'National Indigenous Peoples Day'],
];
export const holidayIn = (text: string) => HOLIDAY_ALIASES.find(([re]) => re.test(text))?.[1];

export const MONTHS: RegExp[] = [
  /\b(january|janvier)\b/i, /\b(february|février|fevrier)\b/i, /\b(march|mars)\b/i, /\b(april|avril)\b/i, /\b(may|mai)\b/i, /\b(june|juin)\b/i,
  /\b(july|juillet)\b/i, /\b(august|août|aout)\b/i, /\b(september|septembre)\b/i, /\b(october|octobre)\b/i, /\b(november|novembre)\b/i, /\b(december|décembre|decembre)\b/i,
];
/** `YYYY-MM` of a month named in the text (this year, or next year once it has passed). */
export const monthIn = (text: string, today: string): string | undefined => {
  const i = MONTHS.findIndex((re) => re.test(text.replace(/\bmay i\b/gi, '')));
  if (i < 0) return undefined;
  const y = Number(today.slice(0, 4)) + (i + 1 < Number(today.slice(5, 7)) ? 1 : 0);
  return `${y}-${String(i + 1).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ wording */

export const fmt = (iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) =>
  frFirst(new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)), lang);
/** Like `fmt`, with the year added when the date isn't in the current year ("Monday, March 29, 2027"). */
export const fmtY = (iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) =>
  fmt(iso, lang, iso.slice(0, 4) === todayInCanada().slice(0, 4) ? opts : { ...opts, year: 'numeric' });

/**
 * "Didn't get a payment?" for the programs asked about: CRA wait times (5 working days for the CCB and ACFB, 10 for
 * the others; CRA payment-dates page footnotes) only for CRA programs, and 5 to 10 business days before contacting
 * Service Canada or Veterans Affairs Canada (benefits calendar) for theirs.
 */
/** A program name with its article: "the Canada child benefit", "Old Age Security"; « l’Allocation… », « le Régime… ». */
function withArticle(p: Program, lang: Lang) {
  const n = PROGRAM_NAMES[p][lang];
  if (lang === 'en') return p === 'oas' ? n : `the ${n}`;
  if (p === 'vdp') return 'la pension d’invalidité d’Anciens Combattants Canada';
  return /^[AEIOUÉÈ]/.test(n) ? `l’${n}` : /^Régime/.test(n) ? `le ${n}` : `la ${n}`;
}
/** French « de » + article: « de l’Allocation… », « du Régime… », « de la Sécurité de la vieillesse ». */
export const ofProgram = (p: Program) => {
  const a = withArticle(p, 'fr');
  return a.startsWith('le ') ? `du ${a.slice(3)}` : `de ${a}`;
};

export function waitLine(progs: Program[], lang: Lang, cite: { cra: string; cal: string }): string {
  const art = (p: Program) => withArticle(p, lang);
  const names = (ps: Program[]) => list(ps.map(art), lang);
  const cra5 = progs.filter((p) => PROGRAM_META[p].admin === 'cra' && PROGRAM_META[p].waitDays === 5);
  const cra10 = progs.filter((p) => PROGRAM_META[p].admin === 'cra' && PROGRAM_META[p].waitDays === 10);
  const sc = progs.filter((p) => PROGRAM_META[p].admin === 'sc');
  const vac = progs.filter((p) => PROGRAM_META[p].admin === 'vac');
  const parts: string[] = [];
  const fr = lang === 'fr';
  if (cra5.length || cra10.length) {
    const bits = [
      cra5.length ? (fr ? `5 jours ouvrables pour ${names(cra5)}` : `5 working days for ${names(cra5)}`) : '',
      cra10.length ? (fr ? `10 jours ouvrables pour ${names(cra10)}` : `10 working days for ${names(cra10)}`) : '',
    ].filter(Boolean);
    parts.push(fr ? `Attendez ${bits.join(', ou ')}${bits.length > 1 ? ',' : ''} avant de communiquer avec l’ARC. ${cite.cra}` : `Wait ${bits.join(', or ')}${bits.length > 1 ? ',' : ''} before contacting the CRA. ${cite.cra}`);
  }
  if (sc.length) parts.push(fr ? `Pour ${names(sc)}, attendez de 5 à 10 jours ouvrables avant de communiquer avec Service Canada. ${cite.cal}` : `For ${names(sc)}, wait 5 to 10 business days before contacting Service Canada. ${cite.cal}`);
  if (vac.length) parts.push(fr ? `Pour ${names(vac)}, attendez de 5 à 10 jours ouvrables avant de communiquer avec Anciens Combattants Canada. ${cite.cal}` : `For ${names(vac)}, wait 5 to 10 business days before contacting Veterans Affairs Canada. ${cite.cal}`);
  return `${fr ? 'Vous n’avez pas reçu un versement?' : 'Didn’t get a payment?'} ${parts.join(' ')}`;
}
export const list = (items: string[], lang: Lang) => new Intl.ListFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'long', type: 'conjunction' }).format(items);
export const PROV_NAME: Record<Province, { en: string; fr: string; in: { en: string; fr: string }; /** French: « les jours fériés de l’Ontario ». */ of: string }> = {
  AB: { en: 'Alberta', fr: 'Alberta', in: { en: 'in Alberta', fr: 'en Alberta' }, of: 'de l’Alberta' },
  BC: { en: 'British Columbia', fr: 'Colombie-Britannique', in: { en: 'in British Columbia', fr: 'en Colombie-Britannique' }, of: 'de la Colombie-Britannique' },
  MB: { en: 'Manitoba', fr: 'Manitoba', in: { en: 'in Manitoba', fr: 'au Manitoba' }, of: 'du Manitoba' },
  NB: { en: 'New Brunswick', fr: 'Nouveau-Brunswick', in: { en: 'in New Brunswick', fr: 'au Nouveau-Brunswick' }, of: 'du Nouveau-Brunswick' },
  NL: { en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador', in: { en: 'in Newfoundland and Labrador', fr: 'à Terre-Neuve-et-Labrador' }, of: 'de Terre-Neuve-et-Labrador' },
  NS: { en: 'Nova Scotia', fr: 'Nouvelle-Écosse', in: { en: 'in Nova Scotia', fr: 'en Nouvelle-Écosse' }, of: 'de la Nouvelle-Écosse' },
  NT: { en: 'the Northwest Territories', fr: 'Territoires du Nord-Ouest', in: { en: 'in the Northwest Territories', fr: 'dans les Territoires du Nord-Ouest' }, of: 'des Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'Nunavut', in: { en: 'in Nunavut', fr: 'au Nunavut' }, of: 'du Nunavut' },
  ON: { en: 'Ontario', fr: 'Ontario', in: { en: 'in Ontario', fr: 'en Ontario' }, of: 'de l’Ontario' },
  PE: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard', in: { en: 'in Prince Edward Island', fr: 'à l’Île-du-Prince-Édouard' }, of: 'de l’Île-du-Prince-Édouard' },
  QC: { en: 'Quebec', fr: 'Québec', in: { en: 'in Quebec', fr: 'au Québec' }, of: 'du Québec' },
  SK: { en: 'Saskatchewan', fr: 'Saskatchewan', in: { en: 'in Saskatchewan', fr: 'en Saskatchewan' }, of: 'de la Saskatchewan' },
  YT: { en: 'Yukon', fr: 'Yukon', in: { en: 'in Yukon', fr: 'au Yukon' }, of: 'du Yukon' },
};
/** French article for a holiday name (shared with the widget): le jour du Souvenir, le jour de l’Action de grâces. */
export const le = frArticle;
/** A holiday name mid-sentence with one phrase in italics: « le *jour de l’Action de grâces* », "*Thanksgiving*", "the *National Day for Truth and Reconciliation*". */
export const em = (n: string, lang: Lang) => {
  if (lang === 'en') return `${enArticle(n)}*${n}*`;
  const full = inSentence(n, 'fr');
  const art = frArticle(n);
  return `${art}*${full.slice(art.length)}*`;
};
/** Numbers citations in reading order: `⟦url⟧` → `[n](url)`; a page cited again keeps its number. */
export const c = (url: string) => `⟦${url}⟧`;
export function numbered(paras: string[]): string {
  const seen = new Map<string, number>();
  return paras
    .map((x) => x.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/⟦(\S+?)⟧/g, (_, u: string) => {
      if (!seen.has(u)) seen.set(u, seen.size + 1);
      return `[${seen.get(u)}](${u})`;
    });
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Today is the National Day for Truth and Reconciliation" (but "Today is Thanksgiving"). */
export const the = enArticle;
/**
 * The widget may open on a province guessed from the time zone ("Based on your time zone"): the answer then says what
 * applies there, marked as a guess. `timeZone` reaches `vars` when the engine passes it; without it, nothing is guessed.
 */
export type Ctx = { text: string; lang: Lang; timeZone?: string };
export const guessed = (text: string, timeZone?: string) => (provinceIn(text) ? null : provinceFromZone(timeZone));
export const basedOnZone = (g: Province, lang: Lang) =>
  lang === 'fr' ? `${cap(PROV_NAME[g].in.fr)} (selon votre fuseau horaire)` : `${cap(PROV_NAME[g].in.en)} (based on your time zone)`;
export const listFor = (g: Province, lang: Lang) =>
  lang === 'fr'
    ? `La liste ci-dessous montre les jours fériés ${PROV_NAME[g].in.fr}; vous pouvez changer de province.`
    : `The list below shows the holidays ${PROV_NAME[g].in.en}; you can change the province.`;
export const names = (codes: Province[], lang: Lang) => list(codes.map((c) => PROV_NAME[c][lang]).sort((a, b) => a.localeCompare(b, lang)), lang);

/** Live data (cached) with the verified fallback. Never throws. */
export async function payments() {
  return mergePayments(await fetchPayments().catch(() => null));
}
export async function holidays(): Promise<HolidayItem[]> {
  const y = Number(todayInCanada().slice(0, 4));
  return (await fetchHolidays([y, y + 1]).catch(() => null))?.holidays ?? HOLIDAYS_FALLBACK;
}

export const C = { payCal: URLS.calendar, craPay: URLS.craPayDates, federal: URLS.federalHolidays, cra: URLS.publicHolidays, filing: URLS.filing, instalments: URLS.instalments, rrsp: URLS.rrsp, rrspRule: URLS.rrspRule };


/** A `RegExp` whose `test` runs a predicate: lets a scenario's `exclude` depend on the province named. */
export class When extends RegExp {
  private readonly fn: (text: string) => boolean;
  constructor(fn: (text: string) => boolean) {
    super('(?:)');
    this.fn = fn;
  }
  override test(text: string) {
    return this.fn(text);
  }
}

/** Programs named in payment-date questions (EN, then FR), for the match patterns below. */
export const PAY_PROGRAMS_EN =
  "canada child benefits?|child benefits?|CCB|GST(/HST)?( credit)?|HST|groceries and essentials( benefit)?|CGEB|old age security|OAS|CPP|canada pension plan|quebec pension plan|QPP|GIS|guaranteed income supplement|disability benefit|CDB|workers benefit|CWB|trillium|OTB|ACFB|alberta child and family benefit|veterans?'?s? disability pension";
export const PAY_PROGRAMS_FR =
  "allocation canadienne pour enfants|\\bACE\\b|\\bTPS\\b|\\bTVH\\b|épicerie|sécurité de la vieillesse|\\bSV\\b|\\bRPC\\b|régime de pensions du canada|régime de rentes du québec|\\bRRQ\\b|supplément de revenu garanti|\\bSRG\\b|personnes handicapées|allocation canadienne pour les travailleurs|trillium";

export const EXCLUDE_OTHER = /\b(passport|passeport|appointment|rendez-vous|vaccin\w*|flight|vol)\b/i;
