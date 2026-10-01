/**
 * AI tools for the `taxes` widget (personal income tax, Canada Revenue Agency).
 *   taxesDeadlines    — countdown to the filing deadline + every date that matters for this return
 *   taxesEstimator    — refund / balance-owing estimate with federal + provincial brackets (2026 rates)
 *   taxesSavingsRoom  — TFSA, RRSP and FHSA room helper
 *   taxesFreeFiling   — free ways to file: free tax clinics, SimpleFile, certified NETFILE software
 *   taxesRefundStatus — where is my refund: service-standard timeline + CRA account handoff
 * Facts verified on canada.ca: see widgets/taxes/data.ts.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { buildDeadlines, buildEstimate, buildFreeFiling, buildRefund, buildRoom } from '../widgets/taxes/build';
import { COMPLEXITIES, type Complexity } from '../widgets/taxes/calc/free-filing';
import { PROVINCES, type ProvinceCode } from '../widgets/taxes/data';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs.");
const money = (d: string) => z.number().min(0).max(100_000_000).optional().describe(d);
const province = z
  .enum(PROVINCES as [ProvinceCode, ...ProvinceCode[]])
  .optional()
  .describe('Province or territory of residence on December 31, as a 2-letter code (ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, YT, NT, NU).');

export const tools = {
  taxesDeadlines: tool({
    description:
      'Tax deadlines countdown for Canadian personal income tax. Shows the days left until the filing and payment deadline for the return being prepared now (the 2026 return is due April 30, 2027; June 15, 2027 to file if the person or their spouse/partner is self-employed, but any balance is still due April 30), plus the other dates that matter for that return: the December 15 instalment, the December 31 FHSA deadline and the RRSP contribution deadline (60 days into the new year), with the CRA weekend/holiday rollover rule, the late-filing penalty and an add-to-calendar option. Use for "when are taxes due", "tax deadline", "RRSP deadline", "how long until tax season", "I’m self-employed, when do I file".',
    inputSchema: z.object({
      selfEmployed: z.boolean().optional().describe('True if the person or their spouse/common-law partner is self-employed (June 15 filing deadline).'),
      focus: z
        .enum(['file', 'rrsp'])
        .optional()
        .describe('Which date the countdown leads with: "rrsp" when the person asked about the RRSP contribution deadline, otherwise "file" (default).'),
      lang,
      timeZone,
    }),
    execute: async ({ timeZone: tz, ...a }) => buildDeadlines(a, todayInCanada(new Date(), tz)),
  }),

  taxesEstimator: tool({
    description:
      'Estimates a Canadian tax refund or balance owing for the 2026 tax year (return filed in 2027), using the official 2026 federal and provincial/territorial brackets, basic personal amounts, the Canada employment amount, CPP/EI credits and deductions, the Ontario surtax and health premium, the BC and Ontario tax reductions and the Alberta supplemental credit. Quebec residents get the federal part only (with the 16.5% abatement); Quebec tax is filed with Revenu Québec. The widget lets the person edit every number and shows marginal and average rates plus how much a $1,000 RRSP contribution saves. Use for "how much tax will I pay", "will I get a refund", "do I owe", "what is my tax bracket", "how much does an RRSP save me". Pass only what the person said: employmentIncome = T4 box 14; taxDeducted = income tax deducted (T4 box 22). It is an estimate, not an assessment.',
    inputSchema: z.object({
      province,
      employmentIncome: money('Employment income for 2026 (T4 box 14), in dollars.'),
      otherIncome: money('Other taxable income without CPP/EI (interest, EI benefits, pension), in dollars.'),
      rrspContribution: money('RRSP contributions to deduct, in dollars.'),
      fhsaContribution: money('FHSA contributions to deduct, in dollars.'),
      taxDeducted: money('Income tax already deducted at source (T4 box 22), in dollars.'),
      lang,
    }),
    execute: async (a) => buildEstimate(a),
  }),

  taxesSavingsRoom: tool({
    description:
      'TFSA, RRSP and FHSA contribution room helper (2026). TFSA: total room since 2009 based on birth year (room starts the year you turn 18, or the year you became a resident), minus what they have put in (2026 limit $7,000; $109,000 total for someone 18+ and resident since 2009). RRSP: new room = 18% of last year’s earned income up to $33,810 for 2026, and the March 1, 2027 deadline for 2026 deductions. FHSA: $8,000 a year, up to $8,000 carried forward, $40,000 lifetime. The widget is interactive and points to the CRA account for the exact figure. Use for "how much can I put in my TFSA", "TFSA room", "RRSP limit", "FHSA", "CELI", "REER", "CELIAPP". Set focus to the plan they asked about.',
    inputSchema: z.object({
      focus: z.enum(['tfsa', 'rrsp', 'fhsa']).optional().describe('The plan the person asked about (opens that tab).'),
      birthYear: z.number().int().min(1900).max(2026).optional().describe('Year of birth, if known.'),
      age: z.number().int().min(0).max(120).optional().describe('Age today, when the birth year is not given.'),
      residentSince: z.number().int().min(1900).max(2026).optional().describe('Year they became a resident of Canada, if they moved here after 2009.'),
      tfsaContributed: money('Total TFSA contributions so far, minus withdrawals made before this year.'),
      earnedIncome: money('Earned income last year (2025), for new RRSP room.'),
      fhsaOpenedYear: z.number().int().min(2023).max(2026).optional().describe('Year they opened their first FHSA.'),
      fhsaContributed: money('FHSA contributions and RRSP transfers made before this year.'),
      lang,
    }),
    execute: async (a) => buildRoom(a),
  }),

  taxesFreeFiling: tool({
    description:
      'Free ways to file a Canadian tax return, checked against the person’s situation: free tax clinics run by volunteers (CVITP; the Income Tax Assistance – Volunteer Program in Quebec) with the suggested income limits by family size ($40,000 for 1 person, $55,000 for 2, $60,000 for 3, $65,000 for 4, $70,000 for 5, +$5,000 each extra) and what counts as a simple tax situation; SimpleFile (free CRA service for lower incomes and simple returns: SimpleFile Digital is open to eligible people with or without an invitation, SimpleFile by Phone and by Paper need an invitation; 2025 income limits by province); free certified NETFILE software; and the CRA pre-filled return invitations starting March 2027. Hands off to the official clinic finder. Use for "file my taxes for free", "free tax clinic near me", "SimpleFile", "NETFILE", "can someone do my taxes for free", "comptoir d’impôts".',
    inputSchema: z.object({
      province,
      familySize: z.number().int().min(1).max(15).optional().describe('People in the family: the person, their spouse/partner and dependants.'),
      familyIncome: money('Total family income, in dollars.'),
      age65: z.boolean().optional().describe('True if 65 or older (affects SimpleFile limits).'),
      complex: z
        .array(z.enum(COMPLEXITIES as [Complexity, ...Complexity[]]))
        .optional()
        .describe('Situations volunteers can’t handle, if mentioned: self-employment, rental income, capital gains, foreign income or property, interest over $1,200, bankruptcy, deceased person’s return.'),
      lang,
    }),
    execute: async (a) => buildFreeFiling(a),
  }),

  taxesRefundStatus: tool({
    description:
      'Where is my tax refund? Given when and how the return was filed, shows the CRA service standard (notice of assessment within 2 weeks for returns filed online on time, 12 weeks on paper; these goals only cover returns filed by the due date, so a return filed after April 30 (June 15 if self-employed) has no set timeline), where the person is on that timeline, when it makes sense to contact the CRA (after 12 weeks, 16 if living outside Canada), common reasons a refund is held back, and hands off to the progress tracker in the CRA account. Use for "where is my refund", "when will I get my tax refund", "how long does a refund take", "remboursement d’impôt". Pass filedOn (YYYY-MM-DD) and method only if the person said them.',
    inputSchema: z.object({
      filedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Date the return was filed (YYYY-MM-DD), if known.'),
      method: z.enum(['online', 'paper']).optional().describe('How it was filed: online (NETFILE, SimpleFile, a tax preparer’s EFILE) or paper.'),
      abroad: z.boolean().optional().describe('True if the person lives outside Canada.'),
      onTime: z
        .boolean()
        .optional()
        .describe('Only if the person said so: true if the return was filed by its due date (April 30, or June 15 if self-employed), false if late. Otherwise it is inferred from filedOn.'),
      lang,
      timeZone,
    }),
    execute: async ({ timeZone: tz, ...a }) => buildRefund(a, todayInCanada(new Date(), tz)),
  }),
} satisfies ToolSet;
