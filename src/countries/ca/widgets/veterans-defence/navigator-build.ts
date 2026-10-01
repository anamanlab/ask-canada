/**
 * Veterans benefits navigator: builds the tool output (server, scripted answers and lab fixtures). Program
 * names, official pages and sources come from data.ts, in both official languages, so the widget never
 * needs the catalogue.
 */
import { PHONES, RATES } from './facts';
import { URLS, source, type Lang } from './data';
import { NEEDS, PROGRAMS, navigate, refFor, variantKey, type BenefitsInput, type BenefitsOutput, type BenefitsRefs, type NavAnswers, type Need, type Service, type Status } from './navigator';

/** Official program names (Veterans Affairs Canada / National Defence), EN and FR. */
const PROGRAM_NAMES: Record<string, { en: string; fr: string }> = {
  transitionInterview: { en: 'Transition interview', fr: 'Entrevue de transition' },
  disability: { en: 'Disability benefits', fr: 'Prestations d’invalidité' },
  mentalHealthBenefits: { en: 'Mental Health Benefits', fr: 'Avantages pour la santé mentale' },
  assistance: { en: 'VAC Assistance Service', fr: 'Service d’aide d’ACC' },
  etb: { en: 'Education and Training Benefit', fr: 'Allocation pour études et formation' },
  cts: { en: 'Career Transition Services', fr: 'Services de réorientation professionnelle' },
  rehab: { en: 'Rehabilitation Program', fr: 'Programme de réadaptation' },
  irb: { en: 'Income Replacement Benefit', fr: 'Prestation de remplacement du revenu' },
  vef: { en: 'Veterans Emergency Fund', fr: 'Fonds d’urgence pour les vétérans' },
  treatment: { en: 'Treatment Benefits', fr: 'Avantages médicaux' },
  osiClinics: { en: 'Operational stress injury (OSI) clinics', fr: 'Cliniques pour blessures de stress opérationnel (BSO)' },
  caseManagement: { en: 'Case management', fr: 'Gestion de cas' },
  vip: { en: 'Veterans Independence Program', fr: 'Programme pour l’autonomie des anciens combattants' },
  crb: { en: 'Caregiver Recognition Benefit', fr: 'Allocation de reconnaissance pour aidant' },
  cfis: { en: 'Canadian Forces Income Support', fr: 'Soutien du revenu des Forces canadiennes' },
  vfp: { en: 'Veteran Family Program', fr: 'Programme pour les familles des vétérans' },
  memberAssistance: { en: 'CF Member Assistance Program', fr: 'Programme d’aide aux membres des FC' },
  deathBenefit: { en: 'Death benefit', fr: 'Indemnité de décès' },
  // Programs with their own page and rules for one audience (see `variants` in navigator.ts).
  'vip.survivor': { en: 'Veterans Independence Program for survivors', fr: 'Programme pour l’autonomie des anciens combattants à l’intention des survivants' },
  'cfis.survivor': { en: 'Canadian Forces Income Support for survivors', fr: 'Soutien du revenu des Forces canadiennes pour les survivants' },
};

/** [key, program id, page] for every audience that has its own page for a program. */
const VARIANTS = PROGRAMS.flatMap((p) => Object.entries(p.variants ?? {}).map(([status, v]) => ({ key: variantKey(p.id, status as Status), id: p.id, url: v.url })));

const serviceOf = (years: number | undefined): Service => (years == null ? 'unsure' : years >= 12 ? '12plus' : years >= 6 ? '6to11' : 'under6');

/** Everything in the output that depends on the language: official links, program pages and names, source titles. */
function benefitsRefs(lang: Lang, status: Status, live?: RatesOverride): BenefitsRefs {
  return {
    lang,
    links: {
      myVacSignIn: URLS.myVacSignIn[lang],
      myVac: URLS.myVac[lang],
      contact: URLS.vacContact[lang],
      navigator: URLS.vacNavigator[lang],
      transitionCentres: URLS.transitionCentres[lang],
      rates: URLS.rates[lang],
    },
    urls: Object.fromEntries([...PROGRAMS.map((p) => [p.id, URLS[p.url][lang]]), ...VARIANTS.map((v) => [v.key, URLS[v.url][lang]])]),
    names: Object.fromEntries([...PROGRAMS.map((p) => [p.id, PROGRAM_NAMES[p.id]?.[lang] ?? p.id]), ...VARIANTS.map((v) => [v.key, PROGRAM_NAMES[v.key]?.[lang] ?? PROGRAM_NAMES[v.id]?.[lang] ?? v.id])]),
    sources: [
      source('vacServices', lang, {
        quote:
          lang === 'fr'
            ? 'Vous pourriez être admissible à des services qui soutiennent vos finances, vos études, votre santé mentale et plus encore.'
            : 'You may qualify for services to support your finances, education, mental health and more.',
      }),
      source('rates', lang, live ? { updated: live.updated, checked: live.checked } : {}),
      source('disability', lang),
      source('etb', lang),
      source('vef', lang),
      source('assistance', lang),
      source('vacContact', lang),
      // Serving RCMP members are not covered by the VAC Assistance Service: their own line is on rcmp.ca.
      ...(status === 'rcmp' ? [source('rcmpWellbeing', lang)] : []),
      // The pages whose rules the cards state for this audience (read on 2026-10-01).
      ...VARIANTS.filter((v) => v.key.endsWith(`.${status}`)).map((v) => source(v.url, lang, { checked: '2026-10-01' })),
    ],
  };
}

/** Figures read from the rates page by the tool (rates-live.ts); without them the verified ones in facts.ts are used. */
export type RatesOverride = { cfisMax: number; cfisSince: string; updated: string; checked: string };

export function buildBenefits(input: BenefitsInput, live?: RatesOverride): BenefitsOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const needs = (input.needs ?? []).filter((n): n is Need => (NEEDS as readonly string[]).includes(n));
  const answers: NavAnswers = {
    status: input.status ?? 'veteran',
    serviceRelated: input.serviceRelated ?? 'unsure',
    needs: [...new Set(needs)],
    service: serviceOf(input.yearsOfService),
  };
  return {
    answers,
    known: input.status != null,
    phones: PHONES,
    rates: live ? { ...RATES, cfisMax: live.cfisMax, cfisSince: live.cfisSince } : RATES,
    ...benefitsRefs(lang, answers.status, live),
    alt: benefitsRefs(lang === 'fr' ? 'en' : 'fr', answers.status, live),
  };
}

/** What the model sees: the programs that fit, by name, with their official page. */
export function benefitsForModel(o: BenefitsOutput) {
  return {
    answers: o.answers,
    programs: navigate(o.answers)
      .filter((r) => r.inNeeds)
      .map((r) => ({ name: refFor(o.names, r.program.id, o.answers.status) ?? r.program.id, fit: r.fit, url: refFor(o.urls, r.program.id, o.answers.status) })),
    phones: { vac: o.phones.vac, assistance24_7: o.phones.assistance },
    links: o.links,
    sources: o.sources,
  };
}
