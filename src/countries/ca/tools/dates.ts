/**
 * AI tools for the `dates` widget (facts: widgets/dates/data.ts, verified on canada.ca 2026-09-30).
 *   datesCalendar  2026 benefit payment dates + tax deadlines + holidays in one calendar, add-to-calendar (.ics)
 *   datesHolidays  statutory holidays by province/territory (live from canada-holidays.ca), next long weekend
 * Live sources are read server-side with a timeout and cache; every tool falls back to verified data.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { PROGRAMS, PROVINCES } from '../widgets/dates/data';
import { fetchHolidays, fetchPaymentAlertsBoth, fetchPayments } from '../widgets/dates/feeds';
import { buildCalendar, buildHolidays, provinceFromZone } from '../widgets/dates/build';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (from the system prompt), so today's date matches theirs.");
const province = z
  .enum(PROVINCES)
  .optional()
  .describe('Province or territory code (ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, YT, NT, NU) if the person said where they live or named a city. Omit if unknown; never guess from the language.');

export const tools = {
  datesCalendar: tool({
    description:
      'Key dates calendar for Canada: every 2026 federal benefit payment date (Canada child benefit, Canada Groceries and Essentials Benefit — which replaced the GST/HST credit in July 2026 —, Old Age Security incl. GIS, Canada Pension Plan, advanced Canada workers benefit, Canada Disability Benefit, Veteran disability pension, plus the Ontario trillium benefit, Alberta child and family benefit and Newfoundland and Labrador disability benefit for those provinces), personal tax deadlines (RRSP, filing, self-employed, instalments) and statutory holidays, read live from canada.ca. Shows the next payment with a countdown, a month calendar, an agenda, and lets the person add the dates to their phone calendar (.ics file, saved on the device). Use it for "when is my next CCB / OAS / CPP / GST payment", "benefit payment dates 2026", "payment calendar", "key tax dates", "add my payment dates to my calendar". Pass only the programs the person mentioned (none = all main programs). Do not use it for EI: EI payments are not on fixed dates. It shows dates only, never amounts or personal information.',
    inputSchema: z.object({
      programs: z
        .array(z.enum(PROGRAMS))
        .max(10)
        .optional()
        .describe('Programs they asked about: ccb (Canada child benefit), cgeb (Canada Groceries and Essentials Benefit / former GST/HST credit), oas (Old Age Security, GIS), cpp (Canada Pension Plan), cwb (advanced Canada workers benefit), cdb (Canada Disability Benefit), vdp (Veteran disability pension), otb (Ontario trillium benefit), acfb (Alberta child and family benefit), nldb (NL disability benefit).'),
      focus: z.enum(['all', 'payments', 'taxes', 'holidays']).optional().describe('"payments" for benefit dates only, "taxes" for tax deadlines only, "all" (default) for everything.'),
      province,
      month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Month to open the calendar on (YYYY-MM), if they asked about a specific month.'),
      lang,
      timeZone,
    }),
    execute: async ({ timeZone: tz, province: p, ...input }, { abortSignal }) => {
      const today = todayInCanada(new Date(), tz);
      const guessed = p ? null : provinceFromZone(tz);
      const y = Number(today.slice(0, 4));
      const [payments, holidays, notices] = await Promise.all([
        fetchPayments(abortSignal),
        fetchHolidays([y, y + 1], abortSignal),
        fetchPaymentAlertsBoth(abortSignal),
      ]);
      return buildCalendar({ ...input, province: p ?? guessed ?? undefined, provinceGuessed: Boolean(guessed) }, today, {
        payments,
        holidays: holidays?.holidays ?? null,
        notices,
      });
    },
  }),

  datesHolidays: tool({
    description:
      'Statutory (public) holidays in Canada by province or territory, read live from canada-holidays.ca with each province’s official source: the full list for the year, which days are observed on another day (e.g. Boxing Day on a Saturday), the next holiday with a countdown and whether it makes a long weekend, federal holidays that the province does not observe, and add-to-calendar (.ics). Federal holidays = the 10 Canada Labour Code general holidays that federally regulated workplaces (banks, airlines, railways, telecoms) must give; Easter Monday and Civic Holiday are only federal public-service days (`clc: false`), never say federally regulated employers observe them. Use it for "stat holidays in Ontario", "next long weekend", "is Remembrance Day a stat holiday in Nova Scotia", "is today a holiday", "jours fériés au Québec". Pass `holiday` when they ask about one holiday by name. Without a province it shows the Canada Labour Code holidays and lets the person pick their province. Newfoundland and Labrador has 6 paid public holidays under its Labour Standards Act; St. Patrick’s Day, St. George’s Day, Victoria Day, the June Holiday, Orangemen’s Day, the National Day for Truth and Reconciliation, Thanksgiving and Boxing Day are days off for provincial government employees (`asked.government`; the four that are Canada Labour Code holidays also apply to federally regulated workplaces), never call them statutory in N.L. Quebec: the employer gives either Good Friday or Easter Monday (CNESST), so in Quebec neither is a plain yes or no — the output marks it `asked.choice`. `summary.today` is today’s holiday (never call it "next"); `summary.nextLongWeekend` answers long-weekend questions.',
    inputSchema: z.object({
      province,
      year: z.number().int().min(2026).max(2027).optional().describe('Year of the list (defaults to this year, or next year once this year’s holidays are over).'),
      holiday: z.string().max(80).optional().describe('A holiday they asked about by name, e.g. "Remembrance Day", "Family Day", "Saint-Jean-Baptiste".'),
      longWeekend: z.boolean().optional().describe('True when they asked about the next long weekend: the widget leads with the next holiday that makes a weekend of 3 days or more (never today).'),
      lang,
      timeZone,
    }),
    execute: async ({ timeZone: tz, province: p, ...input }, { abortSignal }) => {
      const today = todayInCanada(new Date(), tz);
      const guessed = p ? null : provinceFromZone(tz);
      const y = Number(today.slice(0, 4));
      const feed = await fetchHolidays([y, y + 1], abortSignal);
      return buildHolidays({ ...input, province: p ?? guessed ?? undefined, provinceGuessed: Boolean(guessed) }, today, {
        holidays: feed?.holidays ?? null,
      });
    },
  }),
} satisfies ToolSet;
