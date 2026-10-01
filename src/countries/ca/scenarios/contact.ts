/** Scripted scenarios for the `contact` widget (EN + FR). Facts and department rules: widgets/contact/data.ts. */
import type { Scenario } from '@/lib/scripted/types';
import { both, FRAUD, PHONE_EN, PHONE_FR, TTY } from '../widgets/contact/scenario-match';
import { craNote, eiNow, keepTogether, openNow, todayNote } from '../widgets/contact/scenario-notes';
import { urgentScenarios } from '../widgets/contact/scenarios-urgent';
import { URLS } from '../widgets/contact/urls';

type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };

const contact: Scenario[] = [
  {
    id: 'contact-callback',
    // Above the product-recall scenarios: in French "rappel" is both a call-back and a recall.
    priority: 15,
    match: [
      /\b(request|ask for|get|book|schedule)\b.*\bcall[- ]?back\b/i,
      /\bcall me back\b/i,
      /\b(demander|obtenir)\b.*\brappel\b.*\b(service canada|agent|téléphon\w*|assurance-emploi)/i,
      /\bme rappelle\b/i,
      /\bdemande de rappel\b/i,
    ],
    exclude: [FRAUD],
    reply: {
      en: `# Ask Service Canada to call you back *online*.

Fill in the eServiceCanada service request form, and an officer will call you back within 2 business days. [1](${URLS.ei.en}) You’ll find the form on eServiceCanada. [2](${URLS.callback.en} "eServiceCanada: service request form")

If you’d rather call now, agents answer Monday to Friday, 8:30 a.m. to 4:30 p.m. local time. [1](${URLS.ei.en}) Here’s the Employment Insurance line with its hours in your time.`,
      fr: `# Demandez à Service Canada de vous rappeler *en ligne*.

Remplissez le formulaire de demande de service eServiceCanada, et un agent vous rappellera dans les 2 jours ouvrables. [1](${URLS.ei.fr}) Le formulaire se trouve sur eServiceCanada. [2](${URLS.callback.fr} "eServiceCanada : formulaire de demande de service")

Si vous préférez appeler maintenant, les agents répondent du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. [1](${URLS.ei.fr}) Voici la ligne de l’assurance-emploi, avec ses heures selon votre fuseau.`,
    },
    toolCalls: [{ toolName: 'contactDirectory', input: ({ lang, timeZone }: Ctx) => ({ topic: 'ei', lang, timeZone }) }],
    followUps: {
      en: ['Is Service Canada open right now?', 'What’s the phone number for EI?', 'Show me TTY numbers'],
      fr: ['Service Canada est-il ouvert en ce moment?', 'Quel est le numéro de l’assurance-emploi?', 'Afficher les numéros ATS'],
    },
  },
  {
    id: 'contact-cra-phone',
    priority: 14,
    match: [
      ...both('(cra|canada revenue agency|revenue canada)', PHONE_EN),
      ...both('(arc|agence du revenu( du canada)?)', PHONE_FR),
    ],
    exclude: [FRAUD],
    reply: {
      en: `# The CRA has no single phone number, and *going online* is often faster.

{todayNote}

Your CRA account lets you check a refund, get your notice of assessment or update your details, and you can chat with an agent there on weekdays. [1](${URLS.craFast.en})

To call, use 1-800-959-8281 for personal tax or 1-800-387-1193 for benefits like the Canada Child Benefit. Agents answer Monday to Friday, 8 a.m. to 8 p.m. Eastern time. [2](${URLS.cra.en}) The card shows both lines in your own time.`,
      fr: `# L’ARC n’a pas de numéro unique, et *passer par Internet* est souvent plus rapide.

{todayNote}

Votre compte de l’ARC vous permet de vérifier un remboursement, d’obtenir votre avis de cotisation ou de mettre à jour vos renseignements, et d’y clavarder avec un agent en semaine. [1](${URLS.craFast.fr})

Pour appeler, composez le 1-800-959-8281 pour l’impôt des particuliers ou le 1-800-387-1193 pour les prestations comme l’Allocation canadienne pour enfants. Les agents répondent du lundi au vendredi, de 8 h à 20 h, heure de l’Est. [2](${URLS.cra.fr}) La carte indique les deux lignes selon votre fuseau.`,
    },
    vars: ({ lang }) => ({ todayNote: craNote(lang, Date.now()) }),
    toolCalls: [{ toolName: 'contactDirectory', input: ({ lang, timeZone }: Ctx) => ({ topic: 'taxes', lang, timeZone }) }],
    followUps: {
      en: ['What’s the phone number for EI?', 'I think a call from the CRA was a scam', 'Is Service Canada open right now?', 'Show me TTY numbers'],
      fr: ['Quel est le numéro de l’assurance-emploi?', 'Je pense qu’un appel de l’ARC était une arnaque', 'Service Canada est-il ouvert en ce moment?', 'Afficher les numéros ATS'],
    },
  },
  {
    id: 'contact-ei-phone',
    priority: 14,
    match: [...both('(ei|employment insurance)', PHONE_EN), ...both('(ae|assurance-emploi|assurance emploi)', PHONE_FR)],
    exclude: [FRAUD],
    reply: {
      en: `{heading}

{todayNote}

It’s toll-free in Canada and the U.S., and agents answer Monday to Friday, 8:30 a.m. to 4:30 p.m. local time. For service in French, call 1-800-808-6352. [1](${URLS.ei.en})

Rather not wait on hold? Request a call back online and an officer will call you within 2 business days. [1](${URLS.ei.en}) The card below has the TTY and international numbers too.`,
      fr: `{heading}

{todayNote}

L’appel est sans frais au Canada et aux États-Unis, et les agents répondent du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. Pour le service en anglais, composez le 1-800-206-7218. [1](${URLS.ei.fr})

Vous préférez ne pas attendre? Demandez un rappel en ligne et un agent vous appellera dans les 2 jours ouvrables. [1](${URLS.ei.fr}) La carte ci-dessous indique aussi les numéros ATS et depuis l’étranger.`,
    },
    vars: ({ lang }) => eiNow(lang, Date.now()),
    toolCalls: [{ toolName: 'contactDirectory', input: ({ text, lang, timeZone }: Ctx) => ({ topic: 'ei', tty: TTY.test(text) || undefined, lang, timeZone }) }],
    followUps: {
      en: ['Is Service Canada open right now?', 'What’s the CRA phone number?', 'Show me TTY numbers', 'I think I got scammed'],
      fr: ['Service Canada est-il ouvert en ce moment?', 'Quel est le numéro de l’ARC?', 'Afficher les numéros ATS', 'Je pense avoir été victime d’une arnaque'],
    },
  },
  {
    id: 'contact-passport-phone',
    priority: 13,
    match: [...both('(passports?)', '(phone|number|call|contact|talk|speak|reach)'), ...both('(passeports?)', '(téléphone|telephone|numéro|numero|appeler|joindre|contacter|parler)')],
    exclude: [/\bhow (long|many)\b/i, /\bcombien\b/i, /\b(office|bureau)\b/i],
    reply: {
      en: `# Start with the *online status checker*: it answers most passport questions.

You can see where your passport application is online, without waiting on the phone. [1](${URLS.passportStatus.en})

If you still need help, the Passport Program’s contact page shows the right way to reach them for your situation. [2](${URLS.passport.en}) Not sure who to ask about something else? 1 800 O-Canada (1-800-622-6232) helps with any federal program. [3](${URLS.oCanada.en})`,
      fr: `# Commencez par l’*outil de vérification en ligne* : il répond à la plupart des questions sur les passeports.

Vous pouvez voir où en est votre demande de passeport en ligne, sans attendre au téléphone. [1](${URLS.passportStatus.fr})

Si vous avez encore besoin d’aide, la page de contact du Programme de passeport indique la bonne façon de le joindre selon votre situation. [2](${URLS.passport.fr}) Pour toute autre question fédérale, 1 800 O-Canada (1-800-622-6232) peut vous orienter. [3](${URLS.oCanada.fr})`,
    },
    toolCalls: [{ toolName: 'contactDirectory', input: ({ lang, timeZone }: Ctx) => ({ topic: 'passports', lang, timeZone }) }],
    followUps: {
      en: ['My passport expires in March', 'Find a passport office near me', 'Is Service Canada open right now?'],
      fr: ['Mon passeport expire en mars', 'Trouver un bureau des passeports près de chez moi', 'Service Canada est-il ouvert en ce moment?'],
    },
  },
  {
    id: 'contact-open-now',
    priority: 11,
    match: [
      /\bis service canada open\b/i,
      /\b(service canada|call cent(re|er)s?|government (phone )?lines?)\b.*\bopen (now|today|right now)\b/i,
      /\bservice canada\b.*\b(open|hours)\b/i,
      /\bservice canada\b.*\bouvert/i,
      /\b(est-ce que )?service canada est[- ]il ouvert\b/i,
      /\bheures d[’']ouverture\b.*\bservice canada\b/i,
    ],
    exclude: [FRAUD, /\b(offices?|bureaux?|in[- ]person|en personne|near me|près de)\b/i],
    reply: {
      en: `{heading}

{lead}

Service Canada lines for EI, CPP and Old Age Security, and dental care answer Monday to Friday, 8:30 a.m. to 4:30 p.m. local time, and are closed on weekends and public holidays. [2](${URLS.ei.en}) [3](${URLS.cpp.en})

Here are those lines, with the hours in your time and whether each one is open right now.`,
      fr: `{heading}

{lead}

Les lignes de Service Canada pour l’AE, le RPC et la Sécurité de la vieillesse, et les soins dentaires répondent du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale; elles sont fermées la fin de semaine et les jours fériés. [2](${URLS.ei.fr}) [3](${URLS.cpp.fr})

Voici ces lignes, avec leurs heures selon votre fuseau et leur état en ce moment.`,
    },
    vars: ({ lang }) => openNow(lang, Date.now()),
    toolCalls: [{ toolName: 'contactDirectory', input: ({ text, lang, timeZone }: Ctx) => ({ topic: 'service-canada', tty: TTY.test(text) || undefined, lang, timeZone }) }],
    followUps: {
      en: ['What’s the phone number for EI?', 'What’s the CRA phone number?', 'Show me TTY numbers', 'How do I request a call back?'],
      fr: ['Quel est le numéro de l’assurance-emploi?', 'Quel est le numéro de l’ARC?', 'Afficher les numéros ATS', 'Comment demander que Service Canada me rappelle?'],
    },
  },
  {
    id: 'contact-tty',
    priority: 11,
    match: [
      /\b(show|give|list|what are)\b.*\b(tty|teletypewriter)\b/i,
      /\b(tty|teletypewriter)\b.*\b(numbers?|lines?)\b/i,
      /\b(deaf|hard of hearing)\b.*\b(call|phone|numbers?|contact)\b/i,
      /\b(numéros?|lignes?)\b.*\bats\b/i,
      /\bats\b.*\b(numéros?|lignes?)\b/i,
      /\b(sourde?s?|malentendante?s?)\b.*\b(appeler|téléphone|numéros?|joindre)\b/i,
    ],
    exclude: [FRAUD],
    reply: {
      en: `# For TTY, the CRA’s line is *1-800-665-0354*, and each Service Canada program has its own.

The CRA’s TTY line answers Monday to Friday, 8 a.m. to 8 p.m. Eastern time. [1](${URLS.cra.en})

For Employment Insurance, the TTY number is 1-800-529-3742. [2](${URLS.ei.en}) For CPP and Old Age Security, TTY or Canada VRS users call 1-800-255-4786. [3](${URLS.cpp.en}) The Canadian Dental Care Plan’s TTY line is 1-833-677-6262 [4](${URLS.dental.en}), and 1 800 O-Canada’s is 1-800-926-9105. [5](${URLS.oCanada.en})

Canada VRS video relay also works with the CRA and EI lines. Here’s every line with its TTY number first, and whether it’s open now.`,
      fr: `# Pour l’ATS, la ligne de l’ARC est le *1-800-665-0354*, et chaque programme de Service Canada a la sienne.

La ligne ATS de l’ARC répond du lundi au vendredi, de 8 h à 20 h, heure de l’Est. [1](${URLS.cra.fr})

Pour l’assurance-emploi, le numéro ATS est le 1-800-529-3742. [2](${URLS.ei.fr}) Pour le RPC et la Sécurité de la vieillesse, les utilisateurs d’ATS ou de SRV Canada composent le 1-800-255-4786. [3](${URLS.cpp.fr}) La ligne ATS du Régime canadien de soins dentaires est le 1-833-677-6262 [4](${URLS.dental.fr}), et celle de 1 800 O-Canada, le 1-800-926-9105. [5](${URLS.oCanada.fr})

Le service de relais vidéo SRV Canada fonctionne aussi avec les lignes de l’ARC et de l’AE. Voici chaque ligne avec son numéro ATS en premier, et son état en ce moment.`,
    },
    toolCalls: [{ toolName: 'contactDirectory', input: ({ lang, timeZone }: Ctx) => ({ topic: 'all', tty: true, lang, timeZone }) }],
    followUps: {
      en: ['Is Service Canada open right now?', 'What’s the CRA phone number?', 'Show me all emergency numbers'],
      fr: ['Service Canada est-il ouvert en ce moment?', 'Quel est le numéro de l’ARC?', 'Afficher les numéros d’urgence'],
    },
  },
  {
    id: 'contact-directory',
    priority: 10,
    match: [
      /\bis service canada open\b/i,
      /\b(service canada|government|federal|canada\.ca)\b.*\b(phone numbers?|open (now|today|right now)|hours|call cent(re|er)s?)\b/i,
      /\b(phone numbers?|call cent(re|er)s?)\b.*\b(government|federal|service canada)\b/i,
      /\bwho (do|should) i call\b(?!.*\b(abroad|overseas|travel\w*)\b)/i,
      /\b(1[- ]?800[- ]?o[- ]?canada|o-canada)\b/i,
      /\b(show|give|list)\b.*\b(tty|teletypewriter)\b/i,
      /\b(tty|teletypewriter)\b.*\b(numbers?|lines?)\b/i,
      /\bservice canada\b.*\bouvert/i,
      /\b(numéros? de téléphone|heures d[’']ouverture|centres? d[’']appels?)\b.*\b(gouvernement|fédéra\w*|service canada)\b/i,
      /\bqui (dois-je|devrais-je|faut-il) appeler\b/i,
      /\b(numéros?|lignes?)\b.*\bats\b/i,
      /\bats\b.*\b(numéros?|lignes?)\b/i,
    ],
    exclude: [FRAUD],
    reply: {
      en: `# Here’s who to call, with *live hours* in your time.

{todayNote}

Service Canada lines for EI, CPP and Old Age Security, and dental care answer Monday to Friday, 8:30 a.m. to 4:30 p.m. local time. [1](${URLS.ei.en}) [2](${URLS.cpp.en}) CRA agents answer on weekdays from 8 a.m. to 8 p.m. Eastern time. [3](${URLS.cra.en})

Not sure who to call? **1 800 O-Canada** (1-800-622-6232) helps with any federal program, weekdays 8 a.m. to 5 p.m. local time. [4](${URLS.oCanada.en}) Pick a topic below for every number, including TTY and international lines.`,
      fr: `# Voici qui appeler, avec les *heures en direct* selon votre fuseau.

{todayNote}

Les lignes de Service Canada pour l’AE, le RPC et la Sécurité de la vieillesse, et les soins dentaires répondent du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. [1](${URLS.ei.fr}) [2](${URLS.cpp.fr}) Les agents de l’ARC répondent en semaine de 8 h à 20 h, heure de l’Est. [3](${URLS.cra.fr})

Vous ne savez pas qui appeler? **1 800 O-Canada** (1-800-622-6232) vous aide pour tous les programmes fédéraux, en semaine de 8 h à 17 h, heure locale. [4](${URLS.oCanada.fr}) Choisissez un sujet ci-dessous pour voir tous les numéros, y compris ATS et depuis l’étranger.`,
    },
    vars: ({ lang }) => ({ todayNote: todayNote(lang, Date.now()) }),
    toolCalls: [{ toolName: 'contactDirectory', input: ({ text, lang, timeZone }: Ctx) => ({ topic: 'all', tty: TTY.test(text) || undefined, lang, timeZone }) }],
    followUps: {
      en: ['What’s the CRA phone number?', 'What’s the phone number for EI?', 'Show me all emergency numbers', 'I think I got scammed'],
      fr: ['Quel est le numéro de l’ARC?', 'Quel est le numéro de l’assurance-emploi?', 'Afficher les numéros d’urgence', 'Je pense avoir été victime d’une arnaque'],
    },
  },
  ...urgentScenarios,
];

/** Phone numbers and times in the answers never break across lines (see `keepTogether`). */
export default contact.map((sc) => {
  const vars = sc.vars;
  return {
    ...sc,
    reply: { en: keepTogether(sc.reply.en), fr: keepTogether(sc.reply.fr) },
    vars: vars
      ? async (ctx: { text: string; lang: 'en' | 'fr' }) => {
          const v = await vars(ctx);
          return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, keepTogether(x)]));
        }
      : undefined,
  };
}) satisfies Scenario[];
