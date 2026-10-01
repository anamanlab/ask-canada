/**
 * Scripted scenarios for the `benefits` widget (EN + FR): ids, matchers, tool calls and follow-ups. The reply
 * copy lives in widgets/benefits/scenario-copy/, and reading a situation out of a question in
 * widgets/benefits/situation.ts. Facts: widgets/benefits/data.ts (verified on canada.ca 2026-09-30). Tool calls
 * are real: the finder and estimators run and read live payment dates.
 */
import type { Scenario } from '@/lib/scripted/types';
import type { Lang } from '../widgets/benefits/rates';
import { CCB_REPLY, EI_REPLY, ccbVars, eiVars } from '../widgets/benefits/scenario-copy/family';
import { FINDER_REPLY, finderVars } from '../widgets/benefits/scenario-copy/finder';
import { CPP_REPLY, OAS_REPLY, oasVars } from '../widgets/benefits/scenario-copy/seniors';
import { OAS_DEFER, incomeIn, oasIn, situationIn } from '../widgets/benefits/situation';

type Ctx = { text: string; lang: Lang; timeZone?: string };

/* ------------------------------------------------------------------ patterns */

const MOVED = /\b(moved|moving|relocat\w*|new to canada|newcomer|immigra\w*|just arrived)\b|déménag\w*|nouvel(le)? arrivante?|immigr\w*|récemment arrivé/i;
const HOW_MUCH = /\b(how much|how many dollars|estimate|calculat\w*|amount|what would i get|what will i get)\b|\b(combien|estim\w*|calcul\w*|montant)\b/i;
const CCB = /\b(canada child benefit|child benefits?|child tax benefit|CCB)\b|\ballocations? (canadienne )?(pour|aux) enfants\b|\bACE\b/i;
const OAS = /\b(old age security|OAS|old age pension)\b|\bsécurité de la vieillesse\b|\bpension de (la )?vieillesse\b|\bSV\b/i;
const CPP = /\b(canada pension plan|CPP)\b|\brégime de pensions du canada\b|\bRPC\b/i;
const EI = /\b(employment insurance|EI)\b|\bassurance[- ]emploi\b|\bAE\b/i;
const and = (...res: RegExp[]) => new RegExp(`^${res.map((r) => `(?=[\\s\\S]*?(?:${r.source}))`).join('')}`, 'i');

/* ------------------------------------------------------------------ scenarios */

