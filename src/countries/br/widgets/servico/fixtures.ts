/**
 * Lab fixtures for the `servico` widget: one service, fully told.
 *
 * Every record here is the catalogue's own words, copied from the generated detail file —
 * never rewritten, because a reworded stage is a stage nobody published. `not-found` and
 * the missing time estimate exist for the same reason the tool has those branches: the
 * catalogue genuinely lacks them sometimes, and the card must say so rather than fill in.
 */
import type { Fixture, ToolSource, WidgetPart } from '@/lib/widgets/types';

const SOURCE = (): ToolSource => ({
  title: 'Portal de Serviços — Governo Federal',
  url: 'https://www.gov.br/pt-br/servicos',
  checked: '2026-10-02',
  authority: 'Portal de Serviços (SERPRO)',
  live: false,
  datasetId: 'servicos-gov-br',
});

type Stage = { title: string; description: string };
type Service = {
  name: string;
  slug: string;
  url: string;
  agency: string;
  digital: boolean;
  free: boolean;
  accountLevel?: string;
};
type Output = {
  status: 'ok' | 'not-found';
  query?: string;
  service?: Service;
  stages?: Stage[];
  audience?: string[];
  estimatedTime?: string;
  contact?: string;
  digitalLink?: string;
  sources?: ToolSource[];
};

let n = 0;
const part = (input: { service: string }, opts: { state?: WidgetPart['state']; output?: Output } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-servicoDetalhe',
    toolCallId: `fx-servico-${++n}`,
    state,
    input,
    output: state === 'output-available' ? opts.output : undefined,
    errorText: state === 'output-error' ? 'O catálogo não respondeu' : undefined,
  };
};

const CPF_URL = 'https://www.gov.br/pt-br/servicos/obter-cartao-de-cpf';
const BOLSA_URL = 'https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia';

const fixtures: Fixture[] = [
  { name: 'Streaming input', toolName: 'servicoDetalhe', part: part({ service: 'cartão de cpf' }, { state: 'input-streaming' }) },
  { name: 'Input available, no output yet', toolName: 'servicoDetalhe', part: part({ service: 'cartão de cpf' }, { state: 'input-available' }) },
  {
    name: 'One stage, no time estimate',
    toolName: 'servicoDetalhe',
    part: part({ service: 'obter-cartao-de-cpf' }, {
      output: {
        status: 'ok',
        service: {
          name: 'Obter Cartão de CPF',
          slug: 'obter-cartao-de-cpf',
          url: CPF_URL,
          agency: 'Secretaria Especial da Receita Federal do Brasil (RFB)',
          digital: true,
          free: true,
          accountLevel: 'Prata',
        },
        stages: [
          {
            title: 'Obter o comprovante de inscrição no CPF',
            description:
              'Acesse o sistema e informe seus dados pessoais quando for solicitado. Se você está inscrito no CPF, mas não sabe o seu número, entre em contato com a Receita Federal através de uma de nossas unidades de atendimento ou solicite atendimento por e-mail.',
          },
        ],
        audience: ['Cidadão inscrito no Cadastro de Pessoas Físicas (CPF).'],
        contact: 'Fale Conosco Orientações sobre CPF',
        digitalLink: 'https://cav.receita.fazenda.gov.br/autenticacao/login/index/5090',
        sources: [SOURCE()],
      },
    }),
    note: 'The catalogue states no time estimate for this one, so the card says it states none — it does not invent "immediate".',
  },
  {
    name: 'Five stages, with a deadline',
    toolName: 'servicoDetalhe',
    part: part({ service: 'receber o bolsa família' }, {
      output: {
        status: 'ok',
        service: {
          name: 'Receber o Bolsa Família',
          slug: 'receber-o-bolsa-familia',
          url: BOLSA_URL,
          agency: 'Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome (MDS)',
          digital: false,
          free: true,
        },
        stages: [
          { title: 'Fazer a inscrição no Cadastro Único', description: 'Você deverá solicitar a sua inscrição no Cadastro Único, que é a porta de entrada para os programas sociais dos Governos Federal, Estaduais, Distrital e Municipais.' },
          { title: 'Receber o Cartão do Bolsa Família', description: 'Quando for selecionada para o Programa, a família receberá um cartão. Ele é emitido pela CAIXA, em nome do(a) responsável familiar.' },
          { title: 'Receber Benefício Financeiro', description: 'Você passará a receber mensalmente uma quantia em dinheiro. O valor depende da renda mensal por pessoa da família e de outros fatores.' },
          { title: 'Cumprir os compromissos de Saúde e Educação', description: 'As crianças de 4 e 5 anos precisam de frequência escolar mínima de 60%; as de 6 a 18 anos incompletos, de 75%.' },
          { title: 'Recorrer caso não tenha conseguido cumprir os compromissos', description: 'O não cumprimento das condicionalidades pode gerar efeitos no recebimento. É possível justificar por meio de recurso.' },
        ],
        audience: ['Para receber os benefícios, a principal regra é a renda mensal por pessoa da família.'],
        estimatedTime: 'até 180 dias corridos',
        sources: [SOURCE()],
      },
    }),
    note: 'The catalogue does give a deadline here — "até 180 dias corridos" — and the card shows it as the catalogue’s own words.',
  },
  {
    name: 'Not in the catalogue',
    toolName: 'servicoDetalhe',
    part: part({ service: 'serviço que não existe xyz' }, {
      output: { status: 'not-found', query: 'serviço que não existe xyz', sources: [SOURCE()] },
    }),
    note: 'A nonsense question must not resolve to a cousin. "Not found" is the answer, with the catalogue as the source that was checked.',
  },
  { name: 'Error', toolName: 'servicoDetalhe', part: part({ service: 'cartão de cpf' }, { state: 'output-error' }) },
];

export default fixtures;