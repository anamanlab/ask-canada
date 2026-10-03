/**
 * Live economic indicators, Brazil. Source: Banco Central do Brasil (SGS), the Central Bank's own
 * time-series service. Open, keyless, and the authority for these numbers by definition — there is no
 * reason to quote an inflation or exchange-rate figure from anywhere else.
 *
 * The catalogue is small on purpose. Each series below was added only after its endpoint was seen
 * returning *current* data, because that is not a safe assumption: SGS keeps serving series it no longer
 * updates, and asking for "the last N" of one can hand back the tail of a decade-old history with a 200
 * status and a well-formed JSON array. Series 63 and 2265 both do exactly that. So every response is
 * checked against its own cadence (see `staleAfter`), and a stale answer is reported as stale rather than
 * presented as today's figure. The same guard covers the failure mode the rest of the pack cares about:
 * a live source being wrong must never become a confident number in the chat.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource, type BrazilToolSource } from './source';

type Series = {
  /** BCB SGS series id. */
  id: number;
  key: string;
  name: { en: string; pt: string };
  unit: { en: string; pt: string };
  /** The official human-readable page for this series, cited in the answer. */
  href: { en: string; pt: string };
  /** Words (already accent-stripped, lowercase) that resolve a free-text question to this series. */
  match: string[];
  /** A cadence this series is published at; silence longer than this is treated as stale, not as current. */
  cadenceDays: number;
};

const SERIES: Series[] = [
  {
    id: 432,
    key: 'selic',
    name: { en: 'Selic rate', pt: 'Taxa Selic' },
    unit: { en: '% per year', pt: '% ao ano' },
    href: {
      en: 'https://www.bcb.gov.br/en/monetarypolicy/taxasselic',
      pt: 'https://www.bcb.gov.br/controleinflacao/taxasselic',
    },
    match: ['selic', 'taxa selic', 'juros', 'juro', 'politica monetaria', 'interest rate'],
    cadenceDays: 10,
  },
  {
    id: 4189,
    key: 'selicAcumulada',
    name: { en: 'Selic rate, accumulated in the year', pt: 'Selic acumulada no ano' },
    unit: { en: '%', pt: '%' },
    href: {
      en: 'https://www.bcb.gov.br/en/monetarypolicy/taxasselic',
      pt: 'https://www.bcb.gov.br/controleinflacao/taxasselic',
    },
    match: ['selic acumulada', 'selic acumulada no ano'],
    cadenceDays: 10,
  },
  {
    id: 13522,
    key: 'ipca12',
    name: { en: 'IPCA, 12 months', pt: 'IPCA em 12 meses' },
    unit: { en: '%', pt: '%' },
    href: {
      en: 'https://www.bcb.gov.br/en/economia/inflacao',
      pt: 'https://www.bcb.gov.br/economia/inflacao',
    },
    match: ['ipca', 'ipca 12 meses', 'ipca em 12 meses', 'inflacao', 'inflacao anual'],
    cadenceDays: 75,
  },
  {
    id: 4380,
    key: 'ipcaAcumulado',
    name: { en: 'IPCA, accumulated', pt: 'IPCA acumulado' },
    unit: { en: 'index', pt: 'índice' },
    href: {
      en: 'https://www.bcb.gov.br/en/economia/inflacao',
      pt: 'https://www.bcb.gov.br/economia/inflacao',
    },
    match: ['ipca acumulado', 'ipca acumulado no ano'],
    cadenceDays: 75,
  },
  {
    id: 12,
    key: 'igpm',
    name: { en: 'IGPM, monthly', pt: 'IGPM mensal' },
    unit: { en: '%', pt: '%' },
    href: {
      en: 'https://www.bcb.gov.br/en/economia/igpm',
      pt: 'https://www.bcb.gov.br/economia/igpm',
    },
    match: ['igpm'],
    cadenceDays: 75,
  },
  {
    id: 1,
    key: 'dolar',
    name: { en: 'US dollar, PTAX sale rate', pt: 'Dólar comercial (PTAX venda)' },
    unit: { en: 'BRL', pt: 'R$' },
    href: {
      en: 'https://www.bcb.gov.br/en/estabilidadefinanceira/historicocotacoes',
      pt: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
    },
    match: ['dolar', 'dolar comercial', 'usd', 'cambio', 'ptax', 'exchange rate', 'real'],
    cadenceDays: 10,
  },
];

/** Accent-stripped, so "inflação" and "inflacao" match the same series. */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function resolve(query: string): Series | undefined {
  const q = fold(query);
  if (!q) return undefined;
  // Longest match first: "ipca acumulado" must not be swallowed by the bare "ipca".
  return SERIES.filter((s) => s.match.some((m) => q.includes(m))).sort(
    (a, b) => b.match.filter((m) => q.includes(m)).join('').length - a.match.filter((m) => q.includes(m)).join('').length,
  )[0];
}

/** SGS dates are dd/mm/yyyy. Returned as ISO so nothing downstream has to guess the order. */
function toIso(d: string): string | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim());
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

