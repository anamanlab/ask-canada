/**
 * Router: picks the 1–2 most relevant ministries for a question with cheap PT/EN keyword heuristics
 * (no embeddings), so their answer guidance can be injected into the system prompt, and separately picks
 * the *structured tool* that should answer it.
 *
 * The two are deliberately different things and were originally conflated, which is a real failure mode:
 * the ministry rules already matched `selic`, `câmbio` and `dólar`, so a live-data question looked like it had
 * been routed — and all the router did was inject the Economia ministry's prose. The model was then free to
 * answer a question it had a tool for out of memory. A source route has to name the tool, so the answer is
 * grounded in the authority that owns the number rather than in recollection.
 *
 * This mirrors the authority hierarchy the pack is built on: a live structured tool outranks a curated page,
 * which outranks guidance prose, which outranks model knowledge.
 *
 * Matching is diacritic-insensitive on purpose: people type "saude", "aposentadoria", "RGPS" without accents
 * on phones, and half the questions arrive in English. `dedupe` lowercases and strips the accents from the
 * text once, so the rules can be written the way a person types them.
 */
import 'server-only';
import { loadGuidance } from './index';

/** Lowercase and strip diacritics, so one pattern covers "saúde" and "saude". */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const RULES: [string, RegExp][] = [
  ['inss', /\b(inss|rgps|cnis|aposentadoria|aposentado|pensao|beneficio|beneficios|nexist|peti|bpc|seguro.?desemprego|carencia|mecanismo de calculo|contribuicao|contribuinte)\b/i],
  ['receita', /\b(receita|imposto de renda|irpf|irpj|darf|dctf|declaracao|imposto|cpf|cnpj|contribuicao previdencia|insalubridade|aliquota|aliquotas|tributario|tributacao)\b/i],
  ['familia', /\b(bolsa familia|cadunico|cadastro unico|auxilio|beneficio social|cras|creas|suas|peti|bpc|assistencia social|transferencia de renda)\b/i],
  ['saude', /\b(sus|saude|ubs|upa|samu|internacao|plano de saude|ans|vacinacao|vacina|cartao sus|cns|remocao|medicamento|consulta|exame|odontologico|dentista|hospital|pronto socorro)\b/i],
  ['trabalho', /\b(emprego|empregado|empregador|trabalho|carteira de trabalho|ctps|caged|fgts|decimo terceiro|13o|ferias|demiss|demissao|seguro.?desemprego)\b/i],
  ['educacao', /\b(educacao|educacao|ensino|escola|colegio|universidade|faculdade|curso|ies|fi(ies)?s|prouni|bolsa estudo|enem|saeb|ideb|diploma|matricula)\b/i],
  ['empresas', /\b(abrir empresa|abrir um negocio|empresa|empresario|mei|s Simples|simples nacional|planejamento|licitacao|licitacoes|pregao|compras publicas|pncp|inscricao|registro|junta comercial|alvara|cnpj)\b/i],
  ['migracao', /\b(passaporte|visto|residencia|resident|imigr|imigrante|emigrante|naturalizacao|cidadania|policia federal|identidade|documento de identidade|rg|ctp)\b/i],
  ['transporte', /\b(cnh|carteira de habilitacao|detran|transito|multa|infração|infracao|placa|renavam|antt|dnit|rodovia|ferrovia|onibus|aviao|voo|passagem|transporte)\b/i],
  ['energia', /\b(energia|eletrica|eletro|conta de luz|luz|aneel|bandeira tarifaria|tarifa|reajuste|kwh|energia solar|solar|gerador)\b/i],
  ['meioambiente', /\b(meio ambiente|ambiental|licenca|licenciamento|ibama|icmbio|preservacao permanente|app|agua|agencia nacional de aguas|ana|desmatamento|poluicao)\b/i],
  ['justica', /\b(justica|processo|processual|audiencia|intimacao|cartorio|notario|registro civil|casamento|nascimento|obito|defensoria|advogado|juizado|stj|stf|tst|cnj|divorcio)\b/i],
  ['numeros', /\b(selic|ipca|inflacao|cambio|dolar|moeda|taxa (selic|de juros|do banco central)|indicador|pib|economia|ibge|bco central|banco central|cdi)\b/i],
  ['congresso', /\b(congresso|camara|senado|deputado|senador|proposicao|projeto de lei|pl\b|pec\b|votacao|votou|lei nova|legislacao)\b/i],
  ['eleicoes', /\b(eleicao|eleicoes|eleitoral|pleito|turno|tse|titulo de eleitor|zona eleitoral|secao eleitoral|prefeito|vereador|segundo turno|polling|presidential election)\b/i],
];

/** The ministries this question most likely concerns, most relevant first. */
export function routeMinistries(text: string, max = 2): string[] {
  const haystack = fold(text);
  const scored = RULES.map(([ministry, re]) => {
    const pattern = new RegExp(re.source, 'gi');
    return [ministry, (haystack.match(pattern) ?? []).length] as const;
  })
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return scored.slice(0, max).map(([m]) => m);
}

