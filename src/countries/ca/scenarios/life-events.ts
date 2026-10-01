/** Scripted scenarios for the `life-events` widget (EN + FR). Facts: widgets/life-events/data.ts and pages/*.ts. */
import type { Scenario } from '@/lib/scripted/types';
import {
  ALL,
  ALLOWANCE_Q,
  BABY,
  DATE,
  DEATH,
  DEATH_EXCLUDE,
  FINAL_RETURN,
  GIS_Q,
  HOW_MUCH,
  HOW_MUCH_LONG,
  JOB_LOSS,
  JOB_LOSS_PLAN,
  MARRIAGE,
  MOVING,
  PARENTAL,
  both,
  call,
  dateLine,
} from '../widgets/life-events/scenario-helpers';
import { DEATH_REPLY, REPLIES } from '../widgets/life-events/scenario-replies';
import { deathVars, finalReturnVars } from '../widgets/life-events/scenario-vars';

const scenarios: Scenario[] = [
  {
    id: 'life-events-moving',
    priority: 8,
    match: MOVING,
    exclude: [
      /\b(to|in|into) canada\b|\bau canada\b/i,
      /\bmoving expenses?\b|\bfrais de déménagement\b/i,
      // Eligibility questions ("am I eligible for the CCB if I just moved…") belong to the benefit's own answer.
      /\b(child benefit|CCB|allocation (canadienne )?pour enfants|eligib\w*|admissib\w*|ai-je droit)\b/i,
      /\bACE\b/,
      /\bmoved (here|to canada)\b/i,
    ],
    reply: REPLIES.moving,
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('moving', 'future') }],
    followUps: {
      en: ['We just got married. Who do I tell?', 'How do I renew my passport?', ALL.en],
      fr: ['Nous venons de nous marier. Qui dois-je aviser?', 'Comment renouveler mon passeport?', ALL.fr],
    },
  },
  {
    id: 'life-events-baby',
    priority: 8,
    match: BABY,
    exclude: [HOW_MUCH],
    reply: REPLIES.baby,
    vars: dateLine(
      'baby',
      'future',
      {
        en: 'Here’s your checklist. Add your due date to see when maternity benefits can start.',
        fr: 'Voici votre liste. Ajoutez la date prévue pour voir quand les prestations de maternité peuvent commencer.',
      },
      {
        en: 'Here’s your checklist, with the date maternity benefits can start.',
        fr: 'Voici votre liste, avec la date où les prestations de maternité peuvent commencer.',
      },
    ),
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('baby', 'future') }],
    followUps: {
      en: ['How much is the Canada child benefit?', 'How much EI would I get on parental leave?', ALL.en],
      fr: ['Combien donne l’Allocation canadienne pour enfants?', 'Combien d’AE recevrais-je en congé parental?', ALL.fr],
    },
  },
  {
    id: 'life-events-parental',
    // Above the EI regular amount answer (benefits-ei-amount, 7): the baby answer's chip "How much EI would I get on
    // parental leave?" needs maternity and parental facts, not regular benefits' weeks and hours.
    priority: 8,
    checked: '2026-09-30',
    match: [both(PARENTAL, HOW_MUCH_LONG)],
    reply: REPLIES.parental,
    followUps: {
      en: ['How much is the Canada child benefit?', 'What do I need to do when our baby is born?', ALL.en],
      fr: ['Combien donne l’Allocation canadienne pour enfants?', 'Que dois-je faire à la naissance de notre bébé?', ALL.fr],
    },
  },
  {
    id: 'life-events-marriage',
    priority: 8,
    match: MARRIAGE,
    exclude: [/\bbusiness\b.*\bname\b|\bnom d[’']entreprise\b/i],
    reply: REPLIES.marriage,
    vars: dateLine(
      'marriage',
      'past',
      {
        en: 'Here’s your checklist. Add the date of your wedding to see your CRA deadline.',
        fr: 'Voici votre liste. Ajoutez la date de votre mariage pour voir votre échéance auprès de l’ARC.',
      },
      { en: 'Here’s your checklist, with your CRA deadline.', fr: 'Voici votre liste, avec votre échéance auprès de l’ARC.' },
    ),
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('marriage', 'past') }],
    followUps: {
      en: ['We’re moving in together. Who do I tell?', 'How much is the Canada child benefit?', ALL.en],
      fr: ['Nous emménageons ensemble. Qui dois-je aviser?', 'Combien donne l’Allocation canadienne pour enfants?', ALL.fr],
    },
  },
  {
    id: 'life-events-job-loss',
    // Only when the person gives their last day or asks for the list itself: a bare "I got laid off" gets the
    // generic EI answer (starters.ts, `ei-regular`), and "how much" goes to the benefits widget.
    priority: 5,
    match: [both(JOB_LOSS, JOB_LOSS_PLAN)],
    exclude: [HOW_MUCH],
    reply: REPLIES['job-loss'],
    vars: dateLine(
      'job-loss',
      'past',
      {
        en: 'Here’s your checklist. Add your last day of work to see your 4-week date.',
        fr: 'Voici votre liste. Ajoutez votre dernier jour de travail pour voir la date des 4 semaines.',
      },
      { en: 'Here’s your checklist, with the date your 4 weeks run out.', fr: 'Voici votre liste, avec la date où vos 4 semaines prennent fin.' },
    ),
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('job-loss', 'past') }],
    followUps: {
      en: ['How much EI would I get?', 'What other benefits can I get?', ALL.en],
      fr: ['Combien d’assurance-emploi recevrais-je?', 'À quelles autres prestations ai-je droit?', ALL.fr],
    },
  },
  {
    id: 'life-events-retiring',
    priority: 7,
    match: [
      /\b(i['’]?m|i am|we['’]?re|we are|getting ready to|about to|planning to|plan to|thinking (about|of)|going to|want to)\s+(be\s+)?retir(e|ing)\b/i,
      /\bretir(e|ing) (next|this|in|soon|at)\b/i,
      /\bretirement (checklist|planning|plan)\b/i,
      /\bplan\w* (for )?(my |our )?retirement\b/i,
      /\bprendre (ma|sa|notre) retraite\b/i,
      /\b(je|nous) (pars|partons|prends|prenons) (ma |notre )?retraite\b/i,
      /\bpartir à la retraite\b/i,
      /\bplanifier (ma |notre )?retraite\b/i,
    ],
    exclude: [HOW_MUCH],
    reply: REPLIES.retiring,
    // Retiring and starting CPP are separate decisions, so a retirement date in the question isn't used as the
    // CPP start date: the person adds the date they want their CPP to start in the checklist.
    vars: () => ({ dateLine: '' }),
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('retiring', 'none') }],
    followUps: {
      en: ['When should I start my CPP?', 'Should I delay my OAS to 70?', ALL.en],
      fr: ['Quand devrais-je commencer mon RPC?', 'Devrais-je reporter ma SV à 70 ans?', ALL.fr],
    },
  },
  {
    id: 'life-events-death',
    priority: 9,
    match: DEATH,
    // Never answer thoughts of self-harm with a paperwork checklist (the crisis answer handles those).
    exclude: DEATH_EXCLUDE,
    reply: DEATH_REPLY,
    vars: deathVars,
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('death', 'past') }],
    followUps: {
      en: ['Who can get the CPP survivor’s pension?', 'When is the final tax return due?', ALL.en],
      fr: ['Qui peut recevoir la pension de survivant du RPC?', 'Quelle est la date limite de la déclaration finale?', ALL.fr],
    },
  },
  {
    id: 'life-events-death-dated',
    // Same answer, but the person gave the date: the reply already carries their exact deadlines, so no chip
    // asks for them again (a generic "when is it due?" would forget the date they just gave).
    priority: 9.5,
    match: DEATH.map((re) => both(re.source, DATE)),
    exclude: DEATH_EXCLUDE,
    reply: DEATH_REPLY,
    vars: deathVars,
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('death', 'past') }],
    followUps: {
      en: ['Who can get the CPP survivor’s pension?', ALLOWANCE_Q.en, ALL.en],
      fr: ['Qui peut recevoir la pension de survivant du RPC?', ALLOWANCE_Q.fr, ALL.fr],
    },
  },
  {
    id: 'life-events-death-benefit',
    // "How do I apply for the CPP death benefit?" (the dated final-return answer's chip): how to apply, without
    // re-opening the checklist. Above the undated death checklist (9); a message that gives the date of death
    // or says who died still gets the checklist with exact dates (9.5, or the exclusions below).
    priority: 9.2,
    checked: '2026-09-30',
    match: [/\bcpp death benefit\b/i, /\bprestation de décès du RPC\b/i],
    exclude: [...DEATH_EXCLUDE, new RegExp(DATE, 'i'), /\b(died|passed away|has passed|lost my)\b|\b(est|sont) (mort|morte|décédée?)|\bdécédée?s?(?![a-z])/i],
    reply: REPLIES['death-benefit'],
    followUps: {
      en: ['Who can get the CPP survivor’s pension?', 'When is the final tax return due?', 'What do I do when someone dies?'],
      fr: ['Qui peut recevoir la pension de survivant du RPC?', 'Quelle est la date limite de la déclaration finale?', 'Que faire quand quelqu’un meurt?'],
    },
  },
  {
    id: 'life-events-survivor',
    // Above the death checklist (9): the chip "Who can get the CPP survivor’s pension?" needs its own answer.
    priority: 10,
    match: [
      /\bsurvivor['’]?s? (pension|benefits?)\b/i,
      /\bcpp (children['’]?s|child['’]?s|orphan['’]?s?) benefits?\b/i,
      /\bpension de survivant\b/i,
      /\bprestations? de survivant\b/i,
      /\bprestations? d['’]enfants?\b.*\bRPC\b/i,
    ],
    exclude: [/\b(veteran|vétéran|anciens? combattants?|CAF|FAC|RCMP|GRC)\b/i],
    reply: REPLIES.survivor,
    followUps: {
      en: [ALLOWANCE_Q.en, 'When is the final tax return due?', 'What do I do when someone dies?'],
      fr: [ALLOWANCE_Q.fr, 'Quelle est la date limite de la déclaration finale?', 'Que faire quand quelqu’un meurt?'],
    },
  },
  {
    id: 'life-events-allowance-survivor',
    // Above the survivor's pension (10): the chip "Can a surviving partner aged 60 to 64 get the Allowance for the
    // Survivor?" asks a yes/no question about a different, OAS-side benefit.
    priority: 10.5,
    checked: '2026-09-30',
    match: [/\ballowance for (the )?survivors?\b/i, /\ballocation (au|aux|de) survivants?\b/i],
    exclude: [/\b(veteran|vétéran|anciens? combattants?|CAF|FAC|RCMP|GRC)\b/i],
    reply: REPLIES['allowance-survivor'],
    followUps: {
      en: ['Who can get the CPP survivor’s pension?', GIS_Q.en, 'What do I do when someone dies?'],
      fr: ['Qui peut recevoir la pension de survivant du RPC?', GIS_Q.fr, 'Que faire quand quelqu’un meurt?'],
    },
  },
  {
    id: 'life-events-gis',
    // The retirement and survivor answers point here. Low priority: payment-date and OAS amount answers win.
    priority: 4,
    checked: '2026-09-30',
    match: [/\bguaranteed income supplement\b|\bGIS\b/i, /\bsuppl[ée]ment de revenu garanti\b|\bSRG\b/i],
    exclude: [/\b(pay(ment)? ?(dates?|days?)|paid|deposit(ed)?)\b|\bdates? de (paiement|versement)\b|\bvers[ée]\b/i],
    reply: REPLIES.gis,
    followUps: {
      en: ['How much is Old Age Security?', 'I’m planning to retire. What do I need to do?', ALLOWANCE_Q.en],
      fr: ['Combien donne la pension de la Sécurité de la vieillesse?', 'Je veux planifier ma retraite. Que dois-je faire?', ALLOWANCE_Q.fr],
    },
  },
  {
    id: 'life-events-final-return',
    // Above the death checklist (9): the chip "When is the final tax return due?" needs its own answer.
    priority: 10,
    match: [new RegExp(FINAL_RETURN, 'i')],
    reply: REPLIES['final-return'],
    followUps: {
      en: ['My father died on March 3. When is his final return due?', 'Who can get the CPP survivor’s pension?', 'What do I do when someone dies?'],
      fr: [
        'Mon père est décédé le 3 mars. Quand sa déclaration finale est-elle due?',
        'Qui peut recevoir la pension de survivant du RPC?',
        'Que faire quand quelqu’un meurt?',
      ],
    },
  },
  {
    id: 'life-events-final-return-dated',
    // With a date of death, work out the exact due date and open the checklist with it.
    priority: 11,
    match: [both(FINAL_RETURN, DATE)],
    reply: REPLIES['final-return-dated'],
    vars: finalReturnVars,
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call('death', 'past') }],
    followUps: {
      en: ['Who can get the CPP survivor’s pension?', 'How do I apply for the CPP death benefit?', ALL.en],
      fr: ['Qui peut recevoir la pension de survivant du RPC?', 'Comment demander la prestation de décès du RPC?', ALL.fr],
    },
  },
  {
    id: 'life-events-all',
    priority: 6,
    match: [
      /\blife events?\b/i,
      /\b(big |major )?life (change|changes|moments?)\b/i,
      /(événements?|evenements?) de (la )?vie\b/i,
      /\bgrands? changements? (dans ma|de) vie\b/i,
    ],
    reply: REPLIES.all,
    toolCalls: [{ toolName: 'lifeEventsChecklist', input: call(undefined) }],
    followUps: {
      en: ['I’m moving next month', 'We just had a baby', 'I’m retiring next year'],
      fr: ['Je déménage le mois prochain', 'Nous venons d’avoir un bébé', 'Je prends ma retraite l’an prochain'],
    },
  },
];

export default scenarios;
