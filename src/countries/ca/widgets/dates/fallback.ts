/**
 * Key dates: the verified fallback tables and official names behind the tools (payment dates, tax deadlines, the
 * holidays feed snapshot and the rules that feed doesn't carry). Used by the tools, the scenarios and the lab fixtures
 * only: the widgets get all of it through the tool output, so none of this ships in the client bundle.
 * Sources and "Date modified" for every table: the header of ./data.ts (checked 2026-09-30).
 */
import type { HolidayItem, Program, Province, TaxKind } from './data';

/* ------------------------------------------------------------------ programs */

/** Official program names (EN/FR as on canada.ca), for tool output and calendar files. */
export const PROGRAM_NAMES: Record<Program, { en: string; fr: string }> = {
  ccb: { en: 'Canada child benefit', fr: 'Allocation canadienne pour enfants' },
  cgeb: { en: 'Canada Groceries and Essentials Benefit', fr: 'Allocation canadienne pour l’épicerie et les besoins essentiels' },
  oas: { en: 'Old Age Security', fr: 'Sécurité de la vieillesse' },
  cpp: { en: 'Canada Pension Plan', fr: 'Régime de pensions du Canada' },
  cwb: { en: 'Advanced Canada workers benefit', fr: 'Avance de l’allocation canadienne pour les travailleurs' },
  cdb: { en: 'Canada Disability Benefit', fr: 'Prestation canadienne pour les personnes handicapées' },
  vdp: { en: 'Veteran disability pension', fr: 'Anciens Combattants Canada – Pension d’invalidité' },
  otb: { en: 'Ontario trillium benefit', fr: 'Prestation Trillium de l’Ontario' },
  acfb: { en: 'Alberta child and family benefit', fr: 'Prestation pour enfants et familles de l’Alberta' },
  nldb: { en: 'Newfoundland and Labrador disability benefit', fr: 'Prestation pour personnes handicapées de Terre-Neuve-et-Labrador' },
};
/** Name of the January and April 2026 payments (before the CGEB replaced the credit in July 2026). */
export const GST_NAME = { en: 'GST/HST credit', fr: 'Crédit pour la TPS/TVH' };

/** `<details id="…-YYYY">` ids on the English benefits calendar page. `gst` folds into `cgeb`. */
export const CALENDAR_IDS: Record<string, Program> = {
  ccb: 'ccb', cgeb: 'cgeb', gst: 'cgeb', oas: 'oas', cpp: 'cpp', cwb: 'cwb', cdb: 'cdb', vdp: 'vdp', otb: 'otb', acfb: 'acfb', nlds: 'nldb',
};

/** Every payment date on the benefits calendar on 2026-09-30 (fallback when the live page can't be read). */
export const PAYMENTS_FALLBACK: Record<Program, string[]> = {
  ccb: ['2026-01-20', '2026-02-20', '2026-03-20', '2026-04-20', '2026-05-20', '2026-06-19', '2026-07-20', '2026-08-20', '2026-09-18', '2026-10-20', '2026-11-20', '2026-12-11'],
  cgeb: ['2026-01-05', '2026-04-02', '2026-07-03', '2026-10-05'],
  oas: ['2026-01-28', '2026-02-25', '2026-03-27', '2026-04-28', '2026-05-27', '2026-06-26', '2026-07-29', '2026-08-27', '2026-09-25', '2026-10-28', '2026-11-26', '2026-12-22'],
  cpp: ['2026-01-28', '2026-02-25', '2026-03-27', '2026-04-28', '2026-05-27', '2026-06-26', '2026-07-29', '2026-08-27', '2026-09-25', '2026-10-28', '2026-11-26', '2026-12-22'],
  cwb: ['2026-01-12', '2026-07-10', '2026-10-09'],
  cdb: ['2026-01-15', '2026-02-19', '2026-03-19', '2026-04-16', '2026-05-21', '2026-06-18', '2026-07-16', '2026-08-20', '2026-09-17', '2026-10-15', '2026-11-19', '2026-12-17'],
  vdp: ['2026-01-30', '2026-02-26', '2026-03-30', '2026-04-29', '2026-05-28', '2026-06-29', '2026-07-30', '2026-08-28', '2026-09-28', '2026-10-29', '2026-11-27', '2026-12-23'],
  otb: ['2026-01-09', '2026-02-10', '2026-03-10', '2026-04-10', '2026-05-08', '2026-06-10', '2026-07-10', '2026-08-10', '2026-09-10', '2026-10-09', '2026-11-10', '2026-12-10'],
  acfb: ['2026-02-27', '2026-05-27', '2026-08-27', '2026-11-27'],
  nldb: ['2026-01-23', '2026-02-25', '2026-03-25', '2026-04-24', '2026-05-25', '2026-06-25', '2026-07-24', '2026-08-25', '2026-09-25', '2026-10-23', '2026-11-25', '2026-12-24'],
};

