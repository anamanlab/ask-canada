/**
 * AI tools for the `citizenship` widget. Facts verified on canada.ca (see widgets/citizenship/data.ts).
 *   citizenshipPresence   physical presence calculator (1,095 days in 5 years) with trips
 *   citizenshipPracticeTest  practice citizenship test from the Discover Canada study guide
 *   citizenshipSteps      how to apply: steps, fees (live) and processing time (live)
 *   citizenshipCeremony   the oath of citizenship, what to bring and what happens after
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import { todayInCanada } from '../data/holidays';
import { FEEDS, FEES, type Lang } from '../widgets/citizenship/data';
import { presenceOutput } from '../widgets/citizenship/presence';
import type { QuizOutput } from '../widgets/citizenship/quiz';
import { buildQuiz } from '../widgets/citizenship/quiz-bank';
import { buildCeremony, buildSteps, fallbackProcessing, type Fees, type Processing } from '../widgets/citizenship/steps';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer.');
const timeZone = z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs.");

// ——— Live feeds (server-side, cached, validated, with graceful fallback) ———

/** "$1,590" / "1&nbsp;590&nbsp;$" -> 1590. The English column is read, so a comma is a thousands separator. */
const dollars = (s: string) => {
  const n = s ? Number(s.replace(/&nbsp;|[\s$,\u00a0\u202f]/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** IRCC's fee list has one entry per fee, with the amount as display text in each language. These four are read. */
const Fee = z.object({ en: z.string().max(40) });
const FeeList = z.object({ 'cit-adult-total': Fee, 'cit-grant-adult': Fee, 'cit-right': Fee, 'cit-minor': Fee });

export async function liveFees(signal?: AbortSignal): Promise<Fees> {
  const res = await fetchJson(FEEDS.fees, FeeList, { revalidate: 21_600, timeout: 4000, signal });
  if (!res.ok) return { ...FEES, live: false };
  const adultTotal = dollars(res.data['cit-adult-total'].en);
  const adultProcessing = dollars(res.data['cit-grant-adult'].en);
  const rightOfCitizenship = dollars(res.data['cit-right'].en);
  const minor = dollars(res.data['cit-minor'].en);
  if (!adultTotal || !adultProcessing || !rightOfCitizenship || !minor) return { ...FEES, live: false };
  return { adultTotal, adultProcessing, rightOfCitizenship, minor, live: true };
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
};
/** "September 3, 2026" / "3 septembre 2026" -> "2026-09-03". */
function parseFeedDate(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.toLowerCase().replace(/1er/, '1');
  const m = t.match(/([a-zéû]+)\s+(\d{1,2}),?\s+(\d{4})/) ?? t.match(/(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/);
  if (!m) return null;
  const [month, day] = /\d/.test(m[1]) ? [MONTHS[m[2]], Number(m[1])] : [MONTHS[m[1]], Number(m[2])];
  if (!month || !day) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** IRCC's processing-time feed: display text per application type. Only the parts read here are checked. */
const Wording = z.record(z.string(), z.unknown());
const ProcessingFeed = z.object({
  'default-update': z.object({ flpt_lastupdated: z.string().optional() }).optional(),
  'current-flpt': Wording,
  'total-people': Wording.optional(),
});
/** A short line of display text ("About 12 months"), or null for anything else. */
const shortText = (v: unknown) => (typeof v === 'string' && v.trim() && v.length < 80 ? v : null);

export async function liveProcessing(l: Lang, signal?: AbortSignal): Promise<Processing> {
  const res = await fetchJson(FEEDS.processing[l], ProcessingFeed, { revalidate: 21_600, timeout: 4500, signal });
  const text = res.ok ? shortText(res.data['current-flpt']['citizen-grants']) : null;
  if (!res.ok || !text) return fallbackProcessing(l);
  return {
    text,
    waiting: shortText(res.data['total-people']?.['citizen-grants']),
    updated: parseFeedDate(res.data['default-update']?.flpt_lastupdated),
    live: true,
  };
}

// ——— Tools ———

export const tools = {
  citizenshipPresence: tool({
    description:
      'Canadian citizenship physical presence calculator (adult grant of citizenship). Counts days in Canada in the 5 years before the application date: each day as a permanent resident counts 1, each day before PR as a temporary resident or protected person counts 0.5 (max 365), and the day you leave and the day you return count as days in Canada. Shows the total against the 1,095 days needed, the earliest date the person can apply (as trips stand), how much each planned trip pushes that date, and an editable trip list saved on the device only. Use for "when can I apply for citizenship", "do I have enough days", "how long until I can become a citizen", "I became a PR in …", trips abroad and citizenship, or "what do I need for citizenship". Pass prDate if the person gave when they became a permanent resident (use the 1st of the month if only a month is given, and set prDateMonthOnly); leave it out to let them enter it in the widget. Pass trips only if they listed actual dates. This is an estimate: the official calculator in the online application is what IRCC uses.',
    inputSchema: z.object({
      prDate: isoDate.optional().describe('Date the person became a permanent resident (YYYY-MM-DD).'),
      prDateMonthOnly: z
        .boolean()
        .optional()
        .describe('true when the person gave only a month and year, so prDate is the 1st of that month. The widget then asks for the exact date.'),
      applyDate: isoDate.optional().describe('Date they plan to sign their application. Defaults to today.'),
      tempStart: isoDate
        .optional()
        .describe('Date they first held temporary resident status (visitor, student, worker) or became a protected person in Canada, if before PR.'),
      trips: z
        .array(z.object({ left: isoDate.describe('Date they left Canada.'), returned: isoDate.describe('Date they came back.'), place: z.string().max(60).optional() }))
        .max(60)
        .optional()
        .describe('Trips outside Canada, including day trips to the U.S.'),
      lang,
      timeZone,
    }),
    execute: async ({ timeZone: tz, ...input }) => presenceOutput(input, todayInCanada(new Date(), tz)),
  }),

  citizenshipPracticeTest: tool({
    description:
      'Interactive practice quiz for the Canadian citizenship test, written from the official study guide Discover Canada: The Rights and Responsibilities of Citizenship. Each question shows the right answer, a one-line explanation and the guide chapter it comes from; the final score is compared with the real pass mark (15 of 20, 75%). The real test has 20 multiple-choice or true/false questions, 45 minutes, in English or French, 3 chances. Use when someone wants to practise, study, quiz themselves or asks what is on the citizenship test. count = number of questions (default 10, max 20 for a full-length mock test); topic narrows to rights, history, government, symbols or geography.',
    inputSchema: z.object({
      count: z.number().int().min(5).max(20).optional().describe('How many questions (5-20). 20 = full-length mock test.'),
      topic: z.enum(['all', 'rights', 'history', 'government', 'symbols', 'geography']).optional().describe('Limit to one area of the study guide.'),
      lang,
    }),
    execute: async ({ count, topic, lang: l }) => buildQuiz({ count, topic, lang: l, seed: Math.floor(Math.random() * 2_000_000_000) }),
    // The bilingual copy of the questions is for the screen; the model reads `questions` in the answer's language.
    toModelOutput: ({ output }) => ({ type: 'json', value: { ...(output as QuizOutput), items: undefined } }),
  }),

  citizenshipSteps: tool({
    description:
      'How to apply for Canadian citizenship (adults and minor children): the steps from checking eligibility to applying online, the acknowledgement of receipt, the test (ages 18-54), a possible interview, the ceremony and the passport; the application fees read live from canada.ca (adult $653 = $530 processing + $123 right of citizenship fee; minor under 18 $100) with a family total; and the current processing time read live from IRCC. Use for "how do I apply for citizenship", "how much does citizenship cost", "citizenship fees", "how long does citizenship take", "what happens after I apply", or applying with family. adults/minors = how many people are applying together; age = the applicant\'s age if they said it (decides whether the test and language proof apply). For someone who has ALREADY applied and asks about their own file, point them to the official application status tracker instead.',
    inputSchema: z.object({
      adults: z.number().int().min(0).max(12).optional().describe('Adults (18+) applying together.'),
      minors: z.number().int().min(0).max(20).optional().describe('Children under 18 in the application.'),
      age: z.number().int().min(0).max(120).optional().describe("Applicant's age on the day they sign, if known."),
      lang,
    }),
    execute: async ({ lang: l, ...input }, { abortSignal }) => {
      const L: Lang = l === 'fr' ? 'fr' : 'en';
      const [fees, processing] = await Promise.all([liveFees(abortSignal), liveProcessing(L, abortSignal)]);
      return buildSteps({ ...input, lang: L }, fees, processing);
    },
  }),

  citizenshipCeremony: tool({
    description:
      'The Canadian citizenship ceremony and oath: the full oath of citizenship in English and French with a line-by-line practice mode (swear or affirm), what to bring (invitation, PR card, ID) for a virtual or in-person ceremony, what happens on the day, and what to do after (citizenship certificate, passport, voting). Use for questions about the oath, the ceremony, what to bring or wear, or what to do after becoming a citizen. format = the ceremony type if the person mentioned it.',
    inputSchema: z.object({
      format: z.enum(['virtual', 'in-person']).optional().describe('Ceremony type, if known.'),
      lang,
    }),
    execute: async (input) => buildCeremony(input),
  }),
} satisfies ToolSet;
