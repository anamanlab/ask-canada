/**
 * AI tools for the `life-events` widget.
 *   lifeEventsChecklist — a guided, multi-department checklist for a life event (moving, a new baby, marriage or
 *   a name change, losing a job, retiring, the death of a loved one), with the official page for every step,
 *   deadlines computed from the person's date, and progress saved on their device only.
 * Facts verified on canada.ca and elections.ca (see widgets/life-events/data.ts).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { EVENTS } from '../widgets/life-events/data';
import { buildChecklist } from '../widgets/life-events/plan';

export const tools = {
  lifeEventsChecklist: tool({
    description:
      'Step-by-step checklist across federal departments for a life event, with the official canada.ca page for each step, deadlines from the person’s date and progress saved on their device. Events: "moving" (who to tell about a new address: CRA, Service Canada, IRCC, Elections Canada, passport, province), "baby" (birth registration, Canada child benefit, baby’s SIN, EI maternity and parental benefits, child passport, RESP), "marriage" (marital status with the CRA and, for a name change, SIN record, CRA name, new passport, voter registration; also for becoming common-law), "job-loss" (apply for EI within 4 weeks, estimator, EI reports, Job Bank), "retiring" (CPP start age and application, OAS enrolment, GIS, RRSP at 71) and "death" (notify the CRA, cancel CPP/OAS, CPP death benefit, survivor benefits, return the passport, final tax return due date). Call it whenever someone describes one of these moments ("I’m moving", "we just had a baby", "my father died", "I got laid off", "I’m retiring next year", "I’m changing my last name") or asks who to notify. Omit `event` to show all six to choose from. Pass `date` when they gave one (moving day, due date or birthday, date of marriage or name change, last day of work, the date they want their CPP to start, date of death) so the widget can show real deadlines such as the EI 4-week mark or the final return due date. Never ask for a SIN or account numbers.',
    inputSchema: z.object({
      event: z.enum(EVENTS).optional().describe('The life event. Omit to let the person choose.'),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Anchor date as YYYY-MM-DD: moving day, due date or birth date, date of marriage or name change, last day of work, the date the person wants their CPP retirement pension to start (not their last day of work; CPP starts between 60 and 70), or date of death. A date of death, marriage or name change is never in the future: leave `date` out if it hasn’t happened yet.'),
      region: z
        .enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'])
        .optional()
        .describe('Province or territory, if known. Quebec changes parental benefits (QPIP); a province makes the SIN death notice automatic.'),
      lang: z.enum(['en', 'fr']).optional().describe('Language of the answer.'),
      timeZone: z.string().max(64).optional().describe("The person's IANA time zone (given in the system prompt), so today's date matches theirs."),
    }),
    execute: async ({ event, date, region, lang, timeZone }) => buildChecklist({ event, date, region, lang }, todayInCanada(new Date(), timeZone)),
  }),
} satisfies ToolSet;
