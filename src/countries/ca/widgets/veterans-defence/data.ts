/**
 * Veterans & Canadian Armed Forces facts, verified on the official pages on 2026-09-30 and re-read on 2026-10-01.
 * Used by the tools and the scripted answers (server). The widgets import only facts.ts (phones, rates,
 * joining facts): official links, titles and sources reach them through the tool output, in both languages.
 *
 * Every figure below was read on the page listed next to it ("Date modified" in brackets).
 *
 * Veterans Affairs Canada (veterans.gc.ca)
 * - Contact: 1-866-522-2122, TDD/TTY 1-833-921-0071, Monday to Friday 8:30 to 4:30 local time; in-person
 *   service by appointment only. /en/contact-us [2026-09-17]
 * - VAC Assistance Service: 1-800-268-7708 (TTY 1-800-567-5803), 24 hours a day, 365 days a year, free and
 *   confidential; for "Canadian Armed Forces Veterans, Former members of the RCMP, their families, and
 *   their caregivers" (serving RCMP members are NOT listed: see the RCMP entry below); no need to apply or to
 *   receive other VAC services; 1 to 20 hours of support per issue; appointment with a local professional
 *   usually within 5 working days. /en/mental-and-physical-health/mental-health-and-wellness/talk-professional-now [2026-07-29]
 * - Rates effective 1 January 2026, /en/about-vac/resources/rates [2026-10-01]:
 *   Education and Training Benefit max $50,569.97 (6 years of service) / $101,139.94 (12 years), up to
 *   $6,321.24 of it for short courses; Income Replacement Benefit "provides 90% of your gross pre-release
 *   military salary" with a pre-tax floor of $60,002.64 a year (the benefit is then offset by other
 *   income); Caregiver Recognition Benefit $1,264.25 a month; Canadian Forces Income Support max
 *   $2,131.63 a month (Veteran or survivor; with a spouse $3,215.57, each child $455.71, orphan $976.82); Critical Injury Benefit $92,175.45; death benefit $461,956.71;
 *   Pain and Suffering Compensation at 100%: $1,419.82 a month or $461,956.71 lump sum.
 *   Canadian Forces Income Support is the exception to "1 January": its maximums "are adjusted on a quarterly
 *   basis. The most recent adjustment took affect October 1. The next adjustment is scheduled for 1 January
 *   2027." Read on 2026-10-01 (it was $2,102.20 from 1 July). Because this changes four times a year, the
 *   benefits tool reads the amount and the adjustment date from the rates page itself (rates-live.ts, validated,
 *   cached six hours); RATES.cfisMax / cfisSince in facts.ts are the fallback and what the lab fixtures show.
 *   RE-VERIFY the fallback at every check: January, April, July, October.
 * - Disability benefits: tax-free; CAF members and Veterans, current/former RCMP; condition must be related
 *   to service; apply in My VAC Account or form PEN 923. .../disability-benefits [2026-07-29]
 * - Mental Health Benefits: coverage for anxiety, depressive and trauma- and stressor-related disorders from
 *   the day VAC receives a disability benefits application (releasing members who applied before release: "the
 *   day after your release"), for 2 years or until a favourable decision; former
 *   CAF members (and some reservists); no application. .../mental-health-benefits [2024-04-19]
 * - Education and Training Benefit: honourably released on or after 1 April 2006 (or Supplementary Reserve),
 *   at least 2,191 paid days of service (6 years); 10 years from release to apply; released between 1 April 2006
 *   and 31 March 2018: "you can access funding up to 1 April 2028". .../education-and-training-benefit [2026-07-03]
 * - Career Transition Services: serving members (Regular or Reserve) who completed basic training, Veterans
 *   released on or after 1 April 2006, spouses/partners and survivors; decision within 4 weeks. .../career-transition-services [2026-07-29]
 * - Veterans Emergency Fund: Veterans, current spouses/partners of Veterans, survivors and orphans of deceased
 *   Veterans or CAF members; food, clothing, shelter,
 *   uninsured medical costs; decision within 2 business days of a complete application, payment within 2
 *   business days of the decision. .../veterans-emergency-fund [2026-04-27]
 * - Income Replacement Benefit: taxable monthly benefit while in the Rehabilitation Program (or with a
 *   diminished earning capacity); earn up to $20,000 a year without affecting it. .../income-replacement-benefit [2026-05-05]
 * - Rehabilitation Program, Treatment Benefits, Veterans Independence Program, Caregiver Recognition Benefit,
 *   Veteran Family Program (Family Information Line 1-800-866-4546, 24/7) [all 2026-07-29]; Case management
 *   [2025-04-17]; Transition interview [2025-08-05]; OSI clinics (no application; ask VAC or your case manager for a
 *   referral; for service-related conditions; "DND offers similar services through a network of clinics called
 *   operational trauma and stress support centres", so serving members are sent to their CAF medical centre
 *   instead) [2026-07-28]; Peer support (OSISS) [2025-10-28]; Canadian Forces Income Support [2025-06-26]: IRB ended within
 *   six months, low household income, looking for work or in Career Transition Services.
 * - Survivors have their own pages and rules (both read on 2026-10-01):
 *   Canadian Forces Income Support - Survivors [2025-08-05]: for the survivor or orphan of a CAF Veteran who
 *   has a low income, when "you were receiving Earnings Loss Benefit for Survivors but it has ended" or "the
 *   deceased Veteran was receiving CFIS at time of his or her non-service related death", and who meets the
 *   Canadian residency requirement. "If the Veteran's death was not service-related, survivors must apply
 *   within 6 months of the last day of the month in which the veteran dies"; no time limit when the death
 *   was related to service (the French page omits the time limit). No job-search or Career Transition Services condition.
 *   .../death-and-bereavement/death-and-bereavement-programs/canadian-forces-income-support-survivors
 *   Veterans Independence Program for survivors [2026-07-29]: "annual tax-free funding to help cover the cost
 *   for services such as grounds maintenance and housekeeping" (no meals, personal care or health support).
 *   The deceased spouse was a Second World War or Korean War Veteran, receiving or eligible for a Disability
 *   Pension or the War Veterans Allowance, and not receiving VIP services (if they were, the survivor applies
 *   as a primary caregiver instead). The survivor was primarily responsible for their care for at least one
 *   year, unpaid; is low-income (receives the Guaranteed Income Supplement) or disabled (receives the
 *   Disability Tax Credit); has a health-related need; lives in Canada. Nothing about a service-related
 *   condition. .../housing-and-home-life/help-home/veterans-independence-program-survivors
 *
 * National Defence (canada.ca)
 * - CF Member Assistance Program: 1-800-268-7708 (TTY 1-800-567-5803), 24/7, Regular Force members and their
 *   families; certain Reserve members. /en/department-national-defence/programs/member-assistance.html [2021-10-22]
 * Royal Canadian Mounted Police (rcmp.ca / grc.ca)
 * - Serving RCMP employees: "contact the Health Canada Employee Assistance Program (EAP) at 1-800-268-7708 (or
 *   1-800-567-5803 for those with hearing impairments), available 24/7" (the same numbers as the VAC Assistance
 *   Service). Peer support: SOSI "for all categories of employees within the RCMP, and Veterans"; the VAC peer
 *   support page [2025-10-28] says "any Veteran or current member (regular or civilian) of the RCMP".
 *   /en/employee-and-family-resources/mental-health-wellbeing-and-support [2025-01-02], read 2026-10-01.
 *
 * - Mental health care for serving members at CAF medical centres, walk-in crisis services; after hours, the
 *   local emergency department or 911. .../get-help-with-mental-health-in-caf.html [2023-10-11]
 * - OSISS peer support; CAF Transition Group 1-800-883-6094, Monday to Friday 8 a.m. to 5 p.m. Eastern. .../osiss.html [2024-02-01]
 *
 * Canadian Armed Forces recruiting (forces.ca, no "Date modified" on the site; checked 2026-09-30)
 * - Careers: LIVE from https://forces.ca/api/v1/careers (the JSON the forces.ca career browser uses);
 *   110 careers on 2026-09-30, snapshot in careers.snapshot.json. The feed needs a pinned intermediate
 *   certificate that EXPIRES 2027-12-10 (forces-cert.ts): re-check it at every quarterly fact check; the server
 *   log and forces-cert.test.mjs both warn from 60 days before. Education levels: 1 Grade 10, 2 High school,
 *   3 College, 4 Bachelor's, 5 Graduate degree (forces.ca translations API). Priority processing: 30 careers
 *   have `isFeatured`; the 3 with `featuredType: 1` (Paramedic, Vehicle Technician, Weapons Engineering
 *   Technician) show "Priority Application Processing – Paid Education Entry Plan only" / "Traitement
 *   prioritaire des demandes – Programme d’enrôlement avec études subventionnées seulement" on their pages.
 *   Blurb: "When you apply to one of these careers, your application will be processed before others".
 * - Can I join: at least 17 (parent or guardian consent under 18; officers: "a minimum of 16*", which DAOD
 *   5002-1 s. 3.8 limits to applicants "selected for education and training at a Royal Military College or
 *   civilian university" or Reserve officers who stay full-time students, canada.ca [2024-06-04], read 2026-10-01); Canadian citizen or permanent resident;
 *   Grade 10 (Secondary IV in Quebec) for non-commissioned members; officers need Grade 12 and a bachelor's
 *   degree (or be working towards one), or a paid education program. /en/how-to-join/
 * - Regular Force direct entry recruits earn $4,337 to $5,484 a month during basic training; 20 paid leave
 *   days a year to start; some Regular Force occupations offer a $50,000 recruiting allowance ($10,000 +
 *   $20,000 + $20,000; the third needs six years of continuous Regular Force service). Both the allowance and
 *   signing bonuses are Regular Force only: "This bonus will not be offered when you join the Reserve Force
 *   (Part-Time)." /en/life-in-the-military/
 * - Death benefit: paid to the spouse or common-law partner and dependent children if a CAF member "died as a
 *   result of a service-related injury or disease", within 30 days of the injury or of contracting the disease;
 *   later deaths are covered through disability benefits. .../death-benefit [2026-07-29]
 * - Veteran Family Program: for medically releasing or released members and their families (no service-related
 *   condition needed); no application form. .../veteran-family-program [2026-07-29]
 * - 5 steps to join: application, background check, employment and personality assessment, medical exam,
 *   interview. /en/how-to-join/#st
 *
 * 9-8-8 Suicide Crisis Helpline: call or text 9-8-8, 24/7. https://988.ca/
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, FALLBACK, type Bi, type Lang } from './facts';

export { CHECKED, type Lang };

const V = 'https://www.veterans.gc.ca';
const C = 'https://www.canada.ca';
const DND = { en: `${C}/en/department-national-defence`, fr: `${C}/fr/ministere-defense-nationale` };

export const URLS = {
  // Veterans Affairs Canada
  vacContact: { en: `${V}/en/contact-us`, fr: `${V}/fr/contactez-nous` },
  vacServices: { en: `${V}/en/services`, fr: `${V}/fr/services` },
  vacNavigator: FALLBACK.vacNavigator,
  myVac: { en: `${V}/en/contact-us/my-vac-account`, fr: `${V}/fr/contactez-nous/mon-dossier-acc` },
  myVacSignIn: {
    en: 'https://mva-mda.vac-acc.gc.ca/pub/MVA_7_24_1?request_locale=en_CA&sign-in',
    fr: 'https://mva-mda.vac-acc.gc.ca/pub/MVA_7_24_1?request_locale=fr_CA&sign-in',
  },
  rates: { en: `${V}/en/about-vac/resources/rates`, fr: `${V}/fr/propos-dacc/ressources/taux` },
  disability: {
    en: `${V}/en/financial-programs-and-services/compensation-illness-or-injury/disability-benefits`,
    fr: `${V}/fr/programmes-et-services-financiers/indemnite-en-cas-de-maladie-ou-de-blessure/prestations-dinvalidite`,
  },
  mentalHealthBenefits: {
    en: `${V}/en/mental-and-physical-health/mental-health-and-wellness/medical-costs/mental-health-benefits`,
    fr: `${V}/fr/sante-mentale-et-physique/sante-mentale-et-bien-etre/frais-medicaux/avantages-pour-la-sante-mentale`,
  },
  treatment: {
    en: `${V}/en/financial-programs-and-services/medical-costs/coverage-services-prescriptions-and-devices`,
    fr: `${V}/fr/programmes-et-services-financiers/frais-medicaux/couverture-pour-services-ordonnances-et-appareils`,
  },
  rehab: {
    en: `${V}/en/mental-and-physical-health/mental-health-and-wellness/rehabilitation-services`,
    fr: `${V}/fr/sante-mentale-et-physique/sante-mentale-et-bien-etre/services-de-readaptation`,
  },
  irb: {
    en: `${V}/en/financial-programs-and-services/income-support/income-replacement-benefit`,
    fr: `${V}/fr/programmes-et-services-financiers/soutien-du-revenu/prestation-de-remplacement-du-revenu`,
  },
  etb: {
    en: `${V}/en/education-and-jobs/go-back-school/education-and-training-benefit`,
    fr: `${V}/fr/etudes-et-emploi/retour-aux-etudes/allocation-pour-etudes-et-formation`,
  },
  cts: {
    en: `${V}/en/education-and-jobs/prepare-release/career-transition-services`,
    fr: `${V}/fr/etudes-et-emploi/se-preparer-la-liberation/services-de-reorientation-professionnelle`,
  },
  vef: {
    en: `${V}/en/financial-programs-and-services/emergency-funds/veterans-emergency-fund`,
    fr: `${V}/fr/programmes-et-services-financiers/fonds-durgence/fonds-durgence-pour-les-veterans`,
  },
  cfis: {
    en: `${V}/en/financial-programs-and-services/income-support/canadian-forces-income-support`,
    fr: `${V}/fr/programmes-et-services-financiers/soutien-du-revenu/soutien-du-revenu-des-forces-canadiennes`,
  },
  vip: {
    en: `${V}/en/housing-and-home-life/help-home/veterans-independence-program`,
    fr: `${V}/fr/logement-et-vie-de-famille/aide-domicile/programme-pour-lautonomie-des-anciens-combattants`,
  },
  vipSurvivors: {
    en: `${V}/en/housing-and-home-life/help-home/veterans-independence-program-survivors`,
    fr: `${V}/fr/logement-et-vie-de-famille/aide-domicile/programme-pour-lautonomie-des-anciens-combattants-lintention-des-survivants`,
  },
  cfisSurvivors: {
    en: `${V}/en/financial-programs-and-services/death-and-bereavement/death-and-bereavement-programs/canadian-forces-income-support-survivors`,
    fr: `${V}/fr/programmes-et-services-financiers/deces-et-deuil/programmes-de-deces-et-deuil/soutien-du-revenu-des-forces-canadiennes-pour-les-survivants`,
  },
  crb: {
    en: `${V}/en/financial-programs-and-services/compensation-illness-or-injury/caregiver-recognition-benefit`,
    fr: `${V}/fr/programmes-et-services-financiers/indemnite-en-cas-de-maladie-ou-de-blessure/allocation-de-reconnaissance-pour-aidant`,
  },
  assistance: FALLBACK.assistance,
  osiClinics: {
    en: `${V}/en/mental-and-physical-health/mental-health-and-wellness/counselling-services/osi-clinics`,
    fr: `${V}/fr/sante-mentale-et-physique/sante-mentale-et-bien-etre/services-de-consultation/les-cliniques-tso`,
  },
  peerSupport: {
    en: `${V}/en/mental-and-physical-health/mental-health-and-wellness/counselling-services/talk-someone-who-can-relate`,
    fr: `${V}/fr/sante-mentale-et-physique/sante-mentale-et-bien-etre/services-de-consultation/parlez-quelquun-qui-comprend`,
  },
  caseManagement: { en: `${V}/en/mental-and-physical-health/case-management`, fr: `${V}/fr/sante-mentale-et-physique/gestion-de-cas` },
  transitionInterview: {
    en: `${V}/en/education-and-jobs/prepare-release/transition-interview`,
    fr: `${V}/fr/etudes-et-emploi/se-preparer-la-liberation/entrevue-de-transition`,
  },
  vfp: {
    en: `${V}/en/education-and-jobs/prepare-release/veteran-family-program`,
    fr: `${V}/fr/etudes-et-emploi/se-preparer-la-liberation/programme-pour-les-familles-des-veterans`,
  },
  deathBenefit: {
    en: `${V}/en/families-and-caregivers/financial-programs-and-services/death-benefit`,
    fr: `${V}/fr/familles-et-aidants/programmes-et-services-financiers/indemnite-de-deces`,
  },
  // National Defence / CAF
  memberAssistance: { en: `${DND.en}/programs/member-assistance.html`, fr: `${DND.fr}/programmes/aide-membres.html` },
  cafMentalHealth: {
    en: `${DND.en}/services/benefits-military/health-support/mental-health/get-help-with-mental-health-in-caf.html`,
    fr: `${DND.fr}/services/avantages-militaires/sante-soutien/sante-mentale/obtenir-aide-sante-mentale-dans-fac.html`,
  },
  osiss: {
    en: `${DND.en}/services/benefits-military/health-support/casualty-support/peer-support/osiss.html`,
    fr: `${DND.fr}/services/avantages-militaires/sante-soutien/soutien-blesses/soutien-pairs/ssbso.html`,
  },
  release: {
    en: `${DND.en}/services/benefits-military/transition/release.html`,
    fr: `${DND.fr}/services/avantages-militaires/transition/liberation.html`,
  },
  transitionCentres: { en: 'https://military-transition.canada.ca/en/locate-centres', fr: 'https://military-transition.canada.ca/fr/localiser-les-centres' },
  // RCMP (serving employees)
  rcmpWellbeing: {
    en: 'https://rcmp.ca/en/employee-and-family-resources/mental-health-wellbeing-and-support',
    fr: 'https://grc.ca/fr/ressources-lintention-employes-et-leur-famille/sante-mentale-mieux-etre-et-soutien',
  },
  // Recruiting (forces.ca)
  careers: FALLBACK.careers,
  howToJoin: { en: 'https://forces.ca/en/how-to-join/', fr: 'https://forces.ca/fr/vous-enroler/' },
  steps: { en: 'https://forces.ca/en/how-to-join/#st', fr: 'https://forces.ca/fr/vous-enroler/#st' },
  apply: { en: 'https://forces.ca/en/apply-now/', fr: 'https://forces.ca/fr/postuler/' },
  life: { en: 'https://forces.ca/en/life-in-the-military/', fr: 'https://forces.ca/fr/la-vie-militaire/' },
  paidEducation: { en: 'https://forces.ca/en/paid-education/', fr: 'https://forces.ca/fr/etudes-payees/' },
  reserve: { en: 'https://forces.ca/en/reserve-force/', fr: 'https://forces.ca/fr/force-de-reserve/' },
  recruitingCentre: { en: 'https://forces.ca/en/find-a-recruiting-centre/', fr: 'https://forces.ca/fr/trouvez-un-centre-de-recrutement/' },
  // Crisis
  crisis: { en: 'https://988.ca/', fr: 'https://988.ca/fr' },
} as const;

export type UrlKey = keyof typeof URLS;

/** Official page titles (from each page's <title>, 2026-09-30), used for sources and citations. */
const TITLES: Partial<Record<UrlKey, Bi>> = {
  vacContact: { en: 'Contact us | Veterans Affairs Canada', fr: 'Contactez-nous | Anciens Combattants Canada' },
  vacServices: { en: 'Services | Veterans Affairs Canada', fr: 'Services | Anciens Combattants Canada' },
  vacNavigator: { en: 'Benefits Navigator', fr: 'Le navigateur des avantages' },
  myVac: { en: 'My VAC Account | Veterans Affairs Canada', fr: 'Mon dossier ACC | Anciens Combattants Canada' },
  rates: { en: 'Rates | Veterans Affairs Canada', fr: 'Taux | Anciens Combattants Canada' },
  disability: { en: 'Disability benefits', fr: 'Prestations d’invalidité' },
  mentalHealthBenefits: { en: 'Mental Health Benefits', fr: 'Avantages pour la santé mentale' },
  treatment: { en: 'Treatment benefits', fr: 'Couverture pour services, ordonnances et appareils' },
  rehab: { en: 'Rehabilitation services', fr: 'Services de réadaptation' },
  irb: { en: 'Income Replacement Benefit', fr: 'Prestation de remplacement du revenu' },
  etb: { en: 'Education and Training Benefit', fr: 'Allocation pour études et formation' },
  cts: { en: 'Career Transition Services', fr: 'Services de réorientation professionnelle' },
  vef: { en: 'Veterans Emergency Fund', fr: 'Fonds d’urgence pour les vétérans' },
  cfis: { en: 'Canadian Forces Income Support', fr: 'Soutien du revenu des Forces canadiennes' },
  vip: { en: 'Veterans Independence Program', fr: 'Programme pour l’autonomie des anciens combattants' },
  vipSurvivors: { en: 'Veterans Independence Program for survivors', fr: 'Programme pour l’autonomie des anciens combattants à l’intention des survivants' },
  cfisSurvivors: { en: 'Canadian Forces Income Support - Survivors', fr: 'Allocation de soutien du revenu des Forces canadiennes – survivants' },
  crb: { en: 'Caregiver Recognition Benefit', fr: 'Allocation de reconnaissance pour aidant' },
  assistance: { en: 'Talk to a mental health professional', fr: 'Parlez à un professionnel de la santé mentale' },
  osiClinics: { en: 'OSI Clinics', fr: 'Les cliniques BSO' },
  peerSupport: { en: 'Peer support', fr: 'Soutien par les pairs' },
  caseManagement: { en: 'Case management', fr: 'Gestion de cas' },
  transitionInterview: { en: 'Transition interview', fr: 'Entrevue de transition' },
  vfp: { en: 'Veteran Family Program', fr: 'Programme pour les familles des vétérans' },
  deathBenefit: { en: 'Death benefit', fr: 'Indemnité de décès' },
  memberAssistance: { en: 'CF Member Assistance Program', fr: 'Programme d’aide aux membres des FC' },
  cafMentalHealth: { en: 'How to access care and access mental health services', fr: 'Comment accéder aux soins et aux services de santé mentale' },
  osiss: { en: 'Operational Stress Injury Social Support (OSISS) services', fr: 'Soutien social aux blessés de stress opérationnel' },
  release: { en: 'Military release process', fr: 'Processus de libération du service militaire' },
  transitionCentres: { en: 'Locate your closest Transition Centre', fr: 'Localisez le centre de transition le plus proche de vous' },
  rcmpWellbeing: { en: 'Mental health, wellbeing and support | Royal Canadian Mounted Police', fr: 'Santé mentale, mieux-être et soutien | Gendarmerie royale du Canada' },
  careers: { en: 'Careers | Canadian Armed Forces', fr: 'Carrières | Forces armées canadiennes' },
  howToJoin: { en: 'Joining the Canadian Armed Forces', fr: 'S’enrôler dans les Forces armées canadiennes' },
  apply: { en: 'Apply Now | Canadian Armed Forces', fr: 'Postulez maintenant | Forces armées canadiennes' },
  life: { en: 'Life in the Forces | Canadian Armed Forces', fr: 'La vie dans les forces | Forces armées canadiennes' },
  reserve: { en: 'Reserve Force | Canadian Armed Forces', fr: 'Force de réserve | Forces armées canadiennes' },
  paidEducation: { en: 'Paid education | Canadian Armed Forces', fr: 'Études payées | Forces armées canadiennes' },
  steps: { en: 'Steps to join | Canadian Armed Forces', fr: 'Étapes pour vous enrôler | Forces armées canadiennes' },
  crisis: { en: '9-8-8: Suicide Crisis Helpline', fr: '9-8-8 : Ligne d’aide en cas de crise de suicide' },
};

