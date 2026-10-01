/** Scripted scenarios for the `taxes` widget (EN + FR). Facts: widgets/taxes/data.ts; helpers: widgets/taxes/scenario/. */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../widgets/taxes/urls';
import { estimateVars } from '../widgets/taxes/scenario/estimate-vars';
import { estimatorInput, freeFilingInput, refundInput, roomInput, selfEmployed } from '../widgets/taxes/scenario/parse-question';
import { deadlineVars, refundVars, rrspDeadlineVars } from '../widgets/taxes/scenario/refund-vars';
import { roomVars } from '../widgets/taxes/scenario/room-vars';

/** What a scenario's `vars` receives: the question and the answer language (no time zone). */
type Asked = { text: string; lang: 'en' | 'fr' };
/** What a tool call's `input` receives: the same, plus the reader's time zone for the tool's own "today". */
type Call = Asked & { timeZone?: string };

const taxes: Scenario[] = [
  /* ─────────────── RRSP deadline ─────────────── */
  {
    id: 'taxes-rrsp-deadline',
    priority: 8,
    match: [
      /\b(rrsp|registered retirement savings)\b.*\b(deadline|due|due date|cut-?off|last day)\b/i,
      /\b(deadline|due date|cut-?off|last day)\b.*\b(rrsp|registered retirement savings)\b/i,
      /\bwhen\b.*\b(contribute|put money)\b.*\brrsp\b/i,
      /\breer\b.*\b(date limite|échéance|dernier jour)/i,
      /\b(date limite|échéance|dernier jour)\b.*\breer\b/i,
      /\bquand\b.*\bcotiser\b.*\breer\b/i,
    ],
    exclude: [
      /\b(returns?|file|filing|déclaration|produire|home buyers|hbp|accession à la propriété|rap|rrif|ferr|turn(ing)? 71|71 ans)\b/i,
      /\b(died|deceased|décéd\w*)/i,
    ],
    reply: {
      en: `# Contribute by *{rrsp}* to deduct it on your {year} return.

RRSP contributions made from **{from} to {rrsp}** can be deducted on your {year} return. You can deduct up to your RRSP deduction limit: 18% of your {income} earned income, up to **$33,810**, plus unused room from past years, minus any pension adjustment. Your exact limit is on your latest notice of assessment. [1](${URLS.rrspLimit.en}) [2](${URLS.limits.en})

Going over your limit by more than $2,000 costs 1% a month on the excess. [1](${URLS.rrspLimit.en})

The return itself is due **{file}**. [3](${URLS.filingDates.en})

Here’s your countdown to the RRSP deadline, with the other dates for this return.`,
      fr: `# Cotisez au plus tard le *{rrsp}* pour déduire le montant dans votre déclaration de {year}.

Les cotisations à un REER versées du **{from} au {rrsp}** peuvent être déduites dans votre déclaration de {year}. Vous pouvez déduire jusqu’à votre maximum déductible au titre des REER : 18 % de votre revenu gagné en {income}, jusqu’à **33 810 $**, plus les droits inutilisés des années passées, moins tout facteur d’équivalence. Votre maximum exact figure sur votre dernier avis de cotisation. [1](${URLS.rrspLimit.fr}) [2](${URLS.limits.fr})

Si vous dépassez votre maximum de plus de 2 000 $, un impôt de 1 % par mois s’applique à l’excédent. [1](${URLS.rrspLimit.fr})

La déclaration elle-même doit être produite au plus tard le **{file}**. [3](${URLS.filingDates.fr})

Voici votre compte à rebours jusqu’à la date limite du REER, avec les autres dates importantes pour cette déclaration.`,
    },
    vars: ({ lang }: Asked) => rrspDeadlineVars(lang),
    toolCalls: [{ toolName: 'taxesDeadlines', input: ({ text, lang, timeZone }: Call) => ({ selfEmployed: selfEmployed(text), focus: 'rrsp', lang, timeZone }) }],
    followUps: {
      en: ['Estimate my tax refund', 'When is the tax filing deadline?', 'How can I file my taxes for free?'],
      fr: ['Estimer mon remboursement d’impôt', 'Quelle est la date limite pour produire ma déclaration?', 'Comment produire ma déclaration de revenus gratuitement?'],
    },
  },

  /* ─────────────── Deadlines ─────────────── */
  {
    id: 'taxes-deadline',
    priority: 7,
    match: [
      /\b(tax|taxes|filing|return|rrsp)\b.*\b(deadline|due|due date|cut-?off)\b/i,
      /\b(deadline|due date)\b.*\b(tax|taxes|filing|file|return|rrsp)\b/i,
      /\bwhen\b.*\b(do|should|must|have to|need to)\b.*\b(file|pay)\b.*\b(tax|taxes|return)\b/i,
      /\bwhen\b.*\b(taxes?|tax returns?)\b.*\bdue\b/i,
      /\bhow (long|many days)\b.*\b(tax (season|deadline)|file my taxes)\b/i,
      /\b(date limite|échéance|date d[’']échéance)\b.*\b(impôts?|déclaration|reer)\b/i,
      /\b(impôts?|déclaration|reer)\b.*\b(date limite|échéance)\b/i,
      /\bquand\b.*\b(produire|payer|faire)\b.*\b(impôts?|déclaration)\b/i,
    ],
    exclude: [/\b(corporat\w*|société|t2|gst|hst|tps|tvh|payroll|paie|died|deceased|décéd\w*)\b/i],
    reply: {
      en: `# Your 2026 return is due *{file}*.

That’s also the day to pay any balance owing, even if you file later. {selfLine} [1](${URLS.filingDates.en})

To deduct RRSP contributions on your 2026 return, make them by **{rrsp}**. [2](${URLS.rrspLimit.en})

If you owe tax and file late, the penalty is **5% of the balance plus 1% for each full month**, up to 12 months. So file on time even if you can’t pay yet. [3](${URLS.latePenalty.en})

Here’s your countdown, with every date that matters for this return.`,
      fr: `# Votre déclaration de 2026 doit être produite au plus tard le *{file}*.

C’est aussi la date limite pour payer tout solde dû, même si vous produisez plus tard. {selfLine} [1](${URLS.filingDates.fr})

Pour déduire des cotisations au REER dans votre déclaration de 2026, versez-les au plus tard le **{rrsp}**. [2](${URLS.rrspLimit.fr})

Si vous devez de l’impôt et produisez en retard, la pénalité est de **5 % du solde, plus 1 % par mois complet de retard**, jusqu’à 12 mois. Produisez donc à temps, même si vous ne pouvez pas encore payer. [3](${URLS.latePenalty.fr})

Voici votre compte à rebours, avec toutes les dates importantes pour cette déclaration.`,
    },
    vars: ({ text, lang }: Asked) => deadlineVars(text, lang),
    toolCalls: [{ toolName: 'taxesDeadlines', input: ({ text, lang, timeZone }: Call) => ({ selfEmployed: selfEmployed(text), lang, timeZone }) }],
    followUps: {
      en: ['Estimate my tax refund', 'How can I file my taxes for free?', 'How much can I put in my RRSP?'],
      fr: ['Estimer mon remboursement d’impôt', 'Comment produire ma déclaration de revenus gratuitement?', 'Combien puis-je verser dans mon REER?'],
    },
  },

  /* ─────────────── Estimator ─────────────── */
  {
    id: 'taxes-estimate',
    priority: 6,
    match: [
      /\b(estimate|calculate|calculator|figure out)\b.*\b(tax|taxes|refund)\b/i,
      /\b(how much|what)\b.*\b(refund|get back)\b/i,
      /\b(will|would|do|am) i\b.*\b(get a refund|owe|get money back|have to pay)\b/i,
      /\b(will|would|am|do|should|could) i\b.*\b(get|getting|receive|receiving|expect|see)\b.*\b(tax )?refund\b/i,
      /\b(do|will|would) i (owe|have to pay)\b/i,
      /\b(i['’]ll|i will) (get|owe|have to pay)\b.*\b(refund|taxes?|anything)\b/i,
      /\bhow much\b.*\b(tax|taxes)\b.*\b(pay|owe|on)\b/i,
      /\b(tax bracket|marginal (tax )?rate|income tax rates?)\b/i,
      /\bhow much\b.*\brrsp\b.*\b(save|saves|reduce)\b/i,
      /\b(estim\w*|calcul\w*)\b.*\b(impôts?|remboursement)\b/i,
      /\bcombien\b.*\b(impôts?|rembours\w*)\b/i,
      /\b(vais-je|est-ce que je vais)\b.*\b(recevoir|devoir|payer)\b/i,
      /\b(aurai-je|vais-je avoir|est-ce que (je vais avoir|j['’]aurai)|devrai-je)\b.*\b(remboursement|impôts?|payer)\b/i,
      /\b(tranche d[’']imposition|taux marginal|taux d[’']imposition)\b/i,
    ],
    exclude: [/\b(where(?:['’ʼ]?s| is)|status|when will|où est|quand vais-je recevoir|délai)\b/i, /\b(corporat\w*|société|gst|hst|tps|tvh|sales tax|payroll)\b/i],
    reply: {
      en: `# {heading}

Canada taxes income in brackets: federal rates run from **14% to 33%**, and your province or territory adds its own. Each rate applies only to the part of your income inside that bracket. [1](${URLS.rates.en})

Everyone gets a **basic personal amount** before tax starts: $16,452 federally for most people in 2026. [2](${URLS.indexation.en})

{last}`,
      fr: `# {heading}

Au Canada, le revenu est imposé par tranches : les taux fédéraux vont de **14 % à 33 %**, et votre province ou territoire ajoute les siens. Chaque taux s’applique seulement à la partie de votre revenu comprise dans cette tranche. [1](${URLS.rates.fr})

Tout le monde a droit à un **montant personnel de base** avant que l’impôt s’applique : 16 452 $ au fédéral pour la plupart des gens en 2026. [2](${URLS.indexation.fr})

{last}`,
    },
    vars: ({ text, lang }: Asked) => estimateVars(text, lang),
    toolCalls: [{ toolName: 'taxesEstimator', input: ({ text, lang }: Call) => ({ ...estimatorInput(text), lang }) }],
    followUps: {
      en: ['When is the tax deadline?', 'How much can I put in my RRSP?', 'How can I file my taxes for free?'],
      fr: ['Quelle est la date limite pour les impôts?', 'Combien puis-je verser dans mon REER?', 'Comment produire ma déclaration de revenus gratuitement?'],
    },
  },

  /* ─────────────── Savings room ─────────────── */
  {
    id: 'taxes-room',
    priority: 6,
    match: [
      /\b(tfsa|rrsp|fhsa|tax-free savings|first home savings|registered retirement savings)\b.*\b(room|limit|contribut\w*|how much|max\w*|put in|deposit)\b/i,
      /\b(room|limit|how much|max\w*|contribut\w*|put)\b.*\b(tfsa|rrsp|fhsa)\b/i,
      /\b(celi|reer|celiapp)\b.*\b(droits?|plafond|cotis\w*|combien|verser|maximum|limite)\b/i,
      /\b(droits?|plafond|cotis\w*|combien|verser|maximum|limite)\b.*\b(celi|reer|celiapp)\b/i,
    ],
    exclude: [/\b(deadline|due date|date limite|échéance)\b/i, /\b(home buyers|hbp|buy a (home|house)|accession à la propriété|\brap\b)\b/i, /\b(withdraw\w*|retir\w*)\b.*\b(house|home|maison)\b/i],
    reply: {
      en: `# {heading}

{bullets}

Your CRA account shows your official room, but it’s only updated once a year, so check it against your own records. Fill in what you know below.`,
      fr: `# {heading}

{bullets}

Votre compte de l’ARC indique vos droits officiels, mais il n’est mis à jour qu’une fois par année; comparez-le avec vos propres relevés. Remplissez ce que vous savez ci-dessous.`,
    },
    vars: ({ text, lang }: Asked) => roomVars(text, lang),
    toolCalls: [{ toolName: 'taxesSavingsRoom', input: ({ text, lang }: Call) => ({ ...roomInput(text), lang }) }],
    followUps: {
      en: ['When is the RRSP deadline?', 'Estimate my tax refund', 'How can I file my taxes for free?'],
      fr: ['Quelle est la date limite du REER?', 'Estimer mon remboursement d’impôt', 'Comment produire ma déclaration de revenus gratuitement?'],
    },
  },

  /* ─────────────── Free filing ─────────────── */
  {
    // Same intent id as the foundation's low-priority starter answer (paraphrases.json): this one wins.
    id: 'taxes-file',
    priority: 6,
    match: [
      /\bfree\b.*\b(tax|taxes|return|file|filing)\b/i,
      /\b(tax|taxes|return)\b.*\bfor free\b/i,
      /\b(tax clinics?|volunteer tax|cvitp|simplefile|simple file|netfile)\b/i,
      /\b(someone|help)\b.*\b(do|file|prepare)\b.*\bmy (taxes|tax return|return)\b/i,
      /\bgratuit\w*\b.*\b(impôts?|déclaration|produire)\b/i,
      /\b(impôts?|déclaration)\b.*\bgratuit\w*\b/i,
      /\b(comptoirs? d[’']impôts?|clinique d[’']impôts?|déclarer simplement|impôtnet|impotnet|bénévoles?)\b/i,
    ],
    exclude: [/\b(corporat\w*|société|t2|gst|hst|tps|tvh)\b/i],
    reply: {
      en: `# Yes, most people with a modest income can file *for free*.

- **Free tax clinics**: volunteers do your return for you if you have a modest income and a simple tax situation, for example **$40,000 or less for one person**. [1](${URLS.clinics.en})
- **SimpleFile**: a free CRA service for people with a lower income and a simple situation. You can file online with or without an invitation; by phone or on paper, you need one. [2](${URLS.simpleFile.en})
- **Certified software**: most certified tax software prepares a basic return for free if your income is modest, and files it online with NETFILE. [3](${URLS.software.en})

Starting in March 2027, the CRA will also invite 1\u00a0million eligible people to file a pre-filled return in their CRA account. [4](${URLS.howFile.en})

Check which option fits you below.`,
      fr: `# Oui, la plupart des gens à revenu modeste peuvent produire *gratuitement*.

- **Comptoirs d’impôts gratuits** : des bénévoles remplissent votre déclaration si votre revenu est modeste et votre situation fiscale simple, par exemple **40 000 $ ou moins pour une personne**. [1](${URLS.clinics.fr})
- **Déclarer simplement** : un service gratuit de l’ARC pour les personnes à revenu plus faible dont la situation est simple. Vous pouvez l’utiliser en ligne avec ou sans invitation; par téléphone ou sur papier, il faut une invitation. [2](${URLS.simpleFile.fr})
- **Logiciels homologués** : la plupart préparent gratuitement une déclaration de base si votre revenu est modeste, et la transmettent en ligne par IMPÔTNET. [3](${URLS.software.fr})

À compter de mars 2027, l’ARC invitera aussi 1\u00a0million de personnes admissibles à produire une déclaration préremplie dans leur compte de l’ARC. [4](${URLS.howFile.fr})

Voyez ci-dessous l’option qui vous convient.`,
    },
    toolCalls: [{ toolName: 'taxesFreeFiling', input: ({ text, lang }: Call) => ({ ...freeFilingInput(text), lang }) }],
    followUps: {
      en: ['When is the tax deadline?', 'Estimate my tax refund', 'Where is my tax refund?'],
      fr: ['Quelle est la date limite pour les impôts?', 'Estimer mon remboursement d’impôt', 'Où est mon remboursement d’impôt?'],
    },
  },

  /* ─────────────── Refund status ─────────────── */
  {
    id: 'taxes-refund-status',
    priority: 8,
    match: [
      /\bwhere(?:['’ʼ]?s| is)\b.*\b(tax )?refund\b/i,
      /\b(still (no|not|waiting|haven['’]t|didn['’]t|nothing)|haven['’]t|have not|not yet)\b.*\brefund\b/i,
      /\b(didn['’]t|did not|never)\b.*\b(get|got|receive[d]?)\b.*\brefund\b/i,
      /\bfiled\b.*\b(weeks?|days?|months?) ago\b/i,
      /\bwhen\b.*\b(will|do|should|can)\b.*\b(i )?(get|receive)\b.*\brefund\b/i,
      /\b(refund|notice of assessment)\b.*\b(status|how long|take|taking|still|yet|late|waiting)\b/i,
      /\bhow long\b.*\b(refund|notice of assessment|assess)\b/i,
      /\b(où (en )?est|suivi)\b.*\bremboursement\b/i,
      /\bquand\b.*\b(recevoir|recevrai|aurai)\b.*\b(remboursement|avis de cotisation)\b/i,
      /\b(remboursement|avis de cotisation)\b.*\b(délai|combien de temps|toujours pas|pas encore|en retard)\b/i,
      /\bcombien de temps\b.*\b(remboursement|avis de cotisation)\b/i,
      /\b(toujours pas|pas encore|n['’]ai (pas|jamais) reçu)\b.*\bremboursement\b/i,
      /\bj['’]ai (produit|fait|envoyé|transmis)\b.*\b(semaines?|jours?|mois)\b/i,
    ],
    exclude: [/\b(gst|hst|tps|tvh|passport|passeport|business)\b/i],
    reply: {
      en: `# {heading}

The CRA aims to send your notice of assessment within **2 weeks** for returns filed online on time, and within **12 weeks** for paper returns filed on time. Returns filed after the deadline aren’t covered by these goals and can take longer. Your refund follows the assessment. [1](${URLS.serviceStandards.en})

The progress tracker in your CRA account shows where your return is. Wait **12 weeks** before contacting the CRA (16 if you live outside Canada). [2](${URLS.refunds.en})

{closing}`,
      fr: `# {heading}

L’ARC vise à envoyer votre avis de cotisation en **2 semaines** pour les déclarations transmises en ligne à temps, et en **12 semaines** pour les déclarations papier produites à temps. Les déclarations produites après la date limite ne sont pas visées par ces objectifs et peuvent prendre plus de temps. Le remboursement suit la cotisation. [1](${URLS.serviceStandards.fr})

Le suivi de votre déclaration dans votre compte de l’ARC indique où elle en est. Attendez **12 semaines** avant de communiquer avec l’ARC (16 si vous habitez à l’extérieur du Canada). [2](${URLS.refunds.fr})

{closing}`,
    },
    vars: ({ text, lang }: Asked) => refundVars(text, lang),
    toolCalls: [
      {
        toolName: 'taxesRefundStatus',
        input: ({ text, lang, timeZone }: Call) => ({ ...refundInput(text), lang, timeZone }),
      },
    ],
    followUps: {
      en: ['Estimate my tax refund', 'When is the tax deadline?', 'How can I file my taxes for free?'],
      fr: ['Estimer mon remboursement d’impôt', 'Quelle est la date limite pour les impôts?', 'Comment produire ma déclaration de revenus gratuitement?'],
    },
  },
];

export default taxes;
