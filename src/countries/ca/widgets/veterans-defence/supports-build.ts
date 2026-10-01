/**
 * Mental health supports: builds the tool output (server, scripted answers and lab fixtures), with links
 * and sources in both official languages from data.ts.
 */
import { PHONES } from './facts';
import { URLS, source, type Lang } from './data';
import { SUPPORTS, type SupportsInput, type SupportsOutput, type SupportsRefs } from './supports';

/** Language-dependent parts of the output: links and source titles. */
function supportsRefs(lang: Lang): SupportsRefs {
  return {
    lang,
    // `rcmpServing`: where serving RCMP members are sent (the VAC Assistance Service lists former members only).
    urls: { ...Object.fromEntries(SUPPORTS.map((s) => [s.id, URLS[s.url][lang]])), rcmpServing: URLS.rcmpWellbeing[lang] },
    links: { crisis: URLS.crisis[lang], vacContact: URLS.vacContact[lang] },
    sources: [
      source('assistance', lang, {
        // The service's name rather than the page's long title, so the card's source line stays on one row.
        title: lang === 'fr' ? 'Service d’aide d’ACC' : 'VAC Assistance Service',
        quote:
          lang === 'fr'
            ? 'Le Service d’aide d’ACC offre un soutien psychologique gratuit à court terme avec un professionnel de la santé mentale.'
            : 'The VAC Assistance Service provides free, short-term psychological support with a mental health professional.',
      }),
      source('memberAssistance', lang),
      source('osiss', lang),
      source('osiClinics', lang),
      source('mentalHealthBenefits', lang),
      source('vfp', lang),
      source('cafMentalHealth', lang),
      source('crisis', lang),
      source('peerSupport', lang),
      source('rcmpWellbeing', lang),
    ],
  };
}

export function buildSupports(input: SupportsInput): SupportsOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const audience = input.audience ?? 'veteran';
  return {
    audience,
    phones: PHONES,
    ...supportsRefs(lang),
    alt: supportsRefs(lang === 'fr' ? 'en' : 'fr'),
  };
}
