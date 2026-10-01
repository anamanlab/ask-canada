/**
 * AI tools for the `money` widget (personal finances, from official Government of Canada sources).
 *   moneyRespPlanner        — RESP projection with the Canada Education Savings Grant and Canada Learning Bond
 *   moneyAccountCompare     — TFSA vs RRSP vs FHSA: how each is taxed, 2026 limits, same-pay illustration
 *   moneyMortgageStressTest — stress test (5.25% or rate + 2%), GDS/TDS limits, down payment, CMHC premium,
 *                             live Bank of Canada rates
 *   moneyBudgetPlanner      — monthly budget with the FCAC 3-to-6-month emergency fund target
 * Facts verified on canada.ca / cmhc-schl.gc.ca: see widgets/money/data.ts.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { buildBudget, buildCompare, buildMortgage, buildResp } from '../widgets/money/build';
import { BUDGET_CATEGORIES } from '../widgets/money/calc/budget';
import { fetchRates } from '../widgets/money/live';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const dollars = (d: string) => z.number().min(0).max(100_000_000).optional().describe(d);
const pct = (d: string) => z.number().min(0).max(60).optional().describe(d);

export const tools = {
  moneyRespPlanner: tool({
    description:
      'RESP (Registered Education Savings Plan) planner for a child in Canada. Projects, year by year until the end of the year the child turns 17, what the family puts in, the Canada Education Savings Grant (CESG: 20% on the first $2,500 a year = $500, up to $1,000 a year when catching up unused room, $7,200 lifetime), the additional CESG for low and middle incomes (extra 20% or 10% on the first $500; 2026 income limits $58,523 and $117,045), the Canada Learning Bond (CLB: $500 + $100 a year to age 15, up to $2,000, no contribution needed, for lower-income families; retroactive) and an assumed growth rate. The widget lets the person move the child’s age, yearly contribution and income, and hands off to the official “Open an RESP” steps. Use for: RESP, CESG, “how much is the education savings grant”, “how much will the government add to my child’s RESP”, Canada Learning Bond, “saving for my kid’s education”, REEE, SCEE, Bon d’études canadien. Pass only what the person said; leave the rest empty.',
    inputSchema: z.object({
      childAge: z.number().int().min(0).max(17).optional().describe('Child’s age this year (0 for a newborn).'),
      annual: dollars('What they plan to contribute per year, in dollars (multiply a monthly amount by 12).'),
      familyIncome: dollars('Adjusted family net income, in dollars, if they said it.'),
      incomeTier: z.enum(['low', 'middle', 'high']).optional().describe('If only a rough level was given: low (under $58,523), middle ($58,523 to $117,045), high (over $117,045).'),
      children: z.number().int().min(1).max(15).optional().describe('Number of children in the family (the Canada Learning Bond income limit depends on it).'),
      growth: z.number().min(0).max(10).optional().describe('Assumed yearly growth in percent, only if the person gave one.'),
      lang,
      timeZone: z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt)."),
    }),
    execute: async ({ timeZone, ...a }) => buildResp(a, todayInCanada(new Date(), timeZone)),
  }),

  moneyAccountCompare: tool({
    description:
      'Compares the three registered savings accounts, TFSA (Tax-Free Savings Account), RRSP (Registered Retirement Savings Plan) and FHSA (First Home Savings Account): whether contributions are tax-deductible, whether withdrawals are taxed, 2026 limits (TFSA $7,000; RRSP 18% of last year’s earned income up to $33,810; FHSA $8,000 a year, $40,000 lifetime), who can open each, the Home Buyers’ Plan ($60,000 from an RRSP), and an illustration of what the same pre-tax pay becomes in each account given the person’s tax rate now and when they take the money out. General information, not financial advice. Use for: “TFSA or RRSP?”, “should I use an FHSA or RRSP for a house”, “difference between TFSA and RRSP”, “best account to save for my first home”, CELI ou REER, CELIAPP. For “how much room do I have” use taxesSavingsRoom instead.',
    inputSchema: z.object({
      goal: z.enum(['home', 'retirement', 'anything']).optional().describe('What the savings are for: a first home, retirement, or anything (flexible).'),
      firstHome: z.boolean().optional().describe('True if they are a first-time home buyer; false if they own a home they live in.'),
      age: z.number().int().min(0).max(120).optional(),
      amount: dollars('Pre-tax amount they want to set aside, if mentioned (default 1,000).'),
      rateNow: pct('Their marginal tax rate now, in percent, if known.'),
      rateLater: pct('Expected marginal tax rate when withdrawing, in percent, if known.'),
      years: z.number().int().min(0).max(60).optional().describe('Years until they need the money.'),
      lang,
    }),
    execute: async (a) => buildCompare(a),
  }),

  moneyMortgageStressTest: tool({
    description:
      'Mortgage stress test and affordability check for buying a home in Canada. Tests the payment at the minimum qualifying rate (the higher of 5.25% or the contract rate + 2%), computes the gross debt service (GDS, housing costs ≤ 39% of gross household income) and total debt service (TDS, ≤ 44%) ratios, checks the minimum down payment (5% up to $500,000, 10% on the portion to $1.5 million, 20% at $1.5 million+), adds the CMHC insurance premium when the down payment is under 20%, applies the 30-year amortization rule (first-time buyers and new builds), and finds the highest price that passes. Shows live Bank of Canada rates (5-year posted mortgage rate, policy rate, prime). Use for: “can I afford a $600,000 house”, “mortgage stress test”, “how much mortgage do I qualify for”, “minimum down payment”, “CMHC insurance”, test de résistance, hypothèque. Pass only the numbers they gave (income is gross yearly household income).',
    inputSchema: z.object({
      income: dollars('Gross yearly household income, in dollars.'),
      price: dollars('Home purchase price, in dollars.'),
      downPayment: dollars('Down payment in dollars (convert a percentage of the price to dollars).'),
      rate: z.number().min(0).max(25).optional().describe('The mortgage interest rate they were offered, in percent.'),
      amortization: z.union([z.literal(25), z.literal(30)]).optional().describe('Amortization in years.'),
      propertyTax: dollars('Yearly property tax, in dollars.'),
      heating: dollars('Monthly heating costs, in dollars.'),
      condoFees: dollars('Monthly condo fees, in dollars.'),
      debts: dollars('Monthly payments on other debts (car loan, credit cards, lines of credit, student loans, support), in dollars.'),
      firstTimeBuyer: z.boolean().optional(),
      newBuild: z.boolean().optional(),
      lang,
    }),
    execute: async (a, { abortSignal }) => buildMortgage(a, await fetchRates(abortSignal)),
  }),

  moneyBudgetPlanner: tool({
    description:
      'Monthly budget planner (based on the Financial Consumer Agency of Canada’s “Making a budget” guidance): take-home income, expenses by category (housing, utilities, food, transport, childcare, debt payments, insurance, phone and internet, personal, other) and savings, showing what is left, where the money goes, and the emergency fund target of 3 to 6 months of expenses with how long it takes to reach. Everything is editable in the widget and saved only on the device; hands off to the FCAC Budget Planner to compare with similar Canadians. Use for: “help me make a budget”, “budget planner”, “how much should I have in an emergency fund”, “I’m spending more than I earn”, faire un budget, fonds d’urgence. Pass only the amounts the person gave, as monthly dollars.',
    inputSchema: z.object({
      income: dollars('Monthly take-home pay (after tax), in dollars. Divide yearly net pay by 12.'),
      expenses: z
        .object(Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, z.number().min(0).max(10_000_000).optional()])) as Record<(typeof BUDGET_CATEGORIES)[number], z.ZodOptional<z.ZodNumber>>)
        .partial()
        .optional()
        .describe('Monthly expenses by category, in dollars (rent or mortgage goes in housing).'),
      savings: dollars('Monthly amount already going to savings.'),
      emergencySaved: dollars('Money already set aside for emergencies.'),
      lang,
    }),
    execute: async (a) => buildBudget(a),
  }),
} satisfies ToolSet;
