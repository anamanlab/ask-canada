/**
 * Source catalog for the business tools (used on the server by build.ts, never by the renderers): page titles
 * and "Date modified" for each official URL, the quotes we cite, and `ref()`, which builds one page in both
 * languages so the widget can re-express its sources without this table.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, URLS, type L2, type Lang, type SourceRef, type UrlKey } from './data';

/** Page titles (from each page's <title>) and "Date modified". */
const PAGES: Partial<Record<UrlKey, { title: L2; updated?: string }>> = {
  gstWhen: {
    title: { en: 'When to register for and start charging the GST/HST', fr: 'Quand s’inscrire et commencer à facturer la TPS/TVH' },
    updated: '2026-06-16',
  },
  gstRates: { title: { en: 'GST/HST calculator (and rates)', fr: 'Calculatrice de la TPS/TVH (et tableau des taux)' }, updated: '2025-04-01' },
  needBn: { title: { en: 'When you need a BN', fr: 'Quand avez-vous besoin d’un NE' }, updated: '2026-06-30' },
  accounts: { title: { en: 'Program accounts you may need', fr: 'Comptes de programme dont vous pourriez avoir besoin' }, updated: '2026-09-03' },
  registerBn: {
    title: { en: 'Register as a resident with a Canadian business', fr: 'Inscription à titre de résident exploitant une entreprise canadienne' },
    updated: '2026-09-03',
  },
  rideshare: {
    title: { en: 'Register as a rideshare driver or taxi operator', fr: 'S’inscrire comme chauffeur de covoiturage ou chauffeur de taxi' },
    updated: '2026-08-20',
  },
  soleProp: { title: { en: 'Sole proprietorship', fr: 'Entreprise individuelle' }, updated: '2026-08-17' },
  partnership: { title: { en: 'Partnership', fr: 'Société de personnes' }, updated: '2026-08-17' },
  corporation: { title: { en: 'Corporation', fr: 'Société' }, updated: '2026-08-17' },
  structures: {
    title: { en: 'Creating and maintaining a social enterprise', fr: 'Création et exploitation d’une entreprise sociale' },
    updated: '2025-09-18',
  },
  howIncorporate: { title: { en: 'How to incorporate a business', fr: 'Comment incorporer une entreprise' }, updated: '2026-02-25' },
  ccFees: { title: { en: 'Services, fees and processing times', fr: 'Services, frais et délais d’exécution' }, updated: '2025-05-06' },
  ccBenefits: { title: { en: 'Benefits of incorporating', fr: 'Les avantages de la constitution en société' }, updated: '2025-09-16' },
  extraProvincial: {
    title: { en: 'Register a federal corporation in a province or territory', fr: 'Enregistrer une corporation fédérale dans une province ou un territoire' },
    updated: '2022-06-26',
  },
  annualReturn: { title: { en: 'Annual return', fr: 'Rapport annuel' }, updated: '2026-04-20' },
  supportFinancing: {
    title: { en: 'Getting business support and financing', fr: 'Obtenir du soutien et du financement pour votre entreprise' },
    updated: '2026-07-22',
  },
  bbf: { title: { en: 'Business Benefits Finder', fr: 'Outil de recherche d’aide aux entreprises' } },
  csbfp: { title: { en: 'Canada Small Business Financing Program', fr: 'Programme de financement des petites entreprises du Canada' }, updated: '2026-06-25' },
  irap: { title: { en: 'Support for technology innovation', fr: 'Soutien à l’innovation technologique' }, updated: '2025-12-22' },
  tcs: { title: { en: 'Trade Commissioner Service', fr: 'Service des délégués commerciaux' }, updated: '2026-07-20' },
  canadaStrong: { title: { en: 'Find support for your business', fr: 'Trouvez du soutien pour votre entreprise' }, updated: '2026-09-22' },
  tariffResponses: {
    title: { en: 'Canada’s tariff responses to the changing global trade landscape', fr: 'Les droits de douane du Canada en réponse à l’évolution du paysage commercial mondial' },
    updated: '2026-09-29',
  },
  importGuide: {
    title: { en: 'Guide to importing commercial goods into Canada', fr: 'Guide sur l’importation de marchandises commerciales au Canada' },
    updated: '2026-09-17',
  },
  importSetup: { title: { en: 'Set up your business to import', fr: 'Préparer votre entreprise à l’importation' }, updated: '2026-09-17' },
  importDuties: { title: { en: 'Select the duties and taxes that apply', fr: 'Sélectionner les droits et taxes qui s’appliquent' }, updated: '2026-09-17' },
  exportGuide: { title: { en: 'Exporters’ guide to reporting', fr: 'Guide de déclaration à l’intention des exportateurs' }, updated: '2024-10-21' },
  canexport: { title: { en: 'CanExport SMEs', fr: 'CanExport PME' }, updated: '2026-02-09' },
  dutiesRelief: { title: { en: 'Duties Relief Program', fr: 'Programme d’exonération des droits' }, updated: '2025-08-19' },
  drawback: { title: { en: 'Drawback Program', fr: 'Programme de drawback' }, updated: '2025-04-03' },
  counterTariffs: {
    title: { en: 'Complete list of U.S. products subject to counter tariffs', fr: 'Liste complète des produits américains assujettis à des contre-mesures tarifaires' },
    updated: '2026-08-26',
  },
  rqRegister: { title: { en: 'Registering for the GST and QST', fr: 'Inscription aux fichiers de la TPS et de la TVQ' } },
  fx: { title: { en: 'Daily exchange rates – Bank of Canada', fr: 'Taux de change quotidiens – Banque du Canada' } },
};

export const QUOTES = {
  gstSmall: {
    en: 'You do not exceed the $30,000 threshold over four consecutive calendar quarters. You are a small supplier.',
    fr: 'Vous ne dépassez pas le seuil de 30 000 $ au cours de quatre trimestres civils consécutifs. Vous êtes un petit fournisseur.',
  },
  incorporate: {
    en: 'Incorporate online for $200 and get your certificate within one business day.',
    fr: 'L’incorporation en ligne coûte 200 $ et vous obtenez votre certificat en moins d’un jour ouvrable.',
  },
  unincorporated: {
    en: 'In contrast, unincorporated entities like sole proprietorships and partnerships are not distinct from their owners.',
    fr: 'À l’inverse, les entités non constituées en société, les entreprises individuelles et les sociétés de personnes ne sont pas distinctes de leurs propriétaires.',
  },
} satisfies Record<string, L2>;

function page(key: UrlKey, lang: Lang, o: RefOptions): ToolSource {
  const p = PAGES[key];
  return {
    title: p?.title[lang] ?? key,
    url: URLS[key][lang],
    checked: CHECKED,
    ...(p?.updated ? { updated: p.updated } : {}),
    ...o.over,
    ...(o.quote ? { quote: o.quote[lang] } : {}),
  };
}

type RefOptions = {
  /** A sentence quoted from the page, in both languages. */
  quote?: L2;
  /** Fields that override the catalog (e.g. `live` and the observation date for live data). */
  over?: Partial<ToolSource>;
  /** Not in the tool's own list: shown only when the widget asks for it. */
  extra?: boolean;
};

/** One official page in both languages. */
export const ref = (key: UrlKey, o: RefOptions = {}): SourceRef => ({ key, en: page(key, 'en', o), fr: page(key, 'fr', o), ...(o.extra ? { extra: true as const } : {}) });

/** The tool's `sources` (what the chat numbers and cites), in the answer's language. */
export const listed = (refs: SourceRef[], lang: Lang): ToolSource[] => refs.filter((r) => !r.extra).map((r) => r[lang]);