/* ------------------------------------------------------------------ taxes */

/** Individual tax deadlines. `year` = the tax year it relates to. */
export const TAX_DEADLINES: { kind: TaxKind; date: string; year: number; /** Derived from the rule, not yet published by the CRA. */ expected?: true }[] = [
  { kind: 'rrsp', date: '2026-03-02', year: 2025 },
  { kind: 'instalment', date: '2026-03-15', year: 2026 },
  { kind: 'file', date: '2026-04-30', year: 2025 },
  { kind: 'selfEmployed', date: '2026-06-15', year: 2025 },
  { kind: 'instalment', date: '2026-06-15', year: 2026 },
  { kind: 'instalment', date: '2026-09-15', year: 2026 },
  { kind: 'instalment', date: '2026-12-15', year: 2026 },
  { kind: 'rrsp', date: '2027-03-01', year: 2026, expected: true },
  { kind: 'instalment', date: '2027-03-15', year: 2027 },
  { kind: 'file', date: '2027-04-30', year: 2026 },
  { kind: 'selfEmployed', date: '2027-06-15', year: 2026 },
  { kind: 'instalment', date: '2027-06-15', year: 2027 },
];
export const TAX_NAMES: Record<TaxKind, { en: string; fr: string }> = {
  rrsp: { en: 'RRSP contribution deadline', fr: 'Date limite de cotisation au REER' },
  file: { en: 'Tax filing and payment deadline', fr: 'Date limite de production et de paiement des impôts' },
  selfEmployed: { en: 'Filing deadline if self-employed', fr: 'Date limite de production pour les travailleurs autonomes' },
  instalment: { en: 'Tax instalment due', fr: 'Acompte provisionnel d’impôt' },
};

/**
 * Public holidays recognized by the CRA in 2026 (public-holidays.html [2026-01-06]). Used for the due-date rollover
 * rule. The page also lists "Saint-Jean-Baptiste Day – Wednesday, June 24, 2026 (Quebec only)": it's left out on
 * purpose, because the rollover here applies to everyone and no deadline in `TAX_DEADLINES` lands on June 24.
 */
export const CRA_HOLIDAYS_2026 = [
  '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-18', '2026-07-01', '2026-08-03', '2026-09-07', '2026-09-30',
  '2026-10-12', '2026-11-11', '2026-12-25', '2026-12-26',
];

/* ------------------------------------------------------------------ holidays */

/**
 * Quebec's one holiday that the employer picks: "le Vendredi saint ou le lundi de Pâques, au choix de l’employeur"
 * (CNESST, checked 2026-09-30). Attached to both days; canada-holidays.ca doesn't carry it.
 */
const EMPLOYER_CHOICE: { match: RegExp; provinces: Province[]; name: { en: string; fr: string } } = {
  match: /^(good friday|easter monday)$/,
  provinces: ['QC'],
  name: { en: 'Good Friday or Easter Monday', fr: 'Vendredi saint ou lundi de Pâques' },
};

/**
 * Official names, matched on the feed's English name. French follows the official French pages (data.ts header):
 * canada.ca for the Canada Labour Code holidays (« la fête de Victoria », « le jour de l’Action de grâces »; the feed
 * has « Fête de la Reine », « Action de grâce »), the CRA for Easter Monday and Civic Holiday, and each province's own
 * page for its holidays (the feed has « Jour de St. George », « Jour de Nouveau Brunswick », « Jour de Nunavut »).
 * English is only set where the province's name differs from the feed's.
 */
