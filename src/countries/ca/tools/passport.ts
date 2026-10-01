/**
 * AI tools for the `passport` widget.
 *   passportPlanner — renewal planner: eligibility, method comparison, fees, holiday-aware timeline,
 *   checklist and official handoff. Facts verified on canada.ca (see widgets/passport/data.ts).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { fetchPassportNotices } from '../widgets/passport/notices';
import { lastMonthOccurrence, nextMonthOccurrence, planRenewal } from '../widgets/passport/plan';
import { clockIn } from '../widgets/passport/answers/days';

const month = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/);

export const tools = {
  passportPlanner: tool({
    description:
      'Passport renewal planner for an adult Canadian passport applied for in Canada. Shows whether the person can renew (vs apply for a new passport), whether online renewal is open (expires within 6 months or already expired), fees (10-year $163.50 / 5-year $122.50), processing by method (online, in person, by mail) with a holiday-aware timeline, the checklist, live service notices from canada.ca and the official handoff. If they are travelling, pass travelDate: it checks the trip against processing and points to express or urgent pick-up when needed, or, when even urgent pick-up would be ready only on or after the departure day, to the Passport Program and emergency weekend or statutory holiday service. Use for any question about renewing a passport, passport fees, processing times or "my passport expires in …". Pass focus so it leads with the answer to the question asked: "fees" for cost ("how much does a passport cost?"), "processing" for how long it takes, "online" for whether they can renew online. If they gave only a month (e.g. "March"), pass expiryMonth 1-12, plus expired: true when they say it already expired; if they gave a year or full date pass expiry.',
    inputSchema: z.object({
      expiry: month.optional().describe('Current passport expiry as YYYY-MM or YYYY-MM-DD, if known.'),
      expiryMonth: z.number().int().min(1).max(12).optional().describe('Expiry month only (1-12) when no year was given; the next occurrence is used (or the last one when expired is true).'),
      expired: z.boolean().optional().describe('True when they said the passport already expired ("it expired in March"), so a month-only expiry is in the past.'),
      travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Planned departure date, if mentioned.'),
      issuedAt16OrOlder: z.boolean().optional(),
      issuedWithin15Years: z.boolean().optional(),
      sameDetails: z.boolean().optional().describe('False if they want to change name, date/place of birth or gender identifier.'),
      livesInCanada: z.boolean().optional(),
      validityYears: z.union([z.literal(5), z.literal(10)]).optional(),
      focus: z
        .enum(['fees', 'processing', 'online'])
        .optional()
        .describe(
          'What the question was about, so the planner opens with that answer instead of the expiry picker: "fees" (10-year, 5-year, urgent and express fees), "processing" (business days by method, plus mailing), "online" (who can renew online).',
        ),
      lang: z.enum(['en', 'fr']).optional().describe('Language of the answer.'),
      timeZone: z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs."),
    }),
    execute: async ({ expiryMonth, expiry, expired, timeZone, ...rest }, { abortSignal }) => {
      const now = new Date();
      const today = todayInCanada(now, timeZone);
      const exp = expiry ?? (expiryMonth ? (expired ? lastMonthOccurrence : nextMonthOccurrence)(expiryMonth, today) : undefined);
      const notices = await fetchPassportNotices(today, abortSignal);
      return planRenewal({ ...rest, expiry: exp }, today, notices, clockIn(now, timeZone));
    },
  }),
} satisfies ToolSet;
