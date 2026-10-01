/**
 * Canadian citizenship facts, verified against canada.ca on 2026-09-30 (each URL + its "Date modified").
 * Isomorphic: used by the tools (server) and the widgets (client, for instant recalculation).
 *
 * Verified facts
 * - Eligibility (adults 18+): permanent resident; physically present 1,095 days (3 years) in the 5-year
 *   eligibility period (the 5 years before the date you sign), which must include at least 730 days as a PR;
 *   each day as a temporary resident or protected person counts as 0.5 day, max 365 days of credit
 *   (= 730 calendar days); time in prison, on parole or probation doesn't count; taxes filed for 3 of the
 *   5 years if required; language proof (CLB/NCLC 4) and the test for ages 18-54 on the day you sign;
 *   oath at the ceremony for 18+ (and minors 14-17; "Minors under 14 don't need to take the oath of
 *   citizenship"); "apply with more than 1,095 days". Minor 5(2) (Canadian parent or a parent applying at
 *   the same time): no minimum days; minor 5(1): 1,095 days. adult-minor/who.html (2026-04-21, re-read 2026-09-30)
 * - Day counting: the day you leave and the day you return count as days in Canada; only full days away
 *   are absences (leave Jul 1, return Jul 6 = 4 days absent). The eligibility period runs from the date
 *   5 years before you sign up to the day before you sign (apply Apr 1 2018 -> Apr 1 2013 to Mar 31 2018).
 *   Form CIT 0407 "How to Calculate Physical Presence" (05-2019), cit0407.html (2025-01-29)
 * - Online application is recommended; paper required for Crown-servant time or when a representative
 *   submits for you. The calculator lives in the online account; the paper calculator can be used to
 *   check first. Application returned if received more than 90 days after the signature date.
 *   adult-minor/how.html (2026-04-21); adult-minor/how/physical-presence.html (2025-09-11)
 * - Fees (live list used by canada.ca: /content/dam/ircc/documents/json/fees.json, read 2026-09-30):
 *   adult $653 total = $530 processing + $123 right of citizenship fee; minor $100. The right of
 *   citizenship fee is refunded to adults if not approved; minors "don't pay the right of citizenship fee"
 *   (citizenship-ceremony/when.html, 2026-06-12). adult-minor/how.html (2026-04-21)
 * - Processing time (live: /content/dam/ircc/documents/json/flpt-en.json, key current-flpt/citizen-grants):
 *   "About 12 months", about 327,100 people waiting, last updated September 3, 2026 (monthly).
 * - After you apply: confirmation email (not the AOR); AOR once complete; test invitation within a few
 *   weeks or months; available in Canada for test/interview/ceremony; tell IRCC if away 2+ weeks.
 *   adult-minor/after.html (2026-04-21)
 * - Test: 20 questions (multiple choice or true/false), English or French, 45 minutes, pass with 15/20
 *   (75%), 3 chances, 30 days to take the online test, based only on Discover Canada.
 *   test/study.html, test/how-it-works.html, test/results.html (2026-03-31)
 * - Ceremony: invitation at least 1 week before; virtual or in person; bring the invitation, PR card (even
 *   expired) or Confirmation of PR, 2 pieces of ID (adults: 1 with photo + signature); oath text below;
 *   PR card cut (virtual) or collected (in person); sign the Oath or Affirmation form the same day.
 *   citizenship-ceremony/when.html (2026-06-12), bring.html (2025-09-11), expect.html (2026-06-04)
 * - After: e-certificate in the IRCC Portal within 5 business days of the signed oath form; paper
 *   certificate at in-person ceremonies, or by mail 2-4 weeks after a virtual one; passport only after the
 *   certificate; the citizenship certificate isn't a travel document. citizenship-ceremony/after.html (2026-09-16)
 * - Never give IRCC phone numbers; send people to self-service pages (CDS AI Answers, context-ircc).
 */
import type { ToolSource } from '@/lib/widgets/types';

export const CHECKED = '2026-09-30';

export type Lang = 'en' | 'fr';
type L<T = string> = Record<Lang, T>;

export const RULES = {
  requiredDays: 1095,
  windowYears: 5,
  prMinDays: 730,
  tempFactor: 0.5,
  tempCap: 365,
  taxYears: 3,
  languageAges: [18, 54] as const,
  oathMinAge: 14,
  returnedAfterDays: 90,
} as const;

export const TEST = {
  questions: 20,
  toPass: 15,
  minutes: 45,
  attempts: 3,
  daysToTake: 30,
} as const;

