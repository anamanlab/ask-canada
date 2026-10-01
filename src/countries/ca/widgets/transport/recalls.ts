/**
 * Vehicle recall lookup: the output shape and the two helpers the renderer needs. Parsing and shaping Transport
 * Canada's database responses happens on the server (recalls-parse.ts, live.ts).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './constants';

type RecallStatus = 'found' | 'none' | 'need-year' | 'need-vehicle' | 'unavailable';

export type Recall = {
  /** Transport Canada recall number, e.g. "2026251" (shown as 2026-251). */
  id: string;
  date: string;
  system: string;
  kind: string;
  units: number | null;
  models: string[];
  issue: string;
  /** First sentence of the issue: the collapsed card's headline. Absent on answers saved before it existed. */
  lead?: string;
  /** The issue after that sentence, paragraph breaks kept ('' when the headline says it all). */
  rest?: string;
  risk: string | null;
  action: string | null;
  note: string | null;
  mfrNumber: string | null;
  url: string;
};

export type YearCount = { year: number; count: number };

export type RecallsOutput = {
  version: 1;
  lang: Lang;
  status: RecallStatus;
  make: string | null;
  model: string | null;
  year: number | null;
  /** Total recalls for this make/model/year (unique recall numbers; from the database count when the list was cut short). */
  total: number;
  /** True when the database counts more rows than it returned: `total` is then a floor ("25+"). */
  truncated: boolean;
  recalls: Recall[];
  /** Unique recalls per recent model year (need-year state; -1 = couldn't read that year). */
  years: YearCount[];
  maker: { name: string; url: string | null; phone: string | null } | null;
  live: boolean;
  fetchedAt: string;
  links: { database: string; report: string; manufacturers: string; repair: string };
  phones: { defects: string; defectsLocal: string };
  sources: ToolSource[];
};

export type RecallsInput = { make?: string | null; model?: string | null; year?: number | null; lang?: Lang };

/** "2026251" → "2026-251" */
export const displayNumber = (id: string) => (/^\d{7}$/.test(id) ? `${id.slice(0, 4)}-${id.slice(4)}` : id);

/** A recall issued in the last `days` days. */
export const isRecent = (date: string, today: string, days = 365) => {
  const a = Date.parse(date);
  const b = Date.parse(today);
  return Number.isFinite(a) && Number.isFinite(b) && b - a <= days * 86_400_000 && a <= b + 86_400_000;
};