/** "What benefits can I get?" and its variants: the finder, with the person's situation read from the question. */
const FINDER_MATCH: RegExp[] = [
  /\b(what|which)\b.*\b(benefits?|credits?|government (help|money|support)|financial (help|support))\b.*\b(can i|could i|am i|do i|should i|we|eligible|qualify|get)\b/i,
  /\b(am i|are we)\b.*\b(missing|leaving)\b.*\b(benefits?|money|credits?)\b/i,
  /\bbenefits? (finder|i('m| am) eligible for|for me|can i get)\b/i,
  /\b(help|support|money)\b.*\bfrom the government\b/i,
  /\b(lost|lose|losing) (my )?job\b.*\b(help|benefits?|support|what (can|should) i)\b/i,
  /\b(à quelles?|quelles?)\b.*\b(prestations?|aides?|allocations?|crédits?)\b.*\b(droit|admissible|recevoir|obtenir)\b/i,
  /\b(chercheur de prestations|prestations? pour moi)\b/i,
  /\b(aide|argent|soutien)\b.*\bdu gouvernement\b/i,
  /\bperdu (mon )?emploi\b.*\b(aides?|prestations?|soutien)\b/i,
];
/** The same words `situationIn` reads, so the follow-ups fit the situation the finder shows. */
const JOB_LOSS = /\b(lost|lose|losing|quit) (my |our )?job\b|\b(laid off|got fired|unemployed|out of work)\b|\b(perdu|perte de|perdre) (mon |d[’'] ?)?emploi\b|\b(mise? à pied|sans emploi|chômage)\b/i;
const HAS_KIDS = /\b(kids?|children|child|toddlers?|bab(?:y|ies)|newborn|sons?|daughters?|pregnant|expecting|enfants?|bébés?|fils|filles?|enceinte)\b/i;
const NO_KIDS = /\b(no (kids|children)|sans enfants?|pas d[’']enfants?)\b/i;
const SENIOR = /\b(retired|retiring|senior|pensioner|retraitée?s?|aînée?s?)\b|\b(?:i[’']?m|i am|aged?)\s+(?:6[5-9]|[7-9]\d)\b|\b(?:6[5-9]|[7-9]\d)\s+years? old\b|\bj[’']ai\s+(?:6[5-9]|[7-9]\d)\s+ans\b/i;
const finderWhen = (re: RegExp) => FINDER_MATCH.map((m) => and(m, re));

function finderScenario(id: string, priority: number, match: RegExp[], followUps: Scenario['followUps'], exclude: RegExp[] = []): Scenario {
  return {
    id,
    priority,
    checked: '2026-09-30',
    exclude: [MOVED, ...exclude],
    match,
    // The body follows the situation: the paragraph after the lead is about the program the widget shows as the
    // biggest for them (EI, the child benefit, OAS/GIS or the disability benefit), so the text and widget agree.
    reply: FINDER_REPLY,
    vars: finderVars,
    toolCalls: [{ toolName: 'benefitsFinder', input: ({ text, lang, timeZone }: Ctx) => ({ ...situationIn(text), lang, timeZone }) }],
    followUps,
  };
}

const benefits: Scenario[] = [
  // Lost a job: EI leads the answer and the widget, so the next questions are about EI.
  finderScenario('benefits-finder-job', 6.5, finderWhen(JOB_LOSS), {
    en: ['How do I apply for Employment Insurance?', 'How do I get my Record of Employment?', 'How much EI would I get?'],
    fr: ['Comment demander l’assurance-emploi?', 'Comment obtenir mon relevé d’emploi?', 'Combien recevrais-je de l’assurance-emploi?'],
  }),
  // A family: the finder already estimates the child benefit from their answers, so no context-free estimate chip.
  finderScenario(
    'benefits-finder-family',
    6.4,
    finderWhen(HAS_KIDS),
    {
      en: ['When is my next CCB payment?', 'Can my kids get the Canadian Dental Care Plan?', 'How do I save for my child’s education?'],
      fr: ['Quand est mon prochain versement de l’ACE?', 'Mes enfants ont-ils droit au Régime canadien de soins dentaires?', 'Comment ouvrir un REEE pour mon enfant?'],
    },
    [NO_KIDS],
  ),
  finderScenario('benefits-finder-senior', 6.3, finderWhen(SENIOR), {
    en: ['Estimate my Old Age Security', 'When is my next OAS payment?', 'When should I start my CPP?'],
    fr: ['Estimer ma pension de la Sécurité de la vieillesse', 'Quand est mon prochain versement de la SV?', 'Quand devrais-je commencer ma pension du RPC?'],
  }),
  finderScenario('benefits-finder', 6, FINDER_MATCH, {
    en: ['How can I file my taxes for free?', 'Am I eligible for the Canadian Dental Care Plan?', 'When is my next benefit payment?'],
    fr: ['Comment produire ma déclaration gratuitement?', 'Suis-je admissible au Régime canadien de soins dentaires?', 'Quand est mon prochain paiement de prestations?'],
  }),

  {
    id: 'benefits-ccb',
    priority: 6,
    checked: '2026-09-30',
    // A move changes the answer (address change, newcomer forms): the starters cover those.
    exclude: [MOVED, /\b(when|next|date|quand|prochain)\b.*\b(pay|paid|payment|deposit|versement|paiement|dépôt)/i],
    // Eligibility and "how do I apply" stay with the starter answer; this one is about amounts.
    match: [and(CCB, HOW_MUCH), and(/\b(child|children|kids?|enfants?)\b/i, /\b(benefit|allowance|allocation|prestation)s?\b/i, HOW_MUCH)],
    reply: CCB_REPLY,
    vars: ccbVars,
    toolCalls: [
      {
        toolName: 'benefitsEstimator',
        input: ({ text, lang, timeZone }: Ctx) => {
          const s = situationIn(text);
          return { program: 'ccb', income: s.income, childrenUnder6: s.childrenUnder6, children6to17: s.children6to17, children: s.children, childDisability: s.childDisability, lang, timeZone };
        },
      },
    ],
    followUps: {
      en: ['What benefits can I get?', 'When is my next benefit payment?', 'We’re having a baby. What should we apply for?'],
      fr: ['À quelles prestations ai-je droit?', 'Quand est mon prochain paiement de prestations?', 'Nous attendons un bébé. Que devons-nous demander?'],
    },
  },

  {
    id: 'benefits-ei-amount',
    priority: 7,
    checked: '2026-09-30',
    match: [and(EI, HOW_MUCH), /\bhow much (would|will|do|can) i get (on|from) (ei|employment insurance)\b/i],
    reply: EI_REPLY,
    vars: eiVars,
    toolCalls: [{ toolName: 'benefitsEstimator', input: ({ text, lang, timeZone }: Ctx) => ({ program: 'ei', earnings: incomeIn(text), lang, timeZone }) }],
    followUps: {
      en: ['How do I apply for Employment Insurance?', 'How do I get my Record of Employment?', 'What benefits can I get?'],
      fr: ['Comment demander l’assurance-emploi?', 'Comment obtenir mon relevé d’emploi?', 'À quelles prestations ai-je droit?'],
    },
  },

  {
    id: 'benefits-oas',
    priority: 6,
    checked: '2026-09-30',
    // Amounts, and waiting past 65 (the start age is read from the question and set in the estimator).
    match: [and(OAS, HOW_MUCH), and(OAS, OAS_DEFER), and(OAS, /\b(?:at|until|till) (?:age )?(?:6[6-9]|70)\b|(?:à|jusqu[’']à) (?:l[’']âge de )?(?:6[6-9]|70) ans/i)],
    reply: OAS_REPLY,
    vars: oasVars,
    toolCalls: [
      {
        toolName: 'benefitsEstimator',
        input: ({ text, lang, timeZone }: Ctx) => ({ program: 'oas', ...oasIn(text), lang, timeZone }),
      },
    ],
    followUps: {
      en: ['When is my next OAS payment?', 'When should I start my CPP?', 'What benefits can I get?'],
      fr: ['Quand est mon prochain versement de la SV?', 'Quand devrais-je commencer ma pension du RPC?', 'À quelles prestations ai-je droit?'],
    },
  },

  {
    id: 'benefits-cpp',
    priority: 6,
    checked: '2026-09-30',
    match: [
      and(CPP, /\b(when|start|early|late|60|65|70|how much|estimate|delay|wait|take)\b|\b(quand|commencer|tôt|tard|combien|estim\w*|reporter|attendre)\b/i),
      /\b(start|take|begin|collect)\b.*\bpension\b.*\b(early|60|70)\b/i,
    ],
    reply: CPP_REPLY,
    toolCalls: [
      {
        toolName: 'benefitsEstimator',
        input: ({ text, lang, timeZone }: Ctx) => {
          const at = text.match(/\b(?:at|à)\s+(6\d|70)\b/i);
          const amount = text.match(/\$\s?(\d{3,4}(?:[.,]\d{2})?)\b|\b(\d{3,4}(?:,\d{2})?)\s?\$/);
          const at65 = amount ? Number((amount[1] ?? amount[2]).replace(',', '.')) : undefined;
          return { program: 'cpp', startAge: at ? Number(at[1]) : undefined, at65: at65 && at65 <= 1_507.65 ? at65 : undefined, lang, timeZone };
        },
      },
    ],
    followUps: {
      en: ['Estimate my Old Age Security', 'What benefits can I get?', 'When is my next benefit payment?'],
      fr: ['Estimer ma pension de la Sécurité de la vieillesse', 'À quelles prestations ai-je droit?', 'Quand est mon prochain paiement de prestations?'],
    },
  },
];

export default benefits;