/** Fees verified 2026-09-30 (fallback when the live fee list can't be read). */
export const FEES = {
  adultTotal: 653,
  adultProcessing: 530,
  rightOfCitizenship: 123,
  minor: 100,
} as const;

/** Processing time snapshot verified 2026-09-30 (fallback when the live feed can't be read). */
export const PROCESSING_SNAPSHOT = {
  en: 'About 12 months',
  fr: 'Environ 12 mois',
  waiting: { en: 'About 327,100 people waiting', fr: 'Environ 327 100 personnes sont en attente' },
  updated: '2026-09-03',
} as const;

const C = 'https://www.canada.ca';
const B: L = {
  en: `${C}/en/immigration-refugees-citizenship/services/canadian-citizenship`,
  fr: `${C}/fr/immigration-refugies-citoyennete/services/citoyennete-canadienne`,
};
const DC: L = {
  en: `${C}/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada`,
  fr: `${C}/fr/immigration-refugies-citoyennete/organisation/publications-guides/decouvrir-canada`,
};

export const URLS = {
  apply: { en: `${B.en}/adult-minor.html`, fr: `${B.fr}/adulte-mineur.html` },
  who: { en: `${B.en}/adult-minor/who.html`, fr: `${B.fr}/adulte-mineur/qui.html` },
  how: { en: `${B.en}/adult-minor/how.html`, fr: `${B.fr}/adulte-mineur/comment.html` },
  after: { en: `${B.en}/adult-minor/after.html`, fr: `${B.fr}/adulte-mineur/apres.html` },
  presence: { en: `${B.en}/adult-minor/how/physical-presence.html`, fr: `${B.fr}/adulte-mineur/comment/calculatrice.html` },
  calculator: {
    en: 'https://eservices.cic.gc.ca/rescalc/resCalcStartNew.do?lang=en',
    fr: 'https://eservices.cic.gc.ca/rescalc/resCalcStartNew.do?lang=fr',
  },
  journal: {
    en: `${B.en}/become-canadian-citizen/eligibility/record-trips-outside-canada.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/admissibilite/enregistrer-voyages-hors-du-canada.html`,
  },
  applyOnline: { en: 'https://citapply-citdemande.apps.cic.gc.ca/en/landing', fr: 'https://citapply-citdemande.apps.cic.gc.ca/fr/landing' },
  cit0407: {
    en: `${C}/en/immigration-refugees-citizenship/services/application/application-forms-guides/cit0407.html`,
    fr: `${C}/fr/immigration-refugies-citoyennete/services/demande/formulaires-demande-guides/cit0407.html`,
  },
  test: { en: `${B.en}/test.html`, fr: `${B.fr}/examen.html` },
  testHow: { en: `${B.en}/test/how-it-works.html`, fr: `${B.fr}/examen/fonctionnement.html` },
  study: { en: `${B.en}/test/study.html`, fr: `${B.fr}/examen/etudier.html` },
  results: { en: `${B.en}/test/results.html`, fr: `${B.fr}/examen/resultats.html` },
  guide: { en: `${DC.en}.html`, fr: `${DC.fr}.html` },
  ceremony: {
    en: `${B.en}/become-canadian-citizen/citizenship-ceremony.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/ceremonie-citoyennete.html`,
  },
  expect: {
    en: `${B.en}/become-canadian-citizen/citizenship-ceremony/expect.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/ceremonie-citoyennete/attendre.html`,
  },
  bring: {
    en: `${B.en}/become-canadian-citizen/citizenship-ceremony/bring.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/ceremonie-citoyennete/apporter.html`,
  },
  when: {
    en: `${B.en}/become-canadian-citizen/citizenship-ceremony/when.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/ceremonie-citoyennete/quand.html`,
  },
  afterCeremony: {
    en: `${B.en}/become-canadian-citizen/citizenship-ceremony/after.html`,
    fr: `${B.fr}/devenir-citoyen-canadien/ceremonie-citoyennete/apres.html`,
  },
  findCeremony: { en: 'https://secure.cic.gc.ca/CeremonyCeremonie/en/Home', fr: 'https://secure.cic.gc.ca/CeremonyCeremonie/fr/Accueil' },
  processingTimes: {
    en: `${C}/en/immigration-refugees-citizenship/services/application/check-processing-times.html`,
    fr: `${C}/fr/immigration-refugies-citoyennete/services/demande/verifier-delais-traitement.html`,
  },
  status: {
    en: `${C}/en/immigration-refugees-citizenship/services/application/check-status.html`,
    fr: `${C}/fr/immigration-refugies-citoyennete/services/demande/verifier-etat.html`,
  },
  vote: {
    en: 'https://www.elections.ca/content.aspx?section=vot&dir=reg&document=index&lang=e',
    fr: 'https://www.elections.ca/content.aspx?section=vot&dir=reg&document=index&lang=f',
  },
  newPassport: {
    en: `${C}/en/immigration-refugees-citizenship/services/canadian-passports/new-adult-passport.html`,
    fr: `${C}/fr/immigration-refugies-citoyennete/services/passeports-canadiens/nouveau-passeport-adulte.html`,
  },
} as const;

