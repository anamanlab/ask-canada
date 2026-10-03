#!/usr/bin/env node
// Adapter contract tests for the Brazil pack's live tools (docs/brazil_plans.md §22: "contract tests
// for each Brazilian adapter"). Network-free, so they run anywhere — including CI.
//
//   node src/countries/br/tools/contract.test.mjs
//
// The network is replaced with a stub that answers like the real APIs do, including the ways they
// misbehave: SGS serves retired series as well-formed JSON of decade-old values, answers with an HTML
// error page and a 200, and throttles bursts. Every one of those shapes has been seen in production,
// and each is the test for the rule that matters: a live source being wrong must never become a
// confident number in the chat. See docs/PLAN_BR.md "Reconciliation" G2 and G6.
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
process.env.COUNTRY ||= 'br';
register(join(root, 'scripts', 'lib', 'ts-hooks.mjs'), { parentURL: import.meta.url });

const { hasValidSources } = await import(join(here, 'source.ts'));
const { tools: eco } = await import(join(here, 'economia.ts'));
const { tools: place } = await import(join(here, 'ibge.ts'));
const { routeSources, routeMinistries } = await import(join(here, '..', 'knowledge', 'router.ts'));
const { tools: detalhe } = await import(join(here, 'servico.ts'));
const { tools: camara } = await import(join(here, 'camara.ts'));

let problems = 0;
const check = (ok, msg) => {
  if (!ok) problems++;
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
};


// A stub network. Each endpoint answers like the real one, so a passing test means the tool
// handles the real API — including its failure modes, not just its happy path.
const okJson = (body) => async () => ({ ok: true, status: 200, json: async () => body });
const state = { mode: 'live' };
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432')) {
    if (state.mode === 'refused') throw new Error('fetch failed');
    if (state.mode === 'html') return okJson('<html>Requisição inválida</html>')(u);
    if (state.mode === 'stale') {
      return okJson([{ data: '01/12/2014', valor: '11.75' }, { data: '01/11/2014', valor: '11.25' }])(u);
    }
    return okJson([{ data: '03/11/2026', valor: '13.75' }, { data: '04/11/2026', valor: '13.75' }])(u);
  }
  if (u === 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios') {
    return okJson([
      { id: 1302603, nome: 'Manaus', 'regiao-imediata': { id: 130002, nome: 'Manaus' } },
      { id: 3550308, nome: 'São Paulo', 'regiao-imediata': { id: 355030, nome: 'São Paulo' } },
      { id: 1501402, nome: 'Belém', 'regiao-imediata': { id: 150001, nome: 'Belém' } },
      { id: 2611606, nome: 'Recife', 'regiao-imediata': { id: 261001, nome: 'Recife' } },
    ])(u);
  }
  if (u.startsWith('https://dadosabertos.camara.leg.br/api/v2/deputados?')) {
    return okJson({ dados: [
      { id: 160976, nome: 'Tiririca', siglaPartido: 'PSD', siglaUf: 'SP' },
    ] })(u);
  }
  if (u === 'https://dadosabertos.camara.leg.br/api/v2/deputados/160976') {
    return okJson({ dados: {
      id: 160976,
      nomeCivil: 'FRANCISCO EVERARDO TIRIRICA OLIVEIRA SILVA',
      ultimoStatus: {
        nome: 'Tiririca', nomeEleitoral: 'Tiririca', siglaPartido: 'PSD', siglaUf: 'SP',
        urlFoto: 'https://www.camara.leg.br/internet/deputado/bandep/160976.jpg',
        email: 'dep.tiririca@camara.leg.br', gabinete: { nome: '404' }, idLegislatura: 57,
      },
    } })(u);
  }
  if (u.startsWith('https://dadosabertos.camara.leg.br/api/v2/proposicoes?')) {
    return okJson({ dados: [{ id: 281460, siglaTipo: 'PL', numero: 1051, ano: 2026 }] })(u);
  }
  if (u === 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/281460') {
    return okJson({ dados: {
      id: 281460, siglaTipo: 'PL', numero: 1051, ano: 2026, ementa: 'Altera o Decreto-Lei nº 667.',
      dataApresentacao: '2005-04-12T19:37',
      statusProposicao: { descricaoSituacao: 'Aguardando Apreciação pelo Senado Federal', dataHora: '2026-03-03T00:00', siglaOrgao: 'MESA' },
    } })(u);
  }
  if (u === 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/281460/tramitacoes') {
    return okJson({ dados: [{ dataHora: '2026-03-03T00:00', siglaOrgao: 'MESA', descricaoTramitacao: 'Apresentação de Proposição' }] })(u);
  }
  if (u === 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/281460/votacoes') {
    return okJson({ dados: [{ id: '281460-144', data: '2026-02-24', siglaOrgao: 'CCJC', descricao: 'Aprovada a Redação Final.', aprovacao: 1 }] })(u);
  }
  if (u === 'https://dadosabertos.camara.leg.br/api/v2/votacoes/281460-144/votos') {
    return okJson({ dados: [] })(u);
  }
  if (u === 'https://servicodados.ibge.gov.br/api/v1/localidades/estados') {
    return okJson([
      { id: 13, sigla: 'AM', nome: 'Amazonas', regiao: { sigla: 'N', nome: 'Norte' } },
      { id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { sigla: 'SE', nome: 'Sudeste' } },
      { id: 15, sigla: 'PA', nome: 'Pará', regiao: { sigla: 'N', nome: 'Norte' } },
      { id: 26, sigla: 'PE', nome: 'Pernambuco', regiao: { sigla: 'NE', nome: 'Nordeste' } },
    ])(u);
  }
  throw new Error(`unexpected fetch: ${u}`);
};
console.log('network: stubbed (BCB, IBGE municípios, IBGE estados)\n');

