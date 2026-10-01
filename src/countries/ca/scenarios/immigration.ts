/**
 * Scripted scenarios for the `immigration` widget (EN + FR). This file is the list: which questions each
 * scenario answers, which tool it calls and what to ask next. The patterns and the answers themselves live in
 * widgets/immigration/scenario-copy/, one file per tool. Facts: widgets/immigration/data.ts. Live numbers
 * (latest round, processing times) are read through the same feeds the tools use.
 */
import type { Scenario } from '@/lib/scripted/types';
import { profileFromText } from '../widgets/immigration/parse';
import { CRS_EXCLUDE, CRS_MATCH, CRS_REPLY, crsVars, DRAW_MATCH, DRAW_REPLY, drawVars } from '../widgets/immigration/scenario-copy/crs';
import { ELIGIBILITY_EXCLUDE, ELIGIBILITY_MATCH, ELIGIBILITY_REPLY, eligibilityVars } from '../widgets/immigration/scenario-copy/eligibility';
import { PERMITS_EXCLUDE, PERMITS_MATCH, PERMITS_REPLY, permitsInput, permitsVars } from '../widgets/immigration/scenario-copy/permits';
import type { Ctx } from '../widgets/immigration/scenario-copy/shared';
import { PARENTS_EXCLUDE, PARENTS_MATCH, PARENTS_REPLY, parentsVars, TIMES_EXCLUDE, TIMES_MATCH, TIMES_REPLY, timesInput, timesVars } from '../widgets/immigration/scenario-copy/times';
import { VISA_EXCLUDE, VISA_MATCH, VISA_REPLY, visaInput, visaVars } from '../widgets/immigration/scenario-copy/visa';

const immigration: Scenario[] = [
  {
    id: 'immigration-crs',
    priority: 10,
    match: CRS_MATCH,
    exclude: CRS_EXCLUDE,
    reply: CRS_REPLY,
    vars: crsVars,
    toolCalls: [{ toolName: 'immigrationCrsCalculator', input: ({ text, lang }: Ctx) => ({ ...profileFromText(text), mode: 'score', lang }) }],
    followUps: {
      en: ['Am I eligible for Express Entry?', 'How long does Express Entry take?', 'What was the latest Express Entry draw?'],
      fr: ['Suis-je admissible à Entrée express?', 'Combien de temps prend Entrée express?', 'Quelle a été la dernière ronde d’Entrée express?'],
    },
  },
  {
    id: 'immigration-draw',
    priority: 12,
    match: DRAW_MATCH,
    reply: DRAW_REPLY,
    vars: drawVars,
    toolCalls: [{ toolName: 'immigrationCrsCalculator', input: ({ text, lang }: Ctx) => ({ ...profileFromText(text), mode: 'rounds', lang }) }],
    followUps: {
      en: ['What’s my CRS score?', 'Am I eligible for Express Entry?', 'How long does Express Entry take?'],
      fr: ['Quelle est ma note SCG?', 'Suis-je admissible à Entrée express?', 'Combien de temps prend Entrée express?'],
    },
  },
  {
    id: 'immigration-eligibility',
    priority: 8,
    match: ELIGIBILITY_MATCH,
    exclude: ELIGIBILITY_EXCLUDE,
    reply: ELIGIBILITY_REPLY,
    vars: eligibilityVars,
    toolCalls: [{ toolName: 'immigrationEligibility', input: ({ text, lang }: Ctx) => ({ ...profileFromText(text), lang }) }],
    followUps: {
      en: ['What’s my CRS score?', 'How long does Express Entry take?', 'How do I get a work permit?'],
      fr: ['Quelle est ma note SCG?', 'Combien de temps prend Entrée express?', 'Comment obtenir un permis de travail?'],
    },
  },
  {
    id: 'immigration-parents',
    priority: 10,
    match: PARENTS_MATCH,
    exclude: PARENTS_EXCLUDE,
    reply: PARENTS_REPLY,
    vars: parentsVars,
    toolCalls: [{ toolName: 'immigrationProcessingTimes', input: ({ lang }: Ctx) => ({ program: 'parents', lang }) }],
    followUps: {
      en: ['How long does a super visa take from India?', 'How long does spouse sponsorship take?', 'Do my parents need a visa to visit Canada?'],
      fr: ['Combien de temps prend un super visa depuis l’Inde?', 'Combien de temps prend le parrainage d’un époux ou conjoint?', 'Mes parents ont-ils besoin d’un visa pour visiter le Canada?'],
    },
  },
  {
    id: 'immigration-times',
    priority: 9,
    match: TIMES_MATCH,
    exclude: TIMES_EXCLUDE,
    reply: TIMES_REPLY,
    vars: timesVars,
    toolCalls: [{ toolName: 'immigrationProcessingTimes', input: timesInput }],
    followUps: {
      en: ['Do I need a visa to visit Canada?', 'How do I get a study permit?', 'What’s my CRS score?'],
      fr: ['Ai-je besoin d’un visa pour visiter le Canada?', 'Comment obtenir un permis d’études?', 'Quelle est ma note SCG?'],
    },
  },
  {
    id: 'immigration-visa',
    priority: 9,
    match: VISA_MATCH,
    exclude: VISA_EXCLUDE,
    reply: VISA_REPLY,
    vars: visaVars,
    toolCalls: [{ toolName: 'immigrationVisaCheck', input: visaInput }],
    followUps: {
      en: ['Visitor visa processing times', 'How do I get a study permit?', 'Can I immigrate to Canada?'],
      fr: ['Délais de traitement du visa de visiteur', 'Comment obtenir un permis d’études?', 'Puis-je immigrer au Canada?'],
    },
  },
  {
    id: 'immigration-permits',
    priority: 7,
    match: PERMITS_MATCH,
    exclude: PERMITS_EXCLUDE,
    reply: PERMITS_REPLY,
    vars: permitsVars,
    toolCalls: [{ toolName: 'immigrationPermits', input: permitsInput }],
    followUps: {
      en: ['Study permit processing times', 'Do I need a visa to visit Canada?', 'Can I immigrate to Canada?'],
      fr: ['Délais de traitement du permis d’études', 'Ai-je besoin d’un visa pour visiter le Canada?', 'Puis-je immigrer au Canada?'],
    },
  },
];

export default immigration;
