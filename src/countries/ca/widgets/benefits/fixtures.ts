/** Lab fixtures for the `benefits` widget: every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildEstimator, buildFinder, type EstimatorInput, type FinderInput } from './build';
import type { Lang } from './data';
import { fallbackDates } from './payments';

const TODAY = '2026-09-30';
/**
 * Build outputs in the lab's language (/lab/benefits?lang=fr), so French links, titles and sources can be reviewed.
 * Lab only: the lab takes a plain `Fixture[]` (no language argument), so this module reads the lab's own `?lang=`
 * query once when it loads in the browser. Nothing here or in the widget reads the DOM.
 */
const LANG: Lang = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('lang')?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
const dates = fallbackDates(TODAY);
let n = 0;
const id = () => `fx-benefits-${++n}`;

const finder = (input: FinderInput, state: WidgetPart['state'] = 'output-available', live = false): WidgetPart => ({
  type: 'tool-benefitsFinder',
  toolCallId: id(),
  state,
  input,
  output: state === 'output-available' ? { ...buildFinder(input, LANG, TODAY, { ...dates, live }), pinned: true } : undefined,
  ...(state === 'output-error' ? { errorText: 'Upstream timeout' } : {}),
});
const estimator = (input: EstimatorInput, state: WidgetPart['state'] = 'output-available'): WidgetPart => ({
  type: 'tool-benefitsEstimator',
  toolCallId: id(),
  state,
  input,
  output: state === 'output-available' ? { ...buildEstimator(input, LANG, TODAY, dates), pinned: true } : undefined,
  ...(state === 'output-error' ? { errorText: 'Upstream timeout' } : {}),
});

