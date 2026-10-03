/**
 * One federal service, in full. The search index answers "which service"; this answers
 * "what does getting it involve" — the stages in the catalogue's own words, who it is
 * for, the catalogue's own time estimate, where to ask, and the digital-service link.
 *
 * Two honest omissions, and both are stated on the card rather than worked around. The
 * catalogue's `legislacoes` are internal SERPRO ids with no titles, so they are not
 * shipped and not linked: inventing legislation links would be worse than pointing at
 * the official page, which lists the real ones. And `tempoTotalEstimado` is empty on
 * three services in five, so a missing time is reported as missing, never as zero.
 *
 * The data is a generated snapshot (`servicos.detalhes.ts`, same dump and same date as
 * the search index), not a live fetch — and the source says so. A snapshot of a service
 * catalogue is the right trade here: the stages of "how to get a CPF card" do not change
 * between breakfast and lunch, and a card that needs the network to list them would fail
 * exactly when the person needs it.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { DETAIL, DETAIL_FETCHED } from '../knowledge/servicos.detalhes';
import { SERVICES, accountLevel, serviceUrl } from '../knowledge/servicos.index';
import { searchLocalSources } from '../knowledge/search';
import { referenceSource } from './source';

const slugOf = (url: string) => url.replace(/\/$/, '').split('/').pop() ?? '';

/**
 * The noun phrase inside a question. "Quais são as etapas para tirar o CPF?" is about
 * "CPF"; everything else is the person describing what they want to do with it. Used
 * only as a fallback when the whole question resolves to nothing — never as the first
 * attempt, so a precise phrasing is never loosened before it has to be.
 */
/**
 * The best service for a query among the search's top hits. Shared meaningful words
 * count for, unasked-for qualifiers count against, and the overlap guard still has to
 * pass — so ranking cannot become guessing. `original` is the question as asked (for
 * the guard); `query` is what is searched (the whole question, or just its nouns).
 */