const daysBetween = (iso: string, today: string) =>
  Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);

const fmt = new Intl.DateTimeFormat('en-CA');
const todayIso = () => fmt.format(new Date());

type Point = { date: string; value: number };

/**
 * SGS publishes at most daily for these series, so the same figures serve a whole chat session. The cache
 * exists for two reasons: one turn can ask for the same series twice (the scripted answers read the figure
 * and then render the card), and SGS starts refusing connections under bursts — a cached hit is both faster
 * and kinder than a second request. Five minutes is short enough that nobody is ever shown a stale *cache*,
 * and the staleness guard below still judges the figure itself against its own cadence.
 */
const CACHE_MS = 5 * 60_000;

/**
 * A cached series plus how this call got it, so the card can say which one it is.
 * `fromCache` is a fact about the call, not a guess: a fresh fetch and a five-minute-old
 * one are different answers wearing the same badge if nobody says so.
 */
type CachedSeries = { at: number; points: Point[]; fromCache: boolean };
const cache = new Map<string, Omit<CachedSeries, 'fromCache'>>();
const inflight = new Map<string, Promise<CachedSeries>>();

async function loadSeries(s: Series, count: number): Promise<CachedSeries> {
  const key = `${s.id}:${count}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...hit, fromCache: true };
  const pending = inflight.get(key);
  if (pending) return pending;
  const run = fetchSeries(s, count)
    .then((points): CachedSeries => {
      const entry = { at: Date.now(), points };
      cache.set(key, entry);
      return { ...entry, fromCache: false };
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}

async function fetchSeries(s: Series, count: number): Promise<Point[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s.id}/dados/ultimos/${count}?formato=json`;
  let lastErr: unknown;
  // SGS throttles bursts, so one request in a row is not proof the series is unavailable. Retry before
  // giving up — but only to separate "busy" from "gone", never to paper over a failure with a number.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 400 * attempt));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`SGS answered ${res.status}`);
      // A retired series answers with an HTML error page and a 200, so the shape has to be checked, not the status.
      const body = await res.json();
      if (!Array.isArray(body)) throw new Error('SGS did not return a series');
      return body.flatMap((row: { data?: string; valor?: string }) => {
        const date = toIso(row.data ?? '');
        // SGS writes "." for a day the series did not publish.
        const value = Number((row.valor ?? '').replace(',', '.'));
        return date && Number.isFinite(value) ? [{ date, value }] : [];
      });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export const tools = {
  economiaSeries: tool({
    description:
      'Current Brazilian economic indicators straight from the Banco Central do Brasil (SGS): the Selic rate, IPCA and IGP inflation, the accumulated indices and the US dollar PTAX rate. Call it whenever someone asks what inflation is, what the Selic or the dollar is doing, or for any live macro figure. Never state one of these numbers from memory — the tool also says when a figure is stale or unavailable, and that answer is the one to give.',
    inputSchema: z.object({
      question: z.string().describe('What the person asked, e.g. "qual a taxa Selic agora?". Used to pick the series.'),
      count: z.number().int().min(2).max(24).optional().describe('How many observations to return for the trend. Defaults to 6.'),
      language: z.enum(['pt', 'en']).optional().describe('Language for the series names. Defaults to the turn locale.'),
    }),
    execute: async ({ question, count = 6, language = 'pt' }) => {
      const lang = language === 'en' ? 'en' : 'pt';
      const series = resolve(question);
      if (!series) {
        return {
          status: 'unknown-series' as const,
          available: SERIES.map((s) => ({ key: s.key, name: s.name[lang] })),
        };
      }
      // The authority and the dataset are stated by the tool, never by the model, so the
      // citation cannot drift from the fetch it describes.
      const source: BrazilToolSource = liveSource({
        title: `Banco Central do Brasil — ${series.name[lang]}`,
        url: series.href[lang],
        authority: 'Banco Central do Brasil',
        datasetId: `sgs-${series.id}`,
      });
      try {
        const { points, at, fromCache } = await loadSeries(series, count);
        source.fetchedAt = new Date(at).toISOString();
        source.fromCache = fromCache;
        if (points.length === 0) {
          return { status: 'unavailable' as const, series: series.key, name: series.name[lang], reason: 'The series returned no usable values.', sources: [source] };
        }
        const last = points[points.length - 1];
        const gap = daysBetween(last.date, todayIso());
        const stale = gap > series.cadenceDays;
        return {
          status: stale ? ('stale' as const) : ('ok' as const),
          series: series.key,
          name: series.name[lang],
          unit: series.unit[lang],
          latest: last,
          points,
          ...(stale ? { staleByDays: gap } : {}),
          sources: [source],
        };
      } catch (err) {
        // The honest outcome. A number that cannot be fetched is reported as missing, never estimated.
        return {
          status: 'unavailable' as const,
          series: series.key,
          name: series.name[lang],
          reason: err instanceof Error ? err.message : 'The Central Bank could not be reached.',
          sources: [source],
        };
      }
    },
  }),
} satisfies ToolSet;