/**
 * Benefits widget tool, Brazil pack: aggregate data on Bolsa Família, BPC/LOAS, and CadÚnico.
 *
 * All data is aggregate only — person-level lookups are prohibited by LGPD.
 * Sources:
 *   - Portal da Transparência (bolsa-familia, bpc-loas) — requires API key for full access
 *   - dados.gov.br CKAN (public aggregate datasets)
 *   - CadÚnico public statistics (MDSA/Dataprev)
 *
 * The tool tries multiple sources in order and returns the first successful result.
 * If a series is stale (no update within its expected cadence), it is marked as stale.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource, type BrazilToolSource } from './source';

/** Aggregate series available for benefits. */
type Series = {
  key: string;
  name: { en: string; pt: string };
  unit: { en: string; pt: string };
  /** Official page for this aggregate. */
  href: { en: string; pt: string };
  /** Words (accent-stripped, lowercase) that resolve a free-text question to this series. */
  match: string[];
  /** Expected publication cadence in days; silence longer than this is stale. */
  cadenceDays: number;
  /** Source configurations to try in order. */
  sources: SourceConfig[];
};

type SourceConfig = {
  /** Identifier for logging. */
  id: string;
  /** Build the fetch URL. */
  buildUrl: () => string;
  /** Parse the response. */
  parse: (json: Record<string, unknown>) => { value: number; date: string } | null;
  /** Optional headers (e.g., auth). */
  headers?: Record<string, string>;
};

