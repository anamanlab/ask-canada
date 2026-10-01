/**
 * AI tools for the `offices` widget.
 *   officesFinder      — nearest Service Canada Centres, passport offices and outreach sites to a postal code,
 *                        place or shared location, with a map, hours, open-now status (LIVE from ESDC's
 *                        wait-time feed when available), passport service levels, biometrics and accessibility.
 *   officesAppointment — how to book a passport or biometrics appointment, or ask Service Canada to call back,
 *                        with the official eServiceCanada handoffs.
 * Facts and sources: widgets/offices/data.ts. Office list: widgets/offices/offices.json (official office pages).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { appointmentInfo, findOffices } from '../widgets/offices/live';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr).');

export const tools = {
  officesFinder: tool({
    description:
      'Find the nearest in-person Government of Canada service locations: Service Canada Centres (SIN, EI, CPP/OAS, dental care plan, Canada Child Benefit, disability benefit, veterans and more — every centre offers these programs), passport offices and scheduled outreach sites. Shows a map, distance, address, opening hours for the week (holiday closures included), whether each office is open right now, live closures and wait times when ESDC publishes them, which passport services each offers (urgent pick-up by the end of the next business day, express pick-up in 2 to 9 business days at most offices (4 to 9 in Kelowna and Pointe-Claire, 3 to 9 in Charlottetown), 10-business-day pick-up, 20 business days by mail), biometrics, languages, wheelchair access and parking, plus the appointment handoff. Use it whenever someone wants to go somewhere in person: "Service Canada office near me", "closest passport office to M5V", "where can I give my biometrics in Surrey", "is the Service Canada in Moncton open today?", "bureau de Service Canada près de H2X". Pass their postal code or place exactly as they said it (only the first 3 characters of a postal code are used); if the message carries shared coordinates like "(45.42, -75.70)" (the widget\'s "Use my location" button, already rounded to about 1 km), pass them as latitude and longitude instead; if they gave none, call it without a location and the widget asks for one (or offers to use their location). Set need to match what they want to do. Never invent hours or wait times: describe only what this tool returns.',
    inputSchema: z.object({
      location: z
        .string()
        .max(80)
        .optional()
        .describe('Postal code (e.g. "K1A 0B1" or "K1A"), city or town ("Moncton", "Trois-Rivières", "Surrey, BC"), as the person said it. Omit if none was given.'),
      latitude: z.number().min(41).max(84).optional().describe('Latitude, only if the person shared their location.'),
      longitude: z.number().min(-142).max(-52).optional().describe('Longitude, only if the person shared their location.'),
      need: z
        .enum(['any', 'passport', 'passport-urgent', 'passport-express', 'biometrics'])
        .optional()
        .describe(
          'any (default: a Service Canada Centre for SIN, EI, pensions, benefits, etc.) · passport (apply or renew in person) · passport-urgent (need it by the end of the next business day) · passport-express (usually 2 to 9 business days; 3 to 9 or 4 to 9 at a few offices) · biometrics (fingerprints and photo for an immigration application).',
        ),
      passportOffice: z
        .boolean()
        .optional()
        .describe('True when the person asked for a "passport office" by name (pick-up, urgent or express counters), so the nearest true passport office is opened first even if a Service Canada Centre that only mails passports is closer.'),
      lang,
    }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => findOffices({ ...rest, lang: l ?? 'en' }, abortSignal),
  }),

  officesAppointment: tool({
    description:
      'How to get an appointment with Service Canada, with the official handoffs. Most Service Canada Centres serve walk-ins (a few, like Kingston, are appointment-only); for other programs it also lists each program\'s contact page and phone line (EI, CPP/OAS, SIN, dental care plan, Canada Disability Benefit). book a passport or biometrics appointment in the eServiceCanada Appointment Booking Tool (biometrics needs the application number from the Biometric Instruction Letter; passport walk-ins are still possible), or, for anything else (EI, CPP, OAS, SIN, benefits), submit an eServiceCanada service request so an officer calls back within 2 business days and books an in-person appointment if needed. Also gives 1 800 O-Canada and TTY numbers. Use for "book a Service Canada appointment", "do I need an appointment for my passport?", "how do I book biometrics?", "prendre rendez-vous avec Service Canada". Pair it with officesFinder when they also need a location.',
    inputSchema: z.object({
      focus: z
        .enum(['passport', 'biometrics', 'other'])
        .optional()
        .describe('passport (default), biometrics, or other (any Service Canada program: EI, CPP/OAS, SIN, benefits…).'),
      lang,
    }),
    execute: async ({ lang: l, focus }) => appointmentInfo({ focus, lang: l ?? 'en' }),
  }),
} satisfies ToolSet;
