/**
 * The links and sources each tool output carries, in one language (pure). Outputs hold them for the language
 * of the conversation and, under `alt`, for the other official language, so the renderers never need the URL
 * catalogue in ./data.ts. Used by the tools (./live-*.ts, ./dental-build.ts) and the fixtures.
 */
import { dentalSources, drugSources, recallSources, travelSources, URLS, type Lang, type TravelModified } from './data';
import type { DentalLinks, DentalView } from './dental';
import type { DrugLinks } from './drugs';
import type { RecallCategory, RecallLinks } from './recalls';
import { searchUrlFor } from './recalls-parse';
import type { TravelLinks } from './travel';

export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/** `any`: the official search for notices that mention any of the words, not the exact phrase. */
export function recallLinks(lang: Lang, live: boolean, query?: string | null, category?: RecallCategory | 'all', any = false): RecallLinks {
  return {
    searchUrl: searchUrlFor(lang, query, category, undefined, any),
    subscribeUrl: URLS.recallsSubscribe[lang],
    reportUrl: URLS.reportConcern[lang],
    vehicleUrl: URLS.vehicleRecalls[lang],
    sources: recallSources(lang, live),
  };
}

export function dentalLinks(lang: Lang, view: DentalView): DentalLinks {
  const all = dentalSources(lang);
  return {
    applyUrl: URLS.dentalApply[lang],
    qualifyUrl: URLS.dentalQualify[lang],
    coverageUrl: URLS.dentalCoverage[lang],
    contactUrl: URLS.dentalContact[lang],
    providersUrl: URLS.dentalProviders[lang],
    nihbUrl: URLS.nihbDental[lang],
    // The summary card is about coverage, so its footer leads with the coverage page.
    sources: view === 'summary' ? [all[1], all[0], ...all.slice(2)] : all,
  };
}

export function drugLinks(lang: Lang, live: boolean): DrugLinks {
  return { dpdUrl: URLS.dpd[lang], lnhpdUrl: URLS.lnhpd[lang], sideEffectUrl: URLS.sideEffect[lang], sources: drugSources(lang, live) };
}

/** `modified` holds each page's own "Date modified", read from the page when it was fetched. */
export function travelLinks(lang: Lang, live: boolean, modified?: TravelModified): TravelLinks {
  return {
    urls: { notices: URLS.thn[lang], vaccines: URLS.travelVaccines[lang], clinic: URLS.travelClinic[lang], advisories: URLS.advisories[lang] },
    sources: travelSources(lang, live, modified),
  };
}
