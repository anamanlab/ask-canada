/**
 * Health establishments widget tool, Brazil pack: CNES (Cadastro Nacional de Estabelecimentos de Saúde).
 *
 * Source: OpenDataSUS / Ministério da Saúde — public API, no authentication required.
 * Endpoint: https://apidadosabertos.saude.gov.br/cnes/estabelecimentos
 *
 * Returns health establishments filtered by municipality, type, or name.
 * All data is aggregate/facility-level only — no patient data (LGPD compliant).
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource, type BrazilToolSource } from './source';

const CNES_BASE = 'https://apidadosabertos.saude.gov.br/cnes/estabelecimentos';
const CNES_CITE = 'https://opendatasus.saude.gov.br/dataset/cnes';

const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

type Establishment = {
  codigo: string;
  nome: string;
  tipo: string;
  municipio: { codigo: string; nome: string; uf: string };
  endereco: string;
  telefone?: string;
  horarioFuncionamento?: string;
  leitos?: number;
  cnes?: string;
};

const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; value: Establishment[] }>();

async function fetchEstablishments(params: URLSearchParams, signal?: AbortSignal): Promise<Establishment[]> {
  const key = params.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const url = `${CNES_BASE}?${params.toString()}`;
  const res = await fetch(url, { signal, headers: { accept: 'application/json' }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`CNES answered ${res.status}`);
  const data = await res.json();
  const establishments = (data.estabelecimentos ?? data ?? []) as Establishment[];
  cache.set(key, { at: Date.now(), value: establishments });
  return establishments;
}

function filterEstablishments(
  establishments: Establishment[],
  query: string,
  uf?: string,
  municipio?: string,
  tipo?: string
): Establishment[] {
  const q = fold(query);
  return establishments.filter((e) => {
    if (uf && e.municipio.uf.toUpperCase() !== uf.toUpperCase()) return false;
    if (municipio && !fold(e.municipio.nome).includes(fold(municipio))) return false;
    if (tipo && !fold(e.tipo).includes(fold(tipo))) return false;
    if (q && !fold(e.nome).includes(q) && !fold(e.tipo).includes(q)) return false;
    return true;
  });
}

export const tools = {
  cnesEstabelecimentos: tool({
    description:
      'Search Brazilian health establishments (CNES) by name, municipality, state (UF), or type. Returns facility details: name, type, address, phone, hours, and bed count. Use for "where is the nearest UPA/UBS/hospital", "health units in my city", etc. Source: Ministério da Saúde OpenDataSUS, public API.',
    inputSchema: z.object({
      query: z.string().min(1).max(160).describe('What to search for: name, type (UPA, UBS, hospital), or specialty.'),
      uf: z.string().length(2).optional().describe('State abbreviation (e.g., "SP", "RJ").'),
      municipio: z.string().optional().describe('Municipality name (e.g., "São Paulo", "Recife").'),
      tipo: z.string().optional().describe('Facility type: UPA, UBS, hospital, policlinica, etc.'),
      limit: z.number().int().min(1).max(20).optional().default(10).describe('Max results to return.'),
    }),
    execute: async ({ query, uf, municipio, tipo, limit = 10 }, { abortSignal }) => {
      const source: BrazilToolSource = liveSource({
        title: 'Ministério da Saúde — CNES (Cadastro Nacional de Estabelecimentos de Saúde)',
        url: CNES_CITE,
        authority: 'Ministério da Saúde',
        datasetId: 'cnes-estabelecimentos',
      });

      try {
        const params = new URLSearchParams({ limit: '100' });
        if (uf) params.set('uf', uf.toUpperCase());
        if (municipio) params.set('municipio', municipio);
        if (tipo) params.set('tipo', tipo);

        const establishments = await fetchEstablishments(params, abortSignal);
        const filtered = filterEstablishments(establishments, query, uf, municipio, tipo).slice(0, limit);

        source.fetchedAt = new Date().toISOString();

        if (!filtered.length) {
          return {
            status: 'not-found' as const,
            query,
            filters: { uf, municipio, tipo },
            message: 'Nenhum estabelecimento encontrado com esses critérios.',
            sources: [source],
          };
        }

        return {
          status: 'ok' as const,
          query,
          count: filtered.length,
          establishments: filtered.map((e) => ({
            codigo: e.codigo,
            nome: e.nome,
            tipo: e.tipo,
            municipio: e.municipio.nome,
            uf: e.municipio.uf,
            endereco: e.endereco,
            telefone: e.telefone,
            horarioFuncionamento: e.horarioFuncionamento,
            leitos: e.leitos,
          })),
          sources: [source],
        };
      } catch (err) {
        return {
          status: 'unavailable' as const,
          query,
          reason: err instanceof Error ? err.message : 'O CNES não pôde ser consultado agora.',
          sources: [source],
        };
      }
    },
  }),
} satisfies ToolSet;