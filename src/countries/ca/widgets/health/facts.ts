/**
 * The few facts the renderers need on the device (isomorphic, tiny): the Canadian Dental Care Plan numbers the
 * checker recalculates with, and the official page each tool falls back to when it fails. Everything else
 * (URL catalogue, source lists) stays on the server in ./data.ts and arrives in the tool output.
 * Verified 2026-09-30; the page-by-page record is at the top of ./data.ts.
 */
export type Lang = 'en' | 'fr';

export const CDCP = {
  incomeLimit: 90_000,
  /** Co-payment tiers by adjusted family net income (upper bound exclusive). */
  tiers: [
    { below: 70_000, copay: 0 },
    { below: 80_000, copay: 40 },
    { below: 90_000, copay: 60 },
  ],
  phone: '1-833-537-4342',
  tty: '1-833-677-6262',
  benefitPeriod: '2026-2027',
  benefitPeriodEnds: '2027-06-30',
  renewalClosed: '2026-06-01',
  optOutCutoff: '2023-12-11',
} as const;

/** The official page behind each tool: where the error state sends people. */
export const OFFICIAL = {
  dentalQualify: {
    en: 'https://www.canada.ca/en/services/benefits/dental/dental-care-plan/qualify.html',
    fr: 'https://www.canada.ca/fr/services/prestations/dentaire/regime-soins-dentaires/admissibilite.html',
  },
  recalls: { en: 'https://recalls-rappels.canada.ca/en', fr: 'https://recalls-rappels.canada.ca/fr' },
  dpd: { en: 'https://health-products.canada.ca/dpd-bdpp/', fr: 'https://health-products.canada.ca/dpd-bdpp/?lang=fre' },
  thn: { en: 'https://travel.gc.ca/travelling/health-safety/travel-health-notices', fr: 'https://voyage.gc.ca/voyager/sante-securite/conseils-sante-voyageurs' },
} as const;

/**
 * A tool output in the reader's language. Tools answer in the language of the conversation and carry the other
 * language's links and sources in `alt`; when the interface language differs, the official pages still open in
 * the reader's language (notice titles and database labels keep the language they were fetched in).
 */
export function inLang<T extends { lang: Lang; alt?: Partial<T> }>(data: T, lang: Lang): T {
  return data.lang === lang || !data.alt ? data : { ...data, ...data.alt };
}
