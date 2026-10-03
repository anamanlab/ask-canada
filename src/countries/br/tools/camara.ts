/**
 * The Chamber of Deputies, as data. Source: the Câmara's Dados Abertos API — open,
 * keyless, and the authority for who sits in the Chamber, what they proposed, where it
 * stands and how it was voted.
 *
 * Two tools, matching the two questions people actually ask: "who is this deputy" and
 * "where does this bill stand". A proposal answer carries its latest tramitação and its
 * last vote with the placar, because "em que fase está" without the last movement is not
 * an answer, and a vote without the numbers is gossip.
 *
 * Neutrality is a load-bearing requirement here, not a nicety (docs/brazil_plans.md §10):
 * these tools return facts — names, parties, status, counts — and nothing that ranks a
 * politician, endorses one, or tells anyone whom to support. The widget draws the same
 * line: a deputy card shows the mandate, never an assessment.
 *
 * Cache by volatility (§15: legislative status gets the shorter cache). Deputies change
 * with elections, so an hour; a bill's status can move in a day, so ten minutes.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { liveSource } from './source';

const BASE = 'https://dadosabertos.camara.leg.br/api/v2';
const CITE_DEPUTADOS = 'https://www.camara.leg.br/deputados';
const CITE_PROPOSICOES = 'https://www.camara.leg.br/proposicoesWeb/propSearch.do?conta=1';

const AUTHORITY = 'Câmara dos Deputados';

const fetchJson = async (url: string, timeoutMs = 12_000): Promise<unknown> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Câmara answered ${res.status}`);
  return res.json();
};

/** A list endpoint (`/deputados?`, `/proposicoes?`, `/tramitacoes`, `/votacoes`). */
const getList = async <T,>(url: string): Promise<{ dados: T[] }> => {
  const body = (await fetchJson(url)) as { dados?: unknown };
  if (!body || !Array.isArray(body.dados)) throw new Error('Câmara did not return a list');
  return body as { dados: T[] };
};

/**
 * A detail endpoint (`/deputados/{id}`, `/proposicoes/{id}`). Returns one object, not a
 * list — using the list reader here is how the first version of this tool reported every
 * deputy as missing while the search named them correctly.
 */
const getOne = async <T,>(url: string): Promise<{ dados: T }> => {
  const body = (await fetchJson(url)) as { dados?: unknown };
  if (!body || typeof body.dados !== 'object' || Array.isArray(body.dados)) {
    throw new Error('Câmara did not return a record');
  }
  return body as { dados: T };
};

/** Ten minutes for status, an hour for people — see the module note. */
const CACHE_MS = { status: 10 * 60_000, people: 60 * 60_000 };
const cache = new Map<string, { at: number; ttl: number; value: unknown }>();
async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<{ value: T; fromCache: boolean }> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return { value: hit.value as T, fromCache: true };
  const value = await load();
  cache.set(key, { at: Date.now(), ttl, value });
  return { value, fromCache: false };
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

type Deputy = {
  id: number;
  name: string;
  ballotName: string;
  party: string;
  state: string;
  photo?: string;
  email?: string;
  office?: string;
  legislature?: number;
};

async function deputyDetail(id: number): Promise<Deputy> {
  const body = await getOne<Record<string, unknown>>(`${BASE}/deputados/${id}`);
  const d = body.dados as {
    id: number;
    nomeCivil: string;
    ultimoStatus: {
      nome: string;
      nomeEleitoral: string;
      siglaPartido: string;
      siglaUf: string;
      urlFoto?: string;
      email?: string;
      gabinete?: { nome?: string };
      idLegislatura?: number;
    };
  };
  const st = d.ultimoStatus;
  return {
    id: d.id,
    name: d.nomeCivil,
    ballotName: st.nomeEleitoral || st.nome,
    party: st.siglaPartido,
    state: st.siglaUf,
    photo: st.urlFoto,
    email: st.email || undefined,
    office: st.gabinete?.nome ? `Gabinete ${st.gabinete.nome}` : undefined,
    legislature: st.idLegislatura,
  };
}