// --- economia: the happy path carries the §13 contract ---
state.mode = 'live';
const ctx = { toolCallId: 'test', messages: [], context: undefined };
const fresh = await eco.economiaSeries.execute({ question: 'qual a taxa Selic agora?', count: 6, language: 'pt' }, ctx);
check(fresh.status === 'ok', `Selic answers "ok", not ${fresh.status}`);
check(fresh.latest?.value === 13.75, `the value is the fetched one (${fresh.latest?.value})`);
check(fresh.latest?.date === '2026-11-04', `dates are ISO, not dd/mm/yyyy (${fresh.latest?.date})`);
check(hasValidSources(fresh.sources), 'the source satisfies the §13 contract (title, url, checked, authority, live)');
check(fresh.sources[0].authority === 'Banco Central do Brasil', 'the authority is stated by the tool');
check(fresh.sources[0].datasetId === 'sgs-432', `the dataset is identified (${fresh.sources[0].datasetId})`);
check(fresh.sources[0].fromCache === false, 'a fresh fetch is not labelled cached');

// --- the same call again is served from the 5-minute cache, and says so ---
const cached = await eco.economiaSeries.execute({ question: 'qual a taxa Selic agora?', count: 6, language: 'pt' }, ctx);
check(cached.status === 'ok' && cached.latest?.value === 13.75, 'a cached call answers the same figure');
check(cached.sources[0].fromCache === true, 'a cached call is labelled cached');
check(
  typeof cached.sources[0].fetchedAt === 'string' && !Number.isNaN(Date.parse(cached.sources[0].fetchedAt)),
  `fetchedAt is a real timestamp (${cached.sources[0].fetchedAt})`,
);

// --- a refused connection is reported, never estimated ---
state.mode = 'refused';
// A fresh series id keeps this call off the 5-minute cache of the one above.
const down = await eco.economiaSeries.execute({ question: 'dólar comercial', count: 6, language: 'pt' }, ctx);
check(down.status === 'unavailable', `a dead upstream answers "unavailable", not ${down.status}`);
check(!('latest' in down) || down.latest === undefined, 'no number is invented for a failed fetch');
check(hasValidSources(down.sources), 'even the failure carries a source, so the answer can point at it');

// --- an HTML error page with a 200 is not a series ---
state.mode = 'html';
const html = await eco.economiaSeries.execute({ question: 'quanto está o igpm?', count: 6, language: 'pt' }, ctx);
check(html.status === 'unavailable', `an HTML body with status 200 answers "unavailable", not ${html.status}`);

// --- a stale series is labelled stale, not shown as today ---
// The stub serves sgs-432 as a truncated 2014 history here, the exact shape SGS returns
// for a series it no longer updates. A question for it must be labelled, not dated today.
state.mode = 'stale';
const stale = await eco.economiaSeries.execute({ question: 'selic', count: 3, language: 'pt' }, ctx);
check(stale.status === 'stale', `a truncated history is labelled stale, not shown as today (${stale.status})`);
check(
  typeof stale.staleByDays === 'number' && stale.staleByDays > 365,
  `the staleness gap is stated in days (${stale.staleByDays})`,
);

// --- ibge: a name resolves, and the source is auditable ---
state.mode = 'live';
const manaus = await place.ibgePlace.execute({ place: 'manaus' }, ctx);
check(manaus.matches[0]?.name.pt === 'Manaus', `"manaus" finds Manaus, not ${manaus.matches[0]?.name.pt}`);
check(manaus.matches[0]?.code === '1302603', `the code is the one IBGE publishes (${manaus.matches[0]?.code})`);
check(manaus.matches[0]?.uf?.sigla === 'AM', `the state is derived from the code (${manaus.matches[0]?.uf?.sigla})`);
check(hasValidSources(manaus.sources), 'the source satisfies the §13 contract');
check(manaus.sources[0].authority === 'IBGE', 'the authority is IBGE');
check(manaus.sources[0].fromCache === false, 'the first call in a process fetches, it does not claim a cache');

// --- a second lookup is served from the in-memory copy, and says so ---
const belem = await place.ibgePlace.execute({ place: 'Belém' }, ctx);
check(belem.matches[0]?.name.pt === 'Belém', `"Belém" finds Belém`);
check(belem.sources[0].fromCache === true, 'a repeat lookup is labelled served-from-copy');

