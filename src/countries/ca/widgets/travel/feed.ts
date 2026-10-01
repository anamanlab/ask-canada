/**
 * Shape of Global Affairs Canada's per-destination advisory feed, validated at the boundary (live.ts):
 * https://data.international.gc.ca/travel-voyage/cta-cap-<ISO>.json
 * Only the fields the parser reads are declared; anything else in the feed is ignored. Text fields may be
 * missing or null for a destination with little content, so they are all optional here and the parser
 * drops what it can't read. The two fields a card can't exist without (`country-iso`, `eng`) are required.
 */
import { z } from 'zod';

const text = z.string().nullish();
/** Coordinates and flags arrive as numbers or as numeric strings, depending on the destination. */
const numeric = z.union([z.number(), z.string()]).nullish();

const FeedOffice = z.object({
  city: text,
  type: text,
  lat: numeric,
  lng: numeric,
  address: text,
  'tel-legacy': text,
  'email-1': text,
  internet: text,
  'has-passport-services': numeric,
});

const FeedLang = z.object({
  name: text,
  'url-slug': text,
  'friendly-date': text,
  'recent-updates': text,
  advisories: text,
  'entry-exit': text,
  'offices-html': text,
  offices: z.array(FeedOffice).nullish(),
});

const FeedCountrySchema = z.object({
  'country-iso': z.string().min(2),
  'advisory-state': z.coerce.number().int().min(0).max(3),
  'date-published': z.object({ date: text, asp: text }).nullish(),
  eng: FeedLang,
  fra: FeedLang.nullish(),
});

export const FeedResponse = z.object({
  metadata: z.object({ generated: z.object({ date: text }).nullish() }).nullish(),
  data: FeedCountrySchema,
});

export type FeedOffice = z.infer<typeof FeedOffice>;
export type FeedCountry = z.infer<typeof FeedCountrySchema>;
