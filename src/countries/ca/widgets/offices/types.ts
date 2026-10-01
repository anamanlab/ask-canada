/** Types shared by the offices tool (server) and widget (client). */

export type Bi = { en: string; fr: string };
export type Lang = 'en' | 'fr';

type Prov = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

/** scc = Service Canada Centre · scc-passport = centre with a passport office · passport = passport office · outreach = scheduled outreach site */
export type OfficeKind = 'scc' | 'scc-passport' | 'passport' | 'outreach';

/** Passport service levels, as the official finder names them. */
export type PassportTier = 'urgent' | 'express' | 'pickup10' | 'mail20';

/** One point of service (compact; generated from the official office pages, see data.ts). */
export type Office = {
  id: string;
  kind: OfficeKind;
  prov: Prov;
  name: Bi;
  /** Short display name ("Ottawa West"), the kind is shown separately. */
  short: Bi;
  /** Address lines before the city line (building, street). */
  lines: { en: string[]; fr: string[] };
  /** Access note from the office page ("You can also enter from …"), shown in muted text under the address. */
  note?: Bi;
  city: Bi;
  postal?: string;
  lat: number;
  lng: number;
  /** How precisely the pin is placed. */
  geo: 'address' | 'postal' | 'city';
  /** IANA time zone the posted hours are in. */
  tz: string;
  /** [ISO weekday 1-7 (Mon=1), 'HH:MM' open, 'HH:MM' close] */
  weekly?: [number, string, string][];
  /** Outreach: [[nth weeks of the month], ISO weekday, open, close] */
  monthly?: [number[], number, string, string][];
  /** Outreach: explicit visit days [ISO date, open, close] */
  dated?: [string, string, string][];
  /** Daily lunch closure [from, to] */
  lunch?: [string, string];
  /** One-off closure days announced on the office page. */
  closedOn?: string[];
  /** Temporary closure posted on the office page (ISO dates; `to` absent = until further notice). */
  closure?: { from: string; to?: string; cause: Bi };
  lang: Lang[];
  sign?: ('asl' | 'lsq')[];
  wheelchair?: boolean;
  parking?: 'free' | 'paid';
  pp?: PassportTier[];
  /** Express pick-up takes longer here than the usual 2 to 9 business days: [from, to] business days (IRCC). */
  expressDays?: [number, number];
  bio?: boolean;
  /** Posted on the office page: no walk-ins, book by phone. */
  apptOnly?: { phone?: string };
};

/** What the person needs; drives filtering and the handoff. */
export type Need = 'any' | 'passport' | 'passport-urgent' | 'passport-express' | 'biometrics';

/** Live status snapshot from ESDC's wait-time feed. */
export type LiveStatus = {
  closed: boolean;
  holiday: boolean;
  unexpected: boolean;
  /** Estimated wait in whole minutes, when the office is open and posted a wait for today. */
  waitMin?: number;
  /** When that wait was measured (office-local "HH:MM"), if the feed says. */
  waitAt?: string;
  /** The date ("YYYY-MM-DD") the feed says this office's status was last updated. */
  updated?: string;
  /** ISO instant the snapshot was read from the feed itself (never the age of a cached copy). */
  at: string;
};

export type ResultOffice = Office & { km: number; live?: LiveStatus };

export type Origin = {
  lat: number;
  lng: number;
  /** "K1A", "Moncton, NB", … */
  label: string;
  precision: 'fsa' | 'place' | 'coords' | 'region';
};

type FinderStatus = 'ok' | 'no-location' | 'not-found';

export type FinderOutput = {
  status: FinderStatus;
  need: Need;
  /** What the person typed (for not-found), trimmed. */
  query?: string;
  origin: Origin | null;
  /** The office to open first when it isn't simply the nearest (the true passport office for a passport search). */
  focusId?: string;
  /** Candidate pool, nearest first: covers every filter chip without another call. */
  offices: ResultOffice[];
  /** ISO instant the output was computed and live status fetched. */
  asOf: string;
  /** True when live status came back for at least one office. */
  live: boolean;
  /** True when the location came from the live geolocator (false = offline fallback). */
  geocoded: boolean;
  lang: Lang;
  sources: import('@/lib/widgets/types').ToolSource[];
};

export type AppointmentFocus = 'passport' | 'biometrics' | 'other';

export type AppointmentOutput = {
  focus: AppointmentFocus;
  lang: Lang;
  sources: import('@/lib/widgets/types').ToolSource[];
};
