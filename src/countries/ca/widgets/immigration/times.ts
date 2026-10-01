/** IRCC processing times: shapes and parsing (isomorphic). Data: live feeds (live.ts) or snapshot.ts. */

export type Unit = 'minute' | 'day' | 'week' | 'month' | 'year';
export type Duration = { n: number; unit: Unit; q?: 'about' | 'more' };

export type TimeGroup = 'visit' | 'study' | 'work' | 'immigrate' | 'citizenship';
export const TIME_KEYS = [
  'eta', 'visitor', 'supervisa', 'visitor-extension', 'study', 'study-extension', 'work', 'work-extension', 'iec',
  'cec', 'fsw', 'pnp-ee', 'pnp', 'spouse-inside', 'spouse-outside', 'parents', 'pr-card', 'citizenship', 'citizenship-proof',
] as const;
export type TimeKey = (typeof TIME_KEYS)[number];

export const TIME_META: Record<TimeKey, { group: TimeGroup; basis: 'forward' | 'historical'; byCountry?: boolean }> = {
  eta: { group: 'visit', basis: 'historical' },
  visitor: { group: 'visit', basis: 'historical', byCountry: true },
  supervisa: { group: 'visit', basis: 'historical', byCountry: true },
  'visitor-extension': { group: 'visit', basis: 'historical' },
  study: { group: 'study', basis: 'historical', byCountry: true },
  'study-extension': { group: 'study', basis: 'forward' },
  work: { group: 'work', basis: 'historical', byCountry: true },
  'work-extension': { group: 'work', basis: 'forward' },
  iec: { group: 'work', basis: 'historical' },
  cec: { group: 'immigrate', basis: 'forward' },
  fsw: { group: 'immigrate', basis: 'forward' },
  'pnp-ee': { group: 'immigrate', basis: 'forward' },
  pnp: { group: 'immigrate', basis: 'forward' },
  'spouse-inside': { group: 'immigrate', basis: 'forward' },
  'spouse-outside': { group: 'immigrate', basis: 'forward' },
  parents: { group: 'immigrate', basis: 'forward' },
  'pr-card': { group: 'immigrate', basis: 'historical' },
  citizenship: { group: 'citizenship', basis: 'forward' },
  'citizenship-proof': { group: 'citizenship', basis: 'forward' },
};

export const GROUP_ORDER: TimeGroup[] = ['immigrate', 'visit', 'study', 'work', 'citizenship'];

export type TimeRow = {
  key: TimeKey;
  /** For sponsorship rows the feed splits by province: `value` is outside Quebec, `quebec` is in Quebec. */
  value: Duration | null;
  waiting?: number;
  quebec?: Duration | null;
  /** IRCC isn't accepting new applications: the time applies only to applications already submitted. */
  status?: 'paused';
};

/** Rows whose feed value is the outside-Quebec figure (a Quebec figure sits next to it). */
export const QUEBEC_SPLIT: TimeKey[] = ['spouse-inside', 'spouse-outside', 'parents'];

/** Country-based rows: ISO code → compact duration ("58d", "5w"). */
export type CountryTimes = Record<string, string>;

/** IRCC publishes the times in 4 feeds, each with its own update date: pr (forward-looking estimates), ext (extensions, by week), country (by country) and other. */
export type TimeFeed = 'pr' | 'ext' | 'country' | 'other';
export const feedOf = (key: TimeKey): TimeFeed =>
  TIME_META[key].byCountry ? 'country' : TIME_META[key].basis === 'forward' ? (key.endsWith('extension') ? 'ext' : 'pr') : 'other';

export type TimesData = {
  rows: TimeRow[];
  countries: Partial<Record<'visitor' | 'supervisa' | 'study' | 'work', CountryTimes>>;
  /** When IRCC last updated each feed (`tr` is the by-country feed; `other` is absent in older saved answers). */
  updated: { pr: string | null; tr: string | null; ext: string | null; other?: string | null };
  /** At least one feed answered. */
  live: boolean;
  /** Feeds that did not answer: their times are the last known ones, never "right now". */
  down?: TimeFeed[];
};

/** Is this application type's time straight from IRCC's feed (not the last known value)? */
export const isLive = (data: Pick<TimesData, 'live' | 'down'>, key: TimeKey) => data.live && !data.down?.includes(feedOf(key));
/** When IRCC last updated the feed behind this application type. */
export function updatedOf(data: Pick<TimesData, 'updated'>, key: TimeKey): string | null {
  const feed = feedOf(key);
  return feed === 'country' ? data.updated.tr : feed === 'other' ? (data.updated.other ?? data.updated.tr) : data.updated[feed];
}

const UNIT: Record<string, Unit> = { minute: 'minute', day: 'day', week: 'week', month: 'month', year: 'year' };

/** "About 6 months" · "58 days" · "More than 10 years" · "Part 1: 4 months" → Duration; "Not enough data" → null. */
export function parseDuration(raw: unknown): Duration | null {
  if (typeof raw !== 'string') return null;
  const m = raw.match(/(\d[\d,]*)\s*(minute|day|week|month|year)s?/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  const q = /more than/i.test(raw) ? 'more' : /about/i.test(raw) ? 'about' : undefined;
  return { n, unit: UNIT[m[2].toLowerCase()], ...(q ? { q } : {}) };
}

export const encodeDuration = (d: Duration | null) => (d ? `${d.n}${d.unit === 'minute' ? 'i' : d.unit[0]}` : null);
export function decodeDuration(s: string | undefined | null): Duration | null {
  const m = s?.match(/^(\d+)([idwmy])$/);
  if (!m) return null;
  const unit: Unit = m[2] === 'i' ? 'minute' : m[2] === 'd' ? 'day' : m[2] === 'w' ? 'week' : m[2] === 'm' ? 'month' : 'year';
  return { n: Number(m[1]), unit };
}

/** "About 58,900 people waiting" → 58900. */
export const parseWaiting = (raw: unknown) => {
  const m = typeof raw === 'string' ? raw.match(/(\d[\d,]*)/) : null;
  return m ? Number(m[1].replace(/,/g, '')) : undefined;
};

/** Rough length in days, for comparing and drawing bars. */
export const durationDays = (d: Duration) => d.n * { minute: 1 / 1440, day: 1, week: 7, month: 30.44, year: 365.25 }[d.unit];
