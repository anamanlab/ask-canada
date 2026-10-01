/** Citations for the scripted business answers: numbered links that carry the official page title. */
import { type UrlKey, URLS } from '../data';

export type Lang = 'en' | 'fr';

/** Page titles for citations, so the Sources list reads like the official pages. */
const TITLE: Partial<Record<UrlKey, { en: string; fr: string }>> = {
  gstWhen: { en: 'When to register for and start charging the GST/HST', fr: 'Quand s’inscrire et commencer à facturer la TPS/TVH' },
  rideshare: { en: 'Register as a rideshare driver or taxi operator', fr: 'S’inscrire comme chauffeur de covoiturage ou chauffeur de taxi' },
  registerBn: { en: 'Register as a resident with a Canadian business', fr: 'Inscription à titre de résident exploitant une entreprise canadienne' },
  needBn: { en: 'When you need a BN', fr: 'Quand avez-vous besoin d’un NE' },
  soleProp: { en: 'Sole proprietorship', fr: 'Entreprise individuelle' },
  partnership: { en: 'Partnership', fr: 'Société de personnes' },
  corporation: { en: 'Corporation', fr: 'Société' },
  structures: { en: 'Creating and maintaining a social enterprise', fr: 'Création et exploitation d’une entreprise sociale' },
  ccBenefits: { en: 'Benefits of incorporating', fr: 'Les avantages de la constitution en société' },
  howIncorporate: { en: 'How to incorporate a business', fr: 'Comment incorporer une entreprise' },
  ccFees: { en: 'Services, fees and processing times', fr: 'Services, frais et délais d’exécution' },
  extraProvincial: { en: 'Register a federal corporation in a province or territory', fr: 'Enregistrer une corporation fédérale dans une province ou un territoire' },
  annualReturn: { en: 'Annual return', fr: 'Rapport annuel' },
  bbf: { en: 'Business Benefits Finder', fr: 'Outil de recherche d’aide aux entreprises' },
  supportFinancing: { en: 'Getting business support and financing', fr: 'Obtenir du soutien et du financement pour votre entreprise' },
  csbfp: { en: 'Canada Small Business Financing Program', fr: 'Programme de financement des petites entreprises du Canada' },
  canadaStrong: { en: 'Find support for your business', fr: 'Trouvez du soutien pour votre entreprise' },
  importSetup: { en: 'Set up your business to import', fr: 'Préparer votre entreprise à l’importation' },
  importDuties: { en: 'Select the duties and taxes that apply', fr: 'Sélectionner les droits et taxes qui s’appliquent' },
  tariffResponses: {
    en: 'Canada’s tariff responses to the changing global trade landscape',
    fr: 'Les droits de douane du Canada en réponse à l’évolution du paysage commercial mondial',
  },
  exportGuide: { en: 'Exporters’ guide to reporting', fr: 'Guide de déclaration à l’intention des exportateurs' },
  counterTariffs: {
    en: 'Complete list of U.S. products subject to counter tariffs',
    fr: 'Liste complète des produits américains assujettis à des contre-mesures tarifaires',
  },
  gstRates: { en: 'GST/HST calculator (and rates)', fr: 'Calculatrice de la TPS/TVH (et tableau des taux)' },
  canexport: { en: 'CanExport SMEs', fr: 'CanExport PME' },
  tcs: { en: 'Trade Commissioner Service', fr: 'Service des délégués commerciaux' },
};

/** Numbered citation with the page title: [n](url "Title"). */
export const c = (n: number, key: UrlKey, lang: Lang) => {
  const title = TITLE[key]?.[lang];
  return `[${n}](${URLS[key][lang]}${title ? ` "${title.replace(/"/g, '’')}"` : ''})`;
};
