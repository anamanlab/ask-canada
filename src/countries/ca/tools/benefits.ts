/**
 * AI tools for the `benefits` widget. Facts: widgets/benefits/data.ts (verified on canada.ca).
 *   benefitsFinder    life-situation questionnaire -> matched federal programs with estimated amounts
 *   benefitsEstimator slider estimators for the Canada child benefit, EI, OAS and CPP
 * Both read the next payment dates live from the official benefits calendar (with a verified fallback).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { buildEstimator, buildFinder, type EstimatorOutput, type FinderOutput } from '../widgets/benefits/build';
import { paymentDates } from '../widgets/benefits/live';
import { CPP, PROVINCES, type Lang } from '../widgets/benefits/rates';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (from the system prompt), so today's date matches theirs.");
const money = (what: string) => z.number().min(0).max(1_000_000).optional().describe(what);
const kids = (what: string) => z.number().int().min(0).max(12).optional().describe(what);

export const tools = {
  benefitsFinder: tool({
    description:
      'Federal benefits finder for Canada: a short life-situation questionnaire that matches the person to the programs they likely qualify for, with estimated amounts and next payment dates. Covers the Canada child benefit (and child disability benefit), the Canada Groceries and Essentials Benefit (CGEB, which replaced the GST/HST credit in July 2026), the Canada workers benefit, the Canadian Dental Care Plan, the Canada Disability Benefit, EI regular benefits, the Canada Student Grant, Old Age Security, the Guaranteed Income Supplement and the CPP retirement pension. Use it for "what benefits can I get", "am I missing any benefits", "I lost my job / had a baby / am retiring / have a disability / am a student, what help is there", or when someone describes their household and income. Pass only what the person actually said (everything is optional; the widget asks for the rest and recalculates on the device). Without an income the output has no amounts (`ready: false`): do not invent any; the widget asks. Income means adjusted family net income (line 23600, both partners); for seniors it includes their OAS and CPP. EI is based on the person’s own earnings (jobEarnings), never on family income. Never ask for or pass a SIN or other identifiers.',
    inputSchema: z.object({
      household: z.enum(['single', 'couple']).optional().describe('couple = married or common-law.'),
      age: z.enum(['under-19', '19-59', '60-64', '65-74', '75-plus']).optional().describe("The person's age band."),
      childrenUnder6: kids('Children under 6 living with them.'),
      children6to17: kids('Children aged 6 to 17 living with them.'),
      children: kids('Number of children under 18 when the person did not say how old they are. Use childrenUnder6/children6to17 instead when ages are known.'),
      income: money('Adjusted family net income per year, in dollars (both partners).'),
      workIncome: money('Family income from work (employment or self-employment) per year, in dollars.'),
      disability: z.boolean().optional().describe('Approved (or likely to be approved) for the disability tax credit.'),
      childDisability: kids('Children approved for the disability tax credit.'),
      jobLoss: z.boolean().optional().describe('Recently lost their job or stopped working.'),
      jobEarnings: money("EI: the person's own yearly earnings from the job they lost (not family income). Pass it for couples when they said it."),
      student: z.boolean().optional().describe('Full-time post-secondary student.'),
      dentalInsurance: z.boolean().optional().describe('Has access to private dental insurance (including a health spending account).'),
      yearsInCanada: z.number().int().min(0).max(80).optional().describe('Years lived in Canada since age 18 (matters for Old Age Security).'),
      province: z.enum(PROVINCES).optional().describe('Province or territory code, e.g. ON, QC, BC.'),
      lang,
      timeZone,
    }),
    execute: async ({ lang: l, timeZone: tz, ...given }, { abortSignal }): Promise<FinderOutput> => {
      const L: Lang = l === 'fr' ? 'fr' : 'en';
      const today = todayInCanada(new Date(), tz);
      return buildFinder(given, L, today, await paymentDates(today, abortSignal));
    },
  }),

  benefitsEstimator: tool({
    description:
      'Interactive estimator with sliders and live numbers for one program: `ccb` (Canada child benefit by family income and number of children, plus the child disability benefit), `ei` (EI regular benefits: 55% of average insurable weekly earnings, up to $729 a week in 2026, for 14 to 45 weeks), `oas` (Old Age Security by years lived in Canada after 18, start age 65–70, age 75+ and the recovery tax), or `cpp` (CPP retirement pension by start age 60–70: −0.6% a month before 65, +0.7% a month after). Use it for "how much will I get from …", "how much is the child benefit", "should I take CPP at 60 or 70", "how much EI would I get". Pass any numbers the person gave; the widget fills in typical defaults for the rest. For EI, always encourage applying right away and never say the person will not qualify.',
    inputSchema: z.object({
      program: z.enum(['ccb', 'ei', 'oas', 'cpp']).describe('Which estimator to show.'),
      income: money('Adjusted family net income (CCB) or the person’s net income (OAS recovery tax), per year.'),
      childrenUnder6: kids('CCB: children under 6.'),
      children6to17: kids('CCB: children aged 6 to 17.'),
      children: kids('CCB: number of children when their ages were not given.'),
      childDisability: kids('CCB: children approved for the disability tax credit.'),
      earnings: money('EI: insurable earnings from the job over the last year (salary), per year.'),
      yearsInCanada: z.number().int().min(0).max(80).optional().describe('OAS: years lived in Canada since age 18.'),
      startAge: z.number().min(60).max(70).optional().describe('OAS (65–70) or CPP (60–70): age the pension starts.'),
      age75: z.boolean().optional().describe('OAS: already 75 or older.'),
      at65: z.number().min(0).max(CPP.max65).optional().describe('CPP: the monthly pension at 65 from their Statement of Contributions, if they know it.'),
      lang,
      timeZone,
    }),
    execute: async ({ lang: l, timeZone: tz, ...input }, { abortSignal }): Promise<EstimatorOutput> => {
      const L: Lang = l === 'fr' ? 'fr' : 'en';
      const today = todayInCanada(new Date(), tz);
      return buildEstimator(input, L, today, await paymentDates(today, abortSignal));
    },
  }),
} satisfies ToolSet;
