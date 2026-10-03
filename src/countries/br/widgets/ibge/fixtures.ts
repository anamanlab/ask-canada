/**
 * Lab fixtures for the `ibge` widget: the resolution path, the ambiguities, and the near-misses.
 *
 * Records are copied from IBGE's own municipality list. `ambiguous` is the important one: "Santa Rita"
 * really is a municipality in four different states, and a card that quietly picked one of them would be
 * confidently wrong about where someone lives.
 */
import type { Fixture, ToolSource, WidgetPart } from '@/lib/widgets/types';

/**
 * A source exactly as the tool builds it. `fetchedAt` is when this process fetched the
 * municipality list, and `fromCache` says whether this call was served from that copy or
 * fetched for the question — the difference between a live lookup and a cached one.
 */
const SOURCE = (opts: { fetchedAt?: string; fromCache?: boolean } = {}): ToolSource => ({
  title: 'IBGE — Cidades e Estados',
  url: 'https://www.ibge.gov.br/cidades-e-estados',
  checked: '2026-10-02',
  authority: 'IBGE',
  live: true,
  datasetId: 'localidades-municipios',
  ...(opts.fetchedAt ? { fetchedAt: opts.fetchedAt } : {}),
  ...(opts.fromCache !== undefined ? { fromCache: opts.fromCache } : {}),
});

type Match = {
  name: { pt: string; en: string };
  code: string;
  uf?: { code: string; sigla: string; name: { pt: string; en: string } };
  region?: { sigla: string; name: { pt: string; en: string } };
  immediateRegion?: { pt: string; en: string };
};
type StateAnswer = {
  sigla: string;
  name: { pt: string; en: string };
  region: { sigla: string; name: { pt: string; en: string } };
  count: number;
  sample: { name: { pt: string; en: string }; code: string }[];
};
type Output = {
  query: string;
  /** Absent when the question was about a state, which is not a lookup. */
  matches?: Match[];
  ambiguous?: boolean;
  exact?: boolean;
  state?: StateAnswer;
  sources?: ToolSource[];
};

const m = (
  name: string,
  code: string,
  ufSigla: string,
  ufName: string,
  ufCode: string,
  region: string,
  regionSigla: string,
  immediate?: string,
): Match => ({
  name: { pt: name, en: name },
  code,
  uf: { code: ufCode, sigla: ufSigla, name: { pt: ufName, en: ufName } },
  region: { sigla: regionSigla, name: { pt: region, en: region } },
  immediateRegion: immediate ? { pt: immediate, en: immediate } : undefined,
});

let n = 0;
const part = (input: { place: string; limit?: number }, opts: { state?: WidgetPart['state']; output?: Output } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-ibgePlace',
    toolCallId: `fx-ibge-${++n}`,
    state,
    input,
    output: state === 'output-available' ? opts.output : undefined,
    errorText: state === 'output-error' ? 'IBGE não respondeu' : undefined,
  };
};

const saoPaulo = (): Output => ({
  query: 'Sao Paulo',
  matches: [
    m('São Paulo', '3550308', 'SP', 'São Paulo', '35', 'Sudeste', 'SE', 'São Paulo'),
    m('São Paulo das Missões', '4319307', 'RS', 'Rio Grande do Sul', '43', 'Sul', 'S', 'Cruz Alta'),
    m('São Paulo de Olivença', '1303908', 'AM', 'Amazonas', '13', 'Norte', 'N', 'Parintins'),
  ],
  sources: [SOURCE()],
});

