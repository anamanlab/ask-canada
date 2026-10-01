/**
 * Vehicle recall lookup: parsing, normalizing and shaping Transport Canada's Motor Vehicle Safety Recalls Database
 * responses. Pure (no fetching: that's live.ts), used by the tool, the fixtures and the scenarios, never by the renderer.
 */
import { z } from 'zod';
import { PHONES, URLS, recallUrl, type Lang } from './data';
import { makerFor } from './makers';
import { recallSources } from './sources';
import type { Recall, RecallsInput, RecallsOutput } from './recalls';

/* ─────────────── Normalization ─────────────── */

const MAKE_ALIASES: [RegExp, string][] = [
  [/^chevy$/i, 'chevrolet'],
  [/^vw$/i, 'volkswagen'],
  [/^mercedes$|^merc$|^benz$/i, 'mercedes-benz'],
  [/^land ?rover$/i, 'land rover'],
  [/^mini ?cooper$/i, 'mini'],
  [/^harley$/i, 'harley-davidson'],
  [/^alfa$/i, 'alfa romeo'],
];

const MODEL_ALIASES: [RegExp, string][] = [
  [/^f[- ]?(150|250|350|450)$/i, 'f-$1'],
  [/^cr[- ]?v$/i, 'cr-v'],
  [/^hr[- ]?v$/i, 'hr-v'],
  [/^cx[- ]?(\d+)$/i, 'cx-$1'],
  [/^mx[- ]?5$/i, 'mx-5'],
  [/^rav ?4$/i, 'rav4'],
  [/^model ?([3syx])$/i, 'model $1'],
  [/^c[- ]?hr$/i, 'c-hr'],
  [/^ioniq ?(\d)$/i, 'ioniq $1'],
];

export function normalizeMake(make?: string | null): string | null {
  const m = (make ?? '').trim().replace(/\s+/g, ' ');
  if (!m || m.length > 40) return null;
  for (const [re, v] of MAKE_ALIASES) if (re.test(m)) return v;
  return m.toLowerCase();
}

export function normalizeModel(model?: string | null): string | null {
  const m = (model ?? '').trim().replace(/\s+/g, ' ');
  if (!m || m.length > 40) return null;
  for (const [re, v] of MODEL_ALIASES) if (re.test(m)) return m.replace(re, v).toLowerCase();
  return m.toLowerCase();
}

/** Alternate spelling to retry when a model finds nothing ("cx5" → "cx-5", "f150" → "f-150"). */
export function modelVariant(model: string): string | null {
  const m = /^([a-z]+)[- ]?(\d+)$/i.exec(model);
  if (!m) return null;
  const hyphen = `${m[1]}-${m[2]}`.toLowerCase();
  const joined = `${m[1]}${m[2]}`.toLowerCase();
  return model.toLowerCase() === hyphen ? joined : hyphen;
}

/** Display a make or model: words with digits and short hyphen parts in capitals ("rav4" → "RAV4", "cr-v" → "CR-V"). */
export const titleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) =>
      /\d/.test(w) || /^(bmw|gmc|vw|suv|ev|awd|rwd|fwd|phev|brp|ktm)$/i.test(w)
        ? w.toUpperCase()
        : w
            .toLowerCase()
            .split('-')
            .map((p, i, a) => (a.length > 1 && p.length <= 2 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
            .join('-'),
    )
    .join(' ');

/** Database system names come in Title Case ("Lights And Instruments"); show them in sentence case. */
const sentenceCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

/* ─────────────── Parsing the open API ─────────────── */

/** Every endpoint answers with rows of named cells; an empty search is `{ ResultSet: [] }`. */
const Cell = z.object({ Name: z.string(), Value: z.object({ Literal: z.string().nullish() }).nullish() });
export const ApiResult = z.object({ ResultSet: z.array(z.array(Cell)).nullish() });
export type ApiResult = z.output<typeof ApiResult>;

const rowToMap = (row: z.output<typeof Cell>[]) => Object.fromEntries(row.map((c) => [c.Name, c.Value?.Literal ?? '']));

/** "5/21/2026 12:00:00 AM" → "2026-05-21" */
function apiDate(s: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s ?? '');
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/** List rows → unique recalls (a recall appears once per affected model), newest first. */
export function parseList(res: ApiResult): { id: string; date: string; models: string[] }[] {
  const by = new Map<string, { id: string; date: string; models: string[] }>();
  for (const row of res.ResultSet ?? []) {
    const r = rowToMap(row);
    const id = r['Recall number'];
    if (!id) continue;
    const e = by.get(id) ?? { id, date: apiDate(r['Recall date']), models: [] };
    const model = r['Model name'];
    if (model && !e.models.includes(model)) e.models.push(model);
    by.set(id, e);
  }
  return [...by.values()].sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}

export const parseCount = (res: ApiResult) => Number(rowToMap(res.ResultSet?.[0] ?? [])['Result Count'] ?? 0) || 0;

const clean = (s: string) =>
  s
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();

/** Split a recall comment into issue / risk / action / note (EN or FR labels). Unstructured text becomes the issue. */
function splitComment(text: string): { issue: string; risk: string | null; action: string | null; note: string | null } {
  const t = clean(text ?? '');
  const labels = /(Issue|Problème|Safety Risk|Risques? pour la sécurité|Corrective Actions?|Mesures? correctives?|Note|Remarque)\s*:\s*/gi;
  const parts: { key: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = labels.exec(t))) parts.push({ key: m[1].toLowerCase(), start: m.index, end: labels.lastIndex });
  if (!parts.length) return { issue: t, risk: null, action: null, note: null };
  const out = { issue: '', risk: null as string | null, action: null as string | null, note: null as string | null };
  parts.forEach((p, i) => {
    const body = t.slice(p.end, parts[i + 1]?.start ?? t.length).trim();
    if (!body) return;
    if (/^(issue|problème)/.test(p.key)) out.issue = body;
    else if (/^(safety risk|risque)/.test(p.key)) out.risk = body;
    else if (/^(corrective|mesure)/.test(p.key)) out.action = body;
    else out.note = body;
  });
  if (!out.issue) out.issue = t.slice(0, parts[0].start).trim() || out.note || '';
  return out;
}

