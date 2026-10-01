/**
 * AI tools for the `parks` widget (Parks Canada national parks, park reserves and Rouge National Urban Park).
 *   parksFinder     — find parks on a map (by name, nearest to a place, province, landscape, camping), with a
 *                     park card: admission, camping, what to know before you go, live alerts + fire danger.
 *   parksConditions — LIVE wildfire status and Parks Canada bulletins (fire bans, closures, wildlife warnings)
 *                     for one park, or fire danger across every national park.
 *   parksPasses     — Discovery Pass vs daily admission calculator for a party, with free-admission rules.
 *   parksCamping    — campsite reservation handoff: the park's reservable campgrounds, launch-day plan, fees.
 * Facts: widgets/parks/data.ts (sources in sources.ts). Fallbacks: widgets/parks/live.ts; requests and validation: upstream.ts.
 * The cards get the full output; `toModelOutput` keeps card-only detail (the full ranking) out of the model's context.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { LANDSCAPES, PROVINCES } from '../widgets/parks/data';
import { buildCamping, buildConditions, buildFinder, buildPasses } from '../widgets/parks/live';
import type { FinderOutput } from '../widgets/parks/model';
import { MAX_DAYS, MAX_PARTY } from '../widgets/parks/pass-model';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr). Park names and links come back in this language.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs.");
const park = z
  .string()
  .max(80)
  .optional()
  .describe(
    'A national park as the person said it, in English or French ("Banff", "Jasper", "parc de la Mauricie", "Pacific Rim"), or a well-known place inside one ("Lake Louise", "Tofino", "Cabot Trail", "Cavendish"). Omit if they named none.',
  );
const near = z
  .string()
  .max(80)
  .optional()
  .describe('A Canadian city, town or community the person wants parks near ("Calgary", "Rimouski", "near Halifax"). Only the place name is sent to the NRCan geolocator.');

export const tools = {
  parksFinder: tool({
    description:
      'Parks Canada park finder with a map of all 48 national parks, national park reserves and Rouge National Urban Park. Use it when someone wants to find, compare or learn about a national park: "national parks near Calgary", "which parks in Nova Scotia have camping?", "tell me about Gros Morne", "mountain parks", "what should I know before visiting Jasper?". With a park name it opens that park\'s card: daily admission (e.g. Banff adult $12.25, youth free), whether it has reservable campgrounds, what to know before you go (wildlife distances, dogs on leash, no drones, fires only in fire boxes, call 911, spotty cell coverage), plus LIVE Parks Canada bulletins and fire danger. With a place it ranks parks by straight-line distance. Pass filters only when the person asked for them. Never invent fees, hours or road conditions: describe only what this tool returns.',
    inputSchema: z.object({
      park,
      near,
      latitude: z.number().min(41).max(84).optional().describe('Latitude, only if the person shared their location.'),
      longitude: z.number().min(-142).max(-52).optional().describe('Longitude, only if the person shared their location.'),
      province: z.enum(PROVINCES).optional().describe('Two-letter province/territory code (lowercase) when they asked about parks in one province, e.g. "ns".'),
      landscape: z.enum(LANDSCAPES).optional().describe('Only when they asked for a kind of place: mountains, coast (ocean, beaches, islands), lakes (lakes and forests), prairie, north (Arctic and subarctic).'),
      camping: z.boolean().optional().describe('True only when they want parks with reservable campgrounds.'),
      lang,
      timeZone,
    }),
    execute: async ({ lang: l, ...rest }, { abortSignal }): Promise<FinderOutput> => buildFinder({ ...rest, lang: l ?? 'en' }, abortSignal),
    // The ranking of all 48 parks is for the card's filters; the model reads `results`.
    toModelOutput: ({ output }) => ({ type: 'json', value: { ...output, order: undefined } }),
  }),

  parksConditions: tool({
    description:
      'LIVE wildfire status and alerts for Parks Canada national parks. For one park: today\'s fire danger rating (Low, Moderate, High, Very High, Extreme) from the Canadian Wildland Fire Information System, satellite fire hotspots within 50 km in the last 24 hours, fire perimeter estimates within 25 km active in the last week, and the park\'s current Parks Canada "Important bulletins" (fire bans, area closures, wildlife warnings, restricted activities) with links. Without a park: fire danger and nearby hotspots for every national park on a map. Use it for "are there wildfires near Jasper?", "is there a fire ban in Banff?", "is it safe to go to Kootenay this weekend?", "closures in Pacific Rim", "feux de forêt dans les parcs nationaux". Say what it shows; for evacuation orders, tell people to follow provincial/territorial emergency alerts and call 911 in an emergency.',
    inputSchema: z.object({ park, lang, timeZone }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => buildConditions({ ...rest, lang: l ?? 'en' }, abortSignal),
  }),

  parksPasses: tool({
    description:
      'Parks Canada admission and Discovery Pass calculator. Verified 2026 prices: Discovery Pass (12 months, 80+ destinations) adult $83.50, senior $71.50, family/group $167.50 (up to 7 people in one vehicle); daily admission is $12.25 adult / $10.75 senior / $24.50 family in the busiest parks (Banff, Jasper, Yoho, Kootenay, Waterton Lakes, Glacier, Mount Revelstoke, Pacific Rim, Gros Morne), $10.00 / $8.75 / $19.50 or $7.25 / $6.25 / $15.00 elsewhere. Youth 17 and under are always free; new permanent residents and citizens (Canoo app), support persons, Canadian Armed Forces members, Veterans and their families get free admission. It works out whether a Discovery Pass pays off for their group and number of park days. Use it for "how much is a Discovery Pass?", "is the Parks Canada pass worth it?", "how much to get into Banff?", "combien coûte la carte d\'entrée Découverte?". The free Canada Strong Pass ended September 7, 2026.',
    inputSchema: z.object({
      park: park.describe('The park they plan to visit most, if named (sets the daily fee tier). Omit otherwise.'),
      adults: z.number().int().min(0).max(MAX_PARTY).optional().describe('Adults 18 to 64 in the group (default 2).'),
      seniors: z.number().int().min(0).max(MAX_PARTY).optional().describe('Seniors 65 and over.'),
      youth: z.number().int().min(0).max(MAX_PARTY).optional().describe('Children and teens 17 and under (always free).'),
      days: z.number().int().min(1).max(MAX_DAYS).optional().describe('Days they expect to visit parks with daily fees in the next 12 months (default 5).'),
      family: z.boolean().optional().describe('True when they described the group as their family ("my family", "family of 4"). If they gave no head counts, the calculator starts from 2 adults and 2 youth.'),
      lang,
    }),
    execute: async ({ lang: l, ...rest }) => buildPasses({ ...rest, lang: l ?? 'en' }),
  }),

  parksCamping: tool({
    description:
      'Campsite reservation helper for Parks Canada national parks, handing off to the official Parks Canada Reservation Service (reservation.pc.gc.ca) to book and pay. Shows the park\'s reservable campgrounds, when reservations opened for the 2026 season (January 20 to February 12, 2026 depending on the park; 2027 dates are not posted yet), how launch day works (queue opens 30 minutes early, random order at 8 am local time), the $11.50 online / $13.50 phone reservation fee, the phone line 1-877-737-3783, and a launch-day checklist saved on the device. Use it for "how do I book a campsite in Banff?", "when do Parks Canada reservations open?", "camping in Fundy", "réserver un camping à Forillon". Without a park it lists parks with reservable camping (nearest first if they gave a place).',
    inputSchema: z.object({ park, near, lang, timeZone }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => buildCamping({ ...rest, lang: l ?? 'en' }, abortSignal),
  }),
} satisfies ToolSet;
