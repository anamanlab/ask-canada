/**
 * Citations used by the Brazil pack's scripted answers. `withTitles()` rewrites `[n](url)` to
 * `[n](url "Title")` so a source card reads as a page name instead of a URL slug.
 *
 * Only institutional home pages, all checked to resolve on 2026-10-02 (see `knowledge/pages.ts`).
 */
import type { Scenario } from '@/lib/scripted/types';

const U = {
  servicos: 'https://www.gov.br/pt-br/servicos',
  meuInss: 'https://meu.inss.gov.br',
  inss: 'https://www.gov.br/inss/pt-br',
  receita: 'https://www.gov.br/receitafederal/pt-br',
  saude: 'https://www.gov.br/saude/pt-br',
  mds: 'https://www.gov.br/mds/pt-br',
  trabalho: 'https://www.gov.br/trabalho-e-emprego/pt-br',
  mec: 'https://www.gov.br/mec/pt-br',
  transportes: 'https://www.gov.br/transportes/pt-br',
  mme: 'https://www.gov.br/mme/pt-br',
  mma: 'https://www.gov.br/mma/pt-br',
  mj: 'https://www.gov.br/mj/pt-br',
  casacivil: 'https://www.gov.br/casacivil/pt-br',
  mre: 'https://www.gov.br/mre/pt-br',
  bcb: 'https://www.bcb.gov.br',
  ibge: 'https://www.ibge.gov.br',
  camara: 'https://www.camara.leg.br',
  senado: 'https://www.senado.leg.br',
  tse: 'https://www.tse.jus.br',
  feriados: 'https://www.gov.br/mre/pt-br/eresp/feriados-e-pontos-facultativos',
  pncp: 'https://pncp.gov.br',
  acesso: 'https://acesso.gov.br',
  normas: 'https://normas.leg.br/',
} as const;

/** Page titles per language, so a source card reads as a page name instead of a URL slug. */
const TITLE_PT: Record<string, string> = {
  [U.servicos]: 'Todos os serviços do Governo Federal',
  [U.meuInss]: 'Meu INSS: benefícios, extrato e requerimentos',
  [U.inss]: 'INSS — Instituto Nacional do Seguro Social',
  [U.receita]: 'Receita Federal do Brasil',
  [U.saude]: 'Ministério da Saúde',
  [U.mds]: 'Ministério do Desenvolvimento e Assistência Social',
  [U.trabalho]: 'Ministério do Trabalho e Emprego',
  [U.mec]: 'Ministério da Educação',
  [U.transportes]: 'Ministério dos Transportes',
  [U.mme]: 'Ministério de Minas e Energia',
  [U.mma]: 'Ministério do Meio Ambiente',
  [U.mj]: 'Ministério da Justiça e Segurança Pública',
  [U.casacivil]: 'Casa Civil da Presidência da República',
  [U.mre]: 'Ministério das Relações Exteriores',
  [U.bcb]: 'Banco Central do Brasil',
  [U.ibge]: 'IBGE — Instituto Brasileiro de Geografia e Estatística',
  [U.camara]: 'Câmara dos Deputados',
  [U.senado]: 'Senado Federal',
  [U.tse]: 'Tribunal Superior Eleitoral',
  [U.feriados]: 'Feriados nacionais e pontos facultativos',
  [U.pncp]: 'Portal Nacional de Contratações Públicas',
  [U.acesso]: 'Login Único (conta gov.br)',
  [U.normas]: 'Legislação federal (normas.leg.br)',
};

const CITE = /\[(\d{1,2})\]\((https?:\/\/[^)\s]+)\)/g;

/** Adds a title to every citation whose URL is in the table for that language. */
export const titleCitations = (text: string, lang: string) => {
  const titles = lang === 'en' ? TITLE_EN : TITLE_PT;
  return text.replace(CITE, (m, n: string, url: string) => (titles[url] ? `[${n}](${url} "${titles[url]}")` : m));
};

const TITLE_EN: Record<string, string> = {
  [U.servicos]: 'All federal government services',
  [U.meuInss]: 'Meu INSS: benefits, statements and applications',
  [U.inss]: 'INSS — National Social Security Institute',
  [U.receita]: 'Brazilian Federal Revenue Service',
  [U.saude]: 'Ministry of Health',
  [U.mds]: 'Ministry of Social Development',
  [U.trabalho]: 'Ministry of Labour and Employment',
  [U.mec]: 'Ministry of Education',
  [U.transportes]: 'Ministry of Transport',
  [U.mme]: 'Ministry of Mines and Energy',
  [U.mma]: 'Ministry of Environment',
  [U.mj]: 'Ministry of Justice and Public Security',
  [U.casacivil]: 'Office of the President (Casa Civil)',
  [U.mre]: 'Ministry of Foreign Affairs',
  [U.bcb]: 'Central Bank of Brazil',
  [U.ibge]: 'IBGE — Brazilian Institute of Geography and Statistics',
  [U.camara]: 'Chamber of Deputies',
  [U.senado]: 'Federal Senate',
  [U.tse]: 'Superior Electoral Court',
  [U.feriados]: 'National public holidays and optional non-service days',
  [U.pncp]: 'National Public Procurement Portal',
  [U.acesso]: 'Single sign-on (gov.br account)',
  [U.normas]: 'Federal legislation (normas.leg.br)',
};

/** The title tables, so the starter renderer can check that a cited URL really has a title in both. */
export const TITLES = { pt: TITLE_PT, en: TITLE_EN };

export { U };

/** Adds page titles to every citation in a list of scenarios, in each language the pack ships. */
export function withTitles(list: Scenario[]): Scenario[] {
  const langs = ['pt', 'en'];
  for (const s of list) {
    const mapped: Record<string, string> = {};
    for (const lang of langs) {
      mapped[lang] = titleCitations(s.reply[lang] ?? s.reply.en, lang);
    }
    s.reply = { ...s.reply, ...mapped };
    if (s.after) {
      const after: Record<string, string> = {};
      for (const lang of langs) after[lang] = titleCitations(s.after[lang] ?? s.after.en, lang);
      s.after = { ...s.after, ...after };
    }
  }
  return list;
}