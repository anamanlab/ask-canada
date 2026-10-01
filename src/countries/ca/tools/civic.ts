/**
 * AI tools for the `civic` widget (democracy & civic life). Facts: widgets/civic/data.ts; pure builders in
 * widgets/civic/build/, upstream fetches (zod-validated) in widgets/civic/live/.
 *   civicFindMp      — LIVE: postal code → federal riding, who holds the seat now (or vacant), contact card.
 *   civicVoterCheck  — can you vote federally, how to check/update registration (Elections Canada handoff),
 *                      the 3 ways to prove ID, and the 4 ways to vote.
 *   civicParliament  — how Parliament works + LIVE bills from LEGISinfo (find a bill, or bills on a topic).
 *   civicNews        — LIVE Government of Canada news releases, statements and advisories (canada.ca).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { NEWS_TYPES } from '../widgets/civic/data';
import { voterCheck } from '../widgets/civic/build/voter';
import { buildFindMp, findMpForModel } from '../widgets/civic/live/find-mp';
import { buildNews } from '../widgets/civic/live/news';
import { buildParliament } from '../widgets/civic/live/parliament';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr). Names, titles and links come back in this language.');

export const tools = {
  civicFindMp: tool({
    description:
      'LIVE lookup of a person’s federal Member of Parliament (MP) and electoral district (riding) from a Canadian postal code, verified against the House of Commons’ current list of members (so by-election winners, renamed ridings and vacant seats are right). Returns the riding with a map outline, the MP’s official portrait, name, honorific, caucus (a neutral fact), current roles (e.g. minister), email, Hill and constituency office addresses and phone numbers, or a clear "this seat is vacant". Use it for "who is my MP?", "find my riding", "how do I contact my member of Parliament?", "qui est mon député?", "ma circonscription". Pass the postal code exactly as given; if they gave none, call it without one and the widget asks for it. Never name an MP from memory: only what this tool returns. Party politics, opinions on MPs or voting advice are out of scope.',
    inputSchema: z.object({
      postalCode: z.string().max(12).optional().describe('Canadian postal code as the person typed it, e.g. "K1A 0B1". Omit if not given.'),
      lang,
    }),
    execute: async ({ postalCode, lang: l }, { abortSignal }) => buildFindMp({ postalCode, lang: l ?? 'en' }, abortSignal),
    // The portrait is for the screen only; keep it (and its tokens) out of the model's context.
    toModelOutput: ({ output }) => ({ type: 'json', value: findMpForModel(output) }),
  }),

  civicVoterCheck: tool({
    description:
      'Federal voting helper from Elections Canada’s official pages: whether the person can vote in a federal election (Canadian citizen, 18 or older on election day), how to check, update or complete their voter registration (hands off to Elections Canada’s Online Voter Registration Service — we never collect their details), the Register of Future Electors for citizens aged 14 to 17 living in Canada, the International Register of Electors for Canadians abroad, the 3 ways to prove identity and address at the polls (with an interactive "do I have the right ID?" check), and the 4 ways to vote once an election is called (election day, advance polls, any Elections Canada office, by mail). Use it for "am I registered to vote?", "how do I register to vote?", "what ID do I need to vote?", "can I vote if I just turned 18 / live abroad / am a permanent resident?", "comment m’inscrire pour voter?". Provincial and municipal elections are run by other agencies; say so.',
    inputSchema: z.object({
      age: z.number().int().min(0).max(120).optional().describe('Age, only if the person said it.'),
      citizen: z.boolean().optional().describe('True if they said they are a Canadian citizen; false if permanent resident, visitor, etc.'),
      livesAbroad: z.boolean().optional().describe('True if they live outside Canada.'),
      province: z.string().length(2).optional().describe('Two-letter province/territory code if known (e.g. "QC").'),
      focus: z.enum(['register', 'id', 'ways']).optional().describe('What they asked about: registration (default), ID to vote, or ways to vote.'),
      lang,
    }),
    execute: async (input) => voterCheck(input),
  }),

  civicParliament: tool({
    description:
      'How Canada’s Parliament works — the Crown, the Senate (105 senators) and the House of Commons (343 seats, with the LIVE count of sitting members and vacant seats) — and how a bill becomes law, stage by stage, with LIVE bills from LEGISinfo (Parliament of Canada). With a bill number ("C-38", "S-2"): that bill’s official status and a progress track through both chambers to royal assent. With a topic ("housing", "elections"): bills in the current session whose titles match. With neither: the bills that moved most recently. Use it for "how does a bill become law?", "what is the Senate for?", "where is Bill C-25?", "is there a bill about …?", "comment fonctionne le Parlement?". Describe bills neutrally by their official title and status; no opinions on them.',
    inputSchema: z.object({
      bill: z.string().max(20).optional().describe('Bill number if they named one, e.g. "C-38" or "S-2".'),
      topic: z.string().max(80).optional().describe('Topic words to find bills by title, e.g. "housing" or "logement".'),
      lang,
    }),
    execute: async ({ bill, topic, lang: l }, { abortSignal }) => buildParliament({ bill, topic, lang: l ?? 'en' }, abortSignal),
  }),

  civicNews: tool({
    description:
      'LIVE Government of Canada news from the canada.ca news centre: the latest news releases, statements, media advisories, backgrounders, speeches and readouts from federal departments, newest first, each with its department, date and official link. Optional topic words ("housing", "wildfire", "Ukraine") search the last 90 days; optional type narrows to one kind. Use it for "what’s the latest government news?", "any announcements about housing?", "quoi de neuf au gouvernement fédéral?". News items are announcements, not proof a program is open: say so and point to the program page when they want to apply.',
    inputSchema: z.object({
      topic: z.string().max(80).optional().describe('Topic words to filter by, in the person’s words.'),
      type: z.enum(NEWS_TYPES).optional().describe('Only one kind of item (e.g. newsreleases or statements).'),
      limit: z.number().int().min(1).max(12).optional().describe('How many items (default 6).'),
      lang,
    }),
    execute: async ({ topic, type, limit, lang: l }, { abortSignal }) => buildNews({ topic, type, limit, lang: l ?? 'en' }, abortSignal),
  }),
} satisfies ToolSet;
