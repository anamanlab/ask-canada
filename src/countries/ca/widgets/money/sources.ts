/**
 * The Sources list for each money tool: page titles, "Date modified" and the quoted sentences, in both
 * official languages. Used by ./build only (the tools on the server, the lab fixtures), so none of it ships
 * with the widgets: each output carries `sourcesByLang` and the widget picks the page language.
 * Which pages each tool cites, and in what order, is in ./links (CITED).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, type Lang } from './data';
import { CITED, LEAD_TITLES, URLS, type MoneyTool } from './links';
import type { LiveRates } from './rates';

type Key = keyof typeof URLS;

/**
 * Titles are copied from the live pages (checked 2026-10-01): the page's h1, or its <title> where the h1 is
 * shared by a whole guide (the three ESDC education-savings pages) or carries no publisher (CMHC, Bank of Canada).
 * The title of each tool's first source lives in ./links (the widget's loading state needs it).
 */
const TITLES: Partial<Record<Key, { en: string; fr: string; updated?: string; updatedFr?: string }>> = {
  respAmounts: { ...LEAD_TITLES.resp, updated: '2026-08-10' },
  respOpen: { en: 'Open a Registered Education Savings Plan and apply for benefits', fr: 'Ouvrir un Régime enregistré d’épargne-études et demander des prestations', updated: '2025-10-16', updatedFr: '2026-08-19' },
  clb: { en: 'Canada Learning Bond - Automatic enrolment', fr: 'Bon d’études canadien (BEC) - Inscription automatique', updated: '2026-07-02' },
  respPay: {
    en: 'Pay for education using the Registered Education Savings Plans and related benefits',
    fr: 'Payer ses études à l’aide du régime enregistré d’épargne-études',
    updated: '2025-10-16',
  },
  respLimit: { en: 'Registered Education Savings Plans contributions', fr: 'Cotisations à un régime enregistré d’épargne-études', updated: '2026-02-27' },
  savingFuture: { ...LEAD_TITLES.compare, updated: '2026-02-04' },
  tfsaRoom: { en: 'Calculate your TFSA contribution room', fr: 'Calculer vos droits de cotisation aux CELI', updated: '2026-02-20' },
  limits: {
    en: 'MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE',
    fr: 'Plafonds des CD, des PD, des REER, des RPDB, des RVDAA, des CELI, MGAP et le MSGAP',
    updated: '2025-12-01',
  },
  rrspLimit: {
    en: 'How contributions affect your RRSP deduction limit',
    fr: 'Effet de vos cotisations sur le maximum déductible au titre des REER',
    updated: '2026-01-29',
  },
  fhsa: {
    en: 'First Home Savings Account (FHSA)',
    fr: 'Compte d’épargne libre d’impôt pour l’achat d’une première propriété (CELIAPP)',
    updated: '2026-02-02',
  },
  marginalRates: { en: 'Tax rates and income brackets', fr: 'Taux d’imposition et tranches de revenu', updated: '2026-01-20' },
  fhsaClose: { en: 'Closing your FHSAs', fr: 'Fermer vos CELIAPP', updated: '2026-02-02' },
  hbp: { en: 'The Home Buyers’ Plan', fr: 'Le régime d’accession à la propriété', updated: '2026-02-17' },
  mortgagePrep: { ...LEAD_TITLES.mortgage, updated: '2025-10-15' },
  downPayment: { en: 'How much you need for a down payment', fr: 'Combien faut-il pour une mise de fonds', updated: '2025-10-15' },
  reforms: {
    en: 'Boldest mortgage reforms in decades come into force today',
    fr: 'Les réformes hypothécaires les plus audacieuses des dernières décennies entrent en vigueur aujourd’hui',
    updated: '2024-12-15',
  },
  cmhcPremiums: { en: 'Mortgage loan insurance premiums | CMHC', fr: 'Primes d’assurance prêt hypothécaire | SCHL' },
  boc: {
    en: 'Canadian interest rates and monetary policy variables: 10-year lookup - Bank of Canada',
    fr: 'Taux d’intérêt au Canada et variables clés relatives à la politique monétaire - dix dernières années - Banque du Canada',
  },
  budget: { ...LEAD_TITLES.budget, updated: '2025-08-21' },
  budgetPlanner: { en: 'Budget Planner', fr: 'Planificateur budgétaire', updated: '2019-03-01' },
};

function source(key: Key, lang: Lang, extra: Partial<ToolSource> = {}): ToolSource {
  const t = TITLES[key];
  return {
    title: t ? t[lang] : URLS[key][lang],
    url: URLS[key][lang],
    checked: CHECKED,
    ...(t?.updated ? { updated: (lang === 'fr' && t.updatedFr) || t.updated } : {}),
    ...extra,
  };
}

/** The sentence quoted with a source in the answer's Sources list. */
const QUOTED: Partial<Record<Key, Record<Lang, string>>> = {
  respAmounts: {
    en: 'This way, a child could get up to $1,000 of the CESG in their RESP per calendar year if there are unused amounts from previous years.',
    fr: 'un enfant pourrait obtenir jusqu’à 1 000 $ de la SCEE dans son REEE par année civile s’il y a des montants inutilisés',
  },
  mortgagePrep: {
    en: 'Your total monthly housing costs shouldn’t be more than 39% of your gross household income.',
    fr: 'Les frais de logement mensuels totaux ne doivent pas dépasser 39 % du revenu brut de votre ménage.',
  },
  budget: {
    en: 'Your emergency fund should provide you with enough money to cover your living expenses for 3 to 6 months.',
    fr: 'Votre fonds d’urgence devrait contenir assez d’argent pour couvrir de 3 à 6 mois de vos dépenses habituelles.',
  },
};

const cited = (tool: MoneyTool, lang: Lang): ToolSource[] => CITED[tool].map((key: Key) => source(key, lang, QUOTED[key] ? { quote: QUOTED[key][lang] } : {}));

export const respSources = (lang: Lang): ToolSource[] => cited('resp', lang);
export const compareSources = (lang: Lang): ToolSource[] => cited('compare', lang);
/** The Bank of Canada page is marked live, with the date of its latest value, when the rates were fetched. */
export const mortgageSources = (lang: Lang, rates: LiveRates): ToolSource[] =>
  cited('mortgage', lang).map((s) => (rates.live && s.url === URLS.boc[lang] ? { ...s, live: true, checked: rates.posted5y?.date ?? rates.policy?.date ?? CHECKED } : s));
export const budgetSources = (lang: Lang): ToolSource[] => cited('budget', lang);
