/**
 * ANVISA medicine registration widget tool, Brazil pack.
 *
 * Source: ANVISA public search + open data -- registered medicines, active substances, registration holders.
 * Endpoints:
 *   - Public search: https://consultas.anvisa.gov.br/api/medicamentos (or similar)
 *   - Open data: https://dados.gov.br/dados/organization/anvisa (CSV downloads)
 *
 * Returns registration details for a medicine by name or active substance.
 * All data is public regulatory information -- no patient data.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource, type BrazilToolSource } from './source';

const ANVISA_SEARCH_BASE = 'https://consultas.anvisa.gov.br/api/medicamentos';
const ANVISA_CITE = 'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos';

const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

type Medicine = {
  registro: string;
  produto: string;
  principioAtivo: string;
  categoria: string;
  classeTerapeutica?: string;
  apresentacao: string;
  empresa: string;
  cnpjEmpresa: string;
  situacao: string;
  vencimentoRegistro?: string;
};

const CACHE_MS = 30 * 60_000;
const cache = new Map<string, { at: number; value: Medicine[] }>();

async function fetchMedicines(params: URLSearchParams, signal?: AbortSignal): Promise<Medicine[]> {
  const key = params.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const url = `${ANVISA_SEARCH_BASE}?${params.toString()}`;
  const res = await fetch(url, { signal, headers: { accept: 'application/json' }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ANVISA answered ${res.status}`);
  const data = await res.json();
  const medicines = (data.medicamentos ?? data ?? []) as Medicine[];
  cache.set(key, { at: Date.now(), value: medicines });
  return medicines;
}

function filterMedicines(medicines: Medicine[], query: string): Medicine[] {
  const q = fold(query);
  return medicines.filter((m) =>
    fold(m.produto).includes(q) ||
    fold(m.principioAtivo).includes(q) ||
    fold(m.empresa).includes(q) ||
    m.registro.includes(q)
  );
}

export const tools = {
  anvisaMedicamento: tool({
    description:
      'Search registered medicines in ANVISA (Brazil health regulatory agency). Returns registration number, product name, active substance, therapeutic class, presentation, manufacturer, and registration status. Use for "is this medicine registered", "who makes this drug", "what is the active ingredient". Source: ANVISA public data.',
    inputSchema: z.object({
      query: z.string().min(1).max(160).describe('Medicine name, active substance, or registration number.'),
      limit: z.number().int().min(1).max(20).optional().default(10).describe('Max results to return.'),
    }),
    execute: async ({ query, limit = 10 }, { abortSignal }) => {
      const source: BrazilToolSource = liveSource({
        title: 'ANVISA -- Medicamentos Registrados',
        url: ANVISA_CITE,
        authority: 'Agencia Nacional de Vigilancia Sanitaria',
        datasetId: 'anvisa-medicamentos',
      });

      try {
        const params = new URLSearchParams({ limit: '100', query });
        const medicines = await fetchMedicines(params, abortSignal);
        const filtered = filterMedicines(medicines, query).slice(0, limit);

        source.fetchedAt = new Date().toISOString();

        if (!filtered.length) {
          return {
            status: 'not-found' as const,
            query,
            message: 'Nenhum medicamento encontrado com esse nome ou principio ativo.',
            sources: [source],
          };
        }

        return {
          status: 'ok' as const,
          query,
          count: filtered.length,
          medicines: filtered.map((m) => ({
            registro: m.registro,
            produto: m.produto,
            principioAtivo: m.principioAtivo,
            categoria: m.categoria,
            classeTerapeutica: m.classeTerapeutica,
            apresentacao: m.apresentacao,
            empresa: m.empresa,
            cnpjEmpresa: m.cnpjEmpresa,
            situacao: m.situacao,
            vencimentoRegistro: m.vencimentoRegistro,
          })),
          sources: [source],
        };
      } catch (err) {
        return {
          status: 'unavailable' as const,
          query,
          reason: err instanceof Error ? err.message : 'A ANVISA nao pode ser consultada agora.',
          sources: [source],
        };
      }
    },
  }),
} satisfies ToolSet;