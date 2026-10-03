/**
 * Brazilian place names, normalised to the codes the entire public sector actually uses.
 *
 * Every federal form, transfer, benefit record and open dataset keys on the 7-digit IBGE municipality
 * code, so "the city" is not a name but a number. This tool turns what a person says — "São Paulo",
 * "Manaus", "Florianópolis SC", or a code they already have — into that number, with the state and region.
 *
 * Two IBGE endpoints, and the state is deliberately *not* taken from the municipality list. That endpoint's
 * response shape varies between requests: one call returned the full hierarchy (state and region nested under
 * `mesorregiao`), the next returned only `{id, nome, microrregiao, regiao-imediata}` — the state simply gone.
 * Reading it from there would make this tool wrong at random. The state is instead derived from the code
 * itself, because that is what the code means: IBGE municipality codes begin with the state's own code, and
 * all 5,571 codes satisfy that. The 27 states come from `/estados`, which is small and consistently complete.
 *
 * Both lists are fetched once per server process and kept in memory (~3 MB). No build step, no generated file
 * to drift. Names are matched accent-insensitively, because people type "Sao Paulo" and Brazil writes "São Paulo".
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { referenceSource, type BrazilToolSource } from './source';

const MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const CITE_URL = 'https://www.ibge.gov.br/cidades-e-estados';

type Municipality = { id: number; nome: string; 'regiao-imediata'?: { id: number; nome: string } };
type State = { id: number; sigla: string; nome: string; regiao?: { sigla: string; nome: string } };

/** IBGE publishes Portuguese names only. There is no official English form, so `en` repeats `pt`. */
const bothWays = (s: string) => ({ pt: s, en: s });

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const getJson = async <T,>(url: string, timeoutMs: number): Promise<T> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return (await res.json()) as T;
};

type Data = { municipios: Municipality[]; byCode: Map<string, State>; fetchedAt: number };
let cache: Promise<Data> | undefined;

function load() {
  cache ??= (async (): Promise<Data> => {
    const [municipios, estados] = await Promise.all([getJson<Municipality[]>(MUNICIPIOS_URL, 20_000), getJson<State[]>(ESTADOS_URL, 20_000)]);
    if (!Array.isArray(municipios) || !Array.isArray(estados)) throw new Error('IBGE did not return its lists');
    return { municipios, byCode: new Map(estados.map((s) => [String(s.id), s])), fetchedAt: Date.now() };
  })().catch((err) => {
    // Do not cache a failure: the next question should try again.
    cache = undefined;
    throw err;
  });
  return cache;
}

/** The answer when the question was about a state, not a city. */
type StateAnswer = {
  sigla: string;
  name: { pt: string; en: string };
  region: { sigla: string; name: { pt: string; en: string } };
  /** How many municipalities the state has, per IBGE. */
  count: number;
  /** A short alphabetical sample, clearly labelled as such. */
  sample: { name: { pt: string; en: string }; code: string }[];
};

/**
 * Score every municipality against a name query. An exact name is only an exact name
 * within the state the person named, which is what stops "Belém" being three answers of
 * equal weight when they said "Belém PA".
 */
