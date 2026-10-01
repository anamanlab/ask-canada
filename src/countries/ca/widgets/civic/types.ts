/** Output shapes of the civic tools (shared by tools, builders, renderers and fixtures). */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang, NewsType } from './data';

/* ───────────────────────── civicFindMp ───────────────────────── */

export type Office = {
  kind: 'hill' | 'constituency';
  /** e.g. "Main office - Toronto" (constituency) or "House of Commons" (Hill). */
  label: string;
  lines: string[];
  phone?: string;
  fax?: string;
};

export type Mp = {
  personId: string;
  name: string;
  honorific?: string;
  /**
   * Grammatical gender of the member's French title on their House of Commons profile ("Députée" → true,
   * "Député" → false), whatever the answer language. Absent when the profile can't be read: French then uses
   * the neutral "député ou députée".
   */
  feminine?: boolean;
  /** Caucus short name as the House of Commons writes it in the answer language (neutral fact). */
  caucus?: string;
  /** Member since (YYYY-MM-DD). */
  since?: string;
  /** Offices and roles as a parliamentarian (e.g. "Minister of Foreign Affairs"). */
  roles: string[];
  email?: string;
  website?: string;
  preferredLanguage?: string;
  /** Official portrait as a data: URI (kept out of the model's context). */
  photo?: string;
  profileUrl: string;
  offices: Office[];
};

/**
 * A riding outline pre-projected (Web Mercator) into an SVG box (viewBox `0 0 w h`). `bounds` is the box on
 * the ground (west, south, east, north, in degrees), so the outline can be laid over the basemap.
 */
export type RidingShape = { d: string; w: number; h: number; pin?: [number, number]; bounds?: [number, number, number, number] };

export type SeatStatus = 'sitting' | 'vacant' | 'unconfirmed';

export type Riding = {
  /** Federal electoral district number (2023 Representation Order), e.g. "35079". */
  fedNum: string;
  name: string;
  province: string;
  provinceName: string;
  status: SeatStatus;
  mp: Mp | null;
  shape?: RidingShape;
};

export type FindMpStatus = 'ok' | 'ask' | 'invalid' | 'not-found' | 'unavailable';

export type FindMpOutput = {
  status: FindMpStatus;
  lang: Lang;
  /** The postal code as typed back to the person ("K1A 0B1"). */
  postalCode?: string;
  city?: string;
  province?: string;
  /** First riding = the one at the postal code's centre; more when the code spans several ridings. */
  ridings: Riding[];
  house: { seats: number; sitting?: number; vacant?: number };
  live: boolean;
  checked: string;
  sources: ToolSource[];
};

/* ───────────────────────── civicVoterCheck ───────────────────────── */

/**
 * eligible: citizen 18+ in Canada · abroad: citizen 18+ living outside Canada (International Register of Electors)
 * future-elector: 14–17 living in Canada (Register of Future Electors) · too-young: under 14 in Canada
 * future-abroad: under 18 living outside Canada (the Register of Future Electors is for young citizens living in Canada)
 */
export type VoterVerdict = 'eligible' | 'future-elector' | 'future-abroad' | 'too-young' | 'not-citizen' | 'abroad' | 'unknown';

export type VoterInput = {
  age?: number;
  citizen?: boolean;
  livesAbroad?: boolean;
  province?: string;
  focus?: 'register' | 'id' | 'ways';
  lang?: Lang;
};

export type VoterOutput = {
  verdict: VoterVerdict;
  age?: number;
  citizen?: boolean;
  livesAbroad?: boolean;
  province?: string;
  focus: 'register' | 'id' | 'ways';
  lang: Lang;
  /** The day this was computed (YYYY-MM-DD, Eastern time); the reader's own clock takes over once hydrated. */
  today: string;
  /**
   * Élections Québec notice for people in Quebec: 'election' names the provincial general election date
   * (`quebecElection`) until that day (America/Toronto); 'generic' afterwards; null outside Quebec.
   */
  quebecNotice: 'election' | 'generic' | null;
  quebecElection?: string;
  links: { ereg: string; register: string; voterId: string; waysToVote: string; futureElectors: string; abroad: string; contact: string };
  phone: string;
  tty: string;
  checked: string;
  sources: ToolSource[];
};

/* ───────────────────────── civicParliament ───────────────────────── */

/** Stages in each chamber (LEGISinfo dates the readings; committee and report come from the official status line). */
export type StageKey = 'first' | 'second' | 'committee' | 'report' | 'third';
export type TrackStep = { chamber: 'house' | 'senate' | 'assent'; stage?: StageKey; done: boolean; date?: string };

export type BillSummary = {
  code: string;
  title: string;
  /** Official status line from LEGISinfo, in the answer language. */
  status: string;
  kind: 'government' | 'private-member' | 'senate-public' | 'senate-government' | 'other';
  origin: 'house' | 'senate';
  track: TrackStep[];
  /** Index of the next step (the one in progress); track.length when law. */
  at: number;
  law: boolean;
  defeated: boolean;
  /** Parked: a private member's bill outside the Order of Precedence (not eligible for debate yet). */
  paused?: boolean;
  /** Last dated movement (YYYY-MM-DD). */
  lastMoved?: string;
  url: string;
};

export type ParliamentOutput = {
  lang: Lang;
  parliament: number;
  session: number;
  house: { seats: number; sitting?: number; vacant?: number };
  senateSeats: number;
  /** When a bill was asked for: that bill (or null + `notFound`). */
  focus?: BillSummary | null;
  query?: string;
  notFound?: string;
  bills: BillSummary[];
  stats?: { total: number; law: number; government: number };
  live: boolean;
  checked: string;
  sources: ToolSource[];
};

/* ───────────────────────── civicNews ───────────────────────── */

export type NewsItem = {
  title: string;
  teaser: string;
  url: string;
  published: string;
  type?: NewsType;
  department?: string;
};

export type NewsOutput = {
  lang: Lang;
  query?: string;
  type?: NewsType;
  items: NewsItem[];
  /** How far back the search looked (YYYY-MM-DD), when known. */
  since?: string;
  live: boolean;
  checked: string;
  sources: ToolSource[];
};
