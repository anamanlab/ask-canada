/**
 * The "renew" patterns and the month scenarios built from them ("My passport expires in March"), kept apart
 * from the scenario table because they are generated: one per month, in the future and in the past.
 */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../../../data/holidays';
import { monthName } from './format';
import { monthAnswer } from './monthAnswer';
import { expiryFrom, MONTH_ANY, MONTHS, PAST, type Ctx, type L } from './parse';

export const RENEW = [
  /\b(renew|renewal|renewing)\b.*\bpassport/i,
  /\bpassport\b.*\b(renew|renewal|expir\w*)\b/i,
  /\b(renouvel\w*)\b.*\bpasseport/i,
  /\bpasseport\b.*\b(renouvel\w*|expir\w*)/i,
];

/**
 * "My passport expires in March": one scenario per month, so the trip follow-up can carry the month ("I’m
 * travelling in 3 weeks and my passport expires in March") and the next planner keeps the expiry instead of
 * asking for it again. Follow-ups are fixed text, so a question that names a year (or two months) gets the
 * general scenario, whose trip chip leaves the month out.
 */
const renewMonthBase = {
  // The whole answer is computed (see monthAnswer) so it always matches the planner below it.
  reply: { en: '{answer}', fr: '{answer}' },
  vars: ({ text, lang, timeZone }: Ctx) => ({ answer: monthAnswer(text, lang, timeZone) }),
  toolCalls: [{ toolName: 'passportPlanner', input: ({ text, lang, timeZone }: Ctx) => ({ expiry: expiryFrom(text, todayInCanada(new Date(), timeZone)), lang, timeZone }) }],
};
const renewChips = (trip: Record<L, string>) => ({
  en: ['Find a passport office near me', 'What makes a passport photo acceptable?', 'Who can be my reference?', trip.en],
  fr: ['Trouver un bureau des passeports près de chez moi', 'Qu’est-ce qu’une photo de passeport acceptable?', 'Qui peut être ma référence?', trip.fr],
});
export const renewMonth: Scenario[] = [
  ...MONTHS.flatMap(([re, n], i) =>
    ([false, true] as const).map((past): Scenario => ({
      ...renewMonthBase,
      id: `passport-renew-month-${String(n).padStart(2, '0')}${past ? '-expired' : ''}`,
      priority: past ? 10.6 : 10.5,
      match: RENEW.map((r) => new RegExp(`(?=.*${r.source})(?=.*${re.source})${past ? `(?=.*${PAST.source})` : ''}`, 'iu')),
      // Like monthIn: the first month in calendar order is the expiry. A year can't ride along in a chip.
      exclude: [/\b20\d{2}\b/, ...MONTHS.slice(0, i).map(([earlier]) => earlier)],
      followUps: renewChips({
        en: `I’m travelling in 3 weeks and my passport ${past ? 'expired' : 'expires'} in ${monthName(n, 'en')}`,
        fr: `Je voyage dans 3 semaines et mon passeport ${past ? 'a expiré' : 'expire'} en ${monthName(n, 'fr')}`,
      }),
    })),
  ),
  {
    ...renewMonthBase,
    id: 'passport-renew-month',
    priority: 10,
    match: RENEW.map((re) => new RegExp(`(?=.*${re.source})(?=.*\\b(${MONTH_ANY})\\b)`, 'i')),
    followUps: renewChips({ en: 'I need my passport for a trip in 3 weeks', fr: 'J’ai besoin de mon passeport pour un voyage dans 3 semaines' }),
  },
];
