/**
 * Scripted answers for live macro indicators. This really calls `economiaSeries`, so the figure on screen is
 * the same one the answer describes — including when the answer has to admit it could not be fetched.
 *
 * One scenario covers Selic, inflation and the dollar because the tool is what tells them apart: it reads the
 * question, picks the series and returns the latest observation *with its date*. The reply therefore stays
 * series-neutral and everything specific comes from `{meaning}`.
 *
 * Two things this answer is written to survive. A figure is never given without its reference date, because a
 * stale rate quoted confidently is how someone signs for a loan at the wrong number. And an unavailable figure
 * is not dressed up: if the Central Bank does not answer, `{meaning}` says so and the answer says so too.
 */
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

const BCB_URL = {
  selic: 'https://www.bcb.gov.br/controleinflacao/taxasselic',
  default: 'https://www.bcb.gov.br/economia/inflacao',
  ptac: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
};

/** One sentence on what this particular series actually is. It is the part a generic answer gets wrong. */
const MEANING: Record<string, { pt: string; en: string }> = {
  selic: {
    pt: 'É o ritmo ao qual o Banco Central empresta para si mesmo: o principal instrumento de política monetária e a âncora de todo crédito do país. É decidida em reuniões do Copom e vale para todas as taxas, não só para o banco central.',
    en: 'It is the rate at which the Central Bank lends to itself: its main monetary policy instrument and the anchor for every rate in the country. It is set at Copom meetings and applies to every rate, not just the Central Bank’s.',
  },
  selicAcumulada: {
    pt: 'É a Selic acumulada desde 1º de janeiro: o ano inteiro em uma linha só.',
    en: 'It is the Selic accumulated since 1 January: the whole year in one figure.',
  },
  ipca12: {
    pt: 'É o índice oficial de inflação do Brasil, medido pelo IBGE e publicado todo mês. É ele que vale na decisão de aumento de aluguel, de plano de saúde e de crédito — não a variação de um mês só.',
    en: 'This is Brazil’s official inflation index, measured by IBGE and published monthly. It is the figure that counts for rent increases, health-plan adjustments and credit decisions — not a single month’s change.',
  },
  ipcaAcumulado: {
    pt: 'É o IPCA acumulado desde o início do ano, em pontos de índice.',
    en: 'It is IPCA accumulated since the start of the year, in index points.',
  },
  igpm: {
    pt: 'É o índice de preços do comércio atacadista, medido pela FGV e publicado todo mês. Vale como referência de inflação, mas o índice oficial do Brasil é o IPCA, do IBGE, e é nele que os reajuste são definidos.',
    en: 'It is the wholesale price index, measured by FGV and published monthly. It is a useful inflation reference, but Brazil’s official index is IBGE’s IPCA, and that is the one adjustments are defined by.',
  },
  dolar: {
    pt: 'É a cotação que o Banco Central registra a cada dia útil e a que a maioria das pessoas encontra nas transferências internacionais. Ela muda todo dia: viagens, importações, remessas e pagamentos seguem o ritmo dela.',
    en: 'It is the rate the Central Bank records every business day, and the one most people meet when transferring money abroad. It moves daily: travel, imports, remittances and payments all follow it.',
  },
};

type ToolResult = { status?: string; series?: string; unit?: string; latest?: { date: string; value: number } };

async function read(question: string): Promise<ToolResult> {
  const { tools } = await import('../tools/economia');
  // `execute` is the model's entry point and takes the tool-call context; nothing in the tool uses it, and
  // supplying it here is what keeps the scripted answer reading the live figure instead of a cached copy.
  const context = { toolCallId: 'sc-economia', messages: [], context: undefined } as Parameters<
    NonNullable<typeof tools.economiaSeries.execute>
  >[1];
  const out = await tools.economiaSeries.execute?.({ question, count: 6, language: 'pt' }, context);
  return (out ?? {}) as ToolResult;
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
    id: 'money-selic',
    priority: 6,
    match: [
      /\b(taxa )?selic\b/i,
      /\bjuros (do|da) (banco central|selic)\b/i,
      /\bqual (a|é a|o) (?:taxa (?:de )?(?:juros|b[áa]sica)|juros)\b/i,
      /\binfl[ãa]ção\b/i,
      /\bipca\b|\bigpm\b/i,
      /\b(d[óo]lar|c[âa]mbio|ptax|usd)\b/i,
      /\b(selic|interest) rate\b/i,
      /\b(inflation|ipca)\b/i,
      /\b(dollar|exchange rate)\b/i,
    ],
    exclude: [/\bhist[óo]ric[oa]?\b|\bem \d{4}\b|\bvarios anos\b|\bprevis[ãa]o\b/i],
    reply: {
      pt: `# {value}

{meaning} Referência: **{date}**. [1]({url})

O número acima foi buscado agora no Banco Central, e a data é o que o torna utilizável: juros e preços mudam,
e um número sem data de referência não diz nada. Para um valor que não seja o de hoje, a série completa está na
página do Banco Central.`,
      en: `# {value}

{meaning} As of **{date}**. [1]({url})

The figure above was fetched just now from the Central Bank, and the date is what makes it usable: rates and
prices move, and a number with no as-of date says nothing. For anything that is not today’s rate, the full
series is on the Central Bank’s page.`,
    },
    vars: async (ctx: ScenarioCtx) => {
      const en = ctx.locale === 'en';
      const r = await read(ctx.text);
      const key = r.series ?? '';
      const meaning = MEANING[key] ?? { pt: 'É uma série publicada pelo Banco Central do Brasil.', en: 'It is a series published by the Banco Central do Brasil.' };
      const url = key === 'dolar' ? BCB_URL.ptac : key.startsWith('selic') ? BCB_URL.selic : BCB_URL.default;

      // No number is not a formatting problem. Say so in the same slot, so the answer cannot be read as a figure.
      if (!r.latest) {
        const value = en ? 'I could not get this figure just now.' : 'Não consegui obter esse número agora.';
        return { value, meaning: en ? 'The Banco Central did not answer, so there is nothing to quote.' : 'O Banco Central não respondeu, então não há nada a citar.', date: '—', url };
      }
      const value = r.latest.value.toLocaleString(en ? 'en-GB' : 'pt-BR', { maximumFractionDigits: 4 }) + (r.unit ? ` ${r.unit}` : '');
      const stale = r.status === 'stale';
      return {
        value: stale
          ? en
            ? `The latest available figure is **${value}**, and it is outdated.`
            : `O último número disponível é **${value}**, e está desatualizado.`
          : en
            ? `It is **${value}**.`
            : `Está em **${value}**.`,
        meaning: en ? meaning.en : meaning.pt,
        date: longDate(r.latest.date, ctx.locale),
        url,
      };
    },
    toolCalls: [{ toolName: 'economiaSeries', input: (ctx: ScenarioCtx) => ({ question: ctx.text, count: 6 }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Qual é a taxa Selic agora?', 'Qual o valor do IPCA?', 'Como está o dólar comercial?', 'O que é a taxa Selic?'],
      en: ['What is the Selic rate now?', 'What is the IPCA?', 'How is the commercial dollar?', 'What is the Selic rate?'],
    },
  },
];

export default scenarios;