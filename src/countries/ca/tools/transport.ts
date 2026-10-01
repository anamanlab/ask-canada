/**
 * AI tools for the `transport` widget (Transport & vehicles). Facts: widgets/transport/data.ts.
 *   transportRecalls     — LIVE vehicle recall lookup by make, model and year (Transport Canada recalls database API)
 *   transportDrone       — drone pilot certificate path: category, steps and Transport Canada's LIVE fees
 *   transportBoating     — Pleasure Craft Operator Card (PCOC): who needs proof of competency + youth horsepower limits
 *   transportTravelRules — travelling with cannabis or a pet (domestic trips vs crossing the border)
 *   transportEvIncentive — Electric Vehicle Affordability Program (EVAP): LIVE vehicle list, remaining funds, incentive calculator
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { buildBoat, buildDrone, buildEv, buildTravel } from '../widgets/transport/build';
import { L } from '../widgets/transport/data';
import { liveDroneFees, liveEv, liveRecalls } from '../widgets/transport/live';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr). French returns French pages and labels.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs.");

export const tools = {
  transportRecalls: tool({
    description:
      'LIVE vehicle safety recall lookup in Transport Canada\'s Motor Vehicle Safety Recalls Database for a car, SUV, truck, van or motorcycle, by make, model and model year. Shows every recall for that vehicle (newest first) with the Transport Canada recall number, date, system affected, units affected, and the plain-language issue, safety risk and fix, plus the manufacturer\'s own VIN recall lookup and phone line (from Transport Canada\'s list) and how to report a defect. Call it for "is there a recall on my 2016 Honda Civic?", "any recalls for a Ford F-150?", "check recalls before I buy a used RAV4". Pass make and model as the person wrote them (e.g. make "Chevy", model "Equinox"); omit year if they did not say it and the widget shows recalls per model year so they can pick. Recalls are linked to models, not individual vehicles: never say a specific car is or isn\'t affected; tell them to confirm with the VIN on the manufacturer\'s lookup or a dealer. For food, drug, consumer-product or child car seat recalls use the health recalls tool instead.',
    inputSchema: z.object({
      make: z.string().max(40).optional().describe('Vehicle make/brand, e.g. "Honda", "Ford", "Chevy", "VW".'),
      model: z.string().max(40).optional().describe('Model, e.g. "Civic", "F-150", "RAV4", "Model 3".'),
      year: z.number().int().min(1950).max(2030).optional().describe('Model year, if the person gave it.'),
      lang,
      timeZone,
    }),
    execute: async ({ make, model, year, lang: l, timeZone: tz }, { abortSignal }) =>
      liveRecalls({ make, model, year, lang: L(l) }, todayInCanada(new Date(), tz), abortSignal),
  }),

  transportDrone: tool({
    description:
      'Drone rules and pilot certificate path in Canada (Transport Canada, Canadian Aviation Regulations Part IX as updated Nov 4, 2025). From the drone\'s weight and what the person wants to do, it finds the category (microdrone under 250 g: no registration or certificate; Basic; Advanced; Level 1 Complex for beyond visual line-of-sight; or a Special Flight Operations Certificate for advertised events and drones over 150 kg), the minimum age (14 Basic, 16 Advanced, 18 Level 1 Complex), and the steps in order: registration, online exam (with question count and pass mark), flight review, certificate, RPAS Operator Certificate, with Transport Canada\'s current fees read live from its fee service. The person can change weight and operation in the widget. Use for "do I need a licence to fly my drone?", "how do I get a drone pilot certificate?", "can I fly my DJI Mini?", "how much is the drone exam?", "can I fly near people / near an airport?".',
    inputSchema: z.object({
      weightGrams: z.number().min(1).max(1_000_000).optional().describe('Drone take-off weight in grams if known (e.g. DJI Mini ≈ 249, Mavic 3 ≈ 895).'),
      size: z.enum(['micro', 'small', 'medium', 'large']).optional().describe('Only if no weight: micro < 250 g, small 250 g–25 kg, medium 25–150 kg, large > 150 kg.'),
      operation: z
        .enum(['standard', 'near-people', 'controlled-airspace', 'bvlos', 'event'])
        .optional()
        .describe('standard = away from people and airports (default); near-people = within 30 m of or over bystanders; controlled-airspace = near airports/controlled airspace; bvlos = beyond visual line-of-sight; event = an advertised event.'),
      age: z.number().int().min(5).max(110).optional().describe("Pilot's age, if mentioned."),
      lang,
      timeZone,
    }),
    execute: async ({ lang: l, timeZone: tz, ...input }, { abortSignal }) => {
      const today = todayInCanada(new Date(), tz);
      const { fees, live } = await liveDroneFees(today, abortSignal);
      return buildDrone({ ...input, lang: L(l) }, today, fees, live);
    },
  }),

  transportBoating: tool({
    description:
      'Pleasure Craft Operator Card (PCOC) and boating competency checker (Transport Canada). Anyone operating a recreational boat with any motor (even an electric trolling motor, even when it is off) needs proof of competency, most often the PCOC, which is valid for life and is obtained by passing a test from a Transport Canada-accredited course provider (fees are set by providers). Youth limits without direct supervision (someone 16+ in the boat): under 12 up to 10 hp, 12 to 15 up to 40 hp, and no one under 16 may operate a personal watercraft (PWC / Sea-Doo / jet ski) even supervised. Not required in Nunavut or NWT waters, or for visitors using their own boat for under 45 days. The widget lets the person set age, horsepower and PWC to see what they can drive. Use for "do I need a boating licence?", "can my 13-year-old drive our boat?", "how do I get my boater card?", "I lost my PCOC" (set lost: only the accredited course provider that issued the card can replace it, for a fee; Transport Canada\'s Course Provider Lookup finds it), "do I need a licence for a Sea-Doo / kayak / canoe with a motor?". Note: the Pleasure Craft Licence (a boat\'s licence number) is a different thing.',
    inputSchema: z.object({
      age: z.number().int().min(1).max(110).optional().describe("Operator's age, if mentioned."),
      horsepower: z.number().min(0).max(1000).optional().describe('Engine horsepower, if mentioned (0 = no motor).'),
      pwc: z.boolean().optional().describe('True for a personal watercraft (Sea-Doo, jet ski, WaveRunner).'),
      supervised: z.boolean().optional().describe('True if someone 16 or older will be in the boat directly supervising.'),
      north: z.boolean().optional().describe('True if boating in Nunavut or Northwest Territories waters.'),
      visitor: z.boolean().optional().describe('True if the operator is a visitor to Canada.'),
      lost: z.boolean().optional().describe('True if the person lost or damaged their card and wants to replace it (the widget then leads with the course provider lookup).'),
      lang,
    }),
    execute: async ({ lang: l, ...input }) => buildBoat({ ...input, lang: L(l) }),
  }),

  transportTravelRules: tool({
    description:
      'Rules for travelling with cannabis or with a pet, for trips within Canada vs crossing the border. Cannabis: legal to carry on domestic flights (carry-on and checked bag; liquids in the 1 L bag) and within Canada up to the 30 g dried-equivalent public possession limit (the widget converts edibles, oils, vapes, beverages and fresh cannabis to that limit), but taking cannabis in any form (including CBD and medical cannabis) into or out of Canada is a serious criminal offence; if you have it when entering you must declare it (penalties up to $2,000 for not declaring). Pets: CFIA rules — dogs and cats 3 months or older need a rabies vaccination certificate to enter or return to Canada; dogs going to the U.S. must meet the CDC\'s rules; airlines set their own pet rules; security screening steps. Use for "can I fly with weed?", "can I bring cannabis to the US?", "how much cannabis can I carry?", "bringing my dog back from the US", "flying with my cat". topic: cannabis | pets; trip: domestic-flight | domestic-road | entering-canada | leaving-canada.',
    inputSchema: z.object({
      topic: z.enum(['cannabis', 'pets']).describe('What they are travelling with.'),
      trip: z.enum(['domestic-flight', 'domestic-road', 'entering-canada', 'leaving-canada']).optional().describe('Kind of trip, if clear.'),
      pet: z.enum(['dog', 'cat', 'other']).optional().describe('Kind of pet, for pets.'),
      petAgeMonths: z.number().int().min(0).max(400).optional().describe("Pet's age in months, if mentioned."),
      lang,
    }),
    execute: async ({ lang: l, ...input }) => buildTravel({ ...input, lang: L(l) }),
  }),

  transportEvIncentive: tool({
    description:
      'Electric Vehicle Affordability Program (EVAP) incentive calculator with Transport Canada\'s LIVE vehicle list and remaining funding. New battery-electric and hydrogen vehicles get up to $5,000 and plug-in hybrids up to $2,500 in 2026 (stepping down each year to $2,000 / $1,000 by 2030–31), for purchases or leases of 12+ months (prorated under 48 months) made on or after Feb 16, 2026, with a final transaction value of $50,000 or less (no cap for Canadian-made EVs). The dealer applies it at the point of sale; individuals get one incentive. The widget searches the official vehicle list, and the person can change fuel type, price, Canadian-made and lease length. Use for "is there an EV rebate?", "does the Equinox EV qualify?", "how much is the federal EV incentive?", "iZEV", "incentive on a leased electric car". Pass the model the person named as query. Provincial rebates are separate.',
    inputSchema: z.object({
      query: z.string().max(60).optional().describe('Vehicle the person asked about, e.g. "Equinox EV", "Kia EV3", "Model Y".'),
      fuel: z.enum(['BEV', 'PHEV', 'FCEV']).optional().describe('BEV battery-electric, PHEV plug-in hybrid, FCEV hydrogen fuel cell.'),
      price: z.number().min(1000).max(500_000).optional().describe('Price before taxes, if mentioned.'),
      canadianMade: z.boolean().optional(),
      leaseMonths: z.number().int().min(0).max(96).optional().describe('Lease term in months (omit or 0 when buying).'),
      lang,
      timeZone,
    }),
    execute: async ({ lang: l, timeZone: tz, ...input }, { abortSignal }) => {
      const data = await liveEv(abortSignal);
      return buildEv({ ...input, lang: L(l) }, todayInCanada(new Date(), tz), data);
    },
  }),
} satisfies ToolSet;
