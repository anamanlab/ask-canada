/**
 * The shape of ESDC's public wait-time feed for one office (the fields this widget reads), checked with zod at
 * the boundary. Pure (zod only), so it is unit-tested against recorded payloads: feed.test.mjs.
 *
 * The feed writes "nothing posted" as the boolean `false`, not null and not an absent key: an office with no
 * wait-time posting answers `"waitTimeManualDate": false, "waitTimeManualSeconds": false` (Kingston, the
 * appointment-only centre, 2026-10-01). `false`, null and a missing key all read as "not posted" here, so
 * such an office keeps the rest of its live reading (closed, holiday, unexpected closure).
 */
import { z } from 'zod';

/** A string the feed may send as `false`, null or not at all (also empty): undefined when nothing is posted. */
const posted = z
  .union([z.string(), z.literal(false)])
  .nullish()
  .transform((v) => v || undefined);
/** The same for a flag: only a literal `true` counts. */
const flag = z
  .boolean()
  .nullish()
  .transform((v) => v === true);

export const FeedSchema = z.object({
  isClosed: z.boolean(),
  isHoliday: flag,
  isClosedUnexpected: flag,
  waitTimeNotAvailable: flag,
  lastUpdated: posted,
  waitTimeManualDate: posted,
  waitTimeManualSeconds: z
    .union([z.number().finite(), z.literal(false)])
    .nullish()
    .transform((v) => v || undefined),
  /** `en.waitTimeMoment` ("at 2:00pm") is `false` when no wait is posted; anything but a string is ignored. */
  en: z
    .object({ waitTimeMoment: z.unknown().optional() })
    .nullish()
    .transform((v) => v ?? undefined),
});
export type Feed = z.infer<typeof FeedSchema>;

/** "at 12:00pm" / "at 2:00pm" (the feed's English wording of when the wait was measured) → "12:00" / "14:00". */
export function measuredAt(moment: unknown): string | undefined {
  const m = typeof moment === 'string' ? moment.match(/(\d{1,2}):(\d{2})\s*([ap])\.?m/i) : null;
  if (!m) return undefined;
  const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0);
  return h < 24 && Number(m[2]) < 60 ? `${String(h).padStart(2, '0')}:${m[2]}` : undefined;
}
