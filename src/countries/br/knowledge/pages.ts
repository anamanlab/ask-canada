/**
 * Curated official pages for the Brazil pack: the offline index behind `searchLocalSources`.
 *
 * Scope and honesty about scope: the full federal catalogue is `servicos.gov.br`'s 5,730-record dump
 * (`scripts/fetch-servicos.mjs` ingests and trims it into `servicos.index.ts`). Until that runs, this file
 * is the hand-verified core: the pages that carry most first questions, each checked to resolve on
 * 2026-10-02. A question that matches nothing here falls through to the model's own search, which is
 * restricted to `pack.sources.allowlist` — so an unmatched question still cannot cite a blog.
 *
 * Institutional home pages are the primary entries on purpose: a deep link rots, a body that owns the page
 * does not. `fetchOfficialPage` gets the specific service page at answer time.
 */
export type Page = {
  title: { pt: string; en: string };
  url: string;
  /** Extra words that should route here, beyond the title. Accents optional. */
  keywords: string[];
  ministry?: string;
};

export const PAGES: Page[] = [
  {
    title: { pt: 'Todos os serviços do Governo Federal', en: 'All federal government services' },
    url: 'https://www.gov.br/pt-br/servicos',
    keywords: ['servico', 'servicos', 'o que eu preciso', 'onde resolver', 'qual orgao', 'portal de servicos', 'servico federal'],
    ministry: 'receita',
  },
  {
    title: { pt: 'Meu INSS: benefícios, extrato e requerimentos', en: 'Meu INSS: benefits, statements and applications' },
    url: 'https://meu.inss.gov.br',
    keywords: ['meu inss', 'inss', 'beneficio', 'aposentadoria', 'pensao', 'rgps', 'cnis', 'carencia', 'contribuicao', 'beneficiario'],
    ministry: 'inss',
  },
  {
    title: { pt: 'INSS — Instituto Nacional do Seguro Social', en: 'INSS — National Social Security Institute' },
    url: 'https://www.gov.br/inss/pt-br',
    keywords: ['inss', 'instituto', 'agencia do inss', 'telefone do inss'],
    ministry: 'inss',
  },
  {
    title: { pt: 'Receita Federal', en: 'Brazilian Federal Revenue Service' },
    url: 'https://www.gov.br/receitafederal/pt-br',
    keywords: ['receita federal', 'receita', 'imposto', 'imposto de renda', 'irpf', 'declaração', 'darf', 'tributario'],
    ministry: 'receita',
  },
  {
    title: { pt: 'Inscrever Cidadão no Cadastro de Pessoas Físicas (CPF)', en: 'Register an individual for a CPF' },
    url: 'https://www.gov.br/pt-br/servicos/inscrever-no-cpf',
    keywords: ['cpf', 'inscrever no cpf', 'inscrição no cpf', 'tirar cpf', 'fazer cpf', 'emitir cpf', 'cpf registration'],
    ministry: 'receita',
  },
  {
    title: { pt: 'Ministério da Saúde', en: 'Ministry of Health' },
    url: 'https://www.gov.br/saude/pt-br',
    keywords: ['saude', 'ministerio da saude', 'sus', 'vacinacao', 'plano de saude', 'medicamento', 'doacao de orgaos'],
    ministry: 'saude',
  },
  {
    title: { pt: 'Ministério do Desenvolvimento e Assistência Social', en: 'Ministry of Social Development' },
    url: 'https://www.gov.br/mds/pt-br',
    keywords: ['bolsa familia', 'auxilio brasil', 'bpc', 'bpc idoso', 'bpc deficiente', 'cadunico', 'cadastro unico', 'auxilio', 'cras', 'assistencia social', 'beneficio social'],
    ministry: 'familia',
  },
  {
    title: { pt: 'Ministério do Trabalho e Emprego', en: 'Ministry of Labour and Employment' },
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br',
    keywords: ['trabalho', 'emprego', 'carteira de trabalho', 'ctps', 'fgts', 'decimo terceiro', 'salario', 'ferias'],
    ministry: 'trabalho',
  },
  {
    title: { pt: 'Ministério da Educação', en: 'Ministry of Education' },
    url: 'https://www.gov.br/mec/pt-br',
    keywords: ['educacao', 'ensino', 'escola', 'transferencia de escola', 'universidade', 'fies', 'prouni', 'enem'],
    ministry: 'educacao',
  },
  {
    title: { pt: 'Ministério dos Transportes', en: 'Ministry of Transport' },
    url: 'https://www.gov.br/transportes/pt-br',
    keywords: ['transporte', 'transito', 'rodovia', 'ferrovia', 'antt', 'dnit'],
    ministry: 'transporte',
  },
  {
    title: { pt: 'Ministério de Minas e Energia', en: 'Ministry of Mines and Energy' },
    url: 'https://www.gov.br/mme/pt-br',
    keywords: ['energia', 'energia eletrica', 'conta de luz', 'aneel', 'tarifa', 'bandeira', 'solar', 'petrobras'],
    ministry: 'energia',
  },
  {
    title: { pt: 'Ministério do Meio Ambiente e Mudança do Clima', en: 'Ministry of Environment' },
    url: 'https://www.gov.br/mma/pt-br',
    keywords: ['meio ambiente', 'ambiental', 'licenca', 'ibama', 'floresta', 'agua'],
    ministry: 'meioambiente',
  },
  {
    title: { pt: 'Ministério da Justiça e Segurança Pública', en: 'Ministry of Justice and Public Security' },
    url: 'https://www.gov.br/mj/pt-br',
    keywords: ['justica', 'policia federal', 'visto', 'imigracao', 'defensoria'],
    ministry: 'migracao',
  },
  {
    title: { pt: 'Obter passaporte — Portal de Serviços', en: 'Get a passport — Services Portal' },
    url: 'https://www.gov.br/pt-br/servicos/obter-passaporte-comum-para-brasileiro',
    keywords: ['passaporte', 'obter passaporte', 'tirar passaporte', 'renovar passaporte', 'valor do passaporte', 'taxa do passaporte', 'quanto custa o passaporte', 'gru', 'pagtesouro', 'policia federal', 'agendamento', '6 a 10 dias uteis', 'passaporte perdido', 'passaporte danificado'],
    ministry: 'migracao',
  },
  {
    title: { pt: 'Ministério das Relações Exteriores', en: 'Ministry of Foreign Affairs' },
    url: 'https://www.gov.br/mre/pt-br',
    keywords: ['itamaraty', 'relações exteriores', 'visto', 'visto de turista', 'visto de estudo', 'visto de trabalho', 'consulado', 'embaixada', 'passaporte no exterior', 'seguro viagem', 'moeda estrangeira'],
    ministry: 'migracao',
  },
  {
    title: { pt: 'Banco Central do Brasil', en: 'Central Bank of Brazil' },
    url: 'https://www.bcb.gov.br',
    keywords: ['banco central', 'bcb', 'selic', 'ipca', 'cambio', 'dolar', 'juros'],
    ministry: 'numeros',
  },
  {
    title: { pt: 'IBGE — Instituto Brasileiro de Geografia e Estatística', en: 'IBGE — Brazilian Institute of Geography and Statistics' },
    url: 'https://www.ibge.gov.br',
    keywords: ['ibge', 'censo', 'populacao', 'municipio', 'cidade', 'ibge codigo', 'estatistica'],
    ministry: 'numeros',
  },
  {
    title: { pt: 'Câmara dos Deputados', en: 'Chamber of Deputies' },
    url: 'https://www.camara.leg.br',
    keywords: ['camara', 'deputado', 'projeto de lei', 'proposicao', 'congresso'],
    ministry: 'congresso',
  },
  {
    title: { pt: 'Senado Federal', en: 'Federal Senate' },
    url: 'https://www.senado.leg.br',
    keywords: ['senado', 'senador', 'congresso', 'votacao'],
    ministry: 'congresso',
  },
  {
    title: { pt: 'Tribunal Superior Eleitoral (TSE)', en: 'Superior Electoral Court' },
    url: 'https://www.tse.jus.br',
    keywords: ['tse', 'eleicao', 'eleitoral', 'voto', 'candidata', 'titulo de eleitor', 'justificativa de voto'],
    ministry: 'congresso',
  },
  {
    title: { pt: 'Feriados nacionais e pontos facultativos', en: 'National public holidays and optional non-service days' },
    url: 'https://www.gov.br/mre/pt-br/eresp/feriados-e-pontos-facultativos',
    keywords: ['feriado', 'feriados', 'ponto facultativo', 'carnaval', 'corpus christi', 'sexta-feira santa', 'ferias'],
  },
  {
    title: { pt: 'Portal Nacional de Contratações Públicas (PNCP)', en: 'National Public Procurement Portal' },
    url: 'https://pncp.gov.br',
    keywords: ['pncp', 'licitacao', 'pregao', 'compras publicas', 'contratacao'],
    ministry: 'empresas',
  },
  {
    title: { pt: 'Login Único (conta gov.br)', en: 'Single sign-on (gov.br account)' },
    url: 'https://acesso.gov.br',
    keywords: ['login unico', 'conta gov.br', 'gov.br', 'entrar com gov.br', 'criar conta', 'nivel prata', 'nivel ouro'],
  },
  {
    title: { pt: 'Portal Brasileiro de Dados Abertos', en: 'Brazilian Open Data Portal' },
    url: 'https://dados.gov.br',
    keywords: ['dados abertos', 'open data', 'dataset', 'conjunto de dados', 'transparencia de dados'],
    ministry: 'numeros',
  },
];