/** One recall-summary response → a Recall (fields for the requested language). */
export function parseSummary(res: ApiResult, lang: Lang, fallback: { id: string; date: string; models: string[] }): Recall {
  const r = rowToMap(res.ResultSet?.[0] ?? []);
  const fr = lang === 'fr';
  const parts = splitComment((fr ? r.COMMENT_FTXT : r.COMMENT_ETXT) || r.COMMENT_ETXT || '');
  const units = Number(r.UNIT_AFFECTED_NBR);
  return {
    id: fallback.id,
    date: apiDate(r.RECALL_DATE_DTE) || fallback.date,
    system: sentenceCase((fr ? r.SYSTEM_TYPE_FTXT : r.SYSTEM_TYPE_ETXT) || ''),
    kind: (fr ? r.NOTIFICATION_TYPE_FTXT : r.NOTIFICATION_TYPE_ETXT) || '',
    units: Number.isFinite(units) && units > 0 ? units : null,
    models: fallback.models,
    ...parts,
    ...leadAndRest(parts.issue),
    mfrNumber: r.MANUFACTURER_RECALL_NO_TXT || null,
    url: recallUrl(fallback.id, lang),
  };
}

/** A recall we could list but not describe (summary call failed). */
export const bareRecall = (e: { id: string; date: string; models: string[] }, lang: Lang): Recall => ({
  id: e.id,
  date: e.date,
  system: '',
  kind: '',
  units: null,
  models: e.models,
  issue: '',
  lead: '',
  rest: '',
  risk: null,
  action: null,
  note: null,
  mfrNumber: null,
  url: recallUrl(e.id, lang),
});

/* ─────────────── Headline ─────────────── */

/** First sentence of a recall issue ("On certain vehicles, … properly."), for the collapsed card. */
function firstSentence(s: string) {
  const text = s.replace(/\s+/g, ' ').trim();
  // A sentence ends at . ! ? followed by a space, but not after abbreviations like "no." or "approx."
  const re = /[.!?](?=\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(0, m.index).split(' ').pop() ?? '';
    if (/^(no|nos|n°|approx|e\.g|i\.e|etc|vol|p)$/i.test(before) || m.index < 20) continue;
    return m.index > 240 ? `${text.slice(0, 237)}…` : text.slice(0, m.index + 1);
  }
  return text.length > 240 ? `${text.slice(0, 237)}…` : text;
}

/** The issue after its first sentence, keeping the database's paragraph breaks. */
function restWithBreaks(issue: string, lead: string) {
  const flat = issue.replace(/\s+/g, ' ').trim();
  if (!flat.startsWith(lead)) return issue;
  // Walk the original text until we've consumed the lead's non-space characters, then return what follows.
  const target = lead.replace(/\s/g, '').length;
  let seen = 0;
  let i = 0;
  while (i < issue.length && seen < target) {
    if (!/\s/.test(issue[i])) seen++;
    i++;
  }
  return issue.slice(i).replace(/^\s+/, '');
}

/**
 * The card's headline and what the opened card adds to it: the rest of the issue, or the whole issue when the
 * headline had to be shortened.
 */
function leadAndRest(issue: string): { lead: string; rest: string } {
  const lead = firstSentence(issue);
  if (lead.endsWith('…')) return { lead, rest: issue };
  return { lead, rest: issue.replace(/\s+/g, ' ').trim().length > lead.length ? restWithBreaks(issue, lead) : '' };
}

/* ─────────────── Output ─────────────── */

export function recallsOutput(
  input: RecallsInput,
  data: Partial<Pick<RecallsOutput, 'status' | 'total' | 'truncated' | 'recalls' | 'years' | 'live'>> & { model?: string | null },
  now = new Date(),
): RecallsOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const make = input.make ? titleCase(input.make) : null;
  const model = data.model ?? input.model ?? null;
  const mk = input.make ? makerFor(input.make) : undefined;
  const live = data.live ?? false;
  return {
    version: 1,
    lang,
    status: data.status ?? 'unavailable',
    make: mk?.name ?? make,
    model: model ? titleCase(model) : null,
    year: input.year ?? null,
    total: data.total ?? data.recalls?.length ?? 0,
    truncated: !!data.truncated,
    recalls: data.recalls ?? [],
    years: data.years ?? [],
    maker: mk ? { name: mk.name, url: mk.url ?? null, phone: mk.phone ?? null } : null,
    live,
    fetchedAt: now.toISOString(),
    links: {
      database: URLS.recallsDb[lang],
      report: URLS.reportDefect[lang],
      manufacturers: URLS.manufacturers[lang],
      repair: URLS.recallRepair[lang],
    },
    phones: { defects: PHONES.defects, defectsLocal: PHONES.defectsLocal },
    // Nothing is read from the database until a vehicle is named, so that source makes no "live" claim.
    sources: recallSources(lang, live && data.status !== 'need-vehicle'),
  };
}

/** Model years to offer when the person didn't say which (newest first). */
export function recentYears(today: string, count = 12): number[] {
  const y = Number(today.slice(0, 4));
  // New model years go on sale in the fall: offer next year's from September.
  const top = Number(today.slice(5, 7)) >= 9 ? y + 1 : y;
  return Array.from({ length: count }, (_, i) => top - i);
}