const NAMES: [RegExp, { fr: string; en?: string; clcDay?: true }][] = [
  [/^new year/, { fr: 'Jour de l’An' }],
  [/^louis riel/, { fr: 'Jour de Louis Riel' }],
  [/^islander day/, { fr: 'Fête des Insulaires' }],
  // « le jour de la Famille », capital F: ontario.ca/fr and gnb.ca/fr (re-read 2026-10-01), the two provinces with a French page for it.
  [/^family day/, { fr: 'Jour de la Famille' }],
  [/^heritage day/, { fr: 'Jour du patrimoine de la Nouvelle-Écosse' }],
  [/^(saint|st\.?) patrick/, { fr: 'Jour de la Saint-Patrick' }],
  [/^good friday/, { fr: 'Vendredi saint' }],
  [/^easter monday/, { fr: 'Lundi de Pâques' }],
  [/^(saint|st\.?) george/, { fr: 'Jour de la Saint-Georges' }],
  [/^national patriots/, { fr: 'Journée nationale des patriotes' }],
  [/^victoria day/, { fr: 'Fête de Victoria' }],
  [/^national indigenous peoples day/, { fr: 'Journée nationale des peuples autochtones' }],
  // CNESST (EN page, re-read 2026-10-01) calls June 24 the "Quebec National Holiday" / "the National Holiday"; the feed's name follows in brackets.
  [/^(saint|st\.?)[- ]jean/, { en: 'National Holiday (Saint-Jean-Baptiste Day)', fr: 'Fête nationale du Québec' }],
  [/^discovery day/, { fr: 'Jour de la Découverte' }],
  [/^canada day/, { fr: 'Fête du Canada' }],
  // N.L.'s July 1 holiday: "Memorial/Canada Day", « Memorial Day / Fête du Canada » (never « Jour du Souvenir », which is Nov. 11).
  // The feed files it as a provincial day (`federal: false`), but July 1 is Canada Day there too: `clcDay`.
  [/^memorial day/, { en: 'Memorial Day (Canada Day)', fr: 'Memorial Day (fête du Canada)', clcDay: true }],
  [/^nunavut day/, { fr: 'Fête du Nunavut' }],
  [/^orangem[ae]n/, { fr: 'Fête des orangistes' }],
  [/^civic holiday/, { fr: 'Congé civique' }],
  [/^british columbia day/, { fr: 'Fête de la Colombie-Britannique' }],
  [/^new brunswick day/, { fr: 'Fête du Nouveau-Brunswick' }],
  [/^saskatchewan day/, { fr: 'Fête de la Saskatchewan' }],
  [/^labou?r day/, { fr: 'Fête du Travail' }],
  [/^national day for truth and reconciliation/, { fr: 'Journée nationale de la vérité et de la réconciliation' }],
  [/^orange shirt day/, { fr: 'Journée du chandail orange' }],
  [/^thanksgiving/, { fr: 'Jour de l’Action de grâces' }],
  [/^remembrance day/, { fr: 'Jour du Souvenir' }],
  [/^christmas/, { fr: 'Jour de Noël' }],
  [/^boxing day/, { fr: 'Lendemain de Noël' }],
];

/**
 * What the feed gets wrong or leaves out for a province (data.ts header, Newfoundland and Labrador: six paid public
 * holidays under the Labour Standards Act; the Treasury Board Secretariat's schedule gives the provincial government's
 * own employees eight more named days).
 * - A day the feed lists as statutory there that isn't: it leaves the statutory list. `government: true` moves it to
 *   `HolidayItem.government`; otherwise it's dropped (Regatta Day is a St. John's civic holiday, on no provincial list).
 * - `unlisted`: a day the feed doesn't list for the province at all (rightly: it isn't statutory there) that the
 *   provincial government's schedule still gives its employees (N.L.: Victoria Day, the National Day for Truth and
 *   Reconciliation, Thanksgiving). It's added to `HolidayItem.government` and stays a federal holiday not observed there.
 * `name`: what the province's schedule calls it, when the day is that province's alone.
 * `floating`: that schedule sets the day each year (no calendar date of its own; the feed's is Discovery Day's June 24).
 */
const PROVINCE_RULES: { match: RegExp; province: Province; government: boolean; unlisted?: true; floating?: true; name?: { en: string; fr: string } }[] = [
  { match: /^(saint|st\.?) patrick/, province: 'NL', government: true },
  { match: /^(saint|st\.?) george/, province: 'NL', government: true },
  { match: /^victoria day/, province: 'NL', government: true, unlisted: true },
  { match: /^discovery day/, province: 'NL', government: true, floating: true, name: { en: 'June Holiday', fr: 'Congé de juin' } },
  { match: /^orangem[ae]n/, province: 'NL', government: true },
  { match: /^national day for truth and reconciliation/, province: 'NL', government: true, unlisted: true },
  { match: /^thanksgiving/, province: 'NL', government: true, unlisted: true },
  { match: /^boxing day/, province: 'NL', government: true },
  { match: /^regatta day/, province: 'NL', government: false },
];

