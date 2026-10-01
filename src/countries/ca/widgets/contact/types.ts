/**
 * Input and output shapes of the contact tools (types only, plus the list of urgent situations), shared by
 * the server builders (build.ts) and the cards. Nothing here pulls the builders into the browser bundle.
 */
import type { Holiday } from '@/lib/dates/business-days';
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang, LineId, Topic } from './data';
import type { UrgentId } from './urgent-data';

export type DirectoryInput = {
  topic?: Topic | 'all';
  tty?: boolean;
  abroad?: boolean;
  lang?: Lang;
  timeZone?: string;
};

export type LineSummary = { id: LineId; name: string; number?: string; tty?: string; /** The number for this caller's country, when it isn't the main one. */ fromAbroad?: string; /** The official list of numbers by country, when the main number differs abroad. */ fromAbroadPage?: string; hours?: string; now?: string; automated?: string; page: string };

export type DirectoryOutput = {
  kind: 'directory';
  topic: Topic | 'all';
  lang: Lang;
  timeZone: string;
  /** ISO instant the output was computed. */
  asOf: string;
  /** Lab only: freeze the clock at `asOf` instead of ticking live. */
  pinned?: boolean;
  lines: LineId[];
  tty: boolean;
  /** Calling from outside Canada and the United States: international (collect) numbers lead. */
  abroad: boolean;
  /** Calling from the United States: toll-free numbers still work; only "Outside Canada" numbers replace them. */
  us: boolean;
  north: boolean;
  holidays: Holiday[];
  holidaysLive: boolean;
  today?: { date: string; holiday?: string };
  /** Plain-language summary for the model (the card renders from `lines`). */
  summary: LineSummary[];
  guidance: string[];
  sources: ToolSource[];
};

/** fraud = it happened (money or details lost); suspected = a call or message that may be a scam, nothing lost yet. */
export const URGENT_SITUATIONS = ['danger', 'crisis', 'fraud', 'suspected', 'all'] as const;
export type UrgentSituation = (typeof URGENT_SITUATIONS)[number];
export const isUrgentSituation = (x: unknown): x is UrgentSituation => URGENT_SITUATIONS.some((s) => s === x);

export type UrgentInput = { situation?: UrgentSituation; lang?: Lang; timeZone?: string };
export type UrgentOutput = {
  kind: 'urgent';
  situation: UrgentSituation;
  lang: Lang;
  timeZone: string;
  asOf: string;
  pinned?: boolean;
  order: UrgentId[];
  holidays: Holiday[];
  holidaysLive: boolean;
  summary: { id: UrgentId; name: string; how: string }[];
  /** Rules for the model's answer (suspected scams). */
  guidance?: string[];
  sources: ToolSource[];
};
