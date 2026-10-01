/**
 * AI tools for the `veterans-defence` widget (Veterans & Canadian Armed Forces). Facts: widgets/veterans-defence/data.ts.
 *   veteransDefenceCareers      — CAF career matcher, LIVE from forces.ca (110 careers), with the forces.ca handoff
 *   veteransDefenceBenefits     — Veterans Affairs Canada benefits navigator (recalculates on the device)
 *   veteransDefenceMentalHealth — 24/7 mental health lines, peer support and treatment for Veterans, members, RCMP and families
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { CATEGORIES } from '../widgets/veterans-defence/careers';
import { buildCareers, careersForModel } from '../widgets/veterans-defence/careers-build';
import { liveCareers } from '../widgets/veterans-defence/live';
import { NEEDS, STATUSES } from '../widgets/veterans-defence/navigator';
import { benefitsForModel, buildBenefits } from '../widgets/veterans-defence/navigator-build';
import { liveRates } from '../widgets/veterans-defence/rates-live';
import { AUDIENCES } from '../widgets/veterans-defence/supports';
import { buildSupports } from '../widgets/veterans-defence/supports-build';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr). French returns French pages and program names.');

export const tools = {
  veteransDefenceCareers: tool({
    description:
      'Canadian Armed Forces (CAF) career matcher, LIVE from forces.ca (the official CAF recruiting site: about 110 full-time Regular Force and part-time Reserve careers in the Army, Navy and Air Force). The person picks interests, environment, hours and education in the widget and it ranks matching careers, flags the $50,000 recruiting allowance and signing bonuses (Regular Force only, never the Reserve), priority application processing and paid-education routes, and links each career page on forces.ca. It also shows the basic requirements to join (17 or older with parental consent under 18, Canadian citizen or permanent resident, Grade 10 for non-commissioned members, a degree or paid education for officers), pay during basic training and the handoff to apply on forces.ca. Use it for "how do I join the military / Canadian Armed Forces / the Reserves?", "what jobs are there in the army / navy / air force?", "military careers in health care / cyber / engineering", "can I be a pilot / medic / cook in the Forces?", "rejoindre les Forces armées canadiennes". Pass only what the person said; everything is optional and the widget asks for the rest. Put a named job or skill ("pilot", "cyber", "cook") in `query`.',
    inputSchema: z.object({
      interests: z
        .array(z.enum(CATEGORIES))
        .max(6)
        .optional()
        .describe(
          'forces.ca career categories that match what they like: health (medicine, nursing, dental), computing (IT, cyber, intelligence), engineering (trades, construction, electrical), maintenance (mechanics, vehicles, weapons), aviation (pilots, aircraft), naval (ships, sailors), combat (infantry, armour, artillery), safety (military police, firefighters, medics), logistics (transport, supply, drivers), administration (finance, HR, legal), hospitality (cooks, chaplains, support), public-relations. Omit if not said.',
        ),
      environment: z.enum(['army', 'navy', 'air', 'any']).optional().describe('Army, Royal Canadian Navy or Royal Canadian Air Force, only if they named one.'),
      hours: z.enum(['full-time', 'part-time', 'either']).optional().describe('full-time = Regular Force; part-time = Reserve Force (evenings/weekends close to home).'),
      education: z.enum(['grade10', 'high-school', 'college', 'bachelor', 'graduate']).optional().describe('Highest education completed, if they said it.'),
      path: z.enum(['ncm', 'officer', 'either']).optional().describe('Non-commissioned member or officer, only if they said it.'),
      query: z.string().max(60).optional().describe('A specific job or skill they named, e.g. "pilot", "cyber", "nurse", "cuisinier". Omit otherwise.'),
      lang,
    }),
    execute: async (input, { abortSignal }) => {
      const list = await liveCareers(abortSignal);
      return buildCareers(input, list.careers, { live: list.live, asOf: list.asOf });
    },
    // The widget gets the whole catalogue to re-match on the device; the model only needs the top matches.
    toModelOutput: ({ output }) => ({ type: 'json', value: careersForModel(output) }),
  }),

  veteransDefenceBenefits: tool({
    description:
      'Veterans Affairs Canada (VAC) benefits navigator: shows which VAC and CAF programs may fit someone, from who they are (Veteran, leaving the Forces, serving member, family member or caregiver, survivor, current or former RCMP), whether a health condition is related to their service, and what they need (money, health care, mental health, school, a new career, help at home, an emergency). Covers disability benefits (tax-free), Mental Health Benefits (coverage from the day a disability application is received, or from the day after release for members who applied before releasing), the Education and Training Benefit ($50,569.97 after 6 years or $101,139.94 after 12 years of service; apply within 10 years of release, or by 1 April 2028 if released between 1 April 2006 and 31 March 2018), Career Transition Services, the Rehabilitation Program and Income Replacement Benefit (90% of gross pre-release military salary, reduced by other income; pre-tax floor $60,002.64 a year), the Veterans Emergency Fund (decision within 2 business days), Treatment Benefits, OSI clinics, case management, the Veterans Independence Program, the Caregiver Recognition Benefit, Canadian Forces Income Support, the Veteran Family Program (for medical releases), the death benefit (for a death from a service-related injury or illness within 30 days of it) and the transition interview, each with how to apply and the official page, plus the handoff to My VAC Account and VAC’s line 1-866-522-2122. Use it for "what support is there after I leave the Forces?", "what benefits can I get as a veteran?", "will VAC pay for school?", "I’m a veteran and can’t pay rent", "disability benefit for PTSD / hearing loss", "prestations pour les vétérans". It is a guide: VAC decides eligibility. Never ask for a service number, SIN or VAC file number.',
    inputSchema: z.object({
      status: z.enum(STATUSES).optional().describe('veteran (released from the CAF), releasing (serving and planning to leave), serving, family (spouse, partner, child or caregiver of a Veteran), survivor, rcmp (current or former RCMP). Omit if unclear.'),
      serviceRelated: z.enum(['yes', 'unsure', 'no']).optional().describe('Whether they said an illness or injury is related to their service.'),
      needs: z.array(z.enum(NEEDS)).max(7).optional().describe('What they asked about: money, health, mental, school, career, home (help at home, caregiving), emergency (urgent money, food or housing).'),
      yearsOfService: z.number().int().min(0).max(60).optional().describe('Years of paid service, only if they said it (the Education and Training Benefit needs 6+).'),
      lang,
    }),
    // The one quarterly figure (Canadian Forces Income Support) is read from the rates page; on any failure the verified figure stands.
    execute: async (input, { abortSignal }) => buildBenefits(input, (await liveRates(abortSignal)) ?? undefined),
    toModelOutput: ({ output }) => ({ type: 'json', value: benefitsForModel(output) }),
  }),

  veteransDefenceMentalHealth: tool({
    description:
      'Mental health support for Veterans, serving Canadian Armed Forces members, current and former RCMP, and their families, with one-tap phone numbers: the free, confidential 24/7 VAC Assistance Service (Veterans, FORMER RCMP members, families and caregivers; serving RCMP members are not covered by it and call the Employee Assistance Program at the same number) and CF Member Assistance Program (serving CAF members and families), all at 1-800-268-7708 (TTY 1-800-567-5803); the Family Information Line 1-800-866-4546 (24/7); OSISS peer support; OSI clinics; Mental Health Benefits; CAF medical centre walk-in crisis care for serving members; and 911 / 9-8-8 for emergencies. Use it for "I’m a veteran and I’m struggling", "PTSD help for veterans", "mental health support for military families", "who can I talk to, I’m in the Forces", "soutien en santé mentale pour les vétérans". If someone may be in danger or mentions suicide, say first: call 911 if in immediate danger, or call or text 9-8-8 any time.',
    inputSchema: z.object({
      audience: z.enum(AUDIENCES).optional().describe('veteran, serving (CAF member), family (of a member or Veteran), rcmp. Omit if unclear; the widget lets them switch.'),
      lang,
    }),
    execute: async (input) => buildSupports(input),
  }),
} satisfies ToolSet;
