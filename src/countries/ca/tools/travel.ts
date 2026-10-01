/**
 * AI tools for the `travel` widget (travelling outside Canada and coming home). Facts and feeds are
 * documented in widgets/travel/data.ts; outputs are built in widgets/travel/build.ts, which reads the live
 * feeds through widgets/travel/live.ts (core `fetchJson` / `fetchText`, the advisory feed validated with zod).
 *   travelAdvisory       LIVE Global Affairs Canada advisory for one destination (risk level, regional
 *                        advisories, entry requirements, local emergency numbers, Canadian offices)
 *   travelDutyFree       CBSA personal exemption calculator for returning residents
 *   travelBorderWaits    LIVE CBSA wait times at the 30 busiest land crossings (Canada-bound)
 *   travelEmergencyHelp  24/7 Emergency Watch and Response Centre contacts (+ destination specifics)
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildAdvisory, buildBorderWaits, buildDutyFree, buildEmergency } from '../widgets/travel/build';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');

export const tools = {
  travelAdvisory: tool({
    description:
      'Live official Government of Canada travel advisory (travel.gc.ca, Global Affairs Canada open data) for ONE destination outside Canada: its risk level (1 of 4: normal precautions, high degree of caution, avoid non-essential travel, avoid all travel), regional advisories (areas to avoid), entry requirements for Canadians (passport validity, visas), local emergency numbers, Canadian embassies/consulates, plus a Registration of Canadians Abroad handoff and a before-you-go checklist. Call it for any question about a specific destination: "is it safe to go to X", travel warnings, "do I need a visa / how long must my passport be valid for X", or planning a trip abroad. Pass the destination as the person wrote it (country, or a city/region like "Cancún" or "Bali"; English or French). Use focus to open the most relevant part. With no destination (e.g. "how do I register my trip?"), it shows the Registration of Canadians Abroad handoff and popular destinations.',
    inputSchema: z.object({
      destination: z
        .string()
        .max(120)
        .optional()
        .describe('Country, territory or well-known city/region, as written (e.g. "Mexico", "Cancún", "Royaume-Uni", "JP"). Omit when no destination was named.'),
      focus: z
        .enum(['safety', 'entry', 'help', 'prepare'])
        .optional()
        .describe('Part to open first: safety (risk levels, default), entry (passport and visas), help (emergency numbers and offices), prepare (before-you-go checklist).'),
      lang,
    }),
    execute: async (input, { abortSignal }) => buildAdvisory(input, abortSignal),
  }),

  travelDutyFree: tool({
    description:
      'Personal exemption calculator for Canadian residents returning to Canada (CBSA): how much they can bring back without paying duty and taxes, based on how long they were away (under 24 hours: none; 24 hours+: CAN$200, no alcohol or tobacco, and going over means duty on the whole amount; 48 hours+: CAN$800 including alcohol and tobacco limits; 7 days+: CAN$800, and goods other than alcohol/tobacco may follow by mail). Shows alcohol and tobacco limits, what is owed on the excess, and the rules. Call it for "how much can I bring back duty-free", shopping across the border, alcohol or cigarette limits, or declaring goods at the border. Fill in only what the person said.',
    inputSchema: z.object({
      hoursAway: z.number().min(0).max(8760).optional().describe('Length of the trip outside Canada in hours, if known (e.g. a weekend ≈ 48).'),
      daysAway: z.number().min(0).max(365).optional().describe('Length of the trip in days, if given in days.'),
      spent: z.number().min(0).max(1_000_000).optional().describe('Value of goods bought or received abroad, in Canadian dollars.'),
      alcohol: z.boolean().optional().describe('True if they are bringing alcohol.'),
      tobacco: z.boolean().optional().describe('True if they are bringing tobacco or vaping products.'),
      lang,
    }),
    execute: async (input) => buildDutyFree(input),
  }),

  travelBorderWaits: tool({
    description:
      'Live Canada Border Services Agency (CBSA) estimated wait times for entering Canada at the 30 busiest Canada–U.S. land border crossings (travellers and commercial lanes), with the time each estimate was posted and current CBSA notices. Call it for border wait times, lineups at a bridge or crossing (e.g. Peace Bridge, Ambassador Bridge, Pacific Highway, Lacolle), or which crossing is fastest right now. CBSA reports Canada-bound waits only.',
    inputSchema: z.object({
      province: z.enum(['NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC']).optional().describe('Province to show first, if the person named one or a crossing in it.'),
      crossing: z.string().max(80).optional().describe('Crossing, bridge or town named by the person (e.g. "Peace Bridge", "Blaine").'),
      lang,
    }),
    execute: async (input, { abortSignal }) => buildBorderWaits(input, abortSignal),
  }),

  travelEmergencyHelp: tool({
    description:
      'How a Canadian outside Canada gets emergency help: the 24/7 Emergency Watch and Response Centre (call collect, toll-free, email, SMS, WhatsApp, Signal, TTY) and, when a destination is given, its local emergency numbers, the toll-free number to Ottawa from there and the nearest Canadian embassies/consulates (live from travel.gc.ca). Call it for emergencies abroad: lost or stolen passport while travelling, arrest or detention, hospital, natural disaster, a family member in trouble abroad, or "how do I contact the Canadian embassy in X". If someone is in immediate danger, local emergency services come first.',
    inputSchema: z.object({
      destination: z.string().max(120).optional().describe('Country or city where the person is (or where the traveller is), if known.'),
      lang,
    }),
    execute: async (input, { abortSignal }) => buildEmergency(input, abortSignal),
  }),
} satisfies ToolSet;