/** Live feeds read server-side by the tools (never from the browser). */
export const FEEDS = {
  fees: `${C}/content/dam/ircc/documents/json/fees.json`,
  processing: { en: `${C}/content/dam/ircc/documents/json/flpt-en.json`, fr: `${C}/content/dam/ircc/documents/json/flpt-fr.json` },
} as const;

/** Discover Canada chapters (quiz explanations link to the chapter the answer comes from). */
export const CHAPTERS = {
  rights: { en: 'rights-resonsibilities-citizenship', fr: 'droits-responsabilites-citoyennete', title: { en: 'Rights and Responsibilities of Citizenship', fr: 'Les droits et responsabilités liés à la citoyenneté' } },
  who: { en: 'who-are-canadians', fr: 'qui-sont-canadiens', title: { en: 'Who We Are', fr: 'Qui sommes-nous, les Canadiens?' } },
  history: { en: 'canadas-history', fr: 'histoire-canada', title: { en: 'Canada’s History', fr: 'L’histoire du Canada' } },
  govern: { en: 'how-canadians-govern-themselves', fr: 'canadiens-systeme-gouvernement', title: { en: 'How Canadians Govern Themselves', fr: 'Les Canadiens et leur système de gouvernement' } },
  elections: { en: 'federal-elections', fr: 'elections-federales', title: { en: 'Federal Elections', fr: 'Les élections fédérales' } },
  justice: { en: 'justice-system', fr: 'systeme-justice', title: { en: 'The Justice System', fr: 'Le système de justice' } },
  symbols: { en: 'canadian-symbols', fr: 'symboles-canadiens', title: { en: 'Canadian Symbols', fr: 'Les symboles canadiens' } },
  economy: { en: 'canadas-economy', fr: 'economie-canada', title: { en: 'Canada’s Economy', fr: 'L’économie canadienne' } },
  regions: { en: 'canadas-regions', fr: 'regions-canada', title: { en: 'Canada’s Regions', fr: 'Les régions du Canada' } },
} as const;
export type ChapterId = keyof typeof CHAPTERS;

export const chapterUrl = (id: ChapterId, lang: Lang) =>
  `${DC[lang]}/${lang === 'fr' ? 'lisez-ligne' : 'read-online'}/${CHAPTERS[id][lang]}.html`;

/**
 * Oath of citizenship, as printed on "What to expect at the ceremony" (2026-06-04).
 * The oath is set out in the Citizenship Act; reproduced line by line for practice.
 */
export const OATH: L<string[]> = {
  en: [
    'I swear (or affirm)',
    'That I will be faithful',
    'And bear true allegiance',
    'To His Majesty',
    'King Charles the Third',
    'King of Canada',
    'His Heirs and Successors',
    'And that I will faithfully observe',
    'The laws of Canada',
    'Including the Constitution',
    'Which recognizes and affirms',
    'The Aboriginal and treaty rights of',
    'First Nations, Inuit and Métis peoples',
    'And fulfill my duties',
    'As a Canadian citizen.',
  ],
  fr: [
    'Je jure (ou j’affirme solennellement)',
    'Que je serai fidèle',
    'Et porterai sincère allégeance',
    'À Sa Majesté',
    'Le roi Charles Trois',
    'Roi du Canada',
    'À ses héritiers et successeurs',
    'Que j’observerai fidèlement',
    'Les lois du Canada',
    'Y compris la Constitution',
    'Qui reconnaît et confirme les droits',
    'Ancestraux ou issus de traités',
    'Des Premières Nations, des Inuits et des Métis',
    'Et que je remplirai loyalement',
    'Mes obligations',
    'De citoyen canadien.',
  ],
};

/** Opening line with the choice made: swear or affirm. */
export const OATH_OPENING: Record<Lang, { swear: string; affirm: string }> = {
  en: { swear: 'I swear', affirm: 'I affirm' },
  fr: { swear: 'Je jure', affirm: 'J’affirme solennellement' },
};