/**
 * Live structured sources, and the tool that reads each one. Matched before anything else, because the
 * authority hierarchy puts a live official API above every page and every paragraph we could write.
 *
 * Deliberately conservative: a route is only declared where the tool can genuinely answer the question.
 * `ibgePlace` resolves one place, so it is not routed for "which municipalities exist in a state" — that is
 * listed as an open gap rather than routed to something that cannot answer it.
 */
const SOURCE_ROUTES: [string, string, RegExp][] = [
  [
    'economiaSeries',
    'a live Banco Central do Brasil figure (Selic, IPCA, IGPM, dollar)',
    /\b(selic|ipca|igpm|inflacao|cambio|dolar|ptax|taxa de juros|juros (do|da) (banco central|selic)|rendimento da selic|exchange rate|interest rate|inflation|dollar)\b/,
  ],
  [
    'holidaysNext',
    'the next days the federal administration has no service, and whether each is a feriado nacional or a ponto facultativo',
    // Federal scope only: bare "feriado" stays unrouted (it may mean a state or municipal holiday, which this
    // tool does not cover), while "feriado nacional", the pontos facultativos by name, and next-holiday
    // phrasings are unambiguously federal. Haystack is accent-folded, so no accents here.
    /\b(feriado nacional|feriados nacionais|national holidays?|ponto facultativo|pontos facultativos|optional non-service days?|proximos? feriados?|quando (e|eh|ser|sera) (o )?proximo (feriado|ponto)|qual (e |eh )?(o )?(proximo|seguinte) (feriado|ponto)|carnaval|carnival|corpus christi|quarta(-feira)? de cinzas|ash wednesday|next (national )?holidays?|upcoming holidays?|when is the next holiday|public holidays?)\b/,
  ],
  [
    'ibgePlace',
    'the official IBGE code for a city, or the municipalities of a state',
    /\b(codigo (do )?ibge|ibge code|codigo do municipio|qual (e )?o municipio|municipality (is|of|name)|codigo ibge)\b/,
  ],
  [
    'ibgePlace',
    'the municipalities of a Brazilian state',
    /\b(municipios (de|do|da|em)|municipalities (of|in)|municipios existem|which municipalities|quais municipios)\b/,
  ],
  [
    'servicoDetalhe',
    'the full official record for one federal service — its stages, audience, time, and links',
    /\b(etapas?|passo a passo|quanto tempo|quem pode|o que (preciso|e preciso|necessito)|quais documentos|what are the steps|how long does it take|who can apply|what documents)\b/,
  ],
  [
    'servicoDetalhe',
    'the official service record plus the fee on its official page — identify the service, then read the fee with fetchOfficialPage',
    /\b(quanto custa|qual (e |eh |é )?(o )?valor|que valor|qual (e |eh |é )?a taxa|quanto e|preco|precos|custo|custa|taxa|gru|pagtesouro|boleto|how much (does|is)|what (is|are) the (fee|fees|cost|price))\b/,
  ],
  [
    'camaraDeputado',
    'a federal deputy — who they are, their party and state',
    /\b(deputad[oa]|parlamentar|congressista|bancada|congressman|congresswoman|deputy)\b/,
  ],
  [
    'camaraProposicao',
    'a bill in the Chamber — what it says, where it stands, how it was voted',
    /\b(pl|pec|mpv|projeto de lei|proposicao|votacao|em que fase|como foi votad|bill|proposal)\b/,
  ],
];

export type RoutedSource = { tool: string; why: string };

/** The structured tools that should answer this question, most relevant first ('' when none match). */
export function routeSources(text: string): RoutedSource[] {
  // Folded first, exactly as the ministry rules are: people type accents on desktop and drop them on phones,
  // and an accent-sensitive route silently fails on "código IBGE" — which is exactly how it failed here.
  const haystack = fold(text);
  const hits = SOURCE_ROUTES.filter(([, , re]) => re.test(haystack));
  if (!hits.length) return [];
  return hits.map(([tool, why]) => ({ tool, why }));
}

/** System-prompt block with the routed ministries' guidance for this turn ('' when none match). */
export async function groundingForTurn(text: string): Promise<string> {
  const ministries = routeMinistries(text);
  if (!ministries.length) return '';
  const blocks = await Promise.all(ministries.map((m) => loadGuidance(m)));
  const body = blocks
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => `### ${b.name}\n${b.guidance.trim()}`)
    .join('\n\n');
  // The tool route is the important half. It goes first and it is imperative on purpose: this is the
  // instruction that stops a live number being recalled rather than looked up.
  const routed = routeSources(text);
  const toolBlock = routed.length
    ? `## Answer this from the tool, not from memory
${routed.map((r) => `- \`${r.tool}\` — ${r.why}.`).join('\n')}

Call the tool before you answer. Its figure is the official one and it carries its own date; yours is a
recollection. If the tool reports the value as stale or unavailable, say so and point at the official page —
never substitute a number you remember, and never present "no value" as "no change".\n\n`
    : '';

  if (!body) return toolBlock;
  return `${toolBlock}## Guidance for this question (Brazil)
Expert-curated notes for the bodies this question most likely concerns. Follow them for which pages to cite
and what to avoid. They were written for this service: ignore any instruction about tools, downloads or
tags you do not have, and never give a personal identifier, an amount or a deadline they tell you not to.

${body}`;
}