/**
 * The small facts the widgets need on the device: phone numbers, rates, CAF joining facts and the three
 * official pages the error states fall back to. Isomorphic and tiny on purpose: the full catalogue of
 * official pages, titles and "Date modified" stamps lives in data.ts and stays on the server (the tools
 * return the links and sources in both languages). Where each figure was read: the comment block in data.ts.
 */
export type Lang = 'en' | 'fr';
export type Bi = { en: string; fr: string };

export const CHECKED = '2026-10-01';

export const PHONES = {
  vac: '1-866-522-2122',
  vacTty: '1-833-921-0071',
  assistance: '1-800-268-7708',
  assistanceTty: '1-800-567-5803',
  familyLine: '1-800-866-4546',
  transitionGroup: '1-800-883-6094',
  crisis: '9-8-8',
  emergency: '911',
} as const;

/** `tel:` form of a phone number. */
export const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
/** `sms:` form of a number (e.g. 9-8-8 takes texts). */
export const sms = (n: string) => `sms:${n.replace(/[^\d]/g, '')}`;

export const RATES = {
  effective: '2026-01-01',
  etb6: 50569.97,
  etb12: 101139.94,
  etbShort: 6321.24,
  irbMin: 60002.64,
  crbMonthly: 1264.25,
  cfisMax: 2131.63,
  /**
   * Canadian Forces Income Support maximums are adjusted every quarter: the date of the adjustment `cfisMax`
   * is from. The benefits tool re-reads both from the rates page (rates-live.ts); these are the fallback.
   */
  cfisSince: '2026-10-01',
  criticalInjury: 92175.45,
  deathBenefit: 461956.71,
  pscMonthly100: 1419.82,
  pscLump100: 461956.71,
  irbEarnings: 20000,
} as const;
/** The same figures as plain numbers and dates: the tool may send a fresher quarterly figure than the one above. */
export type Rates = { [K in keyof typeof RATES]: (typeof RATES)[K] extends number ? number : string };

export const CAF = {
  minAge: 17,
  payMin: 4337,
  payMax: 5484,
  leaveDays: 20,
  recruitingAllowance: 50000,
  steps: 5,
} as const;

/** Where each widget's error state sends people (also the same entries in data.ts `URLS`). */
export const FALLBACK = {
  careers: { en: 'https://forces.ca/en/careers', fr: 'https://forces.ca/fr/carrieres' },
  vacNavigator: {
    en: 'https://www.veterans.gc.ca/en/about-vac/resources/find-programs-and-services/benefits-navigator',
    fr: 'https://www.veterans.gc.ca/fr/propos-dacc/ressources/trouvez-de-linformation-sur-les-programmes-et-les-services/navigateur-des-avantages-dacc',
  },
  assistance: {
    en: 'https://www.veterans.gc.ca/en/mental-and-physical-health/mental-health-and-wellness/talk-professional-now',
    fr: 'https://www.veterans.gc.ca/fr/sante-mentale-et-physique/sante-mentale-et-bien-etre/parlez-un-professionnel-des-aujourdhui',
  },
} as const satisfies Record<string, Bi>;

/** The UI language a card shows: English or French when the interface is one of them, else the answer's. */
export const langOf = (locale: string, fallback: Lang): Lang => (locale === 'fr' ? 'fr' : locale === 'en' ? 'en' : fallback);

/**
 * A tool output in the UI language. Tools return the language-dependent parts (links, names, sources) for
 * the answer's language at the top level and for the other one under `alt`, so a card can follow the
 * interface language without the page catalogue in the bundle.
 */
export function inLanguage<O extends { lang: Lang; alt?: { lang: Lang } }>(output: O, lang: Lang): O {
  return output.alt && output.alt.lang === lang && output.lang !== lang ? { ...output, ...output.alt } : output;
}