async function resolveRanked(query: string, original: string) {
  if (!query) return undefined;
  const hits = await searchLocalSources(query, 'pt', 5);
  const qwords = [...new Set(fold(original).split(/[^a-z0-9]+/))].filter((w) => w.length > 2 && !GENERIC.has(w));
  let best: (typeof SERVICES)[number] | undefined;
  let bestScore = -Infinity;
  for (const h of hits) {
    if (!h.url.includes('/servicos/')) continue;
    const row = SERVICES.find((s) => s.slug === slugOf(h.url));
    if (!row || !sharesMeaningfulWord(original, row)) continue;
    const swords = [...fold(row.slug).split('-'), ...fold(row.name).split(/[^a-z0-9]+/)].filter(
      (w) => w.length > 2 && !GENERIC.has(w),
    );
    let shared = 0;
    let extra = 0;
    for (const w of swords) {
      if (qwords.some((q) => q.startsWith(w) || w.startsWith(q))) shared++;
      else extra++;
    }
    const score = shared * 10 - extra;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore > 0 ? best : undefined;
}

function nounsOf(service: string): string {
  const framing =
    /\b(quais sao as|qual e a|quanto tempo demora|quem pode|quais documentos|o que preciso|como faco|como tirar|como emitir|como solicitar|como obter|como fazer|como pedir|como receber|como consultar|como declarar|etapas?|passo a passo|para|como|quais|qual|quanto|quem|o que|tempo|demora|pode|documentos|preciso|faco|tirar|emitir|solicitar|obter|fazer|pedir|receber|consultar|declarar|o|a|os|as|um|uma|de|do|da|no|na|em|que|por|com|e|ou)\b/gi;
  const stripped = fold(service).replace(framing, ' ').replace(/\s+/g, ' ').trim();
  return stripped || fold(service);
}

/**
 * The catalogue writes `[label](url)` inside its prose. The card renders plain text, so a
 * link left as-is would show its brackets; the URL itself lives on the official page the
 * card already links to. Keep the words, drop the markup.
 */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

/**
 * Words that match half the catalogue and therefore prove nothing: the verbs the Portal
 * puts in front of every service name, the question words around them, and "serviço"
 * itself. A resolution has to share something rarer than these, or a nonsense question
 * resolves to whatever mentions "serviço" — which is how "serviço que não existe xyz"
 * became a trade-barriers form.
 */
const GENERIC = new Set(
  ('servico servicos como para uma umas uns de do da dos das no na nos nas que nao com sem sobre entre gov br consultar obter solicitar fazer tirar emitir pedir receber saber qual quais onde quando quanto').split(' '),
);

/**
 * Does this service share a meaningful word with the question? The slug and the name are
 * the test, not the keyword cloud: keywords are broad by design, while a word in the
 * service's own name is evidence the question is about it.
 */
function sharesMeaningfulWord(query: string, row: { slug: string; name: string }): boolean {
  const qwords = [...new Set(fold(query).split(/[^a-z0-9]+/))].filter((w) => w.length > 2 && !GENERIC.has(w));
  if (!qwords.length) return false;
  const swords = [...fold(row.slug).split('-'), ...fold(row.name).split(/[^a-z0-9]+/)].filter((w) => w.length > 2);
  return qwords.some((q) => swords.some((x) => x.startsWith(q) || q.startsWith(x)));
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^pt-br\/servicos\//, '')
    .replace(/\/$/, '');

export const tools = {
  servicoDetalhe: tool({
    description:
      'The full official record for one Brazilian federal service: its stages, who it is for, the estimated time, where to ask, and the digital-service link. Call it when someone asks how to get a specific service, what the steps are, how long it takes, who can apply, or what it costs — after the service itself is identified. It returns the catalogue record and the official page URL; the fee itself lives in the Custos section of that official page, so read it with fetchOfficialPage before stating any amount. Never invent stages, fees, deadlines or requirements; if the catalogue does not state one, say so and point at the official page.',
    inputSchema: z.object({
      service: z.string().describe('A catalogue slug ("obter-cartao-de-cpf"), a service name, or the question naming it. The record is Portuguese, the only language the Portal publishes in; the widget draws its own labels in both locales.'),
    }),
    execute: async ({ service }) => {
      const source = referenceSource({
        title: 'Portal de Serviços — Governo Federal',
        url: 'https://www.gov.br/pt-br/servicos',
        authority: 'Portal de Serviços (SERPRO)',
        datasetId: 'servicos-gov-br',
        checked: DETAIL_FETCHED,
        live: false,
      });

      // A slug is a slug; anything else is resolved through the same search the chat uses,
      // so the tool and the answer can never disagree about which service was meant.
      // Catalogue slugs join words with hyphens; people join them with spaces.
      // "declarar meu imposto de renda" is the slug "declarar-meu-imposto-de-renda",
      // and matching it directly is what stops the search resolving it to a cousin.
      const slug = fold(service).replace(/\s+/g, '-');
      let row = SERVICES.find((s) => s.slug === slug);
      // Resolve through ranked search: first the whole question, then the nouns alone. A
      // verb the person added ("tirar", "receber") belongs to no catalogue entry, so
      // "tirar CPF" matches nothing as a whole — yet the noun names the service exactly.
      // Verbs describe intent; nouns identify services. Among several matches, prefer the
      // one that adds the least the person did not ask for: "tirar o CPF" is the card,
      // not the registration abroad and not the statistics page.
      row ??= await resolveRanked(service, service);
      row ??= await resolveRanked(nounsOf(service), service);
      if (!row) {
        return {
          status: 'not-found' as const,
          query: service,
          sources: [source],
        };
      }

      const detail = DETAIL[row.slug] as readonly [string[][], string[], string, string, string] | undefined;
      const [etapas = [], solicitantes = [], tempo = '', contato = '', link = ''] = detail ?? [];
      return {
        status: 'ok' as const,
        service: {
          name: row.name,
          slug: row.slug,
          url: serviceUrl(row),
          agency: row.agency,
          digital: row.flags.includes('d'),
          free: row.flags.includes('g'),
          accountLevel: accountLevel(row) || undefined,
        },
        stages: etapas.map(([title, description]) => ({ title: plain(title), description: plain(description) })),
        audience: solicitantes,
        // Empty means the catalogue states no estimate. The card says that; it does not fill it in.
        estimatedTime: tempo || undefined,
        contact: (contato ? plain(contato) : '') || undefined,
        digitalLink: link || undefined,
        sources: [source],
      };
    },
  }),
} satisfies ToolSet;