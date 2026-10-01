/**
 * Scripted scenarios for the `health` widget (EN + FR). Facts: widgets/health/data.ts (verified 2026-09-30).
 * Tool calls are real: recalls, drugs and travel notices come live from the official sources. The helpers that
 * read a question, word a heading on the live result and write French typography live in widgets/health/scenario-*.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { CDCP, CHECKED, URLS } from '../widgets/health/data';
import { allergenScenarios, drugLookupScenarios, drugRecallScenarios } from '../widgets/health/scenario-families';
import { moneyFr, pctFr, typoFr } from '../widgets/health/scenario-fr';
import { dentalInputOf, money, recallQueryOf, RECALLS_MATCH, type Ctx } from '../widgets/health/scenario-queries';
import { travelInputOf } from '../widgets/health/scenario-travel';
import { travelVars } from '../widgets/health/scenario-travel-vars';
import { dentalVars, handoff, moneyEn, recallsVars } from '../widgets/health/scenario-vars';

const [T0, T1, T2] = CDCP.tiers;

const TRAVEL_MATCH = [
  /\b(vaccin\w*|shots?|jabs?|malaria|yellow fever|travel health|travel clinic|health (risks?|notices?|advice))\b.*\b(for|to|in|before|visiting)\b/i,
  /\b(travel(l?ing)?|trip|going|flying|visit(ing)?)\b.*\b(vaccin\w*|shots?|malaria|dengue|measles|travel health|health risks?)\b/i,
  /\btravel health notices?\b/i,
  /\b(vaccins?|vaccination|paludisme|fièvre jaune|santé[- ]voyage)\b.*\b(pour|au|aux|en|avant|à)\b/i,
  /\b(voyag\w*|partir|aller)\b.*\b(vaccins?|santé|paludisme|dengue|rougeole)\b/i,
  /\bconseils de santé aux voyageurs\b/i,
  /\bconseils de santé .*\b(pour|au|aux|en)\b/i,
];

/**
 * The travel answer in three routes, so no answer offers the question it just answered: a question about Mexico
 * is offered Cuba (not Mexico again), and "any notices right now?" is offered destinations (not itself).
 */
type TravelVariant = { id: string; priority: number; when: RegExp; followUps: NonNullable<Scenario['followUps']> };
const TRAVEL_VARIANTS: TravelVariant[] = [
  {
    id: 'mexico',
    priority: 9,
    when: /\b(?:mexico|mexique)\b/,
    followUps: {
      en: ['Are there any travel health notices right now?', 'What vaccines does my child need?', 'Any health notices for Cuba?'],
      fr: ['Y a-t-il des conseils de santé aux voyageurs en ce moment?', 'De quels vaccins mon enfant a-t-il besoin?', 'Y a-t-il des conseils de santé pour Cuba?'],
    },
  },
  {
    id: 'now',
    priority: 8,
    when: /\b(?:right now|currently|in effect|en ce moment|actuellement|en vigueur)\b/,
    followUps: {
      en: ['What vaccines do I need for Mexico?', 'What vaccines does my child need?', 'Any health notices for Cuba?'],
      fr: ['Quels vaccins me faut-il pour le Mexique?', 'De quels vaccins mon enfant a-t-il besoin?', 'Y a-t-il des conseils de santé pour Cuba?'],
    },
  },
];

function travelScenario(v: TravelVariant | null): Scenario {
  return {
    id: v ? `health-travel-${v.id}` : 'health-travel',
    priority: v ? v.priority : 7,
    match: v ? TRAVEL_MATCH.map((re) => new RegExp(`^(?=[\\s\\S]*(?:${v.when.source}))[\\s\\S]*?(?:${re.source})`, 'i')) : TRAVEL_MATCH,
    exclude: [/\b(child|baby|kid|toddler|son|daughter|enfants?|bébé|fils|fille)\b(?!.*\b(travel|trip|voyage)\b)/i],
    reply: {
      en: `# {head}

{body}

{closing}`,
      fr: `# {head}

{body}

{closing}`,
    },
    vars: travelVars,
    toolCalls: [{ toolName: 'healthTravel', input: travelInputOf }],
    followUps: v?.followUps ?? {
      en: ['Are there any travel health notices right now?', 'What vaccines does my child need?', 'Any health notices for Mexico?'],
      fr: ['Y a-t-il des conseils de santé aux voyageurs en ce moment?', 'De quels vaccins mon enfant a-t-il besoin?', 'Y a-t-il des conseils de santé pour le Mexique?'],
    },
  };
}

