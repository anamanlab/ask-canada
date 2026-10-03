/**
 * Scripted answers for one federal service in full. These really call `servicoDetalhe`,
 * so the stages on screen are the catalogue's own words — including when the catalogue
 * states no time estimate, which the answer says plainly rather than filling in.
 *
 * The reply is built from placeholders because the record varies: a service with five
 * stages and a deadline reads differently from one with a single stage and no estimate.
 * What does not vary is the rule — nothing here is written from memory, and a missing
 * field is marked missing.
 */
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

type Detail = {
  status?: string;
  service?: { name: string; url: string; agency: string; digital: boolean; free: boolean; accountLevel?: string };
  stages?: { title: string; description: string }[];
  audience?: string[];
  estimatedTime?: string;
  contact?: string;
  digitalLink?: string;
};

async function read(service: string): Promise<Detail> {
  const { tools } = await import('../tools/servico');
  const context = { toolCallId: 'sc-servico', messages: [], context: undefined } as Parameters<
    NonNullable<typeof tools.servicoDetalhe.execute>
  >[1];
  const out = await tools.servicoDetalhe.execute?.({ service }, context);
  return (out ?? {}) as Detail;
}

/** "Como faço para tirar o passaporte?" → "tirar o passaporte"; the tool resolves the rest. */
function serviceOf(text: string): string {
  const cleaned = text
    .replace(/[?!.,;:]/g, ' ')
    .replace(/\b(quais são as|qual é a|quanto tempo demora|quem pode solicitar|quais documentos preciso para|como faço para|como tirar|como emitir|como solicitar|etapas?|passo a passo)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || text;
}

const scenarios: Scenario[] = [
  {
    id: 'service-detail',
    priority: 7,
    match: [
      /\betapas?\b/i,
      /\bpasso a passo\b/i,
      /\bquanto tempo (demora|leva|fica pronto)\b/i,
      /\bquem pode (solicitar|pedir|receber)\b/i,
      /\bquais documentos preciso\b/i,
      /\bo que (preciso|é preciso) para\b/i,
      /\bwhat are the steps\b/i,
      /\bhow long does\b/i,
      /\bwho can apply\b/i,
    ],
    exclude: [/\b(inss|sus|saude|saúde|receita|imposto|cnh|mei|bolsa|bpc|cadunico|ibge|selic|dolar|feriado)\b/i],
    reply: {
      pt: `# {name}

{stageList}

{audienceLine}
{timeLine}
{costLine}

Fonte: catálogo oficial — [{agency}]({url}). [1]({url})`,
      en: `# {name}

{stageList}

{audienceLine}
{timeLine}
{costLine}

Source: the official catalogue — [{agency}]({url}). [1]({url})`,
    },
    vars: async (ctx: ScenarioCtx) => {
      const en = ctx.locale === 'en';
      const r = await read(serviceOf(ctx.text));
      if (r.status !== 'ok' || !r.service) {
        return {
          name: en ? 'I could not find that service in the official catalogue.' : 'Não encontrei esse serviço no catálogo oficial.',
          stageList: en
            ? 'It may be a state or municipal service, or a new one. Try the name as it appears on gov.br.'
            : 'Pode ser um serviço estadual, municipal ou novo. Tente o nome como está no gov.br.',
          audienceLine: '',
          timeLine: '',
          costLine: '',
          agency: en ? 'Services Portal' : 'Portal de Serviços',
          url: 'https://www.gov.br/pt-br/servicos',
        };
      }
      const s = r.service;
      const stages = (r.stages ?? []).map((st, i) => `${i + 1}. **${st.title}**${st.description ? ` — ${st.description}` : ''}`).join('\n');
      const audience = (r.audience ?? [])[0];
      return {
        name: s.name,
        stageList: stages || (en ? 'The catalogue lists no stages for this one.' : 'O catálogo não lista etapas para este.'),
        audienceLine: audience ? (en ? `Who it is for: ${audience}` : `Para quem: ${audience}`) : '',
        timeLine: r.estimatedTime
          ? en ? `Timeframe: ${r.estimatedTime}.` : `Prazo: ${r.estimatedTime}.`
          : en ? 'The catalogue states no timeframe.' : 'O catálogo não informa prazo.',
        costLine: en
          ? `${s.free ? 'Free.' : 'It may have a cost.'} ${s.digital ? 'Available online.' : 'In person.'}${s.accountLevel ? ` Gov.br account: ${s.accountLevel}.` : ''}`
          : `${s.free ? 'Gratuito.' : 'Pode ter custo.'} ${s.digital ? 'Disponível on-line.' : 'Presencial.'}${s.accountLevel ? ` Conta gov.br: ${s.accountLevel}.` : ''}`,
        agency: s.agency,
        url: s.url,
      };
    },
    toolCalls: [{ toolName: 'servicoDetalhe', input: (ctx: ScenarioCtx) => ({ service: serviceOf(ctx.text) }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Quais são as etapas para tirar o CPF?', 'Quanto tempo demora a carteira de trabalho?', 'Quem pode solicitar o seguro-desemprego?'],
      en: ['What are the steps to get a CPF?', 'How long does a work card take?', 'Who can apply for unemployment insurance?'],
    },
  },
];

export default scenarios;