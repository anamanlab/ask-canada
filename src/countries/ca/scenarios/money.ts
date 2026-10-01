/**
 * Scripted scenarios for the `money` widget (EN + FR). Facts: widgets/money/data.ts; pages: widgets/money/links.ts.
 * What is read from the question lives in widgets/money/scenario-parse.ts; the answers built from it in
 * widgets/money/scenario-replies.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../widgets/money/links';
import { budgetInput, compareInput, mortgageInput, respToolInput, words } from '../widgets/money/scenario-parse';
import { mortgageVars, respVars } from '../widgets/money/scenario-replies';

type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };

const scenarios: Scenario[] = [
  {
    id: 'money-resp',
    priority: 6,
    match: [
      /\b(RESP|CESG|canada education savings grant|education savings grant|education savings)\b/i,
      /\bsav\w*\b.*\b(kid|kids|child|children|son|daughter|baby|grand\w*)\b.*\b(education|school|college|university|tuition)\b/i,
      /\bsav\w*\b.*\b(\d{1,2}[- ]?(year|yr)[- ]?old|kid|child|son|daughter|baby)['’]?s?\b.*\b(education|school|college|university|tuition)\b/i,
      /\b(REEE|SCEE)\b/,
      words(/\b(subvention canadienne pour l[’']épargne-études|épargne-études)\b/i),
      words(/\bépargn\w*\b.*\b(études|université|cégep)\b.*\b(enfant|fils|fille|bébé)\b/i),
      words(/\bépargn\w*\b.*\b(enfant|fils|fille|bébé)\b.*\b(études|université|cégep)\b/i),
    ],
    exclude: [/\b(learning bond|bon d[’']études)\b/i, words(/\b(RDSP|REEI|disability savings|épargne-invalidité)\b/i)],
    reply: {
      en: `# {heading}

{lead} [1](${URLS.respAmounts.en})

Families with lower or middle incomes get an extra 10% or 20% on the first $500 each year. Children from lower-income families can also get the **Canada Learning Bond**, up to $2,000, without you putting in a dollar. [1](${URLS.respAmounts.en}) [2](${URLS.clb.en})

To start, open an RESP with a provider and name your child as the beneficiary. The provider applies for the grant for you. [3](${URLS.respOpen.en})

The planner below shows what the RESP could grow to. Move the sliders to try your own numbers.`,
      fr: `# {heading}

{lead} [1](${URLS.respAmounts.fr})

Les familles à revenu faible ou moyen reçoivent 10 % ou 20 % de plus sur les premiers 500 $ chaque année. Les enfants de familles à faible revenu peuvent aussi recevoir le **Bon d’études canadien**, jusqu’à 2 000 $, sans que vous versiez un dollar. [1](${URLS.respAmounts.fr}) [2](${URLS.clb.fr})

Pour commencer, ouvrez un REEE auprès d’un fournisseur et désignez votre enfant comme bénéficiaire. Le fournisseur demande la subvention pour vous. [3](${URLS.respOpen.fr})

Le planificateur ci-dessous montre ce que le REEE pourrait atteindre. Déplacez les curseurs pour essayer vos propres chiffres.`,
    },
    vars: respVars,
    toolCalls: [
      {
        toolName: 'moneyRespPlanner',
        input: ({ text, lang, timeZone }: Ctx) => ({ ...respToolInput(text), lang, timeZone }),
      },
    ],
    followUps: {
      en: ['What is the Canada Learning Bond?', 'Should I use a TFSA or an RRSP?', 'Help me make a monthly budget', 'Am I eligible for the Canada Child Benefit?'],
      fr: ['Qu’est-ce que le Bon d’études canadien?', 'Devrais-je utiliser un CELI ou un REER?', 'Aidez-moi à faire un budget mensuel', 'Suis-je admissible à l’Allocation canadienne pour enfants?'],
    },
  },

  {
    id: 'money-clb',
    priority: 8,
    match: [/\b(canada )?learning bond\b/i, /\bCLB\b/, /\bbon d[’']études( canadien)?\b/i, /\bBEC\b/],
    reply: {
      en: `# The Canada Learning Bond puts up to *$2,000* in your child’s RESP, and you don’t have to add a cent.

It’s for children born in 2004 or later from lower-income families: **$500** the first year, then **$100** for each year they’re eligible, up to age 15. For July 2026 to June 2027, a family with 1 to 3 children qualifies with an adjusted family net income of **$58,523 or less**. [1](${URLS.respAmounts.en})

It’s retroactive, so past years count. You can request it until your child turns 18; after that, they can request it themselves until 21. You just need an RESP: ask the provider to apply. [1](${URLS.respAmounts.en}) [2](${URLS.clb.en})

Starting in April 2028, the government will open an RESP automatically for eligible children born in 2024 or later. [2](${URLS.clb.en})

Below is what the bond adds on its own. Move the yearly amount to see what the grant would add on top.`,
      fr: `# Le Bon d’études canadien verse jusqu’à *2 000 $* dans le REEE de votre enfant, sans que vous ajoutiez un sou.

Il s’adresse aux enfants nés en 2004 ou après, dans des familles à faible revenu : **500 $** la première année, puis **100 $** pour chaque année d’admissibilité, jusqu’à 15 ans. De juillet 2026 à juin 2027, une famille de 1 à 3 enfants y a droit si son revenu familial net rajusté est de **58 523 $ ou moins**. [1](${URLS.respAmounts.fr})

Il est rétroactif : les années passées comptent. Vous pouvez en faire la demande jusqu’aux 18 ans de votre enfant; ensuite, il peut la faire lui-même jusqu’à 21 ans. Il faut seulement un REEE : demandez au fournisseur de présenter la demande. [1](${URLS.respAmounts.fr}) [2](${URLS.clb.fr})

À compter d’avril 2028, le gouvernement ouvrira automatiquement un REEE pour les enfants admissibles nés en 2024 ou après. [2](${URLS.clb.fr})

Voici ce que le bon ajoute à lui seul. Modifiez le montant annuel pour voir ce que la subvention ajouterait en plus.`,
    },
    toolCalls: [
      {
        toolName: 'moneyRespPlanner',
        input: ({ text, lang, timeZone }: Ctx) => {
          const i = respToolInput(text);
          return { ...i, incomeTier: 'low', annual: i.annual ?? 0, lang, timeZone };
        },
      },
    ],
    followUps: {
      en: ['How much is the Canada Education Savings Grant?', 'Help me make a monthly budget', 'Am I eligible for the Canada Child Benefit?'],
      fr: ['Combien donne la Subvention canadienne pour l’épargne-études?', 'Aidez-moi à faire un budget mensuel', 'Suis-je admissible à l’Allocation canadienne pour enfants?'],
    },
  },

  {
    id: 'money-compare',
    priority: 9,
    match: [
      /\b(tfsa|rrsp|fhsa)\b.*\b(or|vs\.?|versus|and|compared)\b.*\b(tfsa|rrsp|fhsa)\b/i,
      /\b(difference|which|better|best|should i)\b.*\b(tfsa|rrsp|fhsa)\b/i,
      /\b(tfsa|rrsp|fhsa)\b.*\b(better|best|worth it|difference)\b/i,
      /\b(best|which|what)\b.*\b(account|way)\b.*\bsav\w*\b.*\b(house|home|condo|down ?payment)\b/i,
      /\bsav\w*\b.*\b(for )?(a |my )?(first )?(house|home|condo|down ?payment)\b.*\b(account|tax)\b/i,
      words(/\b(celi|reer|celiapp)\b.*\b(ou|vs\.?|versus|et|comparé)\b.*\b(celi|reer|celiapp)\b/i),
      words(/\b(différence|lequel|laquelle|meilleur|devrais-je)\b.*\b(celi|reer|celiapp)\b/i),
      words(/\b(meilleur|quel)\b.*\bcompte\b.*\b(maison|propriété|mise de fonds)\b/i),
    ],
    exclude: [/\b(room|how much can i|limit|deadline|droits de cotisation|plafond|date limite)\b/i],
    reply: {
      en: `# It comes down to *what you’re saving for* and your tax rate now versus later.

- **TFSA**: no deduction going in, but everything comes out tax-free, and what you take out is added back to your room the next January 1. New room in 2026 is **$7,000**. [1](${URLS.tfsaRoom.en})
- **RRSP**: contributions are tax-deductible and withdrawals are taxed. New room is 18% of last year’s earned income, up to **$33,810** for 2026. [2](${URLS.rrspLimit.en}) [3](${URLS.savingFuture.en})
- **FHSA**: for first-time home buyers. Contributions are deductible **and** qualifying withdrawals for a first home are tax-free: **$8,000** a year, **$40,000** in total. [4](${URLS.fhsa.en})

A simple rule: if your tax rate is higher now than it will be when you take the money out, the RRSP’s deduction is worth more. If it will be the same or higher later, the TFSA wins. Try your own rates below. This is general information, not financial advice.`,
      fr: `# Tout dépend de *la raison de votre épargne* et de votre taux d’imposition maintenant par rapport à plus tard.

- **CELI** : pas de déduction à l’entrée, mais tout est retiré sans impôt, et les retraits s’ajoutent à vos droits le 1ᵉʳ janvier suivant. Les nouveaux droits pour 2026 sont de **7 000 $**. [1](${URLS.tfsaRoom.fr})
- **REER** : les cotisations sont déductibles et les retraits sont imposés. Les nouveaux droits correspondent à 18 % du revenu gagné l’an dernier, jusqu’à **33 810 $** pour 2026. [2](${URLS.rrspLimit.fr}) [3](${URLS.savingFuture.fr})
- **CELIAPP** : pour les personnes qui achètent une première propriété. Les cotisations sont déductibles **et** les retraits admissibles pour une première propriété sont libres d’impôt : **8 000 $** par année, **40 000 $** au total. [4](${URLS.fhsa.fr})

Une règle simple : si votre taux d’imposition est plus élevé maintenant qu’au moment du retrait, la déduction du REER vaut plus. S’il est le même ou plus élevé au retrait, le CELI l’emporte. Essayez vos propres taux ci-dessous. Ce sont des renseignements généraux, pas des conseils financiers.`,
    },
    toolCalls: [{ toolName: 'moneyAccountCompare', input: ({ text, lang }: Ctx) => ({ ...compareInput(text), lang }) }],
    followUps: {
      en: ['How much TFSA room do I have?', 'Can I afford a $600,000 home on $120,000 a year?', 'When is the RRSP deadline?'],
      fr: ['Combien de droits de cotisation au CELI ai-je?', 'Puis-je me permettre une maison de 600 000 $ avec 120 000 $ par année?', 'Quelle est la date limite du REER?'],
    },
  },

  {
    id: 'money-first-home',
    priority: 10,
    match: [
      /\b(fhsa|rrsp|tfsa|account|save|saving)\b.*\b(first home|house|home|condo|down ?payment)\b/i,
      /\b(first home|house|home|condo|down ?payment)\b.*\b(fhsa|rrsp|tfsa|account)\b/i,
      words(/\b(celiapp|reer|celi|compte|épargn\w*)\b.*\b(première propriété|maison|propriété|condo|mise de fonds)\b/i),
      words(/\b(première propriété|maison|propriété|mise de fonds)\b.*\b(celiapp|reer|celi|compte)\b/i),
    ],
    exclude: [/\b(room|limit|deadline|afford|stress test|minimum|qualify|droits de cotisation|plafond|date limite|permettre|test de résistance|minimale|admissible)\b/i],
    reply: {
      en: `# For a first home, the *FHSA* is hard to beat: a deduction going in, no tax coming out.

The First Home Savings Account is for first-time buyers. Contributions are tax-deductible, and qualifying withdrawals to buy or build a first home are tax-free: **$8,000** a year, **$40,000** in total. [1](${URLS.fhsa.en})

You can also use your RRSP. The **Home Buyers’ Plan** lets you take up to **$60,000** out for a first home, but you pay it back over 15 years. For a first withdrawal in 2026 to 2028, repayments start in the fifth year after. [2](${URLS.hbp.en})

A TFSA works for any goal: no deduction, but tax-free withdrawals at any time. New room in 2026 is **$7,000**. [3](${URLS.tfsaRoom.en})

Compare them with your own tax rate below. This is general information, not financial advice.`,
      fr: `# Pour une première propriété, le *CELIAPP* est difficile à battre : une déduction à l’entrée, aucun impôt à la sortie.

Le compte d’épargne libre d’impôt pour l’achat d’une première propriété s’adresse aux premiers acheteurs. Les cotisations sont déductibles, et les retraits admissibles pour acheter ou construire une première propriété sont libres d’impôt : **8 000 $** par année, **40 000 $** au total. [1](${URLS.fhsa.fr})

Vous pouvez aussi utiliser votre REER. Le **Régime d’accession à la propriété** vous permet de retirer jusqu’à **60 000 $** pour une première propriété, mais vous le remboursez sur 15 ans. Pour un premier retrait de 2026 à 2028, les remboursements commencent la cinquième année suivante. [2](${URLS.hbp.fr})

Le CELI convient à tous les objectifs : pas de déduction, mais des retraits libres d’impôt en tout temps. Les nouveaux droits pour 2026 sont de **7 000 $**. [3](${URLS.tfsaRoom.fr})

Comparez-les avec votre propre taux d’imposition ci-dessous. Ce sont des renseignements généraux, pas des conseils financiers.`,
    },
    toolCalls: [{ toolName: 'moneyAccountCompare', input: ({ text, lang }: Ctx) => ({ ...compareInput(text), goal: 'home', firstHome: true, lang }) }],
    followUps: {
      en: ['Can I afford a $600,000 home on $120,000 a year?', 'What is the minimum down payment?', 'How much FHSA room do I have?'],
      fr: ['Puis-je me permettre une maison de 600 000 $ avec 120 000 $ par année?', 'Quelle est la mise de fonds minimale?', 'Combien de droits de cotisation au CELIAPP ai-je?'],
    },
  },

  {
    id: 'money-mortgage',
    priority: 10,
    match: [
      /\bstress[- ]test\b/i,
      /\b(afford|qualify for)\b.*\b(home|house|condo|townhouse|mortgage|place)\b/i,
      /\b(how much|what size)\b.*\bmortgage\b.*\b(qualify|get|afford|approved)\b/i,
      /\b(minimum )?down ?payment\b.*\b(need|minimum|how much|required)\b/i,
      /\b(how much|minimum)\b.*\bdown ?payment\b/i,
      /\b(cmhc|mortgage (loan )?insurance)\b/i,
      words(/\btest de résistance\b/i),
      words(/\b(permettre|admissible|me qualifier|avoir les moyens)\b.*\b(maison|propriété|condo|hypothèque|prêt hypothécaire)\b/i),
      words(/\bmise de fonds\b.*\b(minimale|combien|faut-il|nécessaire)\b/i),
      /\b(combien|minimum)\b.*\bmise de fonds\b/i,
      words(/\b(assurance prêt hypothécaire|schl)\b/i),
    ],
    // Paragraphs are built in mortgageVars(): a down-payment question leads with the down-payment rule, the rest lead with the stress test.
    reply: { en: '# {heading}\n\n{p1}\n\n{p2}\n\n{outro}', fr: '# {heading}\n\n{p1}\n\n{p2}\n\n{outro}' },
    vars: mortgageVars,
    toolCalls: [{ toolName: 'moneyMortgageStressTest', input: ({ text, lang }: Ctx) => ({ ...mortgageInput(text), lang }) }],
    followUps: {
      en: ['Should I use an FHSA or an RRSP to save for a home?', 'Help me make a monthly budget', 'How much TFSA room do I have?'],
      fr: ['Devrais-je utiliser un CELIAPP ou un REER pour acheter une maison?', 'Aidez-moi à faire un budget mensuel', 'Combien de droits de cotisation au CELI ai-je?'],
    },
  },

  {
    id: 'money-budget',
    priority: 7,
    match: [
      /\b(make|making|build|create|start|set up|plan|planning|help( me)?( with)?)\b.*\b(a |my )?(monthly )?budget\b/i,
      /\bbudget(ing)? (planner|plan|help|tips|calculator|template)\b/i,
      /\b(my|monthly|household|personal|family) budget\b/i,
      /\bemergency (fund|savings)\b/i,
      /\bspend(ing)? more than i (make|earn)\b/i,
      words(/\b(faire|établir|préparer|créer|planifier|m[’']aider à faire)\b.*\bbudget\b/i),
      /\b(mon|notre) budget\b/i,
      /\bbudget (mensuel|familial|personnel)\b/i,
      /\bfonds d[’']urgence\b/i,
      words(/\bdépense\w* plus que (je gagne|mon revenu)\b/i),
    ],
    exclude: [words(/\b(federal|government|budget 20\d\d|tabled|fédéral|gouvernement|déposé)\b/i)],
    reply: {
      en: `# A budget starts with *what comes in* and what goes out each month.

List your take-home pay, then your spending: rent or mortgage, utilities, groceries, transportation, debt payments and the rest. Recent pay stubs, bills and account statements make it quick. [1](${URLS.budget.en})

Then plan for surprises. Your emergency fund should cover **3 to 6 months** of living expenses. [1](${URLS.budget.en})

Fill in your numbers below. It stays on this device. When you’re done, the FCAC Budget Planner can compare your budget with Canadians in a similar situation. [2](${URLS.budgetPlanner.en})`,
      fr: `# Un budget commence par *ce qui entre* et ce qui sort chaque mois.

Inscrivez votre salaire net, puis vos dépenses : loyer ou hypothèque, services publics, épicerie, transport, paiements de dettes et le reste. Vos talons de paie, factures et relevés de compte récents facilitent la tâche. [1](${URLS.budget.fr})

Prévoyez ensuite les imprévus. Votre fonds d’urgence devrait couvrir de **3 à 6 mois** de dépenses habituelles. [1](${URLS.budget.fr})

Entrez vos chiffres ci-dessous. Ils restent sur cet appareil. Ensuite, le Planificateur budgétaire de l’ACFC peut comparer votre budget à celui de Canadiens dans une situation semblable. [2](${URLS.budgetPlanner.fr})`,
    },
    toolCalls: [{ toolName: 'moneyBudgetPlanner', input: ({ text, lang }: Ctx) => ({ ...budgetInput(text), lang }) }],
    followUps: {
      en: ['Should I use a TFSA or an RRSP?', 'How can I file my taxes for free?', 'Am I eligible for the Canada Child Benefit?'],
      fr: ['Devrais-je utiliser un CELI ou un REER?', 'Comment produire ma déclaration de revenus gratuitement?', 'Suis-je admissible à l’Allocation canadienne pour enfants?'],
    },
  },
];

export default scenarios;