const fixtures: Fixture[] = [
  { name: 'Finder · streaming input (skeleton)', toolName: 'benefitsFinder', part: finder({ household: 'couple' }, 'input-streaming') },
  { name: 'Finder · input ready, running (skeleton)', toolName: 'benefitsFinder', part: finder({ household: 'couple' }, 'input-available') },
  {
    name: 'Finder · young family, 2 kids, $55k (hero case)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'couple', age: '19-59', childrenUnder6: 1, children6to17: 1, income: 55_000, province: 'ON' }, 'output-available', true),
    note: 'Payment dates read live from canada.ca/en/services/benefits/calendar.html: the note under the results says “Payment dates from the official benefits calendar”, and the calendar is listed in Sources (+ more).',
  },
  {
    name: 'Finder · no answers yet (questionnaire first)',
    toolName: 'benefitsFinder',
    part: finder({}),
    note: 'When the question gives no details, the widget opens on the questionnaire and updates the estimate as you answer. The income sliders are unset: thumb hollow at the start, “Not set yet”. To see “Use my saved answers” in the hero, press “Save my answers” on any finder with results (the hero case above): this one then offers them, and loads them with every answer marked as given.',
  },
  {
    name: 'Finder · “I lost my job” and nothing else (questionnaire first)',
    toolName: 'benefitsFinder',
    part: finder({ jobLoss: true }),
    note: 'With answers saved on the device, “Use my saved answers” loads them and keeps “lost my job” on top. No income given, but EI still leads: the hero shows the 4-week window, “up to $729 a week” and the Apply link, with the questionnaire below. Household, age and children show as assumed.',
  },
  {
    name: 'Finder · only an income given ($30k): the rest shown as assumed',
    toolName: 'benefitsFinder',
    part: finder({ income: 30_000 }),
    note: 'Results show, but the household, age, children and “from work” chips are dashed “assumed” buttons that open the questions. The workers benefit is “Worth checking” (up to), not an estimate, until work income is known.',
  },
  {
    name: 'Finder · “two kids, $55k in Ontario” (ages not given)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'couple', children: 2, income: 55_000, province: 'ON' }),
    note: 'The child benefit is estimated at the 6-to-17 rate until the person says how many are under 6.',
  },
  {
    name: 'Finder · single parent, low income, child with a disability',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '19-59', childrenUnder6: 1, children6to17: 1, childDisability: 1, income: 28_000, workIncome: 22_000, province: 'NS' }),
  },
  {
    name: 'Finder · just lost my job',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '19-59', income: 48_000, jobLoss: true, province: 'BC' }),
    note: 'EI leads the hero (weekly amount + the 4-week window); the other programs are the secondary yearly line. EI is never shown as “not eligible”.',
  },
  {
    name: 'Finder · couple, one partner lost their job ($55k family income)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'couple', age: '19-59', income: 55_000, jobLoss: true, province: 'ON' }),
    note: 'EI is based on the claimant’s own earnings, never family income: the hero shows “up to $729 a week” until they set “Your own earnings from the job you lost”.',
  },
  {
    name: 'Finder · single senior, $25,000 net income (GIS estimated)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '65-74', income: 25_000, yearsInCanada: 40, province: 'ON' }),
    note: 'Net income includes about $9,150 of OAS. GIS counts income without OAS (≈ $15,850), well under $23,112: about $302 a month, included in the total.',
  },
  {
    name: 'Finder · senior on a low income, 28 years in Canada',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '65-74', income: 21_000, workIncome: 0, yearsInCanada: 28, province: 'MB' }),
  },
  {
    name: 'Finder · senior couple over 75, high income (recovery tax)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'couple', age: '75-plus', income: 220_000, workIncome: 0, dentalInsurance: true, province: 'AB' }),
  },
  {
    name: 'Finder · disability tax credit, working part-time',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '19-59', disability: true, income: 21_000, workIncome: 12_000, province: 'SK' }),
  },
  {
    name: 'Finder · full-time student in Quebec (province rules)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'single', age: '19-59', student: true, income: 16_000, province: 'QC' }),
  },
  {
    name: 'Finder · high income, dental insurance (nothing to estimate)',
    toolName: 'benefitsFinder',
    part: finder({ household: 'couple', age: '19-59', income: 240_000, dentalInsurance: true, province: 'ON' }),
  },
  { name: 'Finder · error', toolName: 'benefitsFinder', part: finder({ household: 'single' }, 'output-error') },

  { name: 'Estimator · streaming (skeleton)', toolName: 'benefitsEstimator', part: estimator({ program: 'ccb' }, 'input-streaming') },
  { name: 'Estimator · EI, running (skeleton)', toolName: 'benefitsEstimator', part: estimator({ program: 'ei' }, 'input-available') },
  { name: 'Estimator · OAS, running (skeleton)', toolName: 'benefitsEstimator', part: estimator({ program: 'oas' }, 'input-available') },
  { name: 'Estimator · CPP, running (skeleton)', toolName: 'benefitsEstimator', part: estimator({ program: 'cpp' }, 'input-available') },
  { name: 'Estimator · CCB, 2 children, ages not given', toolName: 'benefitsEstimator', part: estimator({ program: 'ccb', income: 55_000, children: 2 }) },
  { name: 'Estimator · Canada child benefit, 2 kids, $60k', toolName: 'benefitsEstimator', part: estimator({ program: 'ccb', income: 60_000, childrenUnder6: 1, children6to17: 1 }) },
  {
    name: 'Estimator · CCB with the child disability benefit, $95k',
    toolName: 'benefitsEstimator',
    part: estimator({ program: 'ccb', income: 95_000, childrenUnder6: 0, children6to17: 3, childDisability: 1 }),
  },
  { name: 'Estimator · EI, $52k salary', toolName: 'benefitsEstimator', part: estimator({ program: 'ei', earnings: 52_000 }) },
  {
    name: 'Estimator · EI, no earnings given (example figure)',
    toolName: 'benefitsEstimator',
    part: estimator({ program: 'ei' }),
    note: 'The hero shows ≈ and a quieter size, and says “For example, at earnings of $52,000 a year”, until the slider is moved: the placeholder never reads as theirs or as an official typical figure. The slider carries only the dashed EXAMPLE chip.',
  },
  { name: 'Estimator · EI above the maximum insurable earnings', toolName: 'benefitsEstimator', part: estimator({ program: 'ei', earnings: 95_000 }) },
  {
    name: 'Estimator · Old Age Security, nothing given (typical figures)',
    toolName: 'benefitsEstimator',
    part: estimator({ program: 'oas' }),
    note: 'Years in Canada and income are marked “Typical” until moved; on phones the marker sits above its hint, clear of the recovery-tax line.',
  },
  { name: 'Estimator · Old Age Security, full pension', toolName: 'benefitsEstimator', part: estimator({ program: 'oas', yearsInCanada: 40, income: 18_000 }) },
  {
    name: 'Estimator · OAS partial, deferred to 70, recovery tax',
    toolName: 'benefitsEstimator',
    part: estimator({ program: 'oas', yearsInCanada: 22, startAge: 70, income: 130_000 }),
  },
  { name: 'Estimator · CPP, average pension', toolName: 'benefitsEstimator', part: estimator({ program: 'cpp' }) },
  { name: 'Estimator · CPP at 60, maximum pension', toolName: 'benefitsEstimator', part: estimator({ program: 'cpp', at65: 1_507.65, startAge: 60 }) },
  { name: 'Estimator · error', toolName: 'benefitsEstimator', part: estimator({ program: 'ei' }, 'output-error') },
];

export default fixtures;