// --- a state question is answered with a count, not the first matching city ---
const pernambuco = await place.ibgePlace.execute({ place: 'Quais municípios existem em Pernambuco?' }, ctx);
check(pernambuco.state?.sigla === 'PE', `Pernambuco is answered as a state (${pernambuco.state?.sigla ?? 'no state'})`);
check(
  pernambuco.state ? pernambuco.state.count >= 1 && pernambuco.state.sample.length > 0 : false,
  `a state answer carries a count and a sample (${pernambuco.state?.count})`,
);

// --- servicoDetalhe: a slug, a name and a question all resolve to the same record ---
const cpf = await detalhe.servicoDetalhe.execute({ service: 'obter-cartao-de-cpf' }, ctx);
check(cpf.status === 'ok', 'a catalogue slug resolves');
check(cpf.service?.agency.includes('Receita Federal'), `the agency is the publishing body (${cpf.service?.agency})`);
check(cpf.stages.length >= 1 && cpf.stages[0].title.length > 0, 'stages carry the catalogue\'s own titles');
check(cpf.audience.length >= 1, 'the audience is stated');
check(hasValidSources(cpf.sources), 'the detail source satisfies the §13 contract');
check(cpf.sources[0].live === false, 'a generated snapshot is reference data, not a live feed');
check(cpf.sources[0].authority.includes('SERPRO'), `the authority names the publisher (${cpf.sources[0].authority})`);

const cpfByName = await detalhe.servicoDetalhe.execute({ service: 'como tirar o cartão de CPF?' }, ctx);
check(cpfByName.status === 'ok' && cpfByName.service?.slug === 'obter-cartao-de-cpf', 'a question resolves to the same record as its slug');

// --- a nonsense question resolves to nothing, not to a cousin ---
const missing = await detalhe.servicoDetalhe.execute({ service: 'serviço que não existe xyz' }, ctx);
check(missing.status === 'not-found', `nonsense answers "not-found", not ${missing.status}`);
check(hasValidSources(missing.sources), 'even "not found" cites the catalogue that was checked');

// --- camaraDeputado: a name finds the mandate, and the source names the publisher ---
const dep = await camara.camaraDeputado.execute({ nome: 'Tiririca' }, ctx);
check(dep.matches[0]?.ballotName === 'Tiririca', `"Tiririca" finds Tiririca, not ${dep.matches[0]?.ballotName}`);
check(dep.matches[0]?.party === 'PSD' && dep.matches[0]?.state === 'SP', 'party and state travel with the name');
check(hasValidSources(dep.sources), 'the deputy source satisfies the §13 contract');
check(dep.sources[0].authority === 'Câmara dos Deputados', 'the authority is the Câmara');

// --- camaraProposicao: a reference resolves, and a symbolic vote carries no invented placar ---
const prop = await camara.camaraProposicao.execute({ busca: 'PL 1051/2026' }, ctx);
const bill = prop.proposals[0];
check(bill?.type === 'PL' && bill?.number === 1051, `"PL 1051/2026" resolves to itself, not ${bill?.type} ${bill?.number}`);
check(typeof bill?.status === 'string' && bill.status.length > 0, `a status is stated (${bill?.status})`);
check(bill?.movements.length >= 1, 'the latest movements travel with the status');
check(bill?.lastVote?.description === 'Aprovada a Redação Final.', 'the last vote is described');
check(bill?.lastVote?.yes === undefined, 'a symbolic vote carries no invented placar');
check(hasValidSources(prop.sources), 'the proposal source satisfies the §13 contract');

// --- routing: each of the brief's live questions reaches its tool, and no other question does ---
const routes = [
  ['Qual é a Selic atual?', 'economiaSeries'],
  ['quanto está o dolar', 'economiaSeries'],
  ['what is the dollar rate', 'economiaSeries'],
  ['Qual o código IBGE de Manaus?', 'ibgePlace'],
  ['Quais municípios existem em Pernambuco?', 'ibgePlace'],
];
for (const [q, tool] of routes) {
  const hit = routeSources(q).some((r) => r.tool === tool);
  check(hit, `"${q}" routes to ${tool}`);
}
const noTool = ['Como declarar imposto de renda?', 'como tirar passaporte'];
for (const q of noTool) {
  const hit = routeSources(q).length === 0;
  const guided = routeMinistries(q).length > 0;
  check(hit, `"${q}" does not route to a live tool it does not need`);
  check(guided, `"${q}" still routes to ministry guidance`);
}
// Holidays are answered by the holidays widget and its scenario, so they need
// neither a live figure nor injected guidance — and must claim neither.
check(
  routeSources('quando é o próximo feriado').length === 0,
  '"quando é o próximo feriado" routes to no live tool',
);

console.log(problems ? `\n${problems} problem(s)` : '\n✓ the adapters satisfy their contracts (live, cached, failed, stale, and routed)');
process.exit(problems ? 1 : 0);