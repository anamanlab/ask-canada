/**
 * AI tools for the `immigration` widget (IRCC). Facts: widgets/immigration/data.ts. Live feeds: widgets/immigration/live.ts
 * (validated against the schemas in feeds.ts, with a last-known snapshot as fallback). A feed read is shared for a
 * few seconds, so a scripted answer's text and its widget always show the same numbers.
 *   immigrationCrsCalculator   Express Entry CRS score, live draw cut-offs and where the score sits in the pool
 *   immigrationEligibility     "Come to Canada" check: which Express Entry programs someone may qualify for
 *   immigrationProcessingTimes live IRCC processing times (PR, citizenship, visitor/study/work by country)
 *   immigrationVisaCheck       visitor visa vs eTA by nationality and way of travelling, with fees and live times
 *   immigrationPermits         study permit or work permit overview: requirements, money, work rules, PGWP
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildCrs, buildEligibility, buildEntry, buildPermits, buildTimes } from '../widgets/immigration/build';
import { toCountryCode } from '../widgets/immigration/countries';
import { EDUCATION } from '../widgets/immigration/data';
import { getDraws, getFees, getTimes } from '../widgets/immigration/live';
import { TIME_KEYS } from '../widgets/immigration/times';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const clb = (what: string) =>
  z.number().int().min(0).max(12).optional().describe(`${what} as a Canadian Language Benchmark level (CLB / NCLC 4–10; 0 = no test). IELTS/CELPIP/TEF scores must be converted to CLB first; if unsure, leave empty.`);
const education = z.enum(EDUCATION).optional();

const profile = {
  age: z.number().int().min(16).max(80).optional().describe('Age in years.'),
  education: education.describe(
    'Highest completed education: none, secondary (high school), one-year, two-year, bachelors (or any 3+ year program), two-or-more (2+ credentials, one of them 3+ years), masters (or a professional degree in medicine, dentistry, law, pharmacy…), phd.',
  ),
  firstLanguage: z.enum(['en', 'fr']).optional().describe('Official language of their main language test (en = English, fr = French).'),
  firstClb: clb('Level in their main official language, same for all 4 abilities (use the lowest ability)'),
  secondClb: clb('Level in the other official language'),
  canadianWork: z.number().int().min(0).max(10).optional().describe('Years of skilled paid work IN Canada (0–5+).'),
  foreignWork: z.number().int().min(0).max(20).optional().describe('Years of skilled paid work OUTSIDE Canada in the last 10 years.'),
  occupation: z
    .enum(['teer01', 'teer23', 'trade', 'other'])
    .optional()
    .describe('Their main job: teer01 = managers and jobs needing a degree (NOC TEER 0/1), teer23 = jobs needing college or apprenticeship (TEER 2/3), trade = skilled trade, other = TEER 4/5.'),
  certificate: z.boolean().optional().describe('Has a Canadian certificate of qualification in a skilled trade.'),
  jobOffer: z.boolean().optional().describe('Has a valid job offer in Canada (no longer adds CRS points, but counts for FSW/FST eligibility).'),
  spouse: z.boolean().optional().describe('A spouse or common-law partner is coming with them (and is not a Canadian citizen or PR).'),
  spouseEducation: education.describe('Spouse’s highest education (same values as education).'),
  spouseClb: clb('Spouse’s official language level'),
  spouseCanadianWork: z.number().int().min(0).max(10).optional().describe('Spouse’s years of skilled work in Canada.'),
  canadianEducation: z
    .enum(['none', 'short', 'two', 'long'])
    .optional()
    .describe('Post-secondary credential earned in Canada: short = 1-year program, two = 2-year program, long = 3+ years (or a master’s, professional degree or PhD).'),
  sibling: z.boolean().optional().describe('Has a brother or sister in Canada who is 18+ and a citizen or PR.'),
  relative: z
    .boolean()
    .optional()
    .describe('Has a close relative in Canada (18+, citizen or PR): parent, grandparent, child, grandchild, sibling, aunt/uncle or niece/nephew, theirs or their partner’s. Counts for FSW eligibility only.'),
  nomination: z.boolean().optional().describe('Has a provincial or territorial nomination.'),
};

export const tools = {
  immigrationCrsCalculator: tool({
    description:
      'Express Entry Comprehensive Ranking System (CRS) score calculator. Computes the official CRS score out of 1,200 from age, education, language (CLB), Canadian and foreign work experience, spouse, Canadian education, French, siblings and provincial nomination, using the current canada.ca tables (job offers no longer earn points since March 25, 2025). Also returns the LIVE latest Express Entry rounds of invitations (date, type, invitations, cut-off score) and the pool distribution, so the widget shows how the score compares with recent cut-offs and what would raise it. The person can adjust every answer in the widget. Use for "what is my CRS score", "calculate my Express Entry points", "is 470 enough", "latest Express Entry draw / cut-off". Pass only what the person said; leave the rest empty (never guess values). Set mode = rounds when they ask about draws, rounds or cut-offs rather than their own score.',
    inputSchema: z.object({
      ...profile,
      mode: z.enum(['score', 'rounds']).optional().describe('score (default) leads with their estimated score; rounds leads with the latest rounds of invitations.'),
      lang,
    }),
    execute: async (input) => {
      const draws = await getDraws(input.lang === 'fr' ? 'fr' : 'en', 10);
      return buildCrs(input, draws);
    },
  }),

  immigrationEligibility: tool({
    description:
      'Express Entry eligibility check (like IRCC’s "Come to Canada" tool): shows which of the 3 Express Entry programs someone may qualify for (Canadian Experience Class, Federal Skilled Worker Program with its 100-point selection grid (pass mark 67), Federal Skilled Trades Program), which minimum requirement is missing, the settlement funds needed for their family size, and the official Come to Canada tool as the next step. Use for "can I immigrate to Canada", "am I eligible for Express Entry", "do I qualify for FSW/CEC", "how many points do I need for FSW". Not for refugees or family sponsorship. Pass only what the person said.',
    inputSchema: z.object({
      ...profile,
      familySize: z.number().int().min(1).max(12).optional().describe('Number of family members, including themselves (for proof of funds).'),
      lang,
    }),
    execute: async (input) => {
      const { fees } = await getFees();
      return buildEligibility(input, fees);
    },
  }),

  immigrationProcessingTimes: tool({
    description:
      'LIVE IRCC processing times from the feeds behind canada.ca’s "Check processing times" page. Covers Express Entry (Canadian Experience Class, Federal Skilled Worker, provincial nominees), spouse and parent sponsorship, citizenship, PR cards, eTA, visitor visas, super visas, study and work permits (by the country you apply from), extensions and International Experience Canada. Use for "how long does X take" BEFORE someone applies. If they already applied and ask about their own file, still call it (the widget points them to Check application status). Set `program` to the one asked about; set `country` (ISO 3166-1 alpha-2, e.g. IN, PH, NG) for visitor visa, super visa, study or work permit questions when they said where they apply from. Never invent wait times; this is the source. Spouse and parent sponsorship times are for sponsors outside Quebec (the output also has the Quebec figure as `quebec`); say so. The Parents and Grandparents Program is PAUSED (status: paused): IRCC accepts no new interest to sponsor forms and sends no invitations until further notice, so never present it as open or give its time as an "if you apply today" estimate; the time applies only to applications already submitted. Suggest the parent and grandparent super visa instead.',
    inputSchema: z.object({
      program: z.enum(TIME_KEYS).optional().describe('The application type asked about (omit for an overview).'),
      country: z.string().max(60).optional().describe('Country or territory they apply from: ISO alpha-2 code (preferred) or English/French name.'),
      lang,
    }),
    execute: async ({ program, country, lang: l }) => {
      const data = await getTimes();
      return buildTimes({ focus: program ?? null, country: toCountryCode(country), lang: l }, data);
    },
  }),

  immigrationVisaCheck: tool({
    description:
      'Visitor visa or eTA? Checks what a citizen of a given country needs to visit or transit through Canada, from IRCC’s official country lists: visitor visa, electronic travel authorization (eTA, $7, usually minutes), the conditional eTA for 17 visa-required countries (had a Canadian visa in the past 10 years or holds a valid US non-immigrant visa, flying), passport only by land or sea, or nothing for US citizens and US green card holders. Adds fees (visa $100 + $85 biometrics) and the LIVE visitor visa processing time for their country. The widget always links to the official "Find out if you need a visa or eTA" questions for the final answer. Use for "do I need a visa to visit Canada", "eTA or visa", "can a Mexican/Indian/British citizen visit Canada". Pass the nationality they gave; never ask for it if they did not.',
    inputSchema: z.object({
      country: z.string().max(60).optional().describe('Nationality (passport country): ISO alpha-2 code (preferred) or English/French name.'),
      travel: z.enum(['air', 'land-sea']).optional().describe('How they’ll arrive: air (default) or land-sea (car, bus, train, boat, cruise).'),
      hasVisaHistory: z.boolean().optional().describe('Had a Canadian visitor visa in the past 10 years, or has a valid US non-immigrant visa.'),
      usPermanentResident: z.boolean().optional().describe('Is a US lawful permanent resident (green card).'),
      lang,
    }),
    execute: async ({ country, lang: l, ...rest }) => {
      const [times, fees] = await Promise.all([getTimes(), getFees()]);
      return buildEntry({ ...rest, country: toCountryCode(country) ?? undefined, lang: l }, times, fees.fees, fees.live);
    },
  }),

  immigrationPermits: tool({
    description:
      'Study permit or work permit overview for people outside Canada: what you need (letter of acceptance, provincial attestation letter, proof of funds: living expenses by family size from Sept 1, 2026), fees (study permit $150, work permit $155, open work permit holder fee, biometrics), working while studying (24 hours a week off campus), the post-graduation work permit, employer-specific vs open work permits and International Experience Canada, plus LIVE processing times from the country they apply from and the official self-service tools to confirm. Use for "how do I get a study permit", "how much money do I need to study in Canada", "can I work while studying", "how do I get a work permit", "PGWP". focus = study or work.',
    inputSchema: z.object({
      focus: z.enum(['study', 'work']).optional(),
      country: z.string().max(60).optional().describe('Country they apply from: ISO alpha-2 code (preferred) or name.'),
      familySize: z.number().int().min(1).max(10).optional().describe('People coming, including the student (for proof of funds).'),
      lang,
    }),
    execute: async ({ country, ...rest }) => {
      const [times, fees] = await Promise.all([getTimes(), getFees()]);
      return buildPermits({ ...rest, country: toCountryCode(country) }, times, fees.fees);
    },
  }),
} satisfies ToolSet;
