/**
 * Scripted scenarios for the `offices` widget (EN + FR): nearest Service Canada Centres, passport offices,
 * biometrics locations, "is it open today?", and appointments. This file holds the matching and the reply
 * frames; what each answer says is computed in widgets/offices/scenario-answers.ts and scenario-open.ts (the verdict names the
 * actual nearest office and its status right now), with the parsing in scenario-helpers.ts. Facts: data.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../widgets/offices/data';
import { openTodayVars } from '../widgets/offices/scenario-open';
import { appointmentVars, biometricsVars, nearVars, passportVars } from '../widgets/offices/scenario-answers';
import { EXCLUDE_ABROAD, finder, focusOf, NB, passportNeed, u, type Ctx } from '../widgets/offices/scenario-helpers';

const offices: Scenario[] = [
  {
    id: 'offices-open-today',
    priority: 15,
    match: [
      /\b(is|are)\b.*\bservice canada\b.*\b(office|offices|centre|centres|center|centers|location|locations)\b.*\b(open|closed)\b/i,
      /\bservice canada\b.*\b(office|offices|centre|centres|center|centers|location|locations)\b.*\b(open|closed|hours)\b/i,
      /\bservice canada\b.*\b(open|closed|hours)\b.*\b(near|in|around|at)\b/i,
      /\b(bureau|bureaux|centre|centres|point de service)\b.*\bservice canada\b.*\b(ouvert|ouverts|fermé|fermés|heures)\b/i,
      /\bservice canada\b.*\b(ouvert|ouverts|fermé|fermés|heures)\b.*\b(près|à|au|dans)\b/i,
    ].map(u),
    reply: {
      en: `# {head}

{lead}Most Service Canada Centres are open *Monday to Friday, 8:30${NB}a.m. to 4${NB}p.m.* local time, and every location closes on public holidays. Some smaller centres close for lunch or open fewer days. [1](${URLS.finder.en})

{tail}`,
      fr: `# {head}

{lead}La plupart des Centres Service Canada sont ouverts *du lundi au vendredi, de 8${NB}h${NB}30 à 16${NB}h*, heure locale, et tous les points de service ferment les jours fériés. Certains petits centres ferment pour le dîner ou ouvrent moins de jours. [1](${URLS.finder.fr})

{tail}`,
    },
    vars: openTodayVars,
    toolCalls: [{ toolName: 'officesFinder', input: finder('any') }],
    followUps: {
      en: ['Do I need an appointment at Service Canada?', 'Find a passport office near me', 'Where can I give my biometrics?'],
      fr: ['Faut-il un rendez-vous chez Service Canada?', 'Trouver un bureau des passeports près de chez moi', 'Où fournir mes données biométriques?'],
    },
  },
  {
    id: 'offices-passport-near',
    priority: 14,
    match: [
      /\bpassport (office|offices|centre|center|centres|centers|location|locations)\b/i,
      /\b(urgent|express|rush)\b.*\bpassport\b.*\b(near|in|at|office|where|location)\b/i,
      /\bwhere\b.*\b(urgent|express|rush)\b.*\bpassport/i,
      /\b(apply|renew)\b.*\bpassport\b.*\bin person\b/i,
      /\bbureaux? des passeports\b/i,
      /\b(centre|centres|point de service|points de service)\b.*\bpasseports?\b/i,
      /\bpasseport\b.*\b(urgent|express)\b.*\b(près|où|à|bureau)\b/i,
      /\boù\b.*\bpasseport\b.*\b(urgent|express)\b/i,
      /\bpasseport\b.*\ben personne\b/i,
    ].map(u),
    exclude: [EXCLUDE_ABROAD],
    reply: {
      en: `# {head}

{body}`,
      fr: `# {head}

{body}`,
    },
    vars: passportVars,
    toolCalls: [{ toolName: 'officesFinder', input: finder(passportNeed) }],
    followUps: {
      en: ['Do I need an appointment for my passport?', 'How much does a passport cost?', 'I’m travelling before it arrives'],
      fr: ['Faut-il un rendez-vous pour mon passeport?', 'Combien coûte un passeport?', 'Je voyage avant de le recevoir'],
    },
  },
  {
    id: 'offices-biometrics-near',
    priority: 14,
    match: [
      /\b(where|near|nearest|closest|location|locations|office|centre|center)\b.*\bbiometric\w*\b/i,
      /\bbiometric\w*\b.*\b(near|nearest|closest|where|location|locations|office|centre|center)\b/i,
      /\b(où|près|proche|bureau|centre|point de service)\b.*\bbiométri\w*/i,
      /\bbiométri\w*\b.*\b(où|près|proche|bureau|centre|point de service)\b/i,
      // The bare question, with or without "où": "Où fournir mes données biométriques?"
      /(^|\s)(où\s.*)?(fournir|donner|faire prendre)\b.*\bbiométri/i,
    ].map(u),
    exclude: [u(/\b(letter|lettre|deadline|délai|how (many|long)|days|jours|BIL|expire\w*|valid\w*)\b/i), EXCLUDE_ABROAD],
    reply: {
      en: `# {head}

{status}Not every location collects biometrics, and you must book before you go. [1](${URLS.finderPassport.en}) [2](${URLS.booking.en})

To book, have the application number from your Biometric Instruction Letter. Bring the letter and the passport or travel document you used to apply. [2](${URLS.booking.en})`,
      fr: `# {head}

{status}Ce ne sont pas tous les points de service qui recueillent la biométrie, et vous devez réserver avant de vous déplacer. [1](${URLS.finderPassport.fr}) [2](${URLS.booking.fr})

Pour réserver, ayez en main le numéro de demande inscrit dans votre lettre d’instructions relative à la biométrie. Apportez la lettre et le passeport ou le titre de voyage utilisé pour votre demande. [2](${URLS.booking.fr})`,
    },
    vars: biometricsVars,
    toolCalls: [{ toolName: 'officesFinder', input: finder('biometrics') }],
    followUps: {
      en: ['How long do I have to give my biometrics after the letter?', 'Book a biometrics appointment', 'Is the Service Canada office open today?'],
      fr: ['Combien de jours ai-je pour fournir mes données biométriques après la lettre?', 'Prendre rendez-vous pour la biométrie', 'Le bureau de Service Canada est-il ouvert aujourd’hui?'],
    },
  },
  {
    id: 'offices-near',
    priority: 13,
    match: [
      /\bservice canada (office|offices|centre|centres|center|centers|location|locations)\b/i,
      /\b(nearest|closest|find|where is|where's)\b.*\bservice canada\b/i,
      /\bservice canada\b.*\b(near|nearest|closest|in person)\b/i,
      /\b(bureau|bureaux|centre|centres|point de service|points de service)\b.*\bservice canada\b/i,
      /\bservice canada\b.*\b(près|proche|le plus proche|en personne)\b/i,
    ].map(u),
    reply: {
      en: `# {head}

{status}Every Service Canada Centre helps in person with your SIN, Employment Insurance, CPP and Old Age Security, the Canadian Dental Care Plan, the Canada Child Benefit and more. Most are open Monday to Friday, 8:30${NB}a.m. to 4${NB}p.m. local time, and most take walk-ins. [1](${URLS.finder.en}) [2](${URLS.booking.en})

Would a phone call work better? Send a service request and an officer calls you within 2 business days. [3](${URLS.callback.en})

{tail}`,
      fr: `# {head}

{status}Tous les Centres Service Canada vous aident en personne pour le NAS, l’assurance-emploi, le RPC et la Sécurité de la vieillesse, le Régime canadien de soins dentaires, l’Allocation canadienne pour enfants et plus encore. La plupart sont ouverts du lundi au vendredi, de 8${NB}h${NB}30 à 16${NB}h, heure locale, et la plupart vous accueillent sans rendez-vous. [1](${URLS.finder.fr}) [2](${URLS.booking.fr})

Un appel vous conviendrait mieux? Envoyez une demande de services : un agent vous appelle dans les 2 jours ouvrables. [3](${URLS.callback.fr})

{tail}`,
    },
    vars: nearVars,
    toolCalls: [{ toolName: 'officesFinder', input: finder('any') }],
    followUps: {
      en: ['Is the Service Canada office open today?', 'Do I need an appointment at Service Canada?', 'Find a passport office near me'],
      fr: ['Le bureau de Service Canada est-il ouvert aujourd’hui?', 'Faut-il un rendez-vous chez Service Canada?', 'Trouver un bureau des passeports près de chez moi'],
    },
  },
  {
    id: 'offices-appointment',
    priority: 13,
    match: [
      /\bappointment\b.*\b(passport|biometric\w*|service canada)\b/i,
      /\b(passport|biometric\w*|service canada)\b.*\bappointment\b/i,
      /\brendez-vous\b.*\b(passeport|biométri\w*|service canada)\b/i,
      /\b(passeport|biométri\w*|service canada)\b.*\brendez-vous\b/i,
    ].map(u),
    exclude: [EXCLUDE_ABROAD, u(/\b(letter|lettre|deadline|délai|how (many|long)|combien de jours|BIL)\b/i)],
    reply: {
      en: `# {head}

{body}

{outro}`,
      fr: `# {head}

{body}

{outro}`,
    },
    vars: appointmentVars,
    toolCalls: [{ toolName: 'officesAppointment', input: ({ text, lang }: Ctx) => ({ focus: focusOf(text), lang }) }],
    followUps: {
      en: ['Find a Service Canada office near me', 'Where can I give my biometrics?', 'Is the Service Canada office open today?'],
      fr: ['Trouver un bureau de Service Canada près de chez moi', 'Où fournir mes données biométriques?', 'Le bureau de Service Canada est-il ouvert aujourd’hui?'],
    },
  },
];

export default offices;