const health: Scenario[] = [
  {
    id: 'health-recalls',
    priority: 3,
    match: RECALLS_MATCH,
    exclude: [/\b(car seats?|child seats?|booster seats?|si[èe]ges? d['’]auto|si[èe]ges? pour enfants?)\b/i, /\b(vin|vehicle identification|num[ée]ro d['’]identification du v[ée]hicule)\b/i],
    reply: {
      en: `# {headEn}

Health Canada, the Canadian Food Inspection Agency and Transport Canada publish every recall and safety alert for food, health products, consumer products and vehicles on one official site, as soon as they’re issued. [1](${URLS.recalls.en})

Before you throw anything out, match the brand, size and UPC or lot code on the notice. If you think a product made you sick, contact a health care provider, and you can report a health or safety concern to the Government of Canada. [1](${URLS.recalls.en}) [2](${URLS.reportConcern.en})

{bodyEn}`,
      fr: `# {headFr}

Santé Canada, l’Agence canadienne d’inspection des aliments et Transports Canada publient tous les rappels et avis de sécurité visant les aliments, les produits de santé, les produits de consommation et les véhicules sur un seul site officiel, dès leur diffusion. [1](${URLS.recalls.fr})

Avant de jeter quoi que ce soit, comparez la marque, le format et le CUP ou le code de lot indiqués dans l’avis. Si vous pensez qu’un produit vous a rendu malade, consultez un professionnel de la santé. Vous pouvez aussi signaler un problème lié à la santé ou à la sécurité au gouvernement du Canada. [1](${URLS.recalls.fr}) [2](${URLS.reportConcern.fr})

{bodyFr}`,
    },
    vars: recallsVars,
    // "Which UPC codes are affected?": the newest notice opens with its affected products showing.
    toolCalls: [{ toolName: 'healthRecalls', input: ({ text, lang }: Ctx) => ({ query: recallQueryOf(text) ?? undefined, expand: /\b(upc|cup|lot|lots|codes?)\b/i.test(text) || undefined, lang }) }],
    followUps: {
      en: ['Any recalls for undeclared peanut?', 'How do I get recall alerts?', 'Was my car seat recalled?'],
      fr: ['Y a-t-il des rappels pour de l’arachide non déclarée?', 'Comment recevoir les alertes de rappel?', 'Mon siège d’auto a-t-il été rappelé?'],
    },
  },
  ...allergenScenarios,
  ...drugRecallScenarios,
  {
    id: 'health-recall-alerts',
    priority: 6,
    match: [
      /\b(get|receive|sign up for|subscribe to|subscribe|email|notified)\b.*\b(recall|safety)\b.*\b(alerts?|notifications?|emails?|updates?)\b/i,
      /\b(recall|safety) (alerts?|notifications?) (by|via|to my) (e-?mail|inbox)\b/i,
      /\b(recevoir|m['’]abonner|abonnement|m['’]inscrire)\b.*\b(rappels?|alertes?|avis de s[ée]curit[ée])\b/i,
    ],
    reply: {
      en: `# Sign up for *email alerts* on the Recalls site.

You can get an email as soon as a recall or safety alert is posted, or one daily digest. Choose the kinds of products you care about, including specific food allergens such as peanut, milk, egg, sesame seeds, soy, mustard, tree nut and gluten. [1](${URLS.recallsSubscribe.en} "Get email alerts about recalls")

Vehicle recall alerts aren’t offered there. For vehicles, tires and child car seats, check Transport Canada. [1](${URLS.recallsSubscribe.en} "Get email alerts about recalls") [2](${URLS.vehicleRecalls.en} "Defects and recalls of vehicles, tires and child car seats")

Here’s the official sign-up page:`,
      fr: `# Abonnez-vous aux *alertes par courriel* du site des rappels.

Vous pouvez recevoir un courriel dès qu’un rappel ou un avis de sécurité est publié, ou un condensé quotidien. Choisissez les types de produits qui vous intéressent, y compris des allergènes alimentaires précis comme les arachides, le lait, les œufs, les graines de sésame, le soja, la moutarde, les noix et le gluten. [1](${URLS.recallsSubscribe.fr} "Recevoir des alertes par courriel sur les rappels")

Les alertes de rappel de véhicules n’y sont pas offertes. Pour les véhicules, les pneus et les sièges d’auto pour enfants, consultez Transports Canada. [1](${URLS.recallsSubscribe.fr} "Recevoir des alertes par courriel sur les rappels") [2](${URLS.vehicleRecalls.fr} "Défauts et rappels des véhicules, des pneus et des sièges d’auto pour enfant")

Voici la page d’inscription officielle :`,
    },
    toolCalls: [{ toolName: 'officialHandoff', input: handoff(URLS.recallsSubscribe, { en: 'Sign up for recall alerts', fr: 'M’abonner aux alertes de rappel' }, { en: 'You’ll enter your email, then choose categories and allergens.', fr: 'Vous entrerez votre courriel, puis choisirez les catégories et les allergènes.' }) }],
    followUps: {
      en: ['Are there any recent recalls?', 'Any recalls for undeclared sesame?', 'How do I report a food safety concern?'],
      fr: ['Y a-t-il des rappels récents?', 'Y a-t-il des rappels pour du sésame non déclaré?', 'Comment signaler un problème de salubrité alimentaire?'],
    },
  },
  {
    id: 'health-report-concern',
    priority: 5,
    match: [
      /\breport\b.*\b(food|product|recall|safety|side effects?|allergic|made me sick|health concern)/i,
      /\bsignaler\b.*\b(aliment|produit|rappel|s[ée]curit[ée]|salubrit[ée]|effet|r[ée]action|sant[ée])/i,
    ],
    exclude: [/\b(scam|fraud|arnaque|fraude|passport|passeport|tax|impôt)\b/i],
    reply: {
      en: `# Report it online: food concerns go to the *Canadian Food Inspection Agency*.

The Government of Canada’s reporting page sends you to the right form for each kind of product. Food safety and labelling concerns go to the Canadian Food Inspection Agency. Drugs, medical devices, consumer products, cosmetics, cannabis and natural health products each have their own form. [1](${URLS.reportConcern.en})

If you live in Quebec, food complaints go first to the Ministère de l’Agriculture, des Pêcheries et de l’Alimentation du Québec (MAPAQ). [2](${URLS.foodComplaint.en} "Find out where to report a food complaint or concern")

If a product made you sick or hurt you, contact your doctor, a health professional or a poison centre first. [1](${URLS.reportConcern.en})`,
      fr: `# Signalez-le en ligne : les problèmes d’aliments relèvent de l’*Agence canadienne d’inspection des aliments*.

La page de signalement du gouvernement du Canada vous dirige vers le bon formulaire pour chaque type de produit. Les problèmes de salubrité et d’étiquetage des aliments relèvent de l’Agence canadienne d’inspection des aliments. Les médicaments, les instruments médicaux, les produits de consommation, les cosmétiques, le cannabis et les produits de santé naturels ont chacun leur formulaire. [1](${URLS.reportConcern.fr})

Si vous habitez au Québec, les plaintes sur les aliments sont d’abord traitées par le ministère de l’Agriculture, des Pêcheries et de l’Alimentation du Québec (MAPAQ). [2](${URLS.foodComplaint.fr} "Découvrez où vous pouvez déposer une plainte ou signaler une préoccupation alimentaire")

Si un produit vous a rendu malade ou vous a blessé, communiquez d’abord avec votre médecin, un professionnel de la santé ou un centre antipoison. [1](${URLS.reportConcern.fr})`,
    },
    toolCalls: [{ toolName: 'officialHandoff', input: handoff(URLS.reportConcern, { en: 'Report a concern on canada.ca', fr: 'Signaler un problème sur canada.ca' }, { en: 'Choose the kind of product, then fill in the official form.', fr: 'Choisissez le type de produit, puis remplissez le formulaire officiel.' }) }],
    followUps: {
      en: ['Are there any recent recalls?', 'How do I get recall alerts?'],
      fr: ['Y a-t-il des rappels récents?', 'Comment recevoir les alertes de rappel?'],
    },
  },
  {
    id: 'health-car-seat',
    priority: 6,
    match: [
      /\b(car seats?|child seats?|booster seats?|infant seats?)\b.*\b(recall\w*|safe|safety|alert)/i,
      /\b(recall\w*|safety)\b.*\b(car seats?|child seats?|booster seats?|infant seats?)\b/i,
      /\bsi[èe]ges? (d['’]auto|pour enfants?|d['’]appoint)\b.*\b(rappel\w*|s[ée]curit[ée])/i,
      /\b(rappel\w*|s[ée]curit[ée])\b.*\bsi[èe]ges? (d['’]auto|pour enfants?|d['’]appoint)\b/i,
    ],
    reply: {
      en: `# Check your car seat in *two places*.

Transport Canada keeps the official record of child car seat recalls. Search it by make and model, and register your car seat with the manufacturer so you get recall notices by mail. [1](${URLS.vehicleRecalls.en} "Defects and recalls of vehicles, tires and child car seats")

Health Canada also posts warnings about car seats and accessories sold online on the Recalls site. [2](${URLS.recalls.en})

Here are the latest notices that mention car seats. Compare the model name and date of manufacture on your seat’s label with the notice.`,
      fr: `# Vérifiez votre siège d’auto *à deux endroits*.

Transports Canada tient le registre officiel des rappels de sièges d’auto pour enfants. Cherchez par marque et modèle, et enregistrez votre siège auprès du fabricant pour recevoir les avis de rappel par la poste. [1](${URLS.vehicleRecalls.fr} "Défauts et rappels des véhicules, des pneus et des sièges d’auto pour enfant")

Santé Canada publie aussi des mises en garde sur les sièges d’auto et les accessoires vendus en ligne, sur le site des rappels. [2](${URLS.recalls.fr})

Voici les derniers avis qui mentionnent les sièges d’auto. Comparez le nom du modèle et la date de fabrication sur l’étiquette de votre siège avec l’avis.`,
    },
    toolCalls: [{ toolName: 'healthRecalls', input: ({ lang }: Ctx) => ({ query: lang === 'fr' ? 'siège d’auto' : 'car seat', lang }) }],
    followUps: {
      en: ['Are there any recent product recalls?', 'Any recalls for undeclared milk?'],
      fr: ['Y a-t-il des rappels de produits récents?', 'Y a-t-il des rappels pour du lait non déclaré?'],
    },
  },
  {
    id: 'health-dental',
    priority: 6,
    match: [
      /\bdental (care )?(plan|coverage|benefits?|program)\b/i,
      /\b(no|without|don['’]t have)\s+(any\s+)?dental (insurance|coverage)\b/i,
      /\bsans assurance dentaire|pas d['’]assurance dentaire/i,
      /\bCDCP\b/,
      /\b(afford|pay for|help with|free)\b.*\b(dentist|dental)\b/i,
      /\b(dentist|dental)\b.*\b(eligib\w*|qualif\w*|afford|cost|covered|coverage)\b/i,
      /\br[ée]gime (canadien )?de soins dentaires\b/i,
      /\bRCSD\b/,
      /\b(soins dentaires|dentiste)\b.*\b(admissib\w*|couvert\w*|payer|co[uû]t|gratuit\w*|aide)\b/i,
    ],
    reply: {
      en: `# {head}

You must meet all 4 requirements: no access to private dental insurance or coverage, tax returns filed in Canada (you and your spouse or partner), an adjusted family net income under ${moneyEn(CDCP.incomeLimit)}, and Canadian residency for tax purposes. Coverage through a government program doesn’t count against you. [1](${URLS.dentalQualify.en})

The plan pays 100% of its set fees if your adjusted family net income is under ${moneyEn(T0.below)}. From ${moneyEn(T0.below)} to ${moneyEn(T1.below - 1)} you pay a ${T1.copay}% co-payment, and from ${moneyEn(T1.below)} to ${moneyEn(T2.below - 1)}, ${T2.copay}%. Your dentist may charge more than the plan’s fees, so ask first. [2](${URLS.dentalCoverage.en} "What services are covered in the Canadian Dental Care Plan"){mine}

Applications for the ${CDCP.benefitPeriod} benefit period are open, online or by phone at ${CDCP.phone}. [3](${URLS.dentalApply.en} "Apply for the Canadian Dental Care Plan") Dentists take part in the plan voluntarily, so ask yours if they accept it. [4](${URLS.dentalProviders.en} "Canadian Dental Care Plan: Information for oral health providers")

First Nations or Inuit? Eligible clients get dental care through the Non-Insured Health Benefits program instead. [5](${URLS.nihbDental.en} "Non-Insured Health Benefits program for First Nations and Inuit: Dental benefits")

Answer the questions below to check.`,
      fr: `# {head}

Vous devez remplir les 4 exigences : ne pas avoir accès à une assurance dentaire privée, avoir produit vos déclarations de revenus au Canada (vous et votre époux ou conjoint), avoir un revenu familial net rajusté inférieur à ${moneyFr(CDCP.incomeLimit)} et être résident du Canada aux fins de l’impôt. Une couverture par un programme gouvernemental ne vous empêche pas d’être admissible. [1](${URLS.dentalQualify.fr})

Le régime paie ${pctFr(100)} de ses tarifs établis si votre revenu familial net rajusté est inférieur à ${moneyFr(T0.below)}. De ${moneyFr(T0.below)} à ${moneyFr(T1.below - 1)}, vous payez une quote-part de ${pctFr(T1.copay)}, et de ${moneyFr(T1.below)} à ${moneyFr(T2.below - 1)}, de ${pctFr(T2.copay)}. Votre dentiste peut facturer plus que les tarifs du régime : demandez avant. [2](${URLS.dentalCoverage.fr} "Services couverts par le Régime canadien de soins dentaires"){mine}

Les demandes pour la période de prestations ${CDCP.benefitPeriod} sont ouvertes, en ligne ou par téléphone au ${CDCP.phone}. [3](${URLS.dentalApply.fr} "Présenter une demande au Régime canadien de soins dentaires") Les dentistes participent au régime sur une base volontaire : demandez au vôtre s’il l’accepte. [4](${URLS.dentalProviders.fr} "Régime canadien de soins dentaires : Information pour les fournisseurs de soins buccodentaires")

Membre des Premières Nations ou Inuit? Les clients admissibles reçoivent plutôt des soins dentaires par le Programme des services de santé non assurés. [5](${URLS.nihbDental.fr} "Programme des services de santé non assurés pour les Premières Nations et les Inuit : prestations dentaires")

Répondez aux questions ci-dessous pour vérifier.`,
    },
    vars: dentalVars,
    toolCalls: [{ toolName: 'healthDentalCheck', input: dentalInputOf }],
    followUps: {
      en: ['How do I apply for the dental care plan?', 'What does the dental care plan cover?', 'How do I find a dentist who accepts the plan?'],
      fr: ['Comment présenter une demande au régime de soins dentaires?', 'Que couvre le régime de soins dentaires?', 'Comment trouver un dentiste qui accepte le régime?'],
    },
  },
  {
    id: 'health-dental-coverage',
    priority: 7,
    match: [/\b(what|which)\b.*\b(covered|cover|services)\b.*\bdental (care )?plan\b/i, /\bdental (care )?plan\b.*\bcover\b/i, /\b(que|qu['’]est-ce que)\b.*\bcouv\w*\b.*\bsoins dentaires\b/i, /\bsoins dentaires\b.*\bcouv\w*/i],
    reply: {
      en: `# The plan covers most *everyday dental care*, with some services needing approval first.

Covered services include exams, x-rays, cleanings, fillings, root canals, gum treatment, dentures, tooth removal and sedation. Some services, like crowns and partial dentures, need preauthorization. Orthodontic services aren’t available right now. [1](${URLS.dentalCoverage.en} "What services are covered in the Canadian Dental Care Plan")

The plan pays its own set fees, which may be lower than what your provider charges. Before treatment, confirm your provider accepts the plan and ask what you’ll pay. [1](${URLS.dentalCoverage.en} "What services are covered in the Canadian Dental Care Plan")

Here’s what the plan pays at each income level.`,
      fr: `# Le régime couvre la plupart des *soins dentaires courants*, et certains services doivent être approuvés d’avance.

Les services couverts comprennent les examens, les radiographies, les nettoyages, les obturations, les traitements de canal, les traitements des gencives, les prothèses dentaires, les extractions et la sédation. Certains services, comme les couronnes et les prothèses partielles, exigent une autorisation préalable. Les services d’orthodontie ne sont pas offerts pour l’instant. [1](${URLS.dentalCoverage.fr} "Services couverts par le Régime canadien de soins dentaires")

Le régime paie ses propres tarifs établis, qui peuvent être inférieurs à ceux de votre fournisseur. Avant un traitement, vérifiez que votre fournisseur accepte le régime et demandez ce que vous paierez. [1](${URLS.dentalCoverage.fr} "Services couverts par le Régime canadien de soins dentaires")

Voici la part que le régime paie selon le revenu familial.`,
    },
    // A compact card (co-payment tiers + where the person stands), not a second copy of the full checker.
    toolCalls: [{ toolName: 'healthDentalCheck', input: ({ text, lang }: Ctx) => ({ familyIncome: money(text), view: 'summary', lang }) }],
    followUps: {
      en: ['Am I eligible for the dental care plan?', 'How do I find a dentist who accepts the plan?', 'How do I apply for the dental care plan?'],
      fr: ['Suis-je admissible au régime de soins dentaires?', 'Comment trouver un dentiste qui accepte le régime?', 'Comment présenter une demande au régime de soins dentaires?'],
    },
  },
  {
    id: 'health-dental-apply',
    priority: 7,
    match: [
      /\b(how|where|when)\b.*\b(apply|sign up|register|enrol+)\b.*\b(dental|CDCP)\b/i,
      /\b(apply|sign up|register|enrol+)\b.*\b(dental (care )?plan|CDCP)\b/i,
      /\b(comment|où|quand)\b.*\b(demande|inscri\w*|adh[ée]rer)\b.*\b(dentaire|RCSD)\b/i,
      /\b(demande|inscri\w*)\b.*\b(r[ée]gime (canadien )?de soins dentaires|RCSD)\b/i,
    ],
    reply: {
      en: `# Apply online with *My Service Canada Account*, on canada.ca, or by phone.

You must meet all 4 requirements before you apply. Applications are open for the ${CDCP.benefitPeriod} benefit period, and there’s no fee to apply. [1](${URLS.dentalApply.en} "Apply for the Canadian Dental Care Plan")

For yourself and each dependant, you’ll need your full name, date of birth, home and mailing address, Social Insurance Number (if your child has one) and any dental coverage through government programs. Your spouse or common-law partner must submit their own application. [1](${URLS.dentalApply.en} "Apply for the Canadian Dental Care Plan")

Can’t apply online? Call Service Canada at ${CDCP.phone} (TTY ${CDCP.tty}). [1](${URLS.dentalApply.en} "Apply for the Canadian Dental Care Plan")

Here’s the official application page:`,
      fr: `# Présentez votre demande en ligne avec *Mon dossier Service Canada*, sur canada.ca ou par téléphone.

Vous devez remplir les 4 exigences avant de présenter une demande. Les demandes sont acceptées pour la période de prestations ${CDCP.benefitPeriod}, et la demande est gratuite. [1](${URLS.dentalApply.fr} "Présenter une demande au Régime canadien de soins dentaires")

Pour vous-même et chaque personne à votre charge, vous aurez besoin du nom complet, de la date de naissance, de l’adresse du domicile et de l’adresse postale, du numéro d’assurance sociale (si votre enfant en a un) et de toute couverture dentaire offerte par un programme gouvernemental. Votre époux ou conjoint de fait doit présenter sa propre demande. [1](${URLS.dentalApply.fr} "Présenter une demande au Régime canadien de soins dentaires")

Vous ne pouvez pas faire la demande en ligne? Appelez Service Canada au ${CDCP.phone} (ATS ${CDCP.tty}). [1](${URLS.dentalApply.fr} "Présenter une demande au Régime canadien de soins dentaires")

Voici la page officielle pour présenter une demande :`,
    },
    toolCalls: [{ toolName: 'officialHandoff', input: handoff(URLS.dentalApply, { en: 'Apply on canada.ca', fr: 'Présenter une demande sur canada.ca' }, { en: 'Online with My Service Canada Account or on canada.ca. There’s no fee to apply.', fr: 'En ligne avec Mon dossier Service Canada ou sur canada.ca. La demande est gratuite.' }) }],
    followUps: {
      en: ['Am I eligible for the dental care plan?', 'What does the dental care plan cover?', 'How do I find a dentist who accepts the plan?'],
      fr: ['Suis-je admissible au régime de soins dentaires?', 'Que couvre le régime de soins dentaires?', 'Comment trouver un dentiste qui accepte le régime?'],
    },
  },
  {
    id: 'health-dental-provider',
    priority: 7,
    match: [
      /\b(find|choose|which|does|do|will)\b.*\b(dentists?|providers?|hygienists?|denturists?)\b.*\b(accept\w*|take|takes|participat\w*)\b/i,
      /\b(dentists?|providers?)\b.*\b(accept\w*|participat\w*|take)\b.*\b(dental (care )?plan|CDCP|the plan)\b/i,
      /\b(trouver|choisir|quel)\b.*\b(dentistes?|fournisseurs?|hygi[ée]nistes?|denturologistes?)\b/i,
      /\b(dentistes?|fournisseurs?)\b.*\b(accept\w*|particip\w*)\b/i,
    ],
    reply: {
      en: `# Ask your dentist: taking part in the plan is *voluntary*.

Dentists, denturists, dental hygienists and dental specialists can choose to take part. Some sign up formally through Sun Life, and others send claims one at a time, so ask your provider directly if they’ll see you as a Canadian Dental Care Plan client. [1](${URLS.dentalProviders.en} "Canadian Dental Care Plan: Information for oral health providers")

Providers bill Sun Life directly. You shouldn’t be asked to pay the full cost upfront, only any amount the plan doesn’t cover. The plan’s fees can be lower than what your provider charges, so ask what you’ll pay before treatment. [1](${URLS.dentalProviders.en} "Canadian Dental Care Plan: Information for oral health providers") [2](${URLS.dentalCoverage.en} "What services are covered in the Canadian Dental Care Plan")

First Nations or Inuit? Eligible clients can use the Non-Insured Health Benefits program: show your client identification so the provider can bill it directly. [3](${URLS.nihbDental.en} "Non-Insured Health Benefits program for First Nations and Inuit: Dental benefits")`,
      fr: `# Demandez à votre dentiste : la participation au régime est *volontaire*.

Les dentistes, les denturologistes, les hygiénistes dentaires et les dentistes spécialistes peuvent choisir d’y participer. Certains s’inscrivent officiellement auprès de la Sun Life, et d’autres soumettent les demandes une à la fois : demandez directement à votre fournisseur s’il vous recevra comme client du Régime canadien de soins dentaires. [1](${URLS.dentalProviders.fr} "Régime canadien de soins dentaires : Information pour les fournisseurs de soins buccodentaires")

Les fournisseurs facturent directement la Sun Life. On ne devrait pas vous demander de payer le coût total à l’avance, seulement le montant que le régime ne couvre pas. Les tarifs du régime peuvent être inférieurs à ceux de votre fournisseur : demandez ce que vous paierez avant le traitement. [1](${URLS.dentalProviders.fr} "Régime canadien de soins dentaires : Information pour les fournisseurs de soins buccodentaires") [2](${URLS.dentalCoverage.fr} "Services couverts par le Régime canadien de soins dentaires")

Membre des Premières Nations ou Inuit? Les clients admissibles peuvent utiliser le Programme des services de santé non assurés : montrez votre pièce d’identité de client pour que le fournisseur le facture directement. [3](${URLS.nihbDental.fr} "Programme des services de santé non assurés pour les Premières Nations et les Inuit : prestations dentaires")`,
    },
    // Text and citations answer this one: no second checker in the conversation.
    followUps: {
      en: ['Am I eligible for the dental care plan?', 'What does the dental care plan cover?', 'How do I apply for the dental care plan?'],
      fr: ['Suis-je admissible au régime de soins dentaires?', 'Que couvre le régime de soins dentaires?', 'Comment présenter une demande au régime de soins dentaires?'],
    },
  },
  ...drugLookupScenarios,
  ...TRAVEL_VARIANTS.map(travelScenario),
  travelScenario(null),
  {
    id: 'health-child-vaccines',
    priority: 6,
    match: [
      /\b(child|children|baby|babies|kid|kids|toddler|son|daughter|infant)('s)?\b.*\b(vaccin\w*|immuni[sz]\w*|shots?)\b/i,
      /\b(vaccin\w*|immuni[sz]ation)\b.*\b(schedule|child|children|baby|kids?)\b/i,
      /\b(enfants?|bébés?|fils|fille|nourrissons?)\s.*\bvaccin/i,
      /\bvaccin\w*\s.*\b(enfants?|bébé|fils|fille|nourrissons?)/i,
      /\bcalendrier (de )?vaccin\w*\b/i,
    ],
    exclude: [/\b(travel|trip|voyage|voyager)\b/i],
    reply: {
      en: `# Your child’s vaccines are *free*, on your province or territory’s schedule.

Vaccination schedules can differ depending on where you live in Canada. Childhood vaccines are free everywhere and follow your province or territory’s routine or catch-up schedule. [1](${URLS.childVaccines.en} "Vaccines for children: Childhood vaccination schedule")

Your child’s health care provider or local public health unit can tell you what’s due and give you a vaccine record if you don’t have one. [1](${URLS.childVaccines.en} "Vaccines for children: Childhood vaccination schedule") [2](${URLS.vaccineRecords.en} "Vaccine records: Access your or your child’s vaccination history")

Get your child’s schedule for your province or territory:`,
      fr: `# Les vaccins de votre enfant sont *gratuits*, selon le calendrier de votre province ou territoire.

Les calendriers de vaccination peuvent être différents selon l’endroit où vous vivez au Canada. Les vaccins pour les enfants sont gratuits partout et offerts selon le calendrier de routine ou de rattrapage de votre province ou territoire. [1](${URLS.childVaccines.fr} "Vaccins pour les enfants : Calendrier de vaccination des enfants")

Le professionnel de la santé de votre enfant ou votre bureau de santé publique local peut vous dire quels vaccins sont dus et vous remettre un carnet de vaccination si vous n’en avez pas. [1](${URLS.childVaccines.fr} "Vaccins pour les enfants : Calendrier de vaccination des enfants") [2](${URLS.vaccineRecords.fr} "Carnets de vaccination : Accédez à vos antécédents de vaccination ou à ceux de votre enfant")

Obtenez le calendrier de votre enfant pour votre province ou territoire :`,
    },
    toolCalls: [{ toolName: 'officialHandoff', input: handoff(URLS.vaccineSchedule, { en: 'Get the vaccination schedule', fr: 'Voir le calendrier de vaccination' }, { en: 'Official Government of Canada tool, by province or territory.', fr: 'Outil officiel du gouvernement du Canada, par province ou territoire.' }) }],
    followUps: {
      en: ['What vaccines do I need for Mexico?', 'Am I eligible for the dental care plan?'],
      fr: ['Quels vaccins me faut-il pour le Mexique?', 'Suis-je admissible au régime de soins dentaires?'],
    },
  },
];

// French typography applied once, to every French reply (amounts, $, %, :, « »), and one verified date
// for every source in the answer, text citations included (the widget's sources carry the same CHECKED).
export default health.map((sc) => ({ ...sc, checked: sc.checked ?? CHECKED, reply: { ...sc.reply, fr: typoFr(sc.reply.fr) } }));
