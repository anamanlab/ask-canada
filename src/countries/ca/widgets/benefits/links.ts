/**
 * The few official pages the widget itself needs in the browser: where its error states send people when the
 * tool can't answer. Every other link arrives in the tool output (see ./data.ts, which builds on these).
 */
const C = 'https://www.canada.ca';

export const bilingual = (en: string, fr: string) => ({ en: `${C}${en}`, fr: `${C}${fr}` });

export const LINK_BASE = {
  CRA: '/en/revenue-agency/services/child-family-benefits',
  ARC: '/fr/agence-revenu/services/prestations-enfants-familles',
} as const;

export const OFFICIAL = {
  finder: bilingual('/en/services/benefits/finder.html', '/fr/services/prestations/chercheur.html'),
  ccb: bilingual(`${LINK_BASE.CRA}/canada-child-benefit-overview.html`, `${LINK_BASE.ARC}/allocation-canadienne-enfants.html`),
  ei: bilingual('/en/services/benefits/ei/ei-regular-benefit.html', '/fr/services/prestations/ae/assurance-emploi-reguliere.html'),
  oas: bilingual('/en/services/benefits/publicpensions/old-age-security.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse.html'),
  cpp: bilingual('/en/services/benefits/publicpensions/cpp.html', '/fr/services/prestations/pensionspubliques/rpc.html'),
} as const;