/**
 * Statutory holidays per province and territory in a year, counted on each official page (data.ts header). The lists
 * built here must match; a live feed that doesn't is not trusted (./verify.ts).
 */
export const STAT_COUNTS: Record<Province, number> = { AB: 9, BC: 11, MB: 9, NB: 8, NL: 6, NS: 6, NT: 11, NU: 10, ON: 9, PE: 8, QC: 8, SK: 10, YT: 11 };

/** One feed holiday with the official names and the rules the feed doesn't carry. */
function withHolidayRules(h: HolidayItem): HolidayItem {
  const en = h.name.en.trim().toLowerCase();
  const official = NAMES.find(([re]) => re.test(en))?.[1];
  let out: HolidayItem = official ? { ...h, name: { en: official.en ?? h.name.en, fr: official.fr } } : h;
  if (official?.clcDay && !out.clc) out.clcDay = true;
  for (const rule of PROVINCE_RULES) {
    if (!rule.match.test(en)) continue;
    const listed = out.provinces.includes(rule.province);
    // An `unlisted` rule only applies while the feed agrees the day isn't statutory there; if the province ever makes
    // it one, the feed's entry stands.
    if (rule.unlisted ? listed : !listed) continue;
    const provinces = out.provinces.filter((p) => p !== rule.province);
    out = { ...out, provinces };
    if (rule.government) out.government = [...(out.government ?? []), rule.province];
    if (rule.name && !provinces.length) out.name = rule.name;
    if (rule.floating && !provinces.length) out.floating = true;
  }
  if (EMPLOYER_CHOICE.match.test(en)) out = { ...out, choice: { provinces: EMPLOYER_CHOICE.provinces, name: EMPLOYER_CHOICE.name } };
  return out;
}

/**
 * The feed with the rules it doesn't carry: official names (`NAMES`), Quebec's employer's choice (`EMPLOYER_CHOICE`)
 * and days that aren't statutory where the feed says they are (`PROVINCE_RULES`). A day left with no federal status,
 * no province and no government schedule is dropped.
 */
export const withRules = (list: HolidayItem[]): HolidayItem[] =>
  list.map(withHolidayRules).filter((h) => h.federal || h.provinces.length > 0 || Boolean(h.government?.length));

/** The 10 Canada Labour Code general holidays (vacations-holidays.html [2025-12-12]), matched on the English name. */
const CLC_HOLIDAYS = [
  /^new year/,
  /^good friday/,
  /^victoria day/,
  /^canada day/,
  /^labou?r day/,
  /^national day for truth and reconciliation/,
  /^thanksgiving/,
  /^remembrance day/,
  /^christmas/,
  /^boxing day/,
];
export const isClcHoliday = (nameEn: string, federal: boolean) => federal && CLC_HOLIDAYS.some((re) => re.test(nameEn.trim().toLowerCase()));

