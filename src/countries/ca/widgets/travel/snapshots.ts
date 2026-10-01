/**
 * Real feed snapshots for the lab (generated 2026-09-30 from data.international.gc.ca and the CBSA CSV with
 * the parsers), kept as JSON in snapshots/. Each advisory also carries the feed's prose in the other
 * official language (`prose`), as the tool's output does. Fixtures only: the tools always fetch live data.
 */
import advisories from './snapshots/advisories.json';
import waits from './snapshots/waits.json';
import type { CountryAdvisory, Crossing, Lang } from './types';

/** Keyed "<ISO>_<lang>" ("MX_en"). JSON widens literal fields (levels, wait labels), hence the casts. */
export const ADVISORY_SNAPSHOTS = advisories as unknown as Record<keyof typeof advisories, { country: CountryAdvisory; fetchedAt: string }>;

export const WAITS_SNAPSHOT = waits as unknown as Record<Lang, Crossing[]>;
