/**
 * Lab fixtures for the `camara` widget: a deputy, a bill, and the states that matter.
 *
 * Every record here is the Câmara's own data, copied from Dados Abertos — never rewritten,
 * because a reworded status is a status nobody published. The symbolic-vote fixture exists
 * for the same reason the tool has that branch: most votes that matter are symbolic, with
 * no nominal placar, and showing the description without numbers is honest while showing
 * numbers that were never recorded would be fabrication.
 */
import type { Fixture, ToolSource, WidgetPart } from '@/lib/widgets/types';

const SOURCE = (dataset: string): ToolSource => ({
  title: 'Câmara dos Deputados — Dados Abertos',
  url: 'https://www.camara.leg.br',
  checked: '2026-10-02',
  authority: 'Câmara dos Deputados',
  live: true,
  datasetId: dataset,
});

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
type DeputyOutput = { query: string; matches: Deputy[]; reason?: string; sources?: ToolSource[] };

type Movement = { at: string; organ: string; description: string };
type Vote = { at: string; organ: string; description: string; approved?: boolean; yes?: number; no?: number; abstentions?: number };
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
  movements: Movement[];
  lastVote?: Vote;
};
type ProposalOutput = { query: string; proposals: Proposal[]; reason?: string; sources?: ToolSource[] };

let n = 0;
const depPart = (input: { nome: string }, opts: { state?: WidgetPart['state']; output?: DeputyOutput } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-camaraDeputado',
    toolCallId: `fx-camara-dep-${++n}`,
    state,
    input,
    output: state === 'output-available' ? opts.output : undefined,
    errorText: state === 'output-error' ? 'A Câmara não respondeu' : undefined,
  };
};
const propPart = (input: { busca: string }, opts: { state?: WidgetPart['state']; output?: ProposalOutput } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-camaraProposicao',
    toolCallId: `fx-camara-prop-${++n}`,
    state,
    input,
    output: state === 'output-available' ? opts.output : undefined,
    errorText: state === 'output-error' ? 'A Câmara não respondeu' : undefined,
  };
};

const TIRIRICA: Deputy = {
  id: 160976,
  name: 'FRANCISCO EVERARDO TIRIRICA OLIVEIRA SILVA',
  ballotName: 'Tiririca',
  party: 'PSD',
  state: 'SP',
  photo: 'https://www.camara.leg.br/internet/deputado/bandep/160976.jpg',
  office: 'Gabinete 404',
  legislature: 57,
};

const PL1051: Proposal = {
  id: 281460,
  type: 'PL',
  number: 1051,
  year: 2026,
  title:
    'Altera o Decreto-Lei nº 667, de 2 de julho de 1969, que dispõe sobre a organização das Polícias Militares e Corpos de Bombeiros Militares dos Estados, dos Territórios e do Distrito Federal.',
  presentedAt: '2005-04-12',
  status: 'Aguardando Apreciação pelo Senado Federal',
  statusAt: '2026-03-03',
  organ: 'MESA',
  movements: [
    { at: '2026-03-03', organ: 'MESA', description: 'Apresentação de Proposição' },
    { at: '2026-03-03', organ: 'MESA', description: 'Expedição de Documento' },
    { at: '2026-02-24', organ: 'CCJC', description: 'Aprovação da Redação Final' },
  ],
  lastVote: { at: '2026-02-24', organ: 'CCJC', description: 'Aprovada a Redação Final.', approved: true },
};

const fixtures: Fixture[] = [
  { name: 'Deputy: streaming input', toolName: 'camaraDeputado', part: depPart({ nome: 'Tiririca' }, { state: 'input-streaming' }) },
  { name: 'Deputy: input available', toolName: 'camaraDeputado', part: depPart({ nome: 'Tiririca' }, { state: 'input-available' }) },
  {
    name: 'A deputy, fully told',
    toolName: 'camaraDeputado',
    part: depPart({ nome: 'Tiririca' }, {
      output: { query: 'Tiririca', matches: [TIRIRICA], sources: [SOURCE('dados-abertos-deputados')] },
    }),
    note: 'The mandate, not an assessment: name, party, state, office. Nothing here ranks or endorses.',
  },
  {
    name: 'Deputy not found',
    toolName: 'camaraDeputado',
    part: depPart({ nome: 'Deputado Inexistente Xyz' }, {
      output: { query: 'Deputado Inexistente Xyz', matches: [], sources: [SOURCE('dados-abertos-deputados')] },
    }),
  },
  { name: 'Deputy: error', toolName: 'camaraDeputado', part: depPart({ nome: 'Tiririca' }, { state: 'output-error' }) },
  { name: 'Proposal: streaming input', toolName: 'camaraProposicao', part: propPart({ busca: 'PL 1051/2026' }, { state: 'input-streaming' }) },
  { name: 'Proposal: input available', toolName: 'camaraProposicao', part: propPart({ busca: 'PL 1051/2026' }, { state: 'input-available' }) },
  {
    name: 'A bill, with status and symbolic vote',
    toolName: 'camaraProposicao',
    part: propPart({ busca: 'PL 1051/2026' }, {
      output: { query: 'PL 1051/2026', proposals: [PL1051], sources: [SOURCE('dados-abertos-proposicoes')] },
    }),
    note: 'The last vote was symbolic — "Aprovada a Redação Final" with no nominal placar — so the card shows the description without numbers. Showing numbers that were never recorded would be fabrication.',
  },
  {
    name: 'A bill with a nominal placar',
    toolName: 'camaraProposicao',
    part: propPart({ busca: 'PL 1051/2026' }, {
      output: {
        query: 'PL 1051/2026',
        proposals: [{
          ...PL1051,
          lastVote: { at: '2026-02-24', organ: 'CCJC', description: 'Aprovada a Redação Final.', approved: true, yes: 41, no: 8, abstentions: 2 },
        }],
        sources: [SOURCE('dados-abertos-proposicoes')],
      },
    }),
    note: 'When the votação is nominal, the placar is shown with it: what the numbers were, not what they mean.',
  },
  {
    name: 'Proposal not found',
    toolName: 'camaraProposicao',
    part: propPart({ busca: 'PL 999999/2099' }, {
      output: { query: 'PL 999999/2099', proposals: [], sources: [SOURCE('dados-abertos-proposicoes')] },
    }),
  },
  { name: 'Proposal: error', toolName: 'camaraProposicao', part: propPart({ busca: 'PL 1051/2026' }, { state: 'output-error' }) },
];

export default fixtures;