type Proposal = {
  id: number;
  type: string;
  number: number;
  year: number;
  title: string;
  presentedAt?: string;
  status?: string;
  statusAt?: string;
  organ?: string;
  movements: { at: string; organ: string; description: string }[];
  lastVote?: { at: string; organ: string; description: string; approved?: boolean; yes?: number; no?: number; abstentions?: number };
};

async function proposalDetail(id: number): Promise<Proposal> {
  const body = await getOne<Record<string, unknown>>(`${BASE}/proposicoes/${id}`);
  const d = body.dados as {
    id: number;
    siglaTipo: string;
    numero: number;
    ano: number;
    ementa: string;
    dataApresentacao?: string;
    statusProposicao?: { descricaoSituacao?: string; dataHora?: string; siglaOrgao?: string };
  };
  const st = d.statusProposicao ?? {};
  const [moves, votes] = await Promise.all([
    getList<{ dataHora: string; siglaOrgao: string; descricaoTramitacao: string }>(`${BASE}/proposicoes/${id}/tramitacoes`),
    getList<{ id: string; data: string; siglaOrgao: string; descricao: string; aprovacao?: number }>(`${BASE}/proposicoes/${id}/votacoes`),
  ]);
  const movements = (moves.dados ?? [])
    .slice(-3)
    .reverse()
    .map((m) => ({ at: (m.dataHora ?? '').slice(0, 10), organ: m.siglaOrgao, description: m.descricaoTramitacao }));
  let lastVote: Proposal['lastVote'];
  const latest = (votes.dados ?? [])[0];
  if (latest) {
    lastVote = { at: latest.data, organ: latest.siglaOrgao, description: latest.descricao, approved: latest.aprovacao === 1 };
    // The placar lives on the votação itself. One more fetch, because a vote without its
    // numbers is the difference between informing and insinuating.
    try {
      // Nominal votes live under `/votos`, not on the votação itself — and a symbolic
      // vote has none at all, which is a complete answer rather than a missing one.
      const nominal = await getList<{ tipoVoto?: string; voto?: string }>(`${BASE}/votacoes/${latest.id}/votos`);
      const tally = { sim: 0, nao: 0, abstencao: 0, other: 0 };
      for (const v of nominal.dados ?? []) {
        const vote = fold(v.tipoVoto ?? v.voto ?? '');
        if (vote.startsWith('sim')) tally.sim++;
        else if (vote.startsWith('nao')) tally.nao++;
        else if (vote.includes('abst')) tally.abstencao++;
        else if (vote) tally.other++;
      }
      if (tally.sim + tally.nao + tally.abstencao > 0) {
        lastVote = { ...lastVote, yes: tally.sim, no: tally.nao, abstentions: tally.abstencao };
      }
    } catch {
      // A missing placar must not sink the status: the vote happened, its numbers are pending.
    }
  }
  return {
    id: d.id,
    type: d.siglaTipo,
    number: d.numero,
    year: d.ano,
    title: d.ementa,
    presentedAt: (d.dataApresentacao ?? '').slice(0, 10) || undefined,
    status: st.descricaoSituacao,
    statusAt: (st.dataHora ?? '').slice(0, 10) || undefined,
    organ: st.siglaOrgao,
    movements,
    lastVote,
  };
}

