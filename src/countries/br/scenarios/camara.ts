/**
 * Scripted answers for the Chamber of Deputies. These really call `camaraDeputado` and
 * `camaraProposicao`, so the mandate on screen is the mandate the Câmara publishes —
 * including when the news cycle has moved on and the party on screen is not the party
 * in yesterday's headline.
 *
 * Neutrality is enforced by shape, not by hope: the answer template has slots for
 * facts (name, party, status, numbers) and no slot for assessment. There is nowhere in
 * this file to write that a deputy is good or bad, a bill wise or unwise — and that is
 * deliberate, because the day a scripted answer carries an opinion is the day it stops
 * being a reference.
 */
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

type Deputy = { ballotName: string; name: string; party: string; state: string; office?: string; email?: string };
type DeputyOut = { query: string; matches: Deputy[] };
type Proposal = {
  type: string;
  number: number;
  year: number;
  title: string;
  status?: string;
  organ?: string;
  statusAt?: string;
  movements: { at: string; organ: string; description: string }[];
  lastVote?: { at: string; organ: string; description: string; approved?: boolean; yes?: number; no?: number; abstentions?: number };
};
type ProposalOut = { query: string; proposals: Proposal[] };

/** The tool-call context the AI SDK passes; nothing in these tools reads it. */
type ToolCtx = { toolCallId: string; messages: unknown[]; context: unknown };
const toolContext = (id: string): ToolCtx => ({ toolCallId: id, messages: [], context: undefined });

/** "Quem é o deputado Tiririca?" → "Tiririca"; the tool searches the fragment. */
function deputyOf(text: string): string {
  const noise =
    'quem qual qual o qual a é e o a os as um uma de do da dos das em no na nos nas para por e é se deputado deputada parlamentar congressista saber sobre me diga fale informe';
  const words = text
    .replace(/[?!.,;:]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ''))
    .filter((w) => w && !noise.split(' ').includes(w.toLowerCase()));
  return words.join(' ');
}

async function readDeputy(name: string): Promise<DeputyOut> {
  const { tools } = await import('../tools/camara');
  const out = await tools.camaraDeputado.execute?.({ nome: name }, toolContext('sc-camara-dep') as never);
  return (out ?? {}) as DeputyOut;
}

async function readProposal(busca: string): Promise<ProposalOut> {
  const { tools } = await import('../tools/camara');
  const out = await tools.camaraProposicao.execute?.({ busca }, toolContext('sc-camara-prop') as never);
  return (out ?? {}) as ProposalOut;
}

function longDate(iso: string, locale: string) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(`${iso}T12:00:00Z`));
}

const scenarios: Scenario[] = [
  {
    id: 'camara-deputy',
    priority: 6,
    match: [
      /\bdeputad[oa]\b/i,
      /\bparlamentar\b/i,
      /\bquem [ée] o (deputado|parlamentar)\b/i,
      /\bde qual partido\b/i,
      /\bwho is (the )?(deputy|congressman|congresswoman)\b/i,
      /\bwhich party\b/i,
    ],
    exclude: [
      /\bsenador\b/i,
      /\bmeu deputado\b|\bminha deputada\b|\bmy (congressman|congresswoman|deputy|representative)\b/i,
    ],
    reply: {
      pt: `# {name}

{partyLine}

{officeLine}

Dados da Câmara dos Deputados — mandato, partido e contatos, sem avaliação. [1](https://www.camara.leg.br/deputados)`,
      en: `# {name}

{partyLine}

{officeLine}

From the Chamber of Deputies — mandate, party and contacts, no assessment. [1](https://www.camara.leg.br/deputados)`,
    },
    vars: async (ctx: ScenarioCtx) => {
      const en = ctx.locale === 'en';
      const r = await readDeputy(deputyOf(ctx.text));
      const d = r.matches[0];
      if (!d) {
        return {
          name: en ? 'I could not find that deputy.' : 'Não encontrei esse deputado.',
          partyLine: en ? 'Try the ballot name, or give the state and party.' : 'Tente o nome parlamentar, ou informe estado e partido.',
          officeLine: '',
        };
      }
      return {
        name: `${d.ballotName} — ${d.name}`,
        partyLine: en
          ? `${d.party} · ${d.state}${d.email ? ` · ${d.email}` : ''}`
          : `${d.party} · ${d.state}${d.email ? ` · ${d.email}` : ''}`,
        officeLine: d.office ? (en ? `Office: ${d.office}.` : `Gabinete: ${d.office}.`) : '',
      };
    },
    toolCalls: [{ toolName: 'camaraDeputado', input: (ctx: ScenarioCtx) => ({ nome: deputyOf(ctx.text) }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Quem é o deputado Tiririca?', 'De qual partido é o Tiririca?', 'Em que fase está o PL 1051/2026?'],
      en: ['Who is deputy Tiririca?', 'Which party is Tiririca from?', 'What stage is PL 1051/2026 at?'],
    },
  },
  {
    id: 'camara-bill',
    priority: 6,
    match: [
      /\b([A-Z]{2,4})\s*\d+\s*\/\s*\d{4}\b/,
      /\bem que fase\b/i,
      /\bcomo foi votad[oa]\b/i,
      /\bo que diz (a|o)\b/i,
      /\bqual a situa[çc][ãa]o\b/i,
      /\bwhat stage is\b/i,
      /\bhow was .* voted\b/i,
    ],
    reply: {
      pt: `# {title}

**Situação:** {status} [1](https://www.camara.leg.br)

{lastVoteLine}

{moveList}`,
      en: `# {title}

**Status:** {status} [1](https://www.camara.leg.br)

{lastVoteLine}

{moveList}`,
    },
    vars: async (ctx: ScenarioCtx) => {
      const en = ctx.locale === 'en';
      const r = await readProposal(ctx.text);
      const p = r.proposals[0];
      if (!p) {
        return {
          title: en ? 'I could not find that bill.' : 'Não encontrei essa proposição.',
          status: en ? 'Try the type, number and year, as in "PL 1051/2026".' : 'Tente tipo, número e ano, como em "PL 1051/2026".',
          lastVoteLine: '',
          moveList: '',
        };
      }
      const vote = p.lastVote;
      const placar = vote && vote.yes !== undefined ? ` (${vote.yes}–${vote.no}${vote.abstentions ? `, ${vote.abstentions} abst.` : ''})` : '';
      return {
        title: `${p.type} ${p.number}/${p.year} — ${p.title}`,
        status: p.status ? `${p.status}${p.organ ? ` · ${p.organ}` : ''}${p.statusAt ? ` (${longDate(p.statusAt, ctx.locale)})` : ''}` : en ? 'No status published.' : 'Sem situação publicada.',
        lastVoteLine: vote
          ? en
            ? `Last vote (${vote.at}, ${vote.organ}): ${vote.description}${placar}`
            : `Última votação (${longDate(vote.at, ctx.locale)}, ${vote.organ}): ${vote.description}${placar}`
          : '',
        moveList: p.movements.map((m) => `· ${m.organ} (${longDate(m.at, ctx.locale)}): ${m.description}`).join('\n'),
      };
    },
    toolCalls: [{ toolName: 'camaraProposicao', input: (ctx: ScenarioCtx) => ({ busca: ctx.text }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Em que fase está o PL 1051/2026?', 'Quem é o deputado Tiririca?', 'Como consultar um serviço no gov.br?'],
      en: ['What stage is PL 1051/2026 at?', 'Who is deputy Tiririca?', 'How do I find a government service?'],
    },
  },
];

export default scenarios;