/** canada-holidays.ca on 2026-09-30, as the feed gives it (fallback when the API can't be reached); `withRules` then applies. */
export const HOLIDAYS_FALLBACK: HolidayItem[] = withRules(([
  { date: '2026-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2026-02-16', name: { en: 'Louis Riel Day', fr: 'Journée Louis Riel' }, federal: false, provinces: ['MB'] },
  { date: '2026-02-16', name: { en: 'Islander Day', fr: 'Fête des Insulaires' }, federal: false, provinces: ['PE'] },
  { date: '2026-02-16', name: { en: 'Family Day', fr: 'Fête de la famille' }, federal: false, provinces: ['AB', 'BC', 'NB', 'ON', 'SK'] },
  { date: '2026-02-16', name: { en: 'Heritage Day', fr: 'Fête du Patrimoine' }, federal: false, provinces: ['NS'] },
  { date: '2026-03-17', observed: '2026-03-16', name: { en: 'Saint Patrick’s Day', fr: 'Jour de la Saint-Patrick' }, federal: false, provinces: ['NL'] },
  { date: '2026-04-03', name: { en: 'Good Friday', fr: 'Vendredi saint' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2026-04-06', name: { en: 'Easter Monday', fr: 'Lundi de Pâques' }, federal: true, provinces: [] },
  { date: '2026-04-23', observed: '2026-04-20', name: { en: 'Saint George’s Day', fr: 'Jour de St. George' }, federal: false, provinces: ['NL'] },
  { date: '2026-05-18', name: { en: 'National Patriots’ Day', fr: 'Journée nationale des patriotes' }, federal: false, provinces: ['QC'] },
  { date: '2026-05-18', name: { en: 'Victoria Day', fr: 'Fête de Victoria' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NT', 'NU', 'ON', 'SK', 'YT'] },
  { date: '2026-06-21', name: { en: 'National Indigenous Peoples Day', fr: 'Journée nationale des peuples autochtones' }, federal: false, provinces: ['NT', 'YT'] },
  { date: '2026-06-24', name: { en: 'Saint-Jean-Baptiste Day', fr: 'Saint-Jean-Baptiste / Fête nationale du Québec' }, federal: false, provinces: ['QC'] },
  { date: '2026-06-24', observed: '2026-06-22', name: { en: 'Discovery Day', fr: 'Journée découverte' }, federal: false, provinces: ['NL'] },
  { date: '2026-07-01', name: { en: 'Canada Day', fr: 'Fête du Canada' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2026-07-01', name: { en: 'Memorial Day', fr: 'Jour du Souvenir' }, federal: false, provinces: ['NL'] },
  { date: '2026-07-09', name: { en: 'Nunavut Day', fr: 'Jour de Nunavut' }, federal: false, provinces: ['NU'] },
  { date: '2026-07-12', observed: '2026-07-13', name: { en: 'Orangemen’s Day', fr: 'Fête des orangistes' }, federal: false, provinces: ['NL'] },
  { date: '2026-08-03', name: { en: 'Civic Holiday', fr: 'Congé civique' }, federal: true, provinces: ['NT', 'NU'] },
  { date: '2026-08-03', name: { en: 'British Columbia Day', fr: 'Jour de Colombie-Britannique' }, federal: false, provinces: ['BC'] },
  { date: '2026-08-03', name: { en: 'New Brunswick Day', fr: 'Jour de Nouveau Brunswick' }, federal: false, provinces: ['NB'] },
  { date: '2026-08-03', name: { en: 'Saskatchewan Day', fr: 'Jour de Saskatchewan' }, federal: false, provinces: ['SK'] },
  { date: '2026-08-05', name: { en: 'Regatta Day', fr: 'Journée des régates' }, federal: false, provinces: ['NL'] },
  { date: '2026-08-17', name: { en: 'Discovery Day', fr: 'Jour de la Découverte' }, federal: false, provinces: ['YT'] },
  { date: '2026-09-07', name: { en: 'Labour Day', fr: 'Fête du Travail' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2026-09-30', name: { en: 'National Day for Truth and Reconciliation', fr: 'Journée nationale de la vérité et de la réconciliation' }, federal: true, provinces: ['BC', 'NT', 'PE', 'YT'] },
  { date: '2026-09-30', name: { en: 'Orange Shirt Day', fr: 'Jour du chandail orange' }, federal: false, provinces: ['MB'] },
  { date: '2026-10-12', name: { en: 'Thanksgiving', fr: 'Jour de l’Action de grâces' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NT', 'NU', 'ON', 'QC', 'SK', 'YT'] },
  { date: '2026-11-11', name: { en: 'Remembrance Day', fr: 'Jour du Souvenir' }, federal: true, provinces: ['AB', 'BC', 'NB', 'NL', 'NT', 'NU', 'PE', 'SK', 'YT'] },
  { date: '2026-12-25', name: { en: 'Christmas Day', fr: 'Jour de Noël' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2026-12-26', observed: '2026-12-28', name: { en: 'Boxing Day', fr: 'Lendemain de Noël' }, federal: true, provinces: ['NL', 'ON'] },
  { date: '2027-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2027-02-15', name: { en: 'Louis Riel Day', fr: 'Journée Louis Riel' }, federal: false, provinces: ['MB'] },
  { date: '2027-02-15', name: { en: 'Islander Day', fr: 'Fête des Insulaires' }, federal: false, provinces: ['PE'] },
  { date: '2027-02-15', name: { en: 'Family Day', fr: 'Fête de la famille' }, federal: false, provinces: ['AB', 'BC', 'NB', 'ON', 'SK'] },
  { date: '2027-02-15', name: { en: 'Heritage Day', fr: 'Fête du Patrimoine' }, federal: false, provinces: ['NS'] },
  { date: '2027-03-17', observed: '2027-03-15', name: { en: 'Saint Patrick’s Day', fr: 'Jour de la Saint-Patrick' }, federal: false, provinces: ['NL'] },
  { date: '2027-03-26', name: { en: 'Good Friday', fr: 'Vendredi saint' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2027-03-29', name: { en: 'Easter Monday', fr: 'Lundi de Pâques' }, federal: true, provinces: [] },
  { date: '2027-04-23', observed: '2027-04-26', name: { en: 'Saint George’s Day', fr: 'Jour de St. George' }, federal: false, provinces: ['NL'] },
  { date: '2027-05-24', name: { en: 'National Patriots’ Day', fr: 'Journée nationale des patriotes' }, federal: false, provinces: ['QC'] },
  { date: '2027-05-24', name: { en: 'Victoria Day', fr: 'Fête de Victoria' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NT', 'NU', 'ON', 'SK', 'YT'] },
  { date: '2027-06-21', name: { en: 'National Indigenous Peoples Day', fr: 'Journée nationale des peuples autochtones' }, federal: false, provinces: ['NT', 'YT'] },
  { date: '2027-06-24', name: { en: 'Saint-Jean-Baptiste Day', fr: 'Saint-Jean-Baptiste / Fête nationale du Québec' }, federal: false, provinces: ['QC'] },
  { date: '2027-06-24', observed: '2027-06-21', name: { en: 'Discovery Day', fr: 'Journée découverte' }, federal: false, provinces: ['NL'] },
  { date: '2027-07-01', name: { en: 'Canada Day', fr: 'Fête du Canada' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2027-07-01', name: { en: 'Memorial Day', fr: 'Jour du Souvenir' }, federal: false, provinces: ['NL'] },
  { date: '2027-07-09', name: { en: 'Nunavut Day', fr: 'Jour de Nunavut' }, federal: false, provinces: ['NU'] },
  { date: '2027-07-12', name: { en: 'Orangemen’s Day', fr: 'Fête des orangistes' }, federal: false, provinces: ['NL'] },
  { date: '2027-08-02', name: { en: 'Civic Holiday', fr: 'Congé civique' }, federal: true, provinces: ['NT', 'NU'] },
  { date: '2027-08-02', name: { en: 'British Columbia Day', fr: 'Jour de Colombie-Britannique' }, federal: false, provinces: ['BC'] },
  { date: '2027-08-02', name: { en: 'New Brunswick Day', fr: 'Jour de Nouveau Brunswick' }, federal: false, provinces: ['NB'] },
  { date: '2027-08-02', name: { en: 'Saskatchewan Day', fr: 'Jour de Saskatchewan' }, federal: false, provinces: ['SK'] },
  { date: '2027-08-04', name: { en: 'Regatta Day', fr: 'Journée des régates' }, federal: false, provinces: ['NL'] },
  { date: '2027-08-16', name: { en: 'Discovery Day', fr: 'Jour de la Découverte' }, federal: false, provinces: ['YT'] },
  { date: '2027-09-06', name: { en: 'Labour Day', fr: 'Fête du Travail' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2027-09-30', name: { en: 'National Day for Truth and Reconciliation', fr: 'Journée nationale de la vérité et de la réconciliation' }, federal: true, provinces: ['BC', 'NT', 'PE', 'YT'] },
  { date: '2027-09-30', name: { en: 'Orange Shirt Day', fr: 'Jour du chandail orange' }, federal: false, provinces: ['MB'] },
  { date: '2027-10-11', name: { en: 'Thanksgiving', fr: 'Jour de l’Action de grâces' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NT', 'NU', 'ON', 'QC', 'SK', 'YT'] },
  { date: '2027-11-11', name: { en: 'Remembrance Day', fr: 'Jour du Souvenir' }, federal: true, provinces: ['AB', 'BC', 'NB', 'NL', 'NT', 'NU', 'PE', 'SK', 'YT'] },
  { date: '2027-12-25', observed: '2027-12-27', name: { en: 'Christmas Day', fr: 'Jour de Noël' }, federal: true, provinces: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
  { date: '2027-12-26', observed: '2027-12-28', name: { en: 'Boxing Day', fr: 'Lendemain de Noël' }, federal: true, provinces: ['NL', 'ON'] },
] as Omit<HolidayItem, 'clc'>[]).map((h) => ({ ...h, clc: isClcHoliday(h.name.en, h.federal) })));

export const HOLIDAYS_API = 'https://canada-holidays.ca/api/v1/holidays';
