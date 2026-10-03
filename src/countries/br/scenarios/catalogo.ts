/**
 * Scripted answer for the services catalogue itself. Not a service, but the way to find one.
 *
 * "Como consultar um serviço no gov.br?" is a question about the catalogue, not about a benefit
 * or a document — and it kept being claimed by scenarios that matched a word in it ("gov.br" sent
 * it to retirement, "consulta" sent it to health). Both answers were confidently wrong about what
 * was asked. This scenario exists so the catalogue question gets the catalogue answer: where the
 * official list lives, how to search it, and that naming a specific service gets its page directly.
 */
import type { Scenario } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';
const CATALOGUE = 'https://www.gov.br/pt-br/servicos';

const scenarios: Scenario[] = [
  {
    id: 'service-catalog',
    priority: 7,
    match: [
      /\bcomo consult\w* um servi[çc]o\b/i,
      /\bconsult\w* .* no gov\.br\b/i,
      /\b(encontr|busc|procur)\w* um servi[çc]o\b/i,
      /\bcat[áa]logo de servi[çc]os\b/i,
      /\bhow (do|can) i (find|look up|consult) a (government )?service\b/i,
      /\bwhere (do|can) i find .*service\b/i,
      /\bservi[çc]os? gratuitos?\b/i,
      /\bquais .* gratuitos?\b/i,
      /\bwhich services are free\b/i,
      /\bfree (government )?services\b/i,
    ],
    exclude: [/\b(inss|sus|saude|saúde|receita|imposto|passaporte|cnh|mei|bolsa|bpc|cadunico)\b/i],
    reply: {
      pt: `# O catálogo oficial é o Portal de Serviços: ${CATALOGUE}. [1](${CATALOGUE})

É a lista de todos os serviços federais — cada um com o órgão responsável, se é gratuito, se é digital
e o link oficial para pedir. A busca entende o nome popular ("carteira de trabalho", "Bolsa Família",
"passaporte"), então não precisa saber o nome técnico.

Se já souber qual serviço quer, pergunte direto pelo nome dele que eu trago a página oficial.`,
      en: `# The official catalogue is the Services Portal: ${CATALOGUE}. [1](${CATALOGUE})

It lists every federal service — each with the responsible agency, whether it is free, whether it is
digital, and the official link to request it. The search understands the common name ("carteira de
trabalho", "Bolsa Família", "passaporte"), so no technical name is needed.

If you already know which service you want, ask for it by name and I will bring the official page.`,
    },
    checked: CHECKED,
    followUps: {
      pt: ['Como tirar passaporte?', 'Como emitir a carteira de trabalho?', 'Quais serviços são gratuitos?'],
      en: ['How do I get a passport?', 'What is the Selic rate?', 'Which services are free?'],
    },
  },
];

export default scenarios;