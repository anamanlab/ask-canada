/**
 * AI tools for the `contact` widget (see docs/WIDGET_GUIDE.md).
 *   contactDirectory — verified federal phone lines with hours converted to the person's time zone and a live
 *                      open/closed status (holiday-aware), TTY and outside-Canada numbers, self-service first.
 *   contactUrgent    — 9-1-1, 9-8-8, Kids Help Phone, Hope for Wellness and the Canadian Anti-Fraud Centre.
 * Facts and department rules: widgets/contact/data.ts.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildDirectory, buildUrgent } from '../widgets/contact/build';
import { TOPICS } from '../widgets/contact/data';
import { federalHolidays } from '../widgets/contact/live';
import { URGENT_SITUATIONS } from '../widgets/contact/types';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr).');
const timeZone = z
  .string()
  .max(64)
  .optional()
  .describe("The person's IANA time zone (given in the system prompt), so hours and open/closed status are shown in their own time.");

const years = (now: number) => {
  const y = new Date(now).getUTCFullYear();
  return [y, y + 1];
};

export const tools = {
  contactDirectory: tool({
    description:
      'Phone directory for federal services, with hours converted to the person\'s own time zone and whether each line is open right now (weekends and federal public holidays included). Covers: CRA personal taxes 1-800-959-8281 and benefits 1-800-387-1193 and businesses 1-800-959-5525 (agents Mon–Fri 8 am–8 pm Eastern), Employment Insurance, CPP/Old Age Security, Canadian Dental Care Plan (Service Canada lines, 8:30 am–4:30 pm local time), 1 800 O-Canada (general help), the Passport Program (self-service links only: never give an IRCC or passport phone number) and the Canadian Anti-Fraud Centre. Includes TTY numbers, the Yukon/NWT/Nunavut CRA lines, outside-Canada numbers, and the self-service option to try first. Call it whenever someone asks for a phone number, "how do I talk to someone / reach a person", whether a government line is open now, office hours, or TTY / accessible contact options. Pick the narrowest topic that fits; use "all" when the service is unclear. Never state wait times.',
    inputSchema: z.object({
      topic: z
        .enum(['all', ...TOPICS])
        .optional()
        .describe(
          'taxes = CRA personal tax; benefits = CCB/credits, EI, CPP/OAS, dental; service-canada = Service Canada lines only (EI, CPP/OAS, dental, 1 800 O-Canada), for "is Service Canada open"; business = CRA business lines; ei = Employment Insurance; pensions = CPP and Old Age Security; dental = Canadian Dental Care Plan; passports = Passport Program; general = not sure who to call; fraud = scams; all = directory.',
        ),
      tty: z.boolean().optional().describe('True if the person is Deaf, hard of hearing or has a speech disability, or asks for TTY / relay: TTY numbers are shown first.'),
      abroad: z.boolean().optional().describe('True if the person is calling from outside Canada and the U.S. (defaults from the time zone).'),
      lang,
      timeZone,
    }),
    execute: async (input, { abortSignal }) => {
      const now = Date.now();
      const { holidays, live } = await federalHolidays(years(now), abortSignal);
      return buildDirectory(input, now, holidays, live);
    },
  }),

  contactUrgent: tool({
    description:
      'Urgent help card: 9-1-1 for immediate danger or urgent medical help; 9-8-8 Suicide Crisis Helpline (call or text, 24/7, English and French); Kids Help Phone (ages 5 to 29: 1-800-668-6868 or text CONNECT to 686868); Hope for Wellness Help Line for First Nations, Inuit and Métis Peoples (1-855-242-3310, 24/7); and, for scams, the Canadian Anti-Fraud Centre (1-888-495-8501, weekdays 10 am–4:45 pm Eastern, or report online any time) with what to do first (bank, police file number, report). Call it for emergencies, "who do I call", mental health crisis or distress, or scams. situation: danger (someone is at risk right now), crisis (suicide or mental health crisis), suspected (a call, text or email that may be a scam, e.g. someone claiming to be the CRA, and nothing lost yet: shows the CRA\'s warning signs, verify through the CRA account or the number on canada.ca, and report even with no loss), fraud (money or personal details were already lost, or identity theft: bank, police, report), all (list every urgent line). Put safety first in the answer.',
    inputSchema: z.object({
      situation: z.enum(URGENT_SITUATIONS).optional().describe('What the person is facing; orders the lines.'),
      lang,
      timeZone,
    }),
    execute: async (input, { abortSignal }) => {
      const now = Date.now();
      const { holidays, live } = await federalHolidays(years(now), abortSignal);
      return buildUrgent(input, now, holidays, live);
    },
  }),
} satisfies ToolSet;
