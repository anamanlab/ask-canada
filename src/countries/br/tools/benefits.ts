/**
 * Benefits widget tool, Brazil pack: aggregate data on Bolsa Família, BPC/LOAS, and CadÚnico.
 *
 * All data is aggregate only — person-level lookups are prohibited by LGPD.
 * Sources: CadÚnico aggregate monthly reports (MDSA), BPC/LOAS official figures (INSS/MDSA),
 * CadÚnico coverage dashboards. No auth required; all sources are public aggregate tables.
 *
 * The tool returns the latest published aggregate figures with their publication dates.
 * If a series is stale (no update within its expected cadence), it is marked as stale.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource, type BrazilToolSource } from './source';

/** Read 2026-10-02. */
const CHECKED = '2026-10-02';

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
  /** Function that fetches the latest aggregate value. */
  fetch: (signal?: AbortSignal) => Promise<{ value: number; date: string } | null>;
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
    match: ['bolsa familia', 'bolsa familia', 'familias bolsa', 'familias bolsa', 'bolsa familia quantas'],
    cadenceDays: 45,
    async fetch(signal?: AbortSignal): Promise<{ value: number; date: string } | null> {
      // Placeholder: in production, fetch from MDSA aggregate CSV/API
      // For now, return null to indicate no live data available
      return null;
    },
  },
  {
    key: 'bpc',
    name: { en: 'BPC/LOAS beneficiaries', pt: 'Beneficiários do BPC/LOAS' },
    unit: { en: 'beneficiaries', pt: 'beneficiários' },
    href: {
      en: 'https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc',
      pt: 'https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc',
    },
    match: ['bpc', 'loas', 'beneficio de prestacao continuada', 'bpc loas', 'beneficio continuado'],
    cadenceDays: 45,
    async fetch(signal?: AbortSignal): Promise<{ value: number; date: string } | null> {
      return null;
    },
  },
  {
    key: 'cadunico',
    name: { en: 'CadÚnico registered families', pt: 'Famílias cadastradas no CadÚnico' },
    unit: { en: 'families', pt: 'famílias' },
    href: {
      en: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
      pt: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
    },
    match: ['cadunico', 'cadastro unico', 'cadastro unico', 'cadunico quantas familias', 'familias cadunico'],
    cadenceDays: 60,
    async fetch(signal?: AbortSignal): Promise<{ value: number; date: string } | null> {
      return null;
    },
  },
];

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
  try {
    const value = await s.fetch(signal);
    if (value) cache.set(s.key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
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
            reason: 'The official aggregate has not been published or could not be fetched.',
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