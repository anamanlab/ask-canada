/**
 * Source lists for the jobs tools' outputs (titles in the answer language, URLs and dates from ./data.ts).
 * Used by tools/jobs.ts and the lab fixtures only.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, URLS, outlookUrl, wagesUrl, type Lang, type Province } from './data';

const T = {
  jobBank: { en: 'Job Bank: search for jobs', fr: 'Guichet-Emplois : recherche d’emplois' },
  wages: { en: 'Job Bank: wages by occupation', fr: 'Guichet-Emplois : salaires par profession' },
  outlook: { en: 'Job Bank: job prospects', fr: 'Guichet-Emplois : perspectives d’emploi' },
  gcJobs: { en: 'Government of Canada jobs', fr: 'Emplois au gouvernement du Canada' },
  gcJobsSearch: { en: 'GC Jobs: job search', fr: 'Emplois GC : recherche d’emplois' },
  youth: { en: 'Youth and student employment', fr: 'Emplois pour les jeunes et les étudiants' },
  fswep: { en: 'Federal Student Work Experience Program', fr: 'Programme fédéral d’expérience de travail étudiant' },
  csj: { en: 'Canada Summer Jobs', fr: 'Emplois d’été Canada' },
  yess: { en: 'Youth Employment and Skills Strategy', fr: 'Stratégie emploi et compétences jeunesse' },
  studentPay: { en: 'Student rates of pay', fr: 'Taux de rémunération des étudiants' },
  jobBankYouth: { en: 'Job Bank: find a job as a young Canadian', fr: 'Guichet-Emplois : trouver un emploi pour les jeunes' },
  careers: { en: 'Job Bank: explore careers', fr: 'Guichet-Emplois : explorer les carrières' },
  findajob: { en: 'Job Bank: find a job', fr: 'Guichet-Emplois : trouver un emploi' },
};

export function searchSources(lang: Lang, searchUrl: string, live: boolean): ToolSource[] {
  return [
    { title: T.jobBank[lang], url: searchUrl, checked: CHECKED, updated: '2026-08-07', live },
    { title: T.gcJobs[lang], url: URLS.gcJobs[lang], checked: CHECKED, updated: '2026-09-29' },
  ];
}

export function wageSources(lang: Lang, profileId: string, geo: Province | 'ca', live: boolean): ToolSource[] {
  return [
    {
      title: T.wages[lang],
      url: wagesUrl(lang, profileId, geo),
      checked: CHECKED,
      updated: '2026-08-07',
      live,
      quote: lang === 'fr' ? 'Ces salaires ont été mis à jour le 19 novembre 2025.' : 'These wages were updated on November 19, 2025.',
    },
    { title: T.outlook[lang], url: outlookUrl(lang, profileId, geo), checked: CHECKED, updated: '2026-08-07', live },
  ];
}

/** When the occupation wasn't recognised: Job Bank's own career explorer. */
export function careerSources(lang: Lang): ToolSource[] {
  return [{ title: T.careers[lang], url: URLS.trendAnalysis[lang], checked: CHECKED, updated: '2026-08-07' }];
}

export function matchSources(lang: Lang): ToolSource[] {
  return [
    { title: T.wages[lang], url: URLS.trendAnalysis[lang], checked: CHECKED, updated: '2026-08-07' },
    { title: T.findajob[lang], url: URLS.jobBankFind[lang], checked: CHECKED, updated: '2026-08-07' },
  ];
}

export function programSources(lang: Lang): ToolSource[] {
  return [
    { title: T.youth[lang], url: URLS.youthJobs[lang], checked: CHECKED, updated: '2026-09-28' },
    {
      title: T.csj[lang],
      url: URLS.csj[lang],
      checked: CHECKED,
      updated: '2026-08-14',
      quote: lang === 'fr' ? 'aide les jeunes de 15 à 30 ans à acquérir une expérience de travail rémunérée pendant l’été' : 'helps youth aged 15 to 30 gain paid summer work experience',
    },
    { title: T.fswep[lang], url: URLS.fswep[lang], checked: CHECKED, updated: '2024-02-23' },
    { title: T.gcJobs[lang], url: URLS.gcJobs[lang], checked: CHECKED, updated: '2026-09-29' },
    // The search itself: it opens without signing in (the page shows no "Date modified").
    { title: T.gcJobsSearch[lang], url: URLS.gcJobsSearch[lang], checked: CHECKED },
    { title: T.yess[lang], url: URLS.yess[lang], checked: CHECKED, updated: '2026-06-10' },
    { title: T.studentPay[lang], url: URLS.studentPay[lang], checked: CHECKED, updated: '2025-01-28' },
    { title: T.jobBankYouth[lang], url: URLS.jobBankYouth[lang], checked: CHECKED, updated: '2026-08-07' },
  ];
}
