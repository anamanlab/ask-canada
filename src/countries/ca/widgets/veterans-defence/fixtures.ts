/** Lab fixtures for the `veterans-defence` widget: every state and edge case of the three tools. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import type { CareersInput } from './careers';
import { buildCareers } from './careers-build';
import { SNAPSHOT } from './careers-schema';
import type { BenefitsInput } from './navigator';
import { buildBenefits } from './navigator-build';
import type { SupportsInput } from './supports';
import { buildSupports } from './supports-build';

const LIST = SNAPSHOT.careers;
const LIVE = { live: true, asOf: '2026-09-30T13:05:00.000Z' };
let n = 0;
const id = () => `fx-vd-${++n}`;

const careers = (input: CareersInput, state: WidgetPart['state'] = 'output-available', meta = LIVE): WidgetPart => ({
  type: 'tool-veteransDefenceCareers',
  toolCallId: id(),
  state,
  input,
  output: state === 'output-available' ? buildCareers(input, LIST, meta) : undefined,
  ...(state === 'output-error' ? { errorText: 'forces.ca timed out' } : {}),
});
const benefits = (input: BenefitsInput, state: WidgetPart['state'] = 'output-available'): WidgetPart => ({
  type: 'tool-veteransDefenceBenefits',
  toolCallId: id(),
  state,
  input,
  output: state === 'output-available' ? buildBenefits(input) : undefined,
  ...(state === 'output-error' ? { errorText: 'Tool failed' } : {}),
});
const supports = (input: SupportsInput, state: WidgetPart['state'] = 'output-available'): WidgetPart => ({
  type: 'tool-veteransDefenceMentalHealth',
  toolCallId: id(),
  state,
  input,
  output: state === 'output-available' ? buildSupports(input) : undefined,
  ...(state === 'output-error' ? { errorText: 'Tool failed' } : {}),
});

const fixtures: Fixture[] = [
  // ── CAF career matcher ──
  { name: 'Careers · streaming input (skeleton)', toolName: 'veteransDefenceCareers', part: careers({}, 'input-streaming') },
  { name: 'Careers · running (skeleton)', toolName: 'veteransDefenceCareers', part: careers({ interests: ['health'] }, 'input-available') },
  {
    name: 'Careers · “How do I join the Forces?”',
    toolName: 'veteransDefenceCareers',
    part: careers({}),
  },
  { name: 'Careers · health care, part-time (Reserve)', toolName: 'veteransDefenceCareers', part: careers({ interests: ['health'], hours: 'part-time' }) },
  { name: 'Careers · named job: “pilot”', toolName: 'veteransDefenceCareers', part: careers({ query: 'pilot' }) },
  {
    name: 'Careers · Navy officer with a bachelor’s degree, tech + naval',
    toolName: 'veteransDefenceCareers',
    part: careers({ interests: ['computing', 'naval', 'engineering'], environment: 'navy', path: 'officer', education: 'bachelor' }),
  },
  {
    name: 'Careers · high school diploma, officer (paid education routes)',
    toolName: 'veteransDefenceCareers',
    part: careers({ path: 'officer', education: 'high-school', interests: ['health', 'aviation'] }),
  },
  {
    name: 'Careers · empty: officer with Grade 10',
    toolName: 'veteransDefenceCareers',
    part: careers({ path: 'officer', education: 'grade10' }),
  },
  {
    name: 'Careers · forces.ca down (saved list fallback)',
    toolName: 'veteransDefenceCareers',
    part: careers({ interests: ['computing'] }, 'output-available', { live: false, asOf: SNAPSHOT.fetchedAt }),
  },
  { name: 'Careers · error', toolName: 'veteransDefenceCareers', part: careers({}, 'output-error') },

  // ── Veterans benefits navigator ──
  { name: 'Benefits · running (skeleton)', toolName: 'veteransDefenceBenefits', part: benefits({ status: 'releasing' }, 'input-available') },
  {
    name: 'Benefits · “What support is there after I leave the Forces?”',
    toolName: 'veteransDefenceBenefits',
    part: benefits({ status: 'releasing' }),
  },
  {
    name: 'Benefits · Veteran going back to school, 12+ years of service',
    toolName: 'veteransDefenceBenefits',
    part: benefits({ status: 'veteran', needs: ['school', 'career'], yearsOfService: 14, serviceRelated: 'no' }),
  },
  {
    name: 'Benefits · Veteran in an emergency (rent, food)',
    toolName: 'veteransDefenceBenefits',
    part: benefits({ status: 'veteran', needs: ['emergency', 'money'] }),
  },
  {
    name: 'Benefits · PTSD related to service',
    toolName: 'veteransDefenceBenefits',
    part: benefits({ status: 'veteran', serviceRelated: 'yes', needs: ['mental', 'money'] }),
  },
  { name: 'Benefits · spouse of a Veteran, mental health', toolName: 'veteransDefenceBenefits', part: benefits({ status: 'family', needs: ['mental'] }) },
  { name: 'Benefits · caregiver of a Veteran, help at home', toolName: 'veteransDefenceBenefits', part: benefits({ status: 'family', needs: ['home'] }) },
  { name: 'Benefits · RCMP, mental health', toolName: 'veteransDefenceBenefits', part: benefits({ status: 'rcmp', needs: ['mental'] }) },
  { name: 'Benefits · survivor', toolName: 'veteransDefenceBenefits', part: benefits({ status: 'survivor' }) },
  {
    name: 'Benefits · serving member, nothing service-related',
    toolName: 'veteransDefenceBenefits',
    part: benefits({ status: 'serving', serviceRelated: 'no' }),
  },
  { name: 'Benefits · error', toolName: 'veteransDefenceBenefits', part: benefits({}, 'output-error') },

  // ── Mental health support ──
  { name: 'Mental health · running (skeleton)', toolName: 'veteransDefenceMentalHealth', part: supports({}, 'input-streaming') },
  { name: 'Mental health · Veteran', toolName: 'veteransDefenceMentalHealth', part: supports({ audience: 'veteran' }) },
  { name: 'Mental health · serving member', toolName: 'veteransDefenceMentalHealth', part: supports({ audience: 'serving' }) },
  { name: 'Mental health · family', toolName: 'veteransDefenceMentalHealth', part: supports({ audience: 'family' }) },
  { name: 'Mental health · RCMP', toolName: 'veteransDefenceMentalHealth', part: supports({ audience: 'rcmp' }) },
  { name: 'Mental health · error', toolName: 'veteransDefenceMentalHealth', part: supports({}, 'output-error') },
];

export default fixtures;