const fixtures: Fixture[] = [
  { name: 'Streaming input', toolName: 'ibgePlace', part: part({ place: 'Sao Paulo' }, { state: 'input-streaming' }) },
  { name: 'Input available, no output yet', toolName: 'ibgePlace', part: part({ place: 'Sao Paulo' }, { state: 'input-available' }) },
  {
    name: 'A state, asked for its municipalities',
    toolName: 'ibgePlace',
    part: part({ place: 'Quais municípios existem em Pernambuco?' }, {
      output: {
        query: 'Quais municípios existem em Pernambuco?',
        state: {
          sigla: 'PE',
          name: { pt: 'Pernambuco', en: 'Pernambuco' },
          region: { sigla: 'NE', name: { pt: 'Nordeste', en: 'Nordeste' } },
          count: 185,
          sample: [
            { name: { pt: 'Abreu e Lima', en: 'Abreu e Lima' }, code: '2600054' },
            { name: { pt: 'Afogados da Ingazeira', en: 'Afogados da Ingazeira' }, code: '2600104' },
            { name: { pt: 'Afrânio', en: 'Afrânio' }, code: '2600203' },
            { name: { pt: 'Agrestina', en: 'Agrestina' }, code: '2600302' },
            { name: { pt: 'Água Preta', en: 'Água Preta' }, code: '2600401' },
          ],
        },
        sources: [SOURCE({ fetchedAt: '2026-10-03T12:04:11Z', fromCache: true })],
      },
    }),
    note: 'A question about a state is answered with a count and a sample, not with the first city that matches. The sample is labelled alphabetical, because without population figures there is no honest way to rank 185 municipalities.',
  },
  {
    name: 'Accent-free spelling still resolves',
    toolName: 'ibgePlace',
    part: part({ place: 'Sao Paulo' }, { output: saoPaulo() }),
    note: 'The person typed "Sao Paulo"; Brazil writes "São Paulo". The exact match is first, and the other São Paulos follow instead of being dropped.',
  },
  {
    name: 'Second lookup, served from the copy',
    toolName: 'ibgePlace',
    part: part({ place: 'Recife PE' }, {
      output: {
        query: 'Recife PE',
        matches: [m('Recife', '2611606', 'PE', 'Pernambuco', '26', 'Nordeste', 'NE', 'Recife')],
        sources: [SOURCE({ fetchedAt: '2026-10-03T12:04:11Z', fromCache: true })],
      },
    }),
    note: 'The municipality list is fetched once per server process, so later lookups are served from that copy. The card says which: "Ao vivo · cache de 12:04".',
  },
  {
    name: 'City with a state, disambiguated',
    toolName: 'ibgePlace',
    part: part({ place: 'Belém PA' }, {
      output: {
        query: 'Belém PA',
        matches: [
          m('Belém', '1501402', 'PA', 'Pará', '15', 'Norte', 'N', 'Belém'),
          m('Belém', '2501906', 'PB', 'Paraíba', '25', 'Nordeste', 'NE', 'Belém'),
          m('Belém', '2700805', 'AL', 'Alagoas', '27', 'Nordeste', 'NE', 'Arapiraca'),
        ],
        ambiguous: true,
        sources: [SOURCE()],
      },
    }),
    note: '"Belém PA" puts Pará first; the other two Beléms stay visible because three exist.',
  },
  {
    name: 'Name shared across states',
    toolName: 'ibgePlace',
    part: part({ place: 'Santa Rita' }, {
      output: {
        query: 'Santa Rita',
        matches: [
          m('Santa Rita', '2110203', 'MA', 'Maranhão', '21', 'Nordeste', 'NE', 'Rosário'),
          m('Santa Rita', '2513703', 'PB', 'Paraíba', '25', 'Nordeste', 'NE', 'Campina Grande'),
          m("Santa Rita d'Oeste", '3547403', 'SP', 'São Paulo', '35', 'Sudeste', 'SE', 'Santa Rita d’Oeste'),
        ],
        ambiguous: true,
        sources: [SOURCE()],
      },
    }),
    note: 'A tie at the top score is real ambiguity, and the card says so rather than guessing.',
  },
  {
    name: 'An IBGE code, given directly',
    toolName: 'ibgePlace',
    part: part({ place: '3550308' }, {
      output: { query: '3550308', matches: [m('São Paulo', '3550308', 'SP', 'São Paulo', '35', 'Sudeste', 'SE', 'São Paulo')], exact: true, sources: [SOURCE()] },
    }),
    note: 'When the code is already known, it resolves outright — no ranking, no alternatives.',
  },
  {
    name: 'Northern state with an accented name',
    toolName: 'ibgePlace',
    part: part({ place: 'Niterói' }, {
      output: { query: 'Niterói', matches: [m('Niterói', '3303302', 'RJ', 'Rio de Janeiro', '33', 'Sudeste', 'SE', 'Rio de Janeiro')], sources: [SOURCE()] },
    }),
  },
  {
    name: 'Not a municipality',
    toolName: 'ibgePlace',
    part: part({ place: 'cidade que nao existe' }, { output: { query: 'cidade que nao existe', matches: [], sources: [SOURCE()] } }),
    note: 'No match is answered with a suggestion of the form that works, never with a guess.',
  },
  { name: 'Error', toolName: 'ibgePlace', part: part({ place: 'Recife' }, { state: 'output-error' }) },
];

export default fixtures;