/**
 * The source contract every Brazil tool must satisfy (docs/brazil_plans.md §13).
 *
 * A tool's answer is only as good as what it can be audited against, so every output carries
 * not just a link but the authority behind it, the dataset the value came from, and the moment
 * the value was actually fetched. Two consequences fall out of that, and they are the point:
 *
 * - **Live and cached must not look alike.** `fromCache` says which one this is, because a live
 *   feed that is four minutes old and one that is four hours old are different answers wearing
 *   the same badge. See §14: an upstream that failed must never be presented as a current value.
 * - **The model must never have to invent a citation.** The tool builds the source itself, so the
 *   answer cannot cite a page it never read.
 *
 * `liveSource` is for values fetched on this call (or served from a cache of a fetch made
 * recently — hence `fromCache`). `referenceSource` is for data the tool holds in memory because
 * it changes on a timescale no person is waiting on: the IBGE municipality list, this pack's own
 * index of federal services.
 */
import type { ToolSource } from '@/lib/widgets/types';

/** The pack's verification date for hand-curated pages; the tools stamp their own `checked`. */
export const CHECKED = '2026-10-02';

export type BrazilToolSource = ToolSource & {
  /** The institution that published this, in its own words. Required by the contract. */
  authority: string;
  /** True for values fetched from a live upstream on this call or within its cache window. */
  live: boolean;
  /** ISO timestamp of the fetch behind the value, when it was fetched at runtime. */
  fetchedAt?: string;
  /** The dataset within the authority a value came from, when it runs several. */
  datasetId?: string;
};

const isoNow = () => new Date().toISOString();

type Common = {
  title: string;
  url: string;
  /** ISO date this source was last verified by a human (defaults to the pack's `CHECKED`). */
  checked?: string;
};

/** A live value, fetched now — or served from the pack's cache of a recent fetch. */
export function liveSource(opts: Common & {
  authority: string;
  datasetId?: string;
  /** Set when the value came from the cache instead of this call. */
  fromCache?: boolean;
  /** Overrides `new Date()`; used by fixtures and tests so a card can show a real time. */
  fetchedAt?: string;
}): BrazilToolSource {
  return {
    title: opts.title,
    url: opts.url,
    checked: opts.checked ?? CHECKED,
    authority: opts.authority,
    live: true,
    datasetId: opts.datasetId,
    fromCache: opts.fromCache,
    fetchedAt: opts.fetchedAt ?? isoNow(),
  };
}

/** Reference data held in memory because it changes slower than anyone is waiting on. */
export function referenceSource(opts: Common & {
  authority: string;
  datasetId?: string;
  /** ISO timestamp of the fetch that populated the in-memory copy, when known. */
  fetchedAt?: string;
  /**
   * Whether the upstream is read at runtime (`true`: the IBGE list, fetched once per
   * process) or the value comes from a committed snapshot (`false`: the service
   * catalogue, generated into the repo). A snapshot is checked, not live — and the
   * footer says "verified on", not "live", because that is what it is.
   */
  live?: boolean;
}): BrazilToolSource {
  return {
    title: opts.title,
    url: opts.url,
    checked: opts.checked ?? CHECKED,
    authority: opts.authority,
    live: opts.live ?? true,
    datasetId: opts.datasetId,
    fetchedAt: opts.fetchedAt,
  };
}

/** True when every source satisfies the §13 contract. Used by the adapter contract test. */
export function hasValidSources(sources: unknown): boolean {
  return (
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as BrazilToolSource).title === 'string' &&
        typeof (s as BrazilToolSource).url === 'string' &&
        typeof (s as BrazilToolSource).checked === 'string' &&
        typeof (s as BrazilToolSource).authority === 'string' &&
        (s as BrazilToolSource).authority.length > 0 &&
        typeof (s as BrazilToolSource).live === 'boolean',
    )
  );
}