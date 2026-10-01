/**
 * AI tools for the `health` widget (Health & safety). Facts: widgets/health/data.ts.
 *   healthRecalls     — LIVE recalls and safety alerts (Health Canada, CFIA, Transport Canada) from recalls-rappels.canada.ca
 *   healthDentalCheck — Canadian Dental Care Plan eligibility + co-payment checker (recalculates on the device)
 *   healthDrugLookup  — LIVE Drug Product Database lookup by brand name or DIN
 *   healthTravel      — LIVE travel health notices (PHAC) for a destination + the 6-weeks-before clinic reminder
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildDental } from '../widgets/health/dental-build';
import { liveDrugs } from '../widgets/health/live-drugs';
import { liveRecalls } from '../widgets/health/live-recalls';
import { liveTravel } from '../widgets/health/live-travel';

// Required, so a French conversation never gets English pages and labels because the language was left out.
const lang = z.enum(['en', 'fr']).describe('Language of the conversation: "fr" when the person writes in French, otherwise "en". French returns French pages and labels.');

export const tools = {
  healthRecalls: tool({
    description:
      'LIVE recalls and safety alerts from the Government of Canada Recalls site (recalls-rappels.canada.ca), where Health Canada, the Canadian Food Inspection Agency (CFIA) and Transport Canada publish food, health product, consumer product and vehicle recalls. Call it for "any recent recalls?", "was X recalled?", "is there a recall on my car seat / baby formula / blender?", allergen questions ("recalls for undeclared peanut/milk/sesame") and "is this product safe?" when a product or brand is named. With a query it searches the live site (newest first; pass the brand or product as the person said it, and when the exact words find nothing the tool widens the search to the brand word and says so) and shows each notice with the product, the issue, what to do, where it was sold and the affected sizes and UPC codes; without a query it shows the newest notices. Never say a product is safe, or that it is a good sign, because nothing matched: say only that no notice matched that wording, and tell the person to try the brand name and check the official site. For a car\'s VIN, point to Transport Canada (the widget links it).',
    inputSchema: z.object({
      query: z
        .string()
        .max(80)
        .optional()
        .describe('Product, brand or allergen to search for, as the person said it (e.g. "car seat", "Tylenol", "peanut", "raspberries"). Omit for the latest recalls.'),
      category: z
        .enum(['all', 'food', 'health', 'consumer', 'vehicles'])
        .optional()
        .describe('Limit to one category only when the person asked for one (food, health products incl. drugs and medical devices, consumer products, vehicles). Default all.'),
      allergen: z
        .boolean()
        .optional()
        .describe('True when the person asks about an undeclared or mislabelled allergen (pass the allergen as the query, e.g. "peanut"): the widget opens on the allergen notices first.'),
      expand: z
        .boolean()
        .optional()
        .describe('True when the person asks which sizes, UPC codes or lot codes are affected: the newest notice opens with its details and affected products showing.'),
      lang,
    }),
    // `allergen` and `expand` only change how the widget opens: both are echoed, so the output records it.
    execute: async ({ query, category, allergen, expand, lang: l }, { abortSignal }) => ({
      ...(await liveRecalls({ query, category, lang: l === 'fr' ? 'fr' : 'en' }, abortSignal)),
      allergen: Boolean(allergen),
      expand: Boolean(expand),
    }),
  }),

  healthDentalCheck: tool({
    description:
      'Canadian Dental Care Plan (CDCP) eligibility and co-payment checker. The CDCP has 4 requirements: no access to private dental insurance or coverage (including through a job, pension, a family member\'s plan or a health spending account; government social program coverage is fine), tax returns filed in Canada (you and your spouse or partner), adjusted family net income under $90,000 (line 23600 for you and your spouse or partner, minus UCCB and RDSP income on lines 11700 and 12500, plus UCCB and RDSP amounts repaid on lines 21300 and 23200), and Canadian residency for tax purposes. Co-payment: 0% under $70,000, 40% from $70,000 to $79,999, 60% from $80,000 to $89,999. The widget shows each requirement, an income slider with the co-payment tiers and the handoff to apply; answers are kept on the device, so a later checker opens pre-filled. Render the full checker once per conversation; for follow-ups about coverage or cost pass view "summary", and for how to apply or find a dentist answer in text (the officialHandoff tool can link the apply page). Use for "am I eligible for the dental plan", "how much will the dental care plan cover", "dental care for seniors / kids / low income". Pass only what the person said; the other fields are optional and the widget asks for the rest. Never ask for a SIN. Dentists take part voluntarily, so tell people to ask theirs. Eligible First Nations and Inuit get dental benefits through the Non-Insured Health Benefits (NIHB) program instead: when that may apply, say so.',
    inputSchema: z.object({
      familyIncome: z.number().min(0).max(1_000_000).optional().describe('Adjusted family net income in dollars, if they gave it: line 23600 of their and their spouse\'s or partner\'s returns, minus UCCB and RDSP income (lines 11700, 12500), plus amounts repaid (lines 21300, 23200).'),
      noPrivateCoverage: z.boolean().optional().describe('True if they said they have NO dental insurance or coverage; false if they have access to any (even unused).'),
      filedTaxes: z.boolean().optional().describe('True if they (and their partner) filed last year\'s tax returns in Canada.'),
      residentForTax: z.boolean().optional().describe('True if they (and their partner) are Canadian residents for tax purposes.'),
      hasPartner: z.boolean().optional().describe('True if they have a spouse or common-law partner.'),
      view: z
        .enum(['checker', 'summary'])
        .optional()
        .describe('"checker" (default) shows the 4 questions and the income slider: use it for eligibility questions. "summary" is a compact card with the co-payment tiers and where the person stands: use it for follow-ups about coverage or cost, so the full checker isn\'t repeated.'),
      lang,
    }),
    execute: async (input) => buildDental({ ...input, lang: input.lang === 'fr' ? 'fr' : 'en' }),
  }),

  healthDrugLookup: tool({
    description:
      'LIVE lookup in Health Canada\'s Drug Product Database (DPD): is a drug authorized and marketed in Canada, its Drug Identification Number (DIN), active ingredients and strengths, dosage form, route, whether it needs a prescription, the company and the official product page. Use for "is X approved in Canada?", "what is in X?", "is X prescription-only?", "look up DIN 02241769", or when someone names a brand of medication. Pass the brand name (e.g. "Advil", "Ozempic") or the 8-digit DIN. Natural health products (vitamins, herbal remedies) are in a different database; the widget links it when nothing matches. This is information, not medical advice: suggest a pharmacist or doctor for questions about taking a medication.',
    inputSchema: z.object({
      query: z.string().max(60).describe('Brand name or 8-digit DIN, as the person wrote it. Leave it empty only when they named no drug: the widget then asks for the name.'),
      lang,
    }),
    execute: async ({ query, lang: l }, { abortSignal }) => liveDrugs({ query, lang: l === 'fr' ? 'fr' : 'en' }, abortSignal),
  }),

  healthTravel: tool({
    description:
      'LIVE travel health notices from the Public Health Agency of Canada (travel.gc.ca) for a destination, with the risk level (1 practise health precautions, 2 enhanced precautions, 3 avoid non-essential travel, 4 avoid all travel), plus the official advice to see a travel health clinic or health care provider about 6 weeks before the trip (the widget counts down to that date when a travel date is given) and links to find a clinic. Use for "what vaccines do I need for X", "is it safe health-wise to travel to X", "travel health advice for X", "dengue / measles / malaria in X", or "any travel health notices right now?". For entry rules, passports or security advisories, other tools are better.',
    inputSchema: z.object({
      destination: z.string().max(200).optional().describe('Country or place as the person named it (e.g. "Cuba", "Mexique", "the UK", "Bali"). Omit to list every current notice.'),
      travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Departure date YYYY-MM-DD, only if they gave one.'),
      lang,
    }),
    execute: async ({ destination, travelDate, lang: l }, { abortSignal }) => liveTravel({ destination, travelDate, lang: l === 'fr' ? 'fr' : 'en' }, abortSignal),
  }),
} satisfies ToolSet;