/** "Date modified" of each page, where the page shows one. */
const UPDATED: Partial<Record<UrlKey, string>> = {
  vacContact: '2026-09-17',
  vacServices: '2025-12-16',
  vacNavigator: '2024-06-14',
  myVac: '2026-09-22',
  rates: '2026-10-01',
  disability: '2026-07-29',
  mentalHealthBenefits: '2024-04-19',
  treatment: '2026-07-29',
  rehab: '2026-07-29',
  irb: '2026-05-05',
  etb: '2026-07-03',
  cts: '2026-07-29',
  vef: '2026-04-27',
  cfis: '2025-06-26',
  vip: '2026-07-29',
  vipSurvivors: '2026-07-29',
  cfisSurvivors: '2025-08-05',
  crb: '2026-07-29',
  assistance: '2026-07-29',
  osiClinics: '2026-07-28',
  peerSupport: '2025-10-28',
  caseManagement: '2025-04-17',
  transitionInterview: '2025-08-05',
  vfp: '2026-07-29',
  deathBenefit: '2026-07-29',
  memberAssistance: '2021-10-22',
  cafMentalHealth: '2023-10-11',
  osiss: '2024-02-01',
  release: '2024-11-25',
  transitionCentres: '2026-03-04',
  rcmpWellbeing: '2025-01-02',
};

const titleOf = (key: UrlKey, lang: Lang) => TITLES[key]?.[lang] ?? URLS[key][lang];

export function source(key: UrlKey, lang: Lang, extra: Partial<ToolSource> = {}): ToolSource {
  const updated = UPDATED[key];
  return { title: titleOf(key, lang), url: URLS[key][lang], checked: CHECKED, ...(updated ? { updated } : {}), ...extra };
}

/** Markdown citation with the page title, e.g. `[1](https://… "Disability benefits")`. */
export const cite = (n: number, key: UrlKey, lang: Lang) => `[${n}](${URLS[key][lang]} "${titleOf(key, lang).replace(/"/g, '')}")`;
