/**
 * Lab fixtures for the `life-events` widget: every state and the important edge cases.
 * The widget follows the page language, so view French with /lab/life-events?lang=fr (and RTL with ?dir=rtl).
 * `preview` seeds ticks and skips for the lab only; anything saved on the device takes over once you tick.
 * Every fixture is pinned to TODAY (`preview.pinned`), so "in 12 days", "today" and "9 days ago" stay true
 * whatever the real date is.
 */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildChecklist, type ChecklistInput } from './plan';

const TODAY = '2026-09-30';
let n = 0;
const pin = (input: ChecklistInput): ChecklistInput => ({ ...input, preview: { ...input.preview, pinned: true } });
const part = (input: ChecklistInput, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: 'tool-lifeEventsChecklist',
  toolCallId: `fx-le-${++n}`,
  state,
  input: pin(input),
  output: state === 'output-available' ? buildChecklist(pin(input), TODAY) : undefined,
  ...extra,
});

const fixtures: Fixture[] = [
  { name: 'Streaming input, event known (plan skeleton)', toolName: 'lifeEventsChecklist', part: part({ event: 'moving' }, 'input-streaming') },
  { name: 'Running, no event (picker skeleton)', toolName: 'lifeEventsChecklist', part: part({}, 'input-available') },
  {
    name: 'Picker: no event yet (all six life events)',
    toolName: 'lifeEventsChecklist',
    part: part({}),
  },
  {
    name: 'Moving in 12 days (hero case)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'moving', date: '2026-10-12', preview: { done: ['cra'] } }),
    note: 'One step ticked, so the ring is under way and Service Canada is “Up next”. Four organizations (the Passport Program counts as IRCC), the passport page-4 trick, and the SIN under “No action needed”. Only the first group is open.',
  },
  {
    name: 'Moving today (count.today)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'moving', date: TODAY }),
  },
  {
    name: 'Moving, with ticks and two steps marked “Not for me”',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'moving', date: '2026-10-12', preview: { done: ['cra', 'elections'], skipped: ['sc', 'ircc'] } }),
    note: 'Skipped steps collapse into a “not for you” row with “Add back”. The hero counts only what is left: 3 organizations, 6 steps.',
  },
  {
    name: 'New baby due in February, Ontario',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'baby', date: '2027-02-14', region: 'ON' }),
    note: 'Maternity benefits can start 12 weeks before the due date.',
  },
  {
    name: 'New baby in Quebec, born 4 weeks ago (QPIP instead of EI, no countdown)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'baby', date: '2026-09-02', region: 'QC' }),
  },
  {
    name: 'Married in September: tell the CRA by the end of October',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'marriage', date: '2026-09-19' }),
  },
  {
    name: 'Marriage, every step done (success state)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'marriage', date: '2026-09-19', preview: { done: ['marital', 'sin', 'craName', 'passport', 'elections'] } }),
  },
  {
    name: 'Job loss: last day was 9 days ago (EI 4-week countdown)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'job-loss', date: '2026-09-21' }),
  },
  {
    name: 'Job loss: EI applied for (the hero stops counting down)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'job-loss', date: '2026-09-21', preview: { done: ['apply'] } }),
    note: 'The deadline task is ticked, so the leaf turns pine and says it’s done instead of “19 days left”.',
  },
  {
    name: 'Job loss: more than 4 weeks ago (apply anyway)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'job-loss', date: '2026-08-14' }),
    note: 'The most urgent state. On a phone the leaf and the ring share a row and the sentence runs full width underneath.',
  },
  {
    name: 'Perte d’emploi, délai dépassé (French: check at 390px with ?lang=fr)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'job-loss', date: '2026-08-14', lang: 'fr' }),
    note: 'The longest missed-deadline sentence (« Faites la demande maintenant. Attendre plus longtemps pourrait vous coûter des prestations. ») must stay at 3 lines or fewer on a phone.',
  },
  {
    name: 'CPP to start June 2028: applications open in 8 months',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'retiring', date: '2028-06-01' }),
  },
  {
    name: 'Retiring, no date (key rule instead of a countdown)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'retiring' }),
  },
  {
    name: 'Death 18 days ago: executor’s 60 days and the April 30 final return',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'death', date: '2026-09-12' }),
    note: 'Gentle tone, grief support, and the soonest deadline (CPP death benefit) in the hero.',
  },
  {
    name: 'Death 18 days ago, death benefit applied for (next deadline takes over)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'death', date: '2026-09-12', preview: { done: ['cra', 'deathBenefit'] } }),
    note: 'With the 60-day step ticked, the hero counts down to the April 30 final return.',
  },
  {
    name: 'Death last December: final return overdue, rolled past a weekend',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'death', date: '2025-12-20' }),
    note: 'June 20, 2026 was a Saturday, so the return was on time until Monday, June 22.',
  },
  {
    name: 'Death in a province, no date (SIN is automatic)',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'death', region: 'BC' }),
  },
  {
    name: 'Error',
    toolName: 'lifeEventsChecklist',
    part: part({ event: 'moving' }, 'output-error', { errorText: 'Upstream timeout' }),
  },
];

export default fixtures;
