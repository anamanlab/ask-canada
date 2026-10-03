/**
 * Scripted answers for benefits topics.
 *
 * The answers teach what each benefit is, who qualifies, and point to the official pages.
 * No live aggregate tool is available; answers cite official pages for reference.
 */
import { federalDaysOff, HOLIDAYS_URL, nationalHolidays, todayInBrazil } from '../data/holidays';
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

const BOLSA_URL = 'https://www.gov.br/mds/pt-br/acoes-e-programas/bolsa-familia';
const BPC_URL = 'https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc';
const CADUNICO_URL = 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico';

function vars({ locale, timeZone }: ScenarioCtx) {
  const today = todayInBrazil(timeZone);

  return {
    today,
  };
}

const scenarios = [
  {
    id: 'benefits-aggregate',
    priority: 4,
    match: [
      /\b(bolsa fam[ií]lia|bolsa famil|familias? (no|do) bolsa)\b/i,
      /\b(bpc|loas|benef[ií]cio de presta[cç][aã]o continuada)\b/i,
      /\b(cad[uú]nico|cadastro [uú]nico)\b/i,
      /\b(quantas? (fam[ií]lias?|benefici[aá]rios?) (no|do|recebem|tem) (bolsa|bpc|cadunico|cadastro [uú]nico|bolsa fam[ií]lia))\b/i,
      /\bhow many (families|beneficiaries) (in|on|receive) (bolsa familia|bpc|cadunico|cadastro)\b/i,
    ],
    exclude: [
      /\b(pessoa|pessoa f[ií]sica|cpf|meu|minha|meus|minhas|eu quero|eu preciso|como fa[cç]o|como posso|solicitar|pedir|requerer)\b/i,
      /\b(quem tem direito|como pe[cç]o|qual a idade|qual a renda|como funciona|qual o valor)\b/i,
    ],
    reply: {
      pt: `# Dados agregados de benefícios sociais

O governo federal publica periodicamente os números agregados dos principais programas sociais. Os números abaixo são as últimas divulgações oficiais.

- **Bolsa Família**: famílias com renda per capita até R$ 218, com prioridade para crianças, adolescentes, gestantes e nutrizes. [1](${BOLSA_URL})
- **BPC/LOAS**: para idosos (65+) ou pessoas com deficiência, renda familiar per capita até ¼ de salário mínimo. [2](${BPC_URL})
- **CadÚnico**: cadastro que abre acesso a Bolsa Família, BPC, Tarifa Social e outros programas. [3](${CADUNICO_URL})

Os valores mudam por política pública, não por revisão de página. Sempre confirme na página oficial. [1](${BOLSA_URL}) [2](${BPC_URL}) [3](${CADUNICO_URL})`,
      en: `# Aggregate social benefit figures

The federal government periodically publishes aggregate numbers for the main social programs. Figures below are the latest official releases.

- **Bolsa Família**: families with per-capita income up to R$ 218, prioritising children, adolescents, pregnant and nursing women. [1](${BOLSA_URL})
- **BPC/LOAS**: for seniors (65+) or people with disability, household per-capita income up to ¼ minimum wage. [2](${BPC_URL})
- **CadÚnico**: the register that grants access to Bolsa Família, BPC, Social Tariff and other programs. [3](${CADUNICO_URL})

Values change by policy, not by page revision. Always check the official page. [1](${BOLSA_URL}) [2](${BPC_URL}) [3](${CADUNICO_URL})`,
    },
    vars,
    checked: '2026-10-02',
    followUps: {
      pt: ['Quem tem direito ao Bolsa Família?', 'Como faço o CadÚnico?', 'O BPC conta como aposentadoria?'],
      en: ['Who qualifies for Bolsa Família?', 'How do I register for CadÚnico?', 'Does the BPC count as a pension?'],
    },
  },
  {
    id: 'benefits-bpc',
    priority: 6,
    match: [
      /\bbpc\b|\bloas\b|\bbenef[ií]cio de presta[cç][aã]o continuada\b/i,
      /\b(quem tem direito|como pe[cç]o|qual a idade|qual a renda)\b.*\b(bpc|loas|benef[ií]cio de presta[cç][aã]o continuada)\b/i,
    ],
    reply: {
      pt: `# O BPC/LOAS é para quem tem 65 anos ou mais, ou uma deficiência, e não consegue se sustentar sozinho.

São três condições: idade de 65 anos ou mais (qualquer idade no caso de deficiência), renda mensal por pessoa da família de até ¼ de salário mínimo, e não receber já um benefício de valor igual ou maior, como aposentadoria ou pensão. O BPC não é aposentadoria: passa por revisão periódica e não aumenta com contribuições.

A renda e o CadÚnico são conferidos no CRAS da sua cidade. O benefício é revisto a cada dois anos. [1](${BPC_URL})`,
      en: `# The BPC/LOAS is for people aged 65 or over, or with a disability, who cannot support themselves.

There are three conditions: being 65 or over (any age for a disability), a household income of up to one-quarter of the minimum wage per person, and not already receiving a benefit of equal or greater value, such as a pension. The BPC is not a pension: it undergoes periodic review and does not rise with contributions.

Income and the CadÚnico record are checked at your city's CRAS. The benefit is reviewed every two years. [1](${BPC_URL})`,
    },
    checked: '2026-10-02',
    followUps: {
      pt: ['Como faço o CadÚnico?', 'O BPC conta como aposentadoria?'],
      en: ['How do I register for CadÚnico?', 'Does the BPC count as a pension?'],
    },
  },
  {
    id: 'benefits-cadunico',
    priority: 6,
    match: [
      /\bcad[uú]nico\b|\bcadastro [uú]nico\b|\bcadastro ?\b.*\b[uú]nico\b/i,
      /\b(como fa[cç]o|onde fa[cç]o|preciso do) (o )?cad[uú]nico\b/i,
      /\b(bolsa fam[ií]lia|bpc).*cad[uú]nico\b|\bcad[uú]nico.*(bolsa fam[ií]lia|bpc)\b/i,
    ],
    reply: {
      pt: `# O CadÚnico é o cadastro que abre a porta dos benefícios sociais, e ele é feito no CRAS.

Você se cadastra na prefeitura ou no CRAS do seu município, com os documentos de quem mora com você. É esse cadastro que define o acesso ao Bolsa Família, ao BPC, à Tarifa Social de Energia Elétrica e a outros programas. Ele não se atualiza sozinho: a família é reconferida periodicamente. [1](${CADUNICO_URL})`,
      en: `# The CadÚnico is the register that opens the door to social benefits, and it is done at the CRAS.

You register at city hall or at your municipality's CRAS, with the documents of everyone you live with. That register is what decides access to Bolsa Família, the BPC, the Social Electricity Tariff and other programmes. It does not update itself: the household is re-checked periodically. [1](${CADUNICO_URL})`,
    },
    checked: '2026-10-02',
    followUps: {
      pt: ['Quem tem direito ao Bolsa Família?', 'O BPC exige o CadÚnico?'],
      en: ['Who qualifies for Bolsa Família?', 'Does the BPC require the CadÚnico?'],
    },
  },
  {
    id: 'benefits-bolsa',
    priority: 6,
    match: [
      /\bbolsa fam[ií]lia\b|\bbolsa fam\b/i,
      /\b(quem tem direito|como pe[cç]o|qual o valor|como funciona)\b.*\bbolsa fam[ií]lia\b/i,
    ],
    reply: {
      pt: `# O Bolsa Família é para famílias com renda per capita até R$ 218, com prioridade para quem tem crianças, adolescentes, gestantes ou nutrizes.

O benefício médio varia por composição familiar; consulte o CRAS para o valor exato do seu caso. A renda e o CadÚnico são conferidos no CRAS da sua cidade. [1](${BOLSA_URL})`,
      en: `# Bolsa Família is for households with per-capita income up to R$ 218, prioritising those with children, adolescents, pregnant or nursing women.

The average benefit varies by family composition; check with your CRAS for the exact amount for your case. Income and the CadÚnico record are checked at your city's CRAS. [1](${BOLSA_URL})`,
    },
    checked: '2026-10-02',
    followUps: {
      pt: ['Como faço o CadÚnico?', 'O Bolsa Família exige conta gov.br?'],
      en: ['How do I register for CadÚnico?', 'Does Bolsa Família require a gov.br account?'],
    },
  },
];

export default scenarios;