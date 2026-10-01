/** Lab fixtures for the `citizenship` widget: every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { presenceOutput, type PresenceInput } from './presence';
import { buildQuiz } from './quiz-bank';
import { buildCeremony, buildSteps, fallbackProcessing, type Fees, type Processing, type StepsInput } from './steps';
import { FEES } from './data';

const TODAY = '2026-09-30';
let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-cz-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

const presence = (input: PresenceInput, state?: WidgetPart['state']) => part('citizenshipPresence', input, presenceOutput(input, TODAY), state);

const TRIPS = [
  { left: '2024-12-20', returned: '2025-01-06' },
  { left: '2025-07-02', returned: '2025-07-16' },
  { left: '2026-03-14', returned: '2026-03-15' },
  { left: '2026-12-18', returned: '2027-01-08' },
];

const liveFees: Fees = { ...FEES, live: true };
const liveProcessing: Processing = { text: 'About 12 months', waiting: 'About 327,100 people waiting', updated: '2026-09-03', live: true };
const steps = (input: StepsInput, processing: Processing = liveProcessing, fees: Fees = liveFees, state?: WidgetPart['state']) =>
  part('citizenshipSteps', input, buildSteps(input, fees, processing), state);

const fixtures: Fixture[] = [
  // ——— Days calculator ———
  {
    name: 'Days: streaming input with trips (skeleton)',
    toolName: 'citizenshipPresence',
    part: presence({ prDate: '2024-10-21', tempStart: '2023-01-09', trips: TRIPS }, 'input-streaming'),
    note: 'Same input as the next fixture: the skeleton has a row per trip and the time-before-PR field, so nothing jumps.',
  },
  { name: 'Days: streaming input, no trips (skeleton)', toolName: 'citizenshipPresence', part: presence({ prDate: '2024-10-21' }, 'input-streaming') },
  {
    name: 'Days: not yet, with a planned trip that moves the date (hero)',
    toolName: 'citizenshipPresence',
    part: presence({ prDate: '2024-10-21', tempStart: '2023-01-09', trips: TRIPS }),
    note: 'Student since Jan 2023 (half days), PR since Oct 2024. The December trip pushes the earliest date by 20 days.',
  },
  {
    name: 'Days: enough days to apply now',
    toolName: 'citizenshipPresence',
    part: presence({ prDate: '2022-05-10', trips: [{ left: '2023-08-01', returned: '2023-08-22' }, { left: '2025-12-20', returned: '2026-01-03' }] }),
  },
  {
    name: 'Days: PR date from a month only (“March 2023”)',
    toolName: 'citizenshipPresence',
    part: presence({ prDate: '2023-03-01', prDateMonthOnly: true }),
    note: 'The chat parsed “I became a PR in March 2023”: the widget says it used March 1 and asks for the exact date.',
  },
  { name: 'Days: no PR date yet (setup)', toolName: 'citizenshipPresence', part: presence({}), note: 'Picks up dates saved on this device, if any.' },
  { name: 'Days: new permanent resident, no trips', toolName: 'citizenshipPresence', part: presence({ prDate: '2026-06-01' }) },
  {
    name: 'Days: time before PR capped at 365',
    toolName: 'citizenshipPresence',
    part: presence({ prDate: '2025-01-15', tempStart: '2019-09-01', trips: [{ left: '2019-12-15', returned: '2020-01-05' }] }),
    note: 'A trip before the 5-year window is listed as outside the window.',
  },
  { name: 'Days: error', toolName: 'citizenshipPresence', part: presence({ prDate: '2024-10-21' }, 'output-error') },

  // ——— Practice test ———
  { name: 'Test: loading (skeleton)', toolName: 'citizenshipPracticeTest', part: part('citizenshipPracticeTest', { count: 10 }, null, 'input-available') },
  { name: 'Test: 10 mixed questions', toolName: 'citizenshipPracticeTest', part: part('citizenshipPracticeTest', { count: 10 }, buildQuiz({ count: 10, seed: 7 })) },
  {
    name: 'Test: history only, 5 questions',
    toolName: 'citizenshipPracticeTest',
    part: part('citizenshipPracticeTest', { count: 5, topic: 'history' }, buildQuiz({ count: 5, topic: 'history', seed: 3 })),
  },
  {
    name: 'Test: topic quiz, then the full mock test (the topic badge goes)',
    toolName: 'citizenshipPracticeTest',
    part: part('citizenshipPracticeTest', { count: 5, topic: 'symbols' }, buildQuiz({ count: 5, topic: 'symbols', seed: 9 })),
    note: 'Finish the 5 questions, then “Full mock test (20)”: the set now covers every topic, so the Symbols badge is gone. “Try new questions” and “Retry the ones I missed” keep it.',
  },
  {
    name: 'Test: full-length mock test (20)',
    toolName: 'citizenshipPracticeTest',
    part: part('citizenshipPracticeTest', { count: 20 }, buildQuiz({ count: 20, seed: 11 })),
  },
  {
    name: 'Test: saved answer without its questions (looked up in the bank)',
    toolName: 'citizenshipPracticeTest',
    part: part('citizenshipPracticeTest', { count: 5 }, { ...buildQuiz({ count: 5, seed: 5 }), items: undefined }),
    note: 'An answer saved before the questions travelled with it: the bank is fetched (Suspense) and the ids are looked up.',
  },
  { name: 'Test: error', toolName: 'citizenshipPracticeTest', part: part('citizenshipPracticeTest', {}, null, 'output-error', { errorText: 'Timeout' }) },

  // ——— Steps, fees, processing ———
  { name: 'Steps: loading (skeleton)', toolName: 'citizenshipSteps', part: steps({}, liveProcessing, liveFees, 'input-streaming') },
  { name: 'Steps: live fees and processing time', toolName: 'citizenshipSteps', part: steps({}) },
  {
    name: 'Steps: family of 4 (2 adults, 2 children), age 38',
    toolName: 'citizenshipSteps',
    part: steps({ adults: 2, minors: 2, age: 38 }),
  },
  {
    name: 'Steps: live feed down (verified snapshot), age 61',
    toolName: 'citizenshipSteps',
    part: steps({ age: 61 }, fallbackProcessing('en'), { ...FEES, live: false }),
    note: 'Shown when the IRCC feeds can’t be reached: last verified values, dated.',
  },
  {
    name: 'Steps: answer written in French, read in the other language',
    toolName: 'citizenshipSteps',
    part: steps({ lang: 'fr' }, { ...fallbackProcessing('fr'), live: true }),
    note: 'Built with lang: fr. Links, sources and the processing wording follow the reader’s current language.',
  },
  { name: 'Steps: child applying (under 18)', toolName: 'citizenshipSteps', part: steps({ age: 12 }) },
  { name: 'Steps: error', toolName: 'citizenshipSteps', part: steps({}, liveProcessing, liveFees, 'output-error') },

  // ——— Ceremony and oath ———
  { name: 'Ceremony: loading (skeleton)', toolName: 'citizenshipCeremony', part: part('citizenshipCeremony', {}, null, 'input-available') },
  { name: 'Ceremony: oath and in-person ceremony', toolName: 'citizenshipCeremony', part: part('citizenshipCeremony', {}, buildCeremony({})) },
  {
    name: 'Ceremony: virtual ceremony',
    toolName: 'citizenshipCeremony',
    part: part('citizenshipCeremony', { format: 'virtual' }, buildCeremony({ format: 'virtual' })),
  },
  {
    name: 'Ceremony: built in French',
    toolName: 'citizenshipCeremony',
    part: part('citizenshipCeremony', { lang: 'fr' }, buildCeremony({ lang: 'fr' })),
  },
  { name: 'Ceremony: error', toolName: 'citizenshipCeremony', part: part('citizenshipCeremony', {}, null, 'output-error') },
];

export default fixtures;
