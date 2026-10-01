/**
 * IRCC's live JSON feeds (the files canada.ca's own pages load): where they are and the shape we rely on.
 * Server only: live.ts reads them through `fetchJson`, which validates every response against these schemas.
 * Only the fields we use are checked; everything else in a feed is ignored.
 */
import 'server-only';
import { z } from 'zod';
import type { Fees, Lang } from './data';

const BASE = 'https://www.canada.ca/content/dam/ircc/documents/json';

export const FEEDS = {
  rounds: (lang: Lang) => `${BASE}/ee_rounds_123_${lang}.json`,
  ptimeCountry: `${BASE}/data-ptime-en.json`,
  ptimeOther: `${BASE}/data-ptime-non-country-en.json`,
  flpt: `${BASE}/flpt-en.json`,
  flptWeek: `${BASE}/flpt-by-week-en.json`,
  fees: `${BASE}/fees.json`,
};

/** fees.json key for each fee in data.ts `FEES`. */
export const FEE_KEYS: Record<keyof Fees, string> = {
  eta: 'eta',
  visitorVisa: 'visitor-visa',
  biometrics: 'bio',
  studyPermit: 'study-permit',
  workPermit: 'work-permit',
  openWorkPermitHolder: 'open-work-permit',
  iec: 'iec',
  economicPr: 'economic-main-rprf',
};

/** Pool distribution fields dd1…dd17 without the bold subtotals (dd3, dd9); dd18 is the total. Same order as data.ts `POOL_BANDS`. */
export const POOL_FIELDS = [1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => `dd${n}`);
export const POOL_TOTAL_FIELD = 'dd18';

/** A table of display strings ("About 6 months", "58 days"). A value that isn't text reads as empty: no estimate. */
const Texts = z.record(z.string(), z.string().catch(''));

/** A list where rows of the wrong shape are dropped, so one odd row never costs the whole feed. */
const rowsOf = <S extends z.ZodType>(row: S) =>
  z.array(z.unknown()).transform((list) =>
    list.flatMap((item) => {
      const parsed = row.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    }),
  );

/** ee_rounds_123_en.json: numbers arrive as text ("2,000"); the dd1…dd18 pool fields are read from the catch-all. */
const Round = z
  .object({
    drawNumber: z.string(),
    drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    drawName: z.string(),
    drawSize: z.string(),
    drawCRS: z.string(),
    drawDistributionAsOn: z.string().optional().catch(undefined),
  })
  .catchall(z.unknown());
export const RoundsFeed = z.object({ rounds: rowsOf(Round) });
export type FeedRound = z.output<typeof Round>;

/** ee_rounds_123_fr.json: only the official French round names are used. */
export const RoundNamesFeed = z.object({ rounds: rowsOf(z.object({ drawNumber: z.string(), drawName: z.string() })) });

/** flpt-en.json: forward-looking estimates and people waiting, by program. */
export const FlptFeed = z.object({
  'default-update': z.object({ flpt_lastupdated: z.string().optional().catch(undefined) }).optional().catch(undefined),
  'total-people': Texts.optional().catch(undefined),
  'current-flpt': Texts,
});

/** flpt-by-week-en.json: study and work permit extensions. */
export const FlptWeekFeed = z.object({
  'tr-last-updated': z.string().optional().catch(undefined),
  'current-flpt': Texts,
});

/** data-ptime-en.json (by country) and data-ptime-non-country-en.json: section → { code or field → text }. */
export const PtimeFeed = z.record(z.string(), Texts.catch({})).refine((sections) => Object.keys(sections).length > 0);

/** fees.json: fee key → { en: "$1,590", fr: … }. */
export const FeesFeed = z.record(z.string(), z.object({ en: z.string().optional().catch(undefined) }).catch({}));