export const tools = {
  camaraDeputado: tool({
    description:
      'Find a Brazilian federal deputy: name, party, state, office and contacts, from the Câmara dos Deputados open data. Call it when someone asks who a deputy is, which party or state they are from, or how to contact them. Descriptive and factual only — never rank deputies, compare them, or advise whom to support.',
    inputSchema: z.object({
      nome: z.string().describe('Deputy name or fragment, e.g. "Tiririca", "Maria do Rosário".'),
      uf: z.string().length(2).optional().describe('State abbreviation to disambiguate, e.g. "SP".'),
      partido: z.string().optional().describe('Party abbreviation, e.g. "PT".'),
      limit: z.number().int().min(1).max(5).optional().describe('How many matches to return. Defaults to 3.'),
    }),
    execute: async ({ nome, uf, partido, limit = 3 }) => {
      const params = new URLSearchParams({ itens: String(Math.max(limit, 3)) });
      if (nome) params.set('nome', nome);
      if (uf) params.set('siglaUf', uf.toUpperCase());
      if (partido) params.set('siglaPartido', partido.toUpperCase());
      const source = liveSource({
        title: 'Câmara dos Deputados — Dados Abertos',
        url: CITE_DEPUTADOS,
        authority: AUTHORITY,
        datasetId: 'dados-abertos-deputados',
      });
      try {
        const { value: list, fromCache } = await cached(`dep:${params.toString()}`, CACHE_MS.people, () =>
          getList<{ id: number }>(`${BASE}/deputados?${params.toString()}`),
        );
        const ids = (list.dados ?? []).slice(0, limit).map((d) => d.id);
        const deputies = await Promise.all(
          ids.map((id) =>
            cached(`dep:${id}`, CACHE_MS.people, () => deputyDetail(id)).then((r) => r.value),
          ),
        );
        source.fromCache = fromCache;
        return { query: nome, matches: deputies, sources: [source] };
      } catch (err) {
        return {
          query: nome,
          matches: [],
          reason: err instanceof Error ? err.message : 'The Câmara could not be reached.',
          sources: [source],
        };
      }
    },
  }),

  camaraProposicao: tool({
    description:
      'Follow a bill in the Câmara dos Deputados: what it proposes, its current status, the latest movements and the last vote with its numbers. Call it for "em que fase está", "o que diz", "como foi votado" and any PL/PEC/MP question. Descriptive and factual only — report the status and the placar, never predict the outcome or advise a position.',
    inputSchema: z.object({
      busca: z.string().optional().describe('Free text: "PL 1051/2026", "fake news", "reforma tributária". A type/number/year in the text is read directly.'),
      tipo: z.string().optional().describe('Proposal type, e.g. "PL", "PEC", "MPV".'),
      numero: z.number().int().optional().describe('Proposal number.'),
      ano: z.number().int().optional().describe('Proposal year.'),
      limit: z.number().int().min(1).max(3).optional().describe('How many proposals to return. Defaults to 1.'),
    }),
    execute: async ({ busca = '', tipo, numero, ano, limit = 1 }) => {
      const source = liveSource({
        title: 'Câmara dos Deputados — Proposições',
        url: CITE_PROPOSICOES,
        authority: AUTHORITY,
        datasetId: 'dados-abertos-proposicoes',
      });
      // "PL 1051/2026" inside free text is a reference, not a keyword: read it as one.
      const ref = /([A-Z]{2,4})\s*0*(\d+)\s*\/\s*(\d{4})/i.exec(busca);
      const t = (tipo ?? ref?.[1] ?? '').toUpperCase();
      const n = numero ?? (ref ? Number(ref[2]) : undefined);
      const y = ano ?? (ref ? Number(ref[3]) : undefined);
      try {
        let ids: number[];
        if (t && n && y) {
          const { value, fromCache } = await cached(`prop:${t}:${n}:${y}`, CACHE_MS.status, () =>
            getList<{ id: number }>(`${BASE}/proposicoes?siglaTipo=${t}&numero=${n}&ano=${y}&itens=2`),
          );
          source.fromCache = fromCache;
          ids = (value.dados ?? []).slice(0, limit).map((d) => d.id);
        } else {
          const params = new URLSearchParams({ itens: '5' });
          if (t) params.set('siglaTipo', t);
          if (y) params.set('ano', String(y));
          const keywords = busca.replace(/([A-Z]{2,4})\s*0*(\d+)\s*\/\s*(\d{4})/gi, ' ').trim() || busca;
          if (keywords && !t && !y) params.set('keywords', keywords);
          const { value, fromCache } = await cached(`prop:q:${params.toString()}`, CACHE_MS.status, () =>
            getList<{ id: number }>(`${BASE}/proposicoes?${params.toString()}`),
          );
          source.fromCache = fromCache;
          ids = (value.dados ?? []).slice(0, limit).map((d) => d.id);
        }
        const proposals = await Promise.all(
          ids.map((id) => cached(`prop:${id}`, CACHE_MS.status, () => proposalDetail(id)).then((r) => r.value)),
        );
        return { query: busca || `${t} ${n}/${y}`, proposals, sources: [source] };
      } catch (err) {
        return {
          query: busca,
          proposals: [],
          reason: err instanceof Error ? err.message : 'The Câmara could not be reached.',
          sources: [source],
        };
      }
    },
  }),
} satisfies ToolSet;