function scoreMunicipalities(
  nameQuery: string,
  ufFilter: string | undefined,
  municipios: Municipality[],
  byCode: Map<string, State>,
) {
  return municipios
    .map((x) => {
      const nome = fold(x.nome);
      const state = byCode.get(String(x.id).slice(0, 2));
      let score = nome === nameQuery ? 100 : nome.startsWith(nameQuery) ? 70 : nome.includes(nameQuery) ? 40 : 0;
      if (score && !ufFilter) score += 1;
      if (score && ufFilter && state && state.sigla !== ufFilter) score -= 50;
      return { x, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (a.x.nome < b.x.nome ? -1 : 1));
}

/**
 * Recognise a question that is about a state, and answer it.
 *
 * Two forms: the bare state ("Pernambuco", "PE") and the phrasing people actually use
 * ("which municipalities exist in Pernambuco", "municipios de Pernambuco"). Anything else —
 * including a city that happens to share a name with a state — falls through to the
 * municipality lookup, which is the right tool for it.
 */
async function stateAnswer(
  q: string,
  municipios: Municipality[],
  byCode: Map<string, State>,
): Promise<StateAnswer | undefined> {
  // Questions arrive with punctuation and connectives ("which municipalities exist in
  // Pernambuco?"), so the state is matched on the words alone.
  const words = q.replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  const stated = /^([\p{L}'-]+(?:\s+[\p{L}'-]+)*?)\s*(?:municipios?|municipios (?:de|do|da|em))\s*$/u.exec(words);
  const tail = words.match(/\s+(?:de|do|da|em|in)\s+(.+)$/u);
  const candidates = [stated?.[1] ?? '', tail?.[1] ?? '', words].map((c) => c.trim()).filter(Boolean);
  // A question that asks about a state's municipalities is about the state itself.
  const asksAboutMunicipalities = /\bmunicipios?\b|\bmunicipalities?\b/iu.test(words);

  for (const candidate of candidates) {
    const hit = (await loadStates()).find((s) => fold(s.nome) === candidate || s.sigla.toLowerCase() === candidate);
    if (!hit) continue;
    // A state that shares its name with a city (São Paulo, Rio de Janeiro, Goiás) must
    // not swallow a place question: only a question about municipalities, or a state
    // abbreviation, resolves to the state. Same-named city queries fall through to the
    // municipality lookup, which is the right tool for them.
    const byName = fold(hit.nome) === candidate;
    if (byName && !asksAboutMunicipalities && municipios.some((m) => fold(m.nome) === candidate)) continue;
    const inState = municipios
      .filter((m) => byCode.get(String(m.id).slice(0, 2))?.sigla === hit.sigla)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return {
      sigla: hit.sigla,
      name: bothWays(hit.nome),
      region: hit.regiao
        ? { sigla: hit.regiao.sigla, name: bothWays(hit.regiao.nome) }
        : { sigla: '', name: bothWays('') },
      count: inState.length,
      // Alphabetical, and labelled as such: without population figures there is no honest
      // way to rank them, and implying a ranking would be the easier mistake to make.
      sample: inState.slice(0, 5).map((m) => ({ name: bothWays(m.nome), code: String(m.id) })),
    };
  }
  return undefined;
}

const STATES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
let statesCache: Promise<State[]> | undefined;
/** The 27 states, fetched once and kept with the municipality list. */
function loadStates(): Promise<State[]> {
  statesCache ??= getJson<State[]>(STATES_URL, 20_000).catch((err) => {
    statesCache = undefined;
    throw err;
  });
  return statesCache;
}

export const tools = {
  ibgePlace: tool({
    description:
      'Resolve a Brazilian city to its official IBGE municipality code (7 digits), its state and its region — or list the municipalities of a state. Call it whenever a place name has to be made precise: which municipality a service applies to, what the code for a city is, where a person lives, or which municipalities a state has. Handles accent-free spellings and "City UF" forms. When several cities match it returns them for the person to choose rather than picking one.',
    inputSchema: z.object({
      place: z.string().describe('A municipality name, optionally with the state ("Florianópolis SC"), or an IBGE code.'),
      limit: z.number().int().min(1).max(5).optional().describe('How many matches to return. Defaults to 3.'),
    }),
    execute: async ({ place, limit = 3 }) => {
      const q = fold(place);
      if (!q) {
        const source = referenceSource({ title: 'IBGE — Cidades e Estados', url: CITE_URL, authority: 'IBGE' });
        return { query: place, matches: [], sources: [source] };
      }

      // Did this call fetch the lists, or was it served from the copy this process
      // already holds? The answer belongs in the card: a reader deserves to know whether
      // the municipality they were just handed came from a fetch made now or from one
      // made earlier today.
      const wasCached = cache !== undefined;
      const { municipios, byCode, fetchedAt } = await load();
      const source: BrazilToolSource = referenceSource({
        title: 'IBGE — Cidades e Estados',
        url: CITE_URL,
        authority: 'IBGE',
        datasetId: 'localidades-municipios',
        fetchedAt: new Date(fetchedAt).toISOString(),
      });
      source.fromCache = wasCached;
      const shape = (x: Municipality) => {
        const state = byCode.get(String(x.id).slice(0, 2));
        return {
          name: bothWays(x.nome),
          code: String(x.id),
          uf: state ? { code: String(state.id), sigla: state.sigla, name: bothWays(state.nome) } : undefined,
          region: state?.regiao ? { sigla: state.regiao.sigla, name: bothWays(state.regiao.nome) } : undefined,
          immediateRegion: x['regiao-imediata'] ? bothWays(x['regiao-imediata'].nome) : undefined,
        };
      };

      // A question about a state itself ("which municipalities exist in Pernambuco?") is not a
      // lookup, so it must not be answered with the first city that happens to match. The state
      // has a count and a full list on IBGE's own page; what this returns is the count, an
      // alphabetical sample that says it is alphabetical, and that page.
      const state = await stateAnswer(q, municipios, byCode);
      if (state) return { query: place, state, sources: [source] };

      // An IBGE code means the person already knows which place they mean, so it wins outright.
      const digits = q.replace(/\D/g, '');
      if (/^\d{6,7}$/.test(digits)) {
        const hit = municipios.find((x) => String(x.id).startsWith(digits));
        if (hit) return { query: place, matches: [shape(hit)], exact: true, sources: [source] };
      }

      // "Florianópolis SC" — peel a trailing state off before matching the name.
      const withUf = /^([\p{L}\s'-]+?)\s+([A-Za-z]{2})$/u.exec(place.trim());
      const ufFilter = withUf ? withUf[2].toUpperCase() : undefined;
      const nameQuery = withUf ? fold(withUf[1]) : q;

      const scored = scoreMunicipalities(nameQuery, ufFilter, municipios, byCode);

      // The model may pass the whole question rather than the place it asks about, and
      // "Qual o código IBGE de Manaus?" must still find Manaus. So a miss is retried on
      // the trailing words before it becomes an empty answer.
      if (scored.length === 0) {
        // Strip punctuation too: the model may pass the question verbatim, and
        // "Manaus?" is not a name anyone called their city.
        const words = nameQuery.replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
        for (let take = Math.min(3, words.length); take >= 1; take--) {
          const retry = scoreMunicipalities(words.slice(-take).join(' '), ufFilter, municipios, byCode);
          if (retry.length) { scored.push(...retry); break; }
        }
      }

      const top = scored.slice(0, limit);
      return {
        query: place,
        matches: top.map((r) => shape(r.x)),
        // A tie at the top score means the name is genuinely ambiguous: "Santa Rita" exists in 4 states.
        ambiguous: scored.length > 1 && scored[0].score === scored[1].score,
        sources: [source],
      };
    },
  }),
} satisfies ToolSet;