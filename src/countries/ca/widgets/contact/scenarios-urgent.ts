/** Scripted scenarios for the urgent-help card (scams, crisis and emergency lines), EN + FR. Listed in scenarios/contact.ts. */
import type { Scenario } from '@/lib/scripted/types';
import { FRAUD, LOST, SUSPECTED } from './scenario-match';
import { URLS } from './urls';

type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };

export const urgentScenarios: Scenario[] = [
  {
    id: 'contact-fraud-suspected',
    // Above "I've been scammed" (16): a suspicious call with nothing lost gets the "is it a scam?" answer.
    // Below documents-scam (17), which owns "is this letter real?" questions about a document.
    priority: 16.5,
    match: SUSPECTED,
    exclude: LOST,
    reply: {
      en: `# Hang up: the CRA *never threatens arrest* or asks for gift cards or crypto.

Scammers often pretend to be from the CRA. The CRA will never threaten to arrest or deport you, use aggressive language, or demand immediate payment by gift card, prepaid credit card, cryptocurrency or Interac e-Transfer. [1](${URLS.craRecognize.en})

To check, sign in to your CRA account or call the CRA yourself at 1-800-959-8281, the number listed on canada.ca. Never call back a number the caller gave you: caller ID can be faked. [1](${URLS.craRecognize.en}) [2](${URLS.cra.en})

Report the call to the Canadian Anti-Fraud Centre, even if you didn’t lose any money or share any information. [3](${URLS.craScam.en}) If you did pay or give out banking details, call your bank right away. [4](${URLS.bureauFraud.en}) The card has the warning signs and what to do next.`,
      fr: `# Raccrochez : l’ARC ne *menace jamais d’arrestation* et n’exige jamais de cartes-cadeaux ni de cryptomonnaie.

Les arnaqueurs se font souvent passer pour l’ARC. L’ARC ne va jamais menacer de vous arrêter ou de vous expulser, utiliser un langage agressif, ni exiger un paiement immédiat par carte-cadeau, carte de crédit prépayée, cryptomonnaie ou virement Interac. [1](${URLS.craRecognize.fr})

Pour vérifier, connectez-vous à votre compte de l’ARC ou appelez vous-même l’ARC au 1-800-959-8281, le numéro indiqué sur canada.ca. Ne rappelez jamais un numéro donné par l’appelant : l’afficheur peut être trafiqué. [1](${URLS.craRecognize.fr}) [2](${URLS.cra.fr})

Signalez l’appel au Centre antifraude du Canada, même si vous n’avez perdu aucun argent ni donné de renseignements. [3](${URLS.craScam.fr}) Si vous avez payé ou donné vos coordonnées bancaires, appelez votre banque sans tarder. [4](${URLS.bureauFraud.fr}) La carte présente les signes d’une arnaque et quoi faire ensuite.`,
    },
    toolCalls: [{ toolName: 'contactUrgent', input: ({ lang, timeZone }: Ctx) => ({ situation: 'suspected', lang, timeZone }) }],
    followUps: {
      en: ['I already paid the scammer', 'What’s the CRA phone number?', 'Is this CRA letter real or a scam?', 'Show me all emergency numbers'],
      fr: ['J’ai déjà payé l’arnaqueur', 'Quel est le numéro de l’ARC?', 'Cette lettre de l’ARC est-elle vraie ou une arnaque?', 'Afficher les numéros d’urgence'],
    },
  },
  {
    id: 'contact-fraud',
    priority: 16,
    match: [FRAUD, /\b(claim(s|ing|ed)?|pretend(s|ing|ed)?) to be\b.*\b(cra|service canada|police|government)\b/i, /\b(prétend|se fait passer pour)\b.*\b(arc|service canada|police|gouvernement)\b/i],
    reply: {
      en: `# If you’ve been scammed, *act quickly*, starting with your bank.

Call your bank first, then report it to your local police and ask for a file number, then tell the Canadian Anti-Fraud Centre. [1](${URLS.craScam.en}) [2](${URLS.bureauFraud.en}) The steps and the Centre’s live hours are below.

Watch for a second scam: fraudsters often contact victims again, promising to recover their money. Never pay to get money back. [3](${URLS.craRecognize.en}) If you’re in danger, call 9-1-1.`,
      fr: `# Si vous avez été victime d’une arnaque, *agissez vite*, en commençant par votre banque.

Appelez d’abord votre banque, puis signalez l’incident à votre service de police local en demandant un numéro de dossier, et informez ensuite le Centre antifraude du Canada. [1](${URLS.craScam.fr}) [2](${URLS.bureauFraud.fr}) Les étapes et les heures du Centre en direct sont ci-dessous.

Méfiez-vous d’une deuxième arnaque : les fraudeurs communiquent souvent de nouveau avec les victimes en promettant de récupérer leur argent. Ne payez jamais pour récupérer de l’argent. [3](${URLS.craRecognize.fr}) Si vous êtes en danger, composez le 9-1-1.`,
    },
    toolCalls: [{ toolName: 'contactUrgent', input: ({ lang, timeZone }: Ctx) => ({ situation: 'fraud', lang, timeZone }) }],
    followUps: {
      en: ['What’s the CRA phone number?', 'Show me all emergency numbers', 'Who do I call for EI?'],
      fr: ['Quel est le numéro de l’ARC?', 'Afficher les numéros d’urgence', 'Quel est le numéro de l’assurance-emploi?'],
    },
  },
  {
    id: 'contact-urgent-lines',
    priority: 12,
    match: [
      /\b(emergency|crisis|help ?lines?|hotlines?)\b.*\b(numbers?|lines?|phones?)\b/i,
      /\b(numbers?|lines?)\b.*\b(emergency|crisis|help ?lines?)\b/i,
      /\b(kids help phone|hope for wellness)\b/i,
      /\b(numéros?|lignes?)\b.*\b(urgence|crise|d[’']aide|d[’']écoute)\b/i,
      /\b(jeunesse,? j[’']écoute|ligne d[’']écoute d[’']espoir)\b/i,
    ],
    exclude: [FRAUD],
    reply: {
      en: `# In an emergency, call *9-1-1*.

If you’re in immediate danger or need urgent medical support, call 9-1-1. For a suicide or mental health crisis, call or text **9-8-8**, 24 hours a day, 7 days a week, in English or French. [1](${URLS.mentalHealth.en})

Young people aged 5 to 29 can call Kids Help Phone at 1-800-668-6868 or text CONNECT to 686868. First Nations, Inuit and Métis Peoples can call the Hope for Wellness Help Line at 1-855-242-3310. Both answer 24/7. [1](${URLS.mentalHealth.en})`,
      fr: `# En cas d’urgence, composez le *9-1-1*.

Si vous êtes en danger immédiat ou avez besoin de soins médicaux urgents, composez le 9-1-1. En cas de crise de suicide ou de santé mentale, appelez ou textez le **9-8-8**, 24 heures sur 24, 7 jours sur 7, en français ou en anglais. [1](${URLS.mentalHealth.fr})

Les jeunes de 5 à 29 ans peuvent appeler Jeunesse, J’écoute au 1-800-668-6868 ou texter PARLER au 686868. Les membres des Premières Nations, les Inuit et les Métis peuvent appeler la Ligne d’écoute d’espoir pour le mieux-être au 1-855-242-3310. Les deux lignes répondent 24 heures sur 24. [1](${URLS.mentalHealth.fr})`,
    },
    toolCalls: [{ toolName: 'contactUrgent', input: ({ lang, timeZone }: Ctx) => ({ situation: 'all', lang, timeZone }) }],
    followUps: {
      en: ['What happens when I call 9-8-8?', 'Find mental health support near me', 'I think I got scammed', 'Who do I call about government services?'],
      fr: ['Que se passe-t-il quand j’appelle le 9-8-8?', 'Trouver du soutien en santé mentale près de chez moi', 'Je pense avoir été victime d’une arnaque', 'Qui dois-je appeler pour les services fédéraux?'],
    },
  },
];
