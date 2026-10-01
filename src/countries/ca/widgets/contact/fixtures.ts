/** Lab fixtures for the `contact` widget: every state and edge case, each at a fixed moment (pinned clock). */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildDirectory, buildUrgent } from './build';
import type { DirectoryInput, UrgentInput } from './types';

const dir = (input: DirectoryInput, at: string, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: 'tool-contactDirectory',
  toolCallId: `fx-dir-${at}-${input.topic ?? 'all'}`,
  state,
  input,
  output: state === 'output-available' ? { ...buildDirectory(input, Date.parse(at)), pinned: true } : undefined,
  ...extra,
});
const urg = (input: UrgentInput, at: string, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: 'tool-contactUrgent',
  toolCallId: `fx-urg-${at}-${input.situation ?? 'all'}`,
  state,
  input,
  output: state === 'output-available' ? { ...buildUrgent(input, Date.parse(at)), pinned: true } : undefined,
  ...extra,
});

const fixtures: Fixture[] = [
  {
    name: 'CRA personal taxes · Thursday 9:41 a.m. in Vancouver',
    toolName: 'contactDirectory',
    part: dir({ topic: 'taxes', timeZone: 'America/Vancouver' }, '2026-10-01T16:41:00Z'),
    note: 'CRA agents work 8 a.m.–8 p.m. Eastern, shown as 5 a.m.–5 p.m. Vancouver time. Self-service is offered first (CRA rule), as one quiet line. The second CRA line keeps the same hours, so it says so instead of repeating them.',
  },
  {
    name: 'Everything · National Day for Truth and Reconciliation (closed)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'all', timeZone: 'America/Toronto' }, '2026-09-30T14:00:00Z'),
    note: 'Federal holiday: agents closed, CRA automated lines still open. Rows collapse when there are more than 3 lines.',
  },
  {
    name: 'EI · holiday in Toronto (closed day bar)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'ei', timeZone: 'America/Toronto' }, '2026-09-30T15:10:00Z'),
    note: 'No agent window today: the bar is hatched and labelled "Closed today", and the legend has no Agents swatch.',
  },
  {
    name: 'CRA · holiday in Vancouver (automated line only)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'taxes', timeZone: 'America/Vancouver' }, '2026-09-30T18:30:00Z'),
    note: 'Pills and the holiday notice use the same relative wording ("tomorrow at 5 a.m.").',
  },
  {
    name: 'EI · Saturday in Halifax (weekend, call-back)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'ei', timeZone: 'America/Halifax' }, '2026-10-03T15:00:00Z'),
    note: 'ESDC rule: on weekends mention agent hours and the call-back request (2 business days).',
  },
  {
    name: 'CRA closing soon · 7:42 p.m. in Toronto',
    toolName: 'contactDirectory',
    part: dir({ topic: 'taxes', timeZone: 'America/Toronto' }, '2026-10-01T23:42:00Z'),
  },
  {
    name: 'Benefits · TTY first',
    toolName: 'contactDirectory',
    part: dir({ topic: 'benefits', tty: true, timeZone: 'America/Winnipeg' }, '2026-10-01T15:10:00Z'),
    note: 'An answer that asks for TTY always opens with TTY first: the saved device preference can only switch TTY on (an old "off" is ignored). The toggle still switches it off on this card.',
  },
  {
    name: 'Pensions · calling from London, UK',
    toolName: 'contactDirectory',
    part: dir({ topic: 'pensions', timeZone: 'Europe/London' }, '2026-10-01T13:05:00Z'),
    note: 'Outside Canada and the U.S.: international (collect) number first. The CPP international line runs on Eastern time (per its page); for other "local time" lines the card assumes Eastern time and says so.',
  },
  {
    name: '1 800 O-Canada · calling from London, UK (numbers by country)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'passports', timeZone: 'Europe/London' }, '2026-10-01T13:05:00Z'),
    note: 'The toll-free number differs by country, so the row links to the official list (note under the number, first row in more options).',
  },
  {
    name: 'Everything · calling from New York (toll-free numbers, hours in New York time)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'all', timeZone: 'America/New_York' }, '2026-10-01T15:10:00Z'),
    note: 'The toll-free numbers are listed for "Canada and the United States": no collect numbers, no "(Eastern)" aside, and "local time" lines on New York time. Only the dental plan lists its other number for "Outside Canada", so that one leads.',
  },
  {
    name: 'Pensions · calling from Phoenix (toll-free CPP line, "local time" is Phoenix time)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'pensions', timeZone: 'America/Phoenix' }, '2026-10-01T21:05:00Z'),
    note: 'The CPP/OAS page lists its number for "Canada and the United States (operates in local time)": 8:30 a.m.–4:30 p.m. on the caller\'s own clock. At 2:05 p.m. in Phoenix the line is open (it would read closed on Ottawa time).',
  },
  {
    name: 'Everything · TTY first at night in Vancouver (all closed)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'all', tty: true, timeZone: 'America/Vancouver' }, '2026-10-02T07:22:00Z'),
    note: 'No line is open: the header says "All closed" with the first reopening. The CRA TTY number leads once (personal taxes); the Anti-Fraud Centre has no TTY line and says so.',
  },
  {
    name: 'CRA from Iqaluit (Eastern time, no "(Eastern)" aside)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'business', timeZone: 'America/Iqaluit' }, '2026-10-01T15:10:00Z'),
  },
  {
    name: 'CRA from Whitehorse (northern line)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'taxes', timeZone: 'America/Whitehorse' }, '2026-10-02T18:00:00Z'),
    note: 'The CRA page lists automated service only on 1-800-959-8281 and 1-800-387-1193, so the northern line shows agent hours only.',
  },
  {
    name: 'Service Canada only · "Is Service Canada open?" (Wednesday 3:10 p.m. in Moncton)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'service-canada', timeZone: 'America/Moncton' }, '2026-10-07T18:10:00Z'),
    note: 'No CRA lines and no CRA banner: the question was about Service Canada.',
  },
  {
    name: 'Fraud topic · Anti-Fraud Centre first, no CRA banner',
    toolName: 'contactDirectory',
    part: dir({ topic: 'fraud', timeZone: 'America/Toronto' }, '2026-10-01T15:20:00Z'),
  },
  {
    name: 'Fraud topic · Thursday evening (phone closed, online report leads)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'fraud', timeZone: 'America/Edmonton' }, '2026-10-02T02:30:00Z'),
    note: 'The Anti-Fraud Centre takes reports online at any hour: while its phone is closed, "Report online" leads and Call steps back.',
  },
  {
    name: 'Passports · no phone number (IRCC rule)',
    toolName: 'contactDirectory',
    part: dir({ topic: 'passports', timeZone: 'America/Edmonton' }, '2026-10-01T17:00:00Z'),
    note: 'IRCC guidance: never give a Passport Program number; start with the status checker and contact page.',
  },
  {
    name: 'Urgent · all help lines',
    toolName: 'contactUrgent',
    part: urg({ situation: 'all', timeZone: 'America/Toronto' }, '2026-10-01T16:41:00Z'),
  },
  {
    name: 'Urgent · mental health crisis (9-8-8 first)',
    toolName: 'contactUrgent',
    part: urg({ situation: 'crisis', timeZone: 'America/Vancouver' }, '2026-10-02T06:15:00Z'),
  },
  {
    name: 'Urgent · immediate danger (9-1-1 first)',
    toolName: 'contactUrgent',
    part: urg({ situation: 'danger', timeZone: 'America/Regina' }, '2026-10-01T16:41:00Z'),
  },
  {
    name: 'Suspicious CRA call · Thursday morning in Toronto',
    toolName: 'contactUrgent',
    part: urg({ situation: 'suspected', timeZone: 'America/Toronto' }, '2026-10-01T15:20:00Z'),
    note: '"I think a call from the CRA was a scam": warning signs from the CRA, verify first, report even with no loss, bank only if they paid, with the CRA identity-theft line (6:30 a.m.–7 p.m. Eastern) for a shared SIN or sign-in.',
  },
  {
    name: 'Suspicious CRA call · holiday in Winnipeg (phones closed)',
    toolName: 'contactUrgent',
    part: urg({ situation: 'suspected', timeZone: 'America/Winnipeg' }, '2026-09-30T17:00:00Z'),
  },
  {
    name: 'Fraud · Anti-Fraud Centre open',
    toolName: 'contactUrgent',
    part: urg({ situation: 'fraud', timeZone: 'America/Toronto' }, '2026-10-01T15:20:00Z'),
  },
  {
    name: 'Fraud · evening (phone closed, report online)',
    toolName: 'contactUrgent',
    part: urg({ situation: 'fraud', timeZone: 'America/Vancouver' }, '2026-10-02T03:30:00Z'),
  },

  // Loading and error states last, so the lab opens on real answers.
  { name: 'Directory · streaming input (skeleton)', toolName: 'contactDirectory', part: dir({ topic: 'taxes' }, '2026-10-01T16:41:00Z', 'input-streaming') },
  { name: 'Directory · running, all lines (skeleton)', toolName: 'contactDirectory', part: dir({ topic: 'all' }, '2026-10-01T16:41:00Z', 'input-available') },
  { name: 'Directory · running, passports (skeleton)', toolName: 'contactDirectory', part: dir({ topic: 'passports' }, '2026-10-01T16:41:00Z', 'input-available') },
  { name: 'Urgent · running, all lines (skeleton)', toolName: 'contactUrgent', part: urg({ situation: 'all' }, '2026-10-01T16:41:00Z', 'input-available') },
  { name: 'Urgent · running, crisis (skeleton)', toolName: 'contactUrgent', part: urg({ situation: 'crisis' }, '2026-10-01T16:42:00Z', 'input-available') },
  { name: 'Suspicious call · running (skeleton)', toolName: 'contactUrgent', part: urg({ situation: 'suspected' }, '2026-10-01T16:41:00Z', 'input-available') },
  { name: 'Fraud · running (skeleton)', toolName: 'contactUrgent', part: urg({ situation: 'fraud' }, '2026-10-01T16:41:00Z', 'input-streaming') },
  {
    name: 'Directory · error',
    toolName: 'contactDirectory',
    part: dir({ topic: 'taxes' }, '2026-10-01T16:40:00Z', 'output-error', { errorText: 'Upstream timeout' }),
  },
  {
    name: 'Urgent · error (still shows 9-1-1 and 9-8-8)',
    toolName: 'contactUrgent',
    part: urg({ situation: 'crisis' }, '2026-10-01T16:41:00Z', 'output-error', { errorText: 'Upstream timeout' }),
  },
];

export default fixtures;