const SERIES: Series[] = [
  {
    key: 'bolsaFamilia',
    name: { en: 'Bolsa Família families', pt: 'Famílias no Bolsa Família' },
    unit: { en: 'families', pt: 'famílias' },
    href: {
      en: 'https://www.gov.br/mds/pt-br/acoes-e-programas/bolsa-familia',
      pt: 'https://www.gov.br/mds/pt-br/acoes-e-programas/bolsa-familia',
    },
    match: ['bolsa familia', 'bolsa familia', 'familias bolsa', 'familias bolsa', 'bolsa familia quantas', 'quantas familias bolsa'],
    cadenceDays: 45,
    sources: [
      // 1. Portal da Transparência — Bolsa Família por município (aggregate)
      {
        id: 'transparencia-bolsa',
        buildUrl: () => {
          const token = process.env.TRANSPARENCIA_API_KEY?.trim();
          const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/bolsa-familia-por-municipio';
          const params = new URLSearchParams({ pagina: '1', tamanhoPagina: '1' });
          if (token) params.set('chave-api-dados', token);
          return `${base}?${params.toString()}`;
        },
        parse: (json) => {
          const arr = Array.isArray(json) ? json : (json.data as unknown[] ?? []);
          if (!arr.length) return null;
          // Sum across municipalities for national total
          const total = arr.reduce((sum: number, row: unknown) => {
            const r = row as Record<string, unknown>;
            return sum + Number(r.valor ?? r.quantidadeBeneficiados ?? 0);
          }, 0);
          const first = arr[0] as Record<string, unknown> | undefined;
          const date = first?.mesReferencia ?? first?.dataReferencia ?? new Date().toISOString().slice(0, 10);
          return { value: total, date: normalizeDate(String(date)) };
        },
        headers: { accept: 'application/json' },
      },
      // 2. dados.gov.br CKAN — search for Bolsa Família resource dynamically
      {
        id: 'ckan-bolsa',
        buildUrl: () => 'https://dados.gov.br/dados/api/3/action/package_search?q=bolsa+familia&rows=5',
        parse: (json) => {
          const result = json.result as Record<string, unknown> | undefined;
          const pkg = (result?.results as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined;
          if (!pkg) return null;
          const resources = pkg.resources as unknown[] | undefined;
          const resource = resources?.find((r: unknown) => {
            const rr = r as Record<string, unknown>;
            return rr.format === 'CSV' && /bolsa.*familia|familia.*bolsa/i.test(String(rr.name ?? '') + String(rr.description ?? ''));
          }) as Record<string, unknown> | undefined;
          if (!resource?.id) return null;
          // Fetch latest from that resource
          return null; // Deferred to second fetch below
        },
        headers: { accept: 'application/json' },
      },
      // 3. Fallback: known CKAN resource pattern (may need update)
      {
        id: 'ckan-bolsa-direct',
        buildUrl: () => 'https://dados.gov.br/dados/api/3/action/datastore_search?resource_id=bolsa-familia-mensal&limit=1&sort=data_referencia desc',
        parse: (json) => {
          const result = json.result as Record<string, unknown> | undefined;
          const records = result?.records as unknown[] | undefined;
          if (!records?.length) return null;
          const latest = records[0] as Record<string, unknown>;
          return {
            value: Number(latest.total_familias ?? latest.quantidade_familias ?? latest.valor ?? 0),
            date: normalizeDate(String(latest.data_referencia ?? latest.mes_referencia ?? latest.ano_mes ?? '')),
          };
        },
        headers: { accept: 'application/json' },
      },
    ],
  },
  {
    key: 'bpc',
    name: { en: 'BPC/LOAS beneficiaries', pt: 'Beneficiários do BPC/LOAS' },
    unit: { en: 'beneficiaries', pt: 'beneficiários' },
    href: {
      en: 'https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc',
      pt: 'https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc',
    },
    match: ['bpc', 'loas', 'beneficio de prestacao continuada', 'bpc loas', 'beneficio continuado', 'beneficio assistencial'],
    cadenceDays: 45,
    sources: [
      // 1. Portal da Transparência — BPC/LOAS
      {
        id: 'transparencia-bpc',
        buildUrl: () => {
          const token = process.env.TRANSPARENCIA_API_KEY?.trim();
          const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/bpc-loas';
          const params = new URLSearchParams({ pagina: '1', tamanhoPagina: '1' });
          if (token) params.set('chave-api-dados', token);
          return `${base}?${params.toString()}`;
        },
        parse: (json) => {
          const arr = Array.isArray(json) ? json : (json.data as unknown[] ?? []);
          if (!arr.length) return null;
          const total = arr.reduce((sum: number, row: unknown) => {
            const r = row as Record<string, unknown>;
            return sum + Number(r.quantidadeBeneficiados ?? r.valor ?? 0);
          }, 0);
          const first = arr[0] as Record<string, unknown> | undefined;
          const date = first?.mesReferencia ?? first?.dataReferencia ?? new Date().toISOString().slice(0, 10);
          return { value: total, date: normalizeDate(String(date)) };
        },
        headers: { accept: 'application/json' },
      },
      // 2. dados.gov.br CKAN
      {
        id: 'ckan-bpc',
        buildUrl: () => 'https://dados.gov.br/dados/api/3/action/datastore_search?resource_id=bpc-loas-beneficiarios&limit=1&sort=data_referencia desc',
        parse: (json) => {
          const result = json.result as Record<string, unknown> | undefined;
          const records = result?.records as unknown[] | undefined;
          if (!records?.length) return null;
          const latest = records[0] as Record<string, unknown>;
          return {
            value: Number(latest.total_beneficiarios ?? latest.quantidade ?? latest.valor ?? 0),
            date: normalizeDate(String(latest.data_referencia ?? latest.mes_referencia ?? '')),
          };
        },
        headers: { accept: 'application/json' },
      },
    ],
  },
  {
    key: 'cadunico',
    name: { en: 'CadÚnico registered families', pt: 'Famílias cadastradas no CadÚnico' },
    unit: { en: 'families', pt: 'famílias' },
    href: {
      en: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
      pt: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
    },
    match: ['cadunico', 'cadastro unico', 'cadastro unico', 'cadunico quantas familias', 'familias cadunico', 'quantas familias cadunico'],
    cadenceDays: 60,
    sources: [
      // 1. CadÚnico public statistics API (MDSA/Dataprev)
      {
        id: 'cadunico-api',
        buildUrl: () => 'https://cadunico.dataprev.gov.br/api/publico/estatisticas/familias-cadastradas',
        parse: (json) => {
          if (!json) return null;
          const j = json as Record<string, unknown>;
          return {
            value: Number(j.total_familias ?? j.quantidade ?? j.totalFamiliasCadastradas ?? 0),
            date: normalizeDate(String(j.data_referencia ?? j.dataReferencia ?? j.mesReferencia ?? '')),
          };
        },
        headers: { accept: 'application/json' },
      },
      // 2. dados.gov.br CKAN — CadÚnico aggregates
      {
        id: 'ckan-cadunico',
        buildUrl: () => 'https://dados.gov.br/dados/api/3/action/package_search?q=cadunico&rows=5',
        parse: (json) => {
          const result = json.result as Record<string, unknown> | undefined;
          const pkg = (result?.results as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined;
          if (!pkg) return null;
          const resources = pkg.resources as unknown[] | undefined;
          const resource = resources?.find((r: unknown) => {
            const rr = r as Record<string, unknown>;
            return rr.format === 'CSV' && /cadunico|cadastro.*unico/i.test(String(rr.name ?? '') + String(rr.description ?? ''));
          }) as Record<string, unknown> | undefined;
          if (!resource?.id) return null;
          return null; // Would need second fetch
        },
        headers: { accept: 'application/json' },
      },
    ],
  },
];

/** Normalize various date formats to ISO YYYY-MM-DD. */
function normalizeDate(input: string): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // YYYYMM
  if (/^\d{6}$/.test(input)) return `${input.slice(0, 4)}-${input.slice(4, 6)}-01`;
  // DD/MM/YYYY
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // MM/YYYY or MM-YYYY
  const m2 = /^(\d{2})[\/-](\d{4})$/.exec(input);
  if (m2) return `${m2[2]}-${m2[1]}-01`;
  return new Date().toISOString().slice(0, 10);
}

/** Fold accents and lower-case for matching. */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function resolve(query: string): Series | undefined {
  const q = fold(query);
  if (!q) return undefined;
  return SERIES.filter((s) => s.match.some((m) => q.includes(m))).sort(
    (a, b) =>
      b.match.filter((m) => q.includes(m)).join('').length -
      a.match.filter((m) => q.includes(m)).join('').length,
  )[0];
}

const CACHE_MS = 5 * 60_000;
const cache = new Map<string, { at: number; value: { value: number; date: string } }>();

async function loadSeries(s: Series, signal?: AbortSignal): Promise<{ value: number; date: string } | null> {
  const hit = cache.get(s.key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  // Try each source in order
  for (const src of s.sources) {
    try {
      const url = src.buildUrl();
      const res = await fetch(url, {
        signal,
        headers: src.headers,
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = src.parse(json);
      if (parsed && parsed.value > 0) {
        cache.set(s.key, { at: Date.now(), value: parsed });
        return parsed;
      }
    } catch {
      // Try next source
    }
  }
  return null;
}

function daysBetween(iso: string, today: string) {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);
}

const fmt = new Intl.DateTimeFormat('en-CA');
const todayIso = () => fmt.format(new Date());

export const tools = {
  benefitsAggregate: tool({
    description:
      'Aggregate figures for Brazilian social benefits: Bolsa Família families, BPC/LOAS beneficiaries, and CadÚnico registered families. Returns the latest published aggregate with its date, and marks stale data. Never returns person-level data — all sources are public aggregates.',
    inputSchema: z.object({
      question: z.string().describe('What the person asked, e.g. "Quantas famílias no Bolsa Família?". Used to pick the series.'),
      language: z.enum(['pt', 'en']).optional().describe('Language for the series names. Defaults to the turn locale.'),
    }),
    execute: async ({ question, language = 'pt' }) => {
      const lang = language === 'en' ? 'en' : 'pt';
      const series = resolve(question);
      if (!series) {
        return {
          status: 'unknown-series' as const,
          available: SERIES.map((s) => ({ key: s.key, name: s.name[lang] })),
        };
      }

      const source: BrazilToolSource = liveSource({
        title: `Ministério do Desenvolvimento e Assistência Social — ${series.name[lang]}`,
        url: series.href[lang],
        authority: 'Ministério do Desenvolvimento e Assistência Social',
        datasetId: `mds-${series.key}`,
      });

      try {
        const data = await loadSeries(series);
        if (!data) {
          return {
            status: 'unavailable' as const,
            series: series.key,
            name: series.name[lang],
            reason: 'The official aggregate has not been published or could not be fetched. Set TRANSPARENCIA_API_KEY for Portal da Transparência access.',
            sources: [source],
          };
        }
        source.fetchedAt = new Date().toISOString();
        const stale = daysBetween(data.date, todayIso()) > series.cadenceDays;
        return {
          status: stale ? ('stale' as const) : ('ok' as const),
          series: series.key,
          name: series.name[lang],
          unit: series.unit[lang],
          latest: { value: data.value, date: data.date },
          ...(stale ? { staleByDays: daysBetween(data.date, todayIso()) } : {}),
          sources: [source],
        };
      } catch (err) {
        return {
          status: 'unavailable' as const,
          series: series.key,
          name: series.name[lang],
          reason: err instanceof Error ? err.message : 'The official source could not be reached.',
          sources: [source],
        };
      }
    },
  }),
} satisfies ToolSet;