/**
 * The shape of one office in the bundled lists (offices.json, and the lab's fixtures-data.json), checked with
 * zod where the data enters the code. Isomorphic: the server tool parses the full list, the lab its sample.
 */
import { z } from 'zod';
import type { Office } from './types';

const Bilingual = z.object({ en: z.string(), fr: z.string() });
const Time = z.string().regex(/^\d{2}:\d{2}$/);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Weekday = z.number().int().min(1).max(7);
const OfficeSchema = z.object({
  id: z.string(),
  kind: z.enum(['scc', 'scc-passport', 'passport', 'outreach']),
  prov: z.enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']),
  name: Bilingual,
  short: Bilingual,
  lines: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  note: Bilingual.optional(),
  city: Bilingual,
  postal: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  geo: z.enum(['address', 'postal', 'city']),
  tz: z.string(),
  weekly: z.array(z.tuple([Weekday, Time, Time])).optional(),
  monthly: z.array(z.tuple([z.array(z.number().int()), Weekday, Time, Time])).optional(),
  dated: z.array(z.tuple([IsoDate, Time, Time])).optional(),
  lunch: z.tuple([Time, Time]).optional(),
  closedOn: z.array(IsoDate).optional(),
  closure: z.object({ from: IsoDate, to: IsoDate.optional(), cause: Bilingual }).optional(),
  lang: z.array(z.enum(['en', 'fr'])),
  sign: z.array(z.enum(['asl', 'lsq'])).optional(),
  wheelchair: z.boolean().optional(),
  parking: z.enum(['free', 'paid']).optional(),
  pp: z.array(z.enum(['urgent', 'express', 'pickup10', 'mail20'])).optional(),
  expressDays: z.tuple([z.number(), z.number()]).optional(),
  bio: z.boolean().optional(),
  apptOnly: z.object({ phone: z.string().optional() }).optional(),
}) satisfies z.ZodType<Office>;

/** A bundled office list, validated (a malformed data file fails loudly, when the module loads). */
export const parseOffices = (json: unknown): Office[] => z.array(OfficeSchema).parse(json);