const T = {
  who: { en: 'Canadian citizenship for adults and minor children: Who can apply', fr: 'Citoyenneté canadienne pour adultes et enfants mineurs : Qui peut présenter une demande' },
  how: { en: 'Canadian citizenship for adults and minor children: How to apply', fr: 'Citoyenneté canadienne pour adultes et enfants mineurs : Comment présenter une demande' },
  after: { en: 'Canadian citizenship for adults and minor children: After you apply', fr: 'Citoyenneté canadienne pour adultes et enfants mineurs : Après avoir présenté une demande' },
  presence: { en: 'Apply for citizenship: Calculate your physical presence', fr: 'Demander la citoyenneté : Calculez votre présence effective' },
  study: { en: 'Citizenship test: Study for the test', fr: 'Examen pour la citoyenneté : étudier pour l’examen' },
  guide: { en: 'Discover Canada: The Rights and Responsibilities of Citizenship', fr: 'Découvrir le Canada : Les droits et responsabilités liés à la citoyenneté' },
  results: { en: 'Citizenship test: Test results and next steps', fr: 'Examen pour la citoyenneté : résultats et prochaines étapes' },
  expect: { en: 'Citizenship ceremony: What to expect at the ceremony', fr: 'Cérémonie de citoyenneté : À quoi s’attendre lors de la cérémonie' },
  bring: { en: 'Citizenship ceremony: What to bring to the ceremony', fr: 'Cérémonie de citoyenneté : Ce qu’il faut apporter à la cérémonie' },
  when: { en: 'Citizenship ceremony: When to go to the ceremony', fr: 'Cérémonie de citoyenneté : Quand assister à la cérémonie' },
  afterCeremony: { en: 'Citizenship ceremony: After the ceremony', fr: 'Cérémonie de citoyenneté : Après la cérémonie' },
  processing: { en: 'Check processing times', fr: 'Vérifiez les délais de traitement actuels de l’IRCC' },
};

const src = (key: keyof typeof T, url: string, lang: Lang, updated?: string, quote?: L): ToolSource => ({
  // French titles keep the colon on the same line (U+00A0 before ':').
  title: lang === 'fr' ? T[key][lang].replace(/ :/g, '\u00a0:') : T[key][lang],
  url,
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...(quote ? { quote: quote[lang] } : {}),
});

export function presenceSources(lang: Lang): ToolSource[] {
  return [
    src('who', URLS.who[lang], lang, '2026-04-21', {
      en: 'You must have been physically in Canada for at least 1,095 days (3 years) during your 5-year eligibility period.',
      fr: 'Vous devez avoir été effectivement présent au Canada pendant au moins 1 095 jours (3 ans) au cours de votre période d’admissibilité de 5 ans.',
    }),
    src('presence', URLS.presence[lang], lang, '2025-09-11'),
    src('how', URLS.how[lang], lang, '2026-04-21'),
  ];
}

export function testSources(lang: Lang): ToolSource[] {
  return [
    src('study', URLS.study[lang], lang, '2026-03-31', {
      en: 'You need to get at least 15 of the 20 questions right to pass the test.',
      fr: 'Pour réussir l’examen, vous devrez répondre correctement à au moins 15 des 20 questions.',
    }),
    src('guide', URLS.guide[lang], lang, '2025-02-14'),
    src('results', URLS.results[lang], lang, '2026-03-31'),
  ];
}

export function stepsSources(lang: Lang, live: { fees: boolean; processing: boolean }): ToolSource[] {
  return [
    src('how', URLS.how[lang], lang, '2026-04-21'),
    { ...src('processing', URLS.processingTimes[lang], lang), ...(live.processing ? { live: true } : {}) },
    src('who', URLS.who[lang], lang, '2026-04-21'),
    src('after', URLS.after[lang], lang, '2026-04-21'),
    src('study', URLS.study[lang], lang, '2026-03-31'),
    src('expect', URLS.expect[lang], lang, '2026-06-04'),
  ];
}

export function ceremonySources(lang: Lang): ToolSource[] {
  return [
    src('expect', URLS.expect[lang], lang, '2026-06-04', {
      en: 'We encourage you to practise the oath and anthem before the ceremony.',
      fr: 'Nous vous encourageons à répéter le serment et l’hymne avant la cérémonie.',
    }),
    src('bring', URLS.bring[lang], lang, '2025-09-11'),
    src('when', URLS.when[lang], lang, '2026-06-12'),
    src('afterCeremony', URLS.afterCeremony[lang], lang, '2026-09-16'),
  ];
}
