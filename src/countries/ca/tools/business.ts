/**
 * AI tools for the `business` widget (starting and running a business in Canada).
 *   businessStructure    — sole proprietorship vs partnership vs corporation, with a fit meter.
 *   businessIncorporate  — federal incorporation: 5 steps, fees, provinces to register in, what comes after.
 *   businessRegistration — do I need a business number and a GST/HST account? Small supplier test by quarter.
 *   businessFunding      — grants, loans and advice: Business Benefits Finder + regional agency + programs.
 *   businessTrade        — importing and exporting basics; LIVE Bank of Canada rates for a duty + GST estimate.
 * Facts and sources: widgets/business/data.ts. Pure rules: widgets/business/calc.ts.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { buildFunding, buildIncorporate, buildRegistration, buildStructure, buildTrade } from '../widgets/business/build';
import { fetchFxRates } from '../widgets/business/live';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr); official links come back in this language.');
const province = z
  .enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'])
  .optional()
  .describe('Two-letter province or territory where the business is based, only if the person said it.');

export const tools = {
  businessStructure: tool({
    description:
      'Compares the three ways to structure a business in Canada — sole proprietorship, partnership and corporation — side by side (who owns it, personal liability for debts, how income is taxed, set-up, lifespan, raising money) and shows which fits best with a simple, transparent fit meter the person can adjust. Use it for "should I incorporate?", "sole proprietor or corporation?", "what business structure should I choose?", "what is a partnership?", "incorporer ou pas?". Pass owners="partners" if they start with someone else, and priorities only when they said what matters (protect personal assets, keep it simple and cheap, raise money from investors, one name across Canada). It gives general information, not legal or tax advice.',
    inputSchema: z.object({
      owners: z.enum(['solo', 'partners']).optional().describe('solo = one owner (default); partners = two or more owners.'),
      priorities: z
        .array(z.enum(['protect', 'simple', 'invest', 'name']))
        .max(4)
        .optional()
        .describe('What matters to them: protect (limit personal liability), simple (low cost and paperwork), invest (raise money / sell shares), name (one protected name across Canada).'),
      province,
      lang,
    }),
    execute: async (input) => buildStructure(input),
  }),

  businessIncorporate: tool({
    description:
      'Federal incorporation planner (Corporations Canada, under the Canada Business Corporations Act): the 5 official steps (name, articles, registered office and directors, individuals with significant control, submit and pay), the fee ($200 online, usually 1 business day; +$100 express in 4 hours), the $12 annual return, the business number that arrives by email, and which provinces or territories the corporation must also register in (and how). Use it for "how do I incorporate?", "how much does it cost to incorporate federally?", "numbered company", "constituer une société au fédéral". Pass provinces where they will do business if they said, nameType="word" if they want a named (not numbered) corporation, express=true if they are in a hurry.',
    inputSchema: z.object({
      nameType: z.enum(['numbered', 'word']).optional().describe('numbered (e.g. 12345678 Canada Inc.) or word (a chosen name).'),
      express: z.boolean().optional().describe('True if they want it faster (express service).'),
      provinces: z
        .array(z.enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']))
        .max(13)
        .optional()
        .describe('Provinces/territories where the corporation will do business (two-letter codes).'),
      lang,
    }),
    execute: async (input) => buildIncorporate(input),
  }),

  businessRegistration: tool({
    description:
      'Business number (BN) and GST/HST registration checker (CRA). Runs the official small supplier test on the last four calendar quarters ($30,000 for most businesses, $50,000 for charities and public service bodies): register now if one quarter went over, or the date they stop being a small supplier if the four-quarter total went over. Also shows which CRA program accounts they need (GST/HST RT, payroll RP, corporation income tax RC, import-export RM), the GST/HST rate for their province, that taxi and rideshare drivers must register whatever they earn, and that Quebec businesses register with Revenu Québec. Use it for "do I need to register for GST/HST?", "do I need a business number?", "I sell on Etsy / I freelance, do I charge GST?", "dois-je m’inscrire à la TPS?". Pass their sales if given: quarterlySales (oldest to newest, up to 4) or annualSales. Do not use it for the GST/HST credit or Canada Groceries and Essentials Benefit (personal benefits).',
    inputSchema: z.object({
      quarterlySales: z.array(z.number().min(0).max(1e9)).max(4).optional().describe('Taxable sales (before expenses) for the last calendar quarters, oldest first; the last one is the current quarter.'),
      annualSales: z.number().min(0).max(1e10).optional().describe('Yearly taxable sales, when they gave one figure instead of quarters.'),
      org: z.enum(['business', 'charity', 'psb']).optional().describe('business (default), charity, or other public service body (non-profit, municipality…).'),
      rideshare: z.boolean().optional().describe('True for taxi or commercial rideshare drivers (Uber, Lyft) — not food delivery.'),
      employees: z.boolean().optional().describe('True if they have or will hire employees (payroll account).'),
      incorporated: z.boolean().optional().describe('True if the business is (or will be) a corporation.'),
      trade: z.boolean().optional().describe('True if they import or export commercial goods.'),
      province,
      lang,
      timeZone: z.string().max(64).optional().describe("The person's IANA time zone, so the current calendar quarter matches theirs."),
    }),
    execute: async ({ timeZone, ...input }) => buildRegistration(input, todayInCanada(new Date(), timeZone)),
  }),

  businessFunding: tool({
    description:
      'Grants, loans and business support finder. Always leads with the Business Benefits Finder (the official self-serve tool that gives a personalized list of federal and provincial funding, loans and advice), then the federal regional development agency for their province or territory, then programs that fit their need: Canada Small Business Financing Program (loans through your bank), NRC IRAP (innovation), CanExport SMEs and the Trade Commissioner Service (exporting), Canada Strong support plus the CBSA Duties Relief and Drawback programs (tariff-affected businesses). Use it for "are there grants to start a business?", "funding for my restaurant in Manitoba", "small business loans", "subventions pour entreprise". Never list or invent grant amounts; pass province and need only if the person said them.',
    inputSchema: z.object({
      province,
      need: z.enum(['start', 'grow', 'export', 'innovate', 'tariffs']).optional().describe('What the money or help is for: start (default), grow, export, innovate (R&D, technology), tariffs (hurt by U.S. tariffs).'),
      lang,
    }),
    execute: async (input) => buildFunding(input),
  }),

  businessTrade: tool({
    description:
      'Importing and exporting basics for businesses (CBSA). Import: what to set up (CARM Client Portal account, business number, RM import program account, optional customs broker and Release Prior to Payment), how duties and GST are calculated, and a duty + GST estimate that converts the invoice with the LIVE Bank of Canada daily exchange rate (USD, EUR, GBP, CNY, MXN, JPY, INR, KRW). Export: whether an export declaration and permit are needed (none for most goods to the U.S.; required for commercial goods worth CAN$2,000 or more to other countries, and for controlled goods), the reporting deadline by transport mode, and the Trade Commissioner Service. Use it for "how do I import goods into Canada?", "duty on goods from China", "do I need an export declaration?", "importer des marchandises". Duty rates come from the Customs Tariff: pass dutyRate only if the person gave one.',
    inputSchema: z.object({
      direction: z.enum(['import', 'export']).optional().describe('import (default) or export.'),
      amount: z.number().min(0).max(1e9).optional().describe('Import: invoice value in the invoice currency, only if the person gave one. Omit it otherwise: the estimate opens empty and asks for it.'),
      currency: z.enum(['USD', 'EUR', 'GBP', 'CNY', 'MXN', 'JPY', 'INR', 'KRW', 'CAD']).optional().describe('Import: invoice currency, only if the person named one (the field defaults to USD). If live rates are down, a foreign invoice is not converted: the widget asks for the Canadian-dollar value.'),
      origin: z
        .enum(['us', 'other'])
        .optional()
        .describe('Import: where the goods are made, only if the person said: us (United States) or other (any other country). Never infer it from the invoice currency: suppliers in China and elsewhere often invoice in U.S. dollars. Omit if unknown.'),
      dutyRate: z.number().min(0).max(300).optional().describe('Import: customs duty rate in percent, only if known.'),
      destination: z.enum(['us', 'other']).optional().describe('Export: us (United States, Puerto Rico, U.S. Virgin Islands) or other.'),
      restricted: z.boolean().optional().describe('Export: true if the goods are controlled, regulated or prohibited (need a permit).'),
      value: z.number().min(0).max(1e10).optional().describe('Export: value of the shipment in Canadian dollars. Omit if unknown; the widget asks for it before giving a verdict.'),
      lang,
    }),
    execute: async (input, { abortSignal }) => buildTrade(input, await fetchFxRates(abortSignal)),
  }),
} satisfies ToolSet;
