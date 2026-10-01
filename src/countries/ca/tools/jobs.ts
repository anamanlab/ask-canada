/**
 * AI tools for the `jobs` widget (facts + live sources: widgets/jobs/data.ts).
 *   jobsSearch       — live Job Bank postings for a keyword + place, with deep links and filters.
 *   jobsWages        — live Job Bank wages (low / median / high) and 3-year outlook by province and region.
 *   jobsResumeMatch  — occupations that fit someone's skills and past job titles; the widget also reads an
 *                      uploaded resume on the device (the file itself is never sent to the server).
 *   jobsPrograms     — youth, student and government job programs (GC Jobs, FSWEP, Canada Summer Jobs…).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { URLS, WAGES_REF_PERIOD, WAGES_UPDATED, jobBankSearchUrl, outlookUrl, provinceFrom, wagesUrl, type Lang, type SearchFilters } from '../widgets/jobs/data';
import { catalogFallback, fetchOutlook, fetchWages, resolveLocation, resolveOccupation, searchJobBank } from '../widgets/jobs/live';
import { knownTerms, scoreText, toMatches } from '../widgets/jobs/match';
import { OCCUPATIONS, canonicalQuery, occupationFromTitle, occupationNames } from '../widgets/jobs/occupations';
import { careerSources, matchSources, programSources, searchSources, wageSources } from '../widgets/jobs/sources';
import type { MatchOutput, ProgramsOutput, SearchOutput, WagesOutput } from '../widgets/jobs/types';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (links and job titles follow it).');
const L = (l?: Lang): Lang => (l === 'fr' ? 'fr' : 'en');

export const tools = {
  jobsSearch: tool({
    description:
      'Live job search on Job Bank (Government of Canada’s national job board, jobbank.gc.ca / guichetemplois.gc.ca). Returns the number of matching postings, the newest relevant postings (title, employer, place, pay, posted date, on-site/remote, link to the posting), a count by province, and a deep link to the full search. Use whenever someone wants to find, browse or see jobs or openings for a kind of work, optionally in a place ("nursing jobs in Halifax", "remote data analyst jobs", "student jobs in Ontario", "emplois de soudeur à Québec"). Put only the kind of work in `query` (a job title or keyword, e.g. "welder", not "jobs"; for "student jobs in Toronto" leave it empty and set student) and the place in `location` (city, "City, PR", province or postal code). For government-of-Canada careers, student programs or summer jobs call jobsPrograms instead; for pay by occupation call jobsWages.',
    inputSchema: z.object({
      query: z.string().max(80).optional().describe('Job title or keyword, e.g. "registered nurse", "electrician", "customer service". Leave empty for a filter-only search such as all student jobs in a city.'),
      location: z.string().max(80).optional().describe('City ("Halifax" or "Halifax, NS"), province/territory ("Alberta", "QC") or postal code. Omit for all of Canada.'),
      remote: z.boolean().optional().describe('Only remote jobs (work from home).'),
      student: z.boolean().optional().describe('Only postings flagged for students.'),
      recent: z.boolean().optional().describe('Only postings from the last 48 hours.'),
      fullTime: z.boolean().optional().describe('Only full-time (true) or only part-time (false).'),
      lang,
    }),
    execute: async ({ query, location, remote, student, recent, fullTime, lang: l }): Promise<SearchOutput> => {
      const lg = L(l);
      const q = canonicalQuery((query ?? '').trim(), lg);
      const filters: SearchFilters = { remote: remote || undefined, student: student || undefined, recent: recent || undefined, hours: fullTime == null ? undefined : fullTime ? 'F' : 'P' };
      const { loc, unresolved } = await resolveLocation(location, lg);
      const occ = q ? occupationFromTitle(q) : undefined;
      const live = await searchJobBank(lg, q, loc, filters);
      const searchUrl = live?.url ?? jobBankSearchUrl(lg, q, loc, filters);
      return {
        lang: lg,
        query: q,
        location: loc,
        unresolvedLocation: unresolved,
        filters,
        live: !!live,
        total: live?.total ?? null,
        jobs: live?.jobs ?? [],
        duplicates: live?.duplicates ?? 0,
        byProvince: loc.kind === 'canada' ? (live?.byProvince ?? []) : [],
        searchUrl,
        occupation: occ ? { key: occ.key, profileId: occ.profileId, title: occ.title[lg], median: occ.wage.median, ...occupationNames(occ) } : undefined,
        fetchedAt: new Date().toISOString(),
        sources: searchSources(lg, searchUrl, !!live),
      };
    },
  }),

  jobsWages: tool({
    description:
      'Wage explorer from Job Bank (Labour Force Survey data): low, median and high hourly wages for an occupation in Canada, in every province and territory, and by economic region within one province, plus Job Bank’s 3-year job prospects (stars) by province. Use for "how much does a welder make", "salary of a nurse in BC", "average pay for electricians in Alberta", "combien gagne un plombier au Québec", or when comparing pay across provinces. Pass the occupation as a job title; pass the province if one was named (a city maps to its province).',
    inputSchema: z.object({
      occupation: z.string().min(2).max(80).describe('Job title, e.g. "registered nurse", "software developer", "soudeur".'),
      province: z.string().max(60).optional().describe('Province or territory (name or 2-letter code) to show regional wages for.'),
      lang,
    }),
    execute: async ({ occupation, province, lang: l }): Promise<WagesOutput> => {
      const lg = L(l);
      const prov = provinceFrom(province);
      const occ = await resolveOccupation(occupation, lg);
      if (!occ) {
        const picks = ['registered-nurse', 'electrician', 'software-developer', 'truck-driver', 'administrative-assistant', 'early-childhood-educator'];
        return {
          lang: lg,
          status: 'not-found',
          query: occupation,
          province: prov,
          unit: 'hour',
          live: false,
          provinces: [],
          regions: [],
          links: { wages: URLS.trendAnalysis[lg], outlook: URLS.trendAnalysis[lg], jobs: jobBankSearchUrl(lg, occupation) },
          suggestions: OCCUPATIONS.filter((o) => picks.includes(o.key)).map((o) => ({ key: o.key, title: o.title[lg], titles: o.title })),
          sources: careerSources(lg),
        };
      }
      const [nat, outlook, regional] = await Promise.all([
        fetchWages(occ.profileId, 'ca'),
        fetchOutlook(occ.profileId),
        prov ? fetchWages(occ.profileId, prov, lg) : Promise.resolve(null),
      ]);
      const snap = catalogFallback(occ.profileId);
      const live = !!nat;
      const provinces = (nat?.provinces ?? []).map((p) => ({ ...p, outlook: outlook?.[p.code] }));
      return {
        lang: lg,
        status: 'ok',
        query: occupation,
        occupation: occ,
        province: prov,
        unit: nat?.unit ?? 'hour',
        live,
        updated: nat?.updated ?? (snap ? WAGES_UPDATED : undefined),
        refPeriod: nat?.refPeriod ?? (snap ? WAGES_REF_PERIOD : undefined),
        national: nat?.national ?? (snap ? { ...snap.wage } : undefined),
        provinces,
        regions: regional?.regions ?? [],
        links: {
          wages: wagesUrl(lg, occ.profileId, prov ?? 'ca'),
          outlook: outlookUrl(lg, occ.profileId, prov ?? 'ca'),
          jobs: jobBankSearchUrl(lg, snap?.search[lg] ?? occ.title, prov ? { kind: 'province', province: prov } : { kind: 'canada' }),
        },
        suggestions: [],
        sources: wageSources(lg, occ.profileId, prov ?? 'ca', live),
      };
    },
  }),

  jobsResumeMatch: tool({
    description:
      'Career matcher: suggests up to 5 occupations that fit someone’s skills and past job titles, each with a match score, the skills that matched, the national median wage and a Job Bank search link. The widget also lets the person drop in their resume (PDF, Word or text), which is read only on their device. Use when someone asks what jobs fit their experience or skills, wants a resume matched to jobs, is changing careers, or attaches/pastes a resume ("what jobs match my resume?", "I worked retail and know Excel, what else could I do?", "quels emplois correspondent à mon CV?"). Pass short skill keywords and job titles only — never names, addresses, phone numbers, emails or other personal details from a resume. Call with empty arrays to show the upload card.',
    inputSchema: z.object({
      skills: z.array(z.string().max(40)).max(30).optional().describe('Skills, tools and certifications, e.g. ["Excel", "customer service", "forklift"].'),
      titles: z.array(z.string().max(60)).max(8).optional().describe('Past or current job titles or lines of work, e.g. ["cashier", "shift supervisor"] or ["retail"].'),
      years: z.number().int().min(0).max(50).optional().describe('Years of experience in those titles, when the person says ("I worked retail for 3 years" → 3).'),
      province: z.string().max(60).optional().describe('Province or territory to aim the job searches at.'),
      lang,
    }),
    execute: async ({ skills = [], titles = [], years, province, lang: l }): Promise<MatchOutput> => {
      const lg = L(l);
      const prov = provinceFrom(province);
      const signals = { years, named: skills };
      const said = { skills: skills.slice(0, 30), titles: titles.slice(0, 8) };
      const raw = scoreText([...titles, ...skills].join(' | '), signals);
      return {
        lang: lg,
        province: prov,
        given: { ...said, years: years || undefined, known: knownTerms([...said.titles, ...said.skills], raw) },
        matches: toMatches(raw, lg, prov, 5, signals),
        links: { resumeBuilder: URLS.resumeBuilder[lg], signUp: URLS.jobBankSignUp[lg], findAJob: URLS.jobBankFind[lg] },
        sources: matchSources(lg),
      };
    },
  }),

  jobsPrograms: tool({
    description:
      'Youth, student and Government of Canada job programs, checked against the person’s age and stage: GC Jobs (federal public service jobs), the Federal Student Work Experience Program (FSWEP, with student pay rates), Canada Summer Jobs (youth 15–30), the Post-Secondary Co-op/Internship and Research Affiliate programs, the Student Work Placement Program, the Youth Employment and Skills Strategy, Parks Canada youth jobs, International Experience Canada (work abroad, 18–35) and apprenticeships. Use for "how do I get a government job", "summer jobs for students", "jobs for youth", "internships with the federal government", "emplois d’été pour étudiants". Pass age and stage when known; the person can adjust them in the widget.',
    inputSchema: z.object({
      age: z.number().int().min(12).max(80).optional().describe('Age in years, if mentioned.'),
      stage: z.enum(['high-school', 'post-secondary', 'graduate', 'not-student']).optional().describe('high-school, post-secondary (college/university/CEGEP), graduate (recently finished), or not-student.'),
      interest: z.enum(['government', 'summer', 'any']).optional().describe('government = federal public service; summer = summer jobs.'),
      lang,
      timeZone: z.string().max(64).optional(),
    }),
    execute: async ({ age, stage, interest, lang: l, timeZone }): Promise<ProgramsOutput> => {
      const lg = L(l);
      const today = todayInCanada(new Date(), timeZone);
      return { lang: lg, age, stage, interest: interest ?? 'any', month: Number(today.slice(5, 7)), sources: programSources(lg) };
    },
  }),
} satisfies ToolSet;
