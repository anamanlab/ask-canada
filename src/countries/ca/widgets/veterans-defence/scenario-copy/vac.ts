/**
 * Scripted Veterans Affairs Canada scenarios (EN + FR): leaving the Forces, benefits, school, emergencies,
 * disability benefits and mental health. Facts: ../data.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { cite } from '../data';
import type { Audience } from '../supports';
import { MILITAIRE, MILITARY, type Ctx } from './shared';

/** Mental health: who is asking. */
function audienceOf(text: string): Audience {
  if (/\b(RCMP|GRC|mounties?)\b/i.test(text)) return 'rcmp';
  if (/\b(my (husband|wife|partner|spouse|son|daughter|dad|father|mom|mother|brother|sister)|famil(y|ies)|mon (mari|conjoint|fils|père|frère)|ma (femme|conjointe|fille|mère|sœur|soeur)|famille)\b/i.test(text)) return 'family';
  if (/\b(serving|still in|i['’]?m in the (military|forces|army|navy|air force|reserves?)|currently in|member of the CAF|en service|je suis dans (les forces|l['’]armée))\b/i.test(text)) return 'serving';
  return 'veteran';
}

export const vacScenarios: Scenario[] = [
  {
    id: 'vac-leaving',
    priority: 5,
    match: [
      new RegExp(String.raw`\b(leave|leaving|left|release|released|releasing|transition\w*|get(ting)? out of|retir\w*)\b.*\b${MILITARY}\b`, 'i'),
      /\bafter (the )?(military|forces|my service)\b/i,
      /\b(civilian life|military transition)\b/i,
      new RegExp(String.raw`\b(quitt\w*|libér\w*|transition|départ|après)\b.*\b${MILITAIRE}\b`, 'i'),
      /\bvie civile\b/i,
    ],
    reply: {
      en: `# Start with a *transition interview* with Veterans Affairs Canada.

It’s the first step VAC recommends, as early in your release as you can. You and your family learn which services and benefits fit you, and get help applying. Book it by calling 1-866-522-2122 or through My VAC Account. ${cite(1, 'transitionInterview', 'en')}

Your local CAF Transition Centre can also help with your release, benefits and family services. ${cite(2, 'transitionCentres', 'en')}

Depending on your situation, you may get career counselling, money for school, disability benefits for a condition related to your service, and mental health support. The navigator below shows what may fit you. ${cite(3, 'vacServices', 'en')}`,
      fr: `# Commencez par une *entrevue de transition* avec Anciens Combattants Canada.

C’est la première étape que recommande ACC, le plus tôt possible dans votre libération. Vous et votre famille découvrez les services et les avantages qui vous conviennent, et obtenez de l’aide pour présenter vos demandes. Prenez rendez-vous au 1-866-522-2122 ou dans Mon dossier ACC. ${cite(1, 'transitionInterview', 'fr')}

Votre centre de transition des FAC peut aussi vous aider avec votre libération, vos avantages et les services aux familles. ${cite(2, 'transitionCentres', 'fr')}

Selon votre situation, vous pourriez avoir droit à de l’orientation professionnelle, à de l’argent pour vos études, à des prestations d’invalidité pour une affection liée à votre service et à du soutien en santé mentale. Le navigateur ci-dessous montre ce qui pourrait vous convenir. ${cite(3, 'vacServices', 'fr')}`,
    },
    toolCalls: [{ toolName: 'veteransDefenceBenefits', input: ({ lang }: Ctx) => ({ status: 'releasing', lang }) }],
    followUps: {
      en: ['Will Veterans Affairs pay for school?', 'What benefits can I get for PTSD?', 'Mental health support for veterans'],
      fr: ['Anciens Combattants paiera-t-il mes études?', 'Quelles prestations puis-je obtenir pour un TSPT?', 'Soutien en santé mentale pour les vétérans'],
    },
  },
  {
    id: 'vac-benefits',
    priority: 7,
    match: [
      /\bveterans?\b.*\b(benefits?|entitled|support|help|programs?|services?|get)\b/i,
      /\b(benefits?|entitled|programs?)\b.*\bveterans?\b/i,
      /\bveterans affairs\b/i,
      /\bmy VAC account\b/i,
      /\b(vétérans?|anciens? combattants?)\b.*\b(avantages?|prestations?|aide|soutien|programmes?|services?)\b/i,
      /\b(avantages?|prestations?|programmes?)\b.*\b(vétérans?|anciens? combattants?)\b/i,
      /\banciens combattants canada\b/i,
    ],
    reply: {
      en: `# Veterans Affairs Canada supports you *after your service*, and your family too.

Support includes money and compensation, health care, mental health services, education and help finding a new career. Many programs depend on whether an illness or injury is related to your service. ${cite(1, 'vacServices', 'en')}

Tell the navigator a little about yourself: it shows the programs that may fit, what each one pays and how to apply. VAC confirms what you qualify for when you apply. ${cite(2, 'vacNavigator', 'en')}

For free help with an application, call 1-866-522-2122, Monday to Friday, 8:30 to 4:30 local time. ${cite(3, 'vacContact', 'en')}`,
      fr: `# Anciens Combattants Canada vous soutient *après votre service*, ainsi que votre famille.

Le soutien comprend de l’argent et de l’indemnisation, des soins de santé, des services de santé mentale, des études et de l’aide pour trouver une nouvelle carrière. Beaucoup de programmes dépendent de la présence d’une maladie ou d’une blessure liée à votre service. ${cite(1, 'vacServices', 'fr')}

Parlez un peu de vous au navigateur : il présente les programmes qui pourraient vous convenir, ce que chacun offre et comment présenter une demande. ACC confirme votre admissibilité quand vous présentez votre demande. ${cite(2, 'vacNavigator', 'fr')}

Pour de l’aide gratuite avec une demande, composez le 1-866-522-2122, du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. ${cite(3, 'vacContact', 'fr')}`,
    },
    toolCalls: [{ toolName: 'veteransDefenceBenefits', input: ({ lang }: Ctx) => ({ status: 'veteran', lang }) }],
    followUps: {
      en: ['Will Veterans Affairs pay for school?', 'I’m a veteran and I can’t pay my rent', 'Mental health support for veterans'],
      fr: ['Anciens Combattants paiera-t-il mes études?', 'Je suis vétéran et je n’arrive pas à payer mon loyer', 'Soutien en santé mentale pour les vétérans'],
    },
  },
  {
    id: 'vac-school',
    priority: 8,
    match: [
      /\b(veterans?|VAC|veterans affairs|released)\b.*\b(school|college|university|education|tuition|stud(y|ies)|training|degree|courses?)\b/i,
      /\b(school|college|university|education|tuition|stud(y|ies)|degree)\b.*\b(veterans?|VAC|veterans affairs|after (the )?(military|forces)|leaving the (military|forces))\b/i,
      /\beducation and training benefit\b/i,
      /\ballocation pour études et formation\b/i,
      /\b(vétérans?|ACC|anciens? combattants?)\b.*\b(études|école|collège|cégep|université|formation|scolarité|diplôme)\b/i,
      /\b(études|école|collège|cégep|université|formation|scolarité)\b.*\b(vétérans?|ACC|anciens? combattants?|après (les forces|l['’]armée))\b/i,
    ],
    exclude: [/\b(join|enlist|recruit\w*|paid education|rejoindre|enrôl\w*|études subventionnées)\b/i],
    reply: {
      en: `# Yes. The *Education and Training Benefit* pays up to $101,139.94 for school.

If you released honourably on or after April 1, 2006 with at least 6 years (2,191 days) of paid service, you can get up to $50,569.97. With 12 years, it’s up to $101,139.94, and up to $6,321.24 of it can go to short courses. ${cite(1, 'etb', 'en')} ${cite(2, 'rates', 'en')}

You choose the program and the school, and you have 10 years from your release to apply. Released between April 1, 2006 and March 31, 2018? You have until April 1, 2028. ${cite(1, 'etb', 'en')} Apply in My VAC Account.

Not sure what to study? Career Transition Services gives you a career counsellor to help you decide. ${cite(3, 'cts', 'en')}`,
      fr: `# Oui. L’*Allocation pour études et formation* paie jusqu’à 101 139,94 $ pour vos études.

Si vous avez été libéré honorablement le 1er avril 2006 ou après et avez au moins 6 ans (2 191 jours) de service rémunéré, vous pouvez recevoir jusqu’à 50 569,97 $. Avec 12 ans de service, c’est jusqu’à 101 139,94 $, dont jusqu’à 6 321,24 $ pour des cours de courte durée. ${cite(1, 'etb', 'fr')} ${cite(2, 'rates', 'fr')}

Vous choisissez le programme et l’établissement, et vous avez 10 ans après votre libération pour présenter une demande. Libéré entre le 1er avril 2006 et le 31 mars 2018? Vous avez jusqu’au 1er avril 2028. ${cite(1, 'etb', 'fr')} Présentez votre demande dans Mon dossier ACC.

Vous ne savez pas quoi étudier? Les Services de réorientation professionnelle vous offrent un conseiller en orientation pour vous aider à choisir. ${cite(3, 'cts', 'fr')}`,
    },
    toolCalls: [
      {
        toolName: 'veteransDefenceBenefits',
        input: ({ text, lang }: Ctx) => {
          const years = text.match(/\b(\d{1,2})\s*(years?|yrs?|ans)\b/i)?.[1];
          return { status: 'veteran', needs: ['school', 'career'], ...(years ? { yearsOfService: Number(years) } : {}), lang };
        },
      },
    ],
    followUps: {
      en: ['What support is there after I leave the Forces?', 'What benefits can I get for PTSD?', 'Mental health support for veterans'],
      fr: ['Quel soutien existe-t-il après mon départ des Forces?', 'Quelles prestations puis-je obtenir pour un TSPT?', 'Soutien en santé mentale pour les vétérans'],
    },
  },
  {
    id: 'vac-emergency',
    priority: 27,
    match: [
      /\bveterans?\b.*\b(rent|evict\w*|food|emergency|can['’]?t (pay|afford)|broke|homeless|shelter|bills|money now)\b/i,
      /\b(rent|evict\w*|food|emergency|can['’]?t (pay|afford)|broke|homeless|shelter)\b.*\bveterans?\b/i,
      /\bveterans emergency fund\b/i,
      /\b(vétérans?|anciens? combattants?)\b.*\b(loyer|expuls\w*|nourriture|urgence|arrive pas à payer|itinéran\w*|sans[- ]abri|factures?)\b/i,
      /\b(loyer|expuls\w*|nourriture|urgence|itinéran\w*|sans[- ]abri)\b.*\b(vétérans?|anciens? combattants?)\b/i,
      /\bfonds d['’]urgence pour les vétérans\b/i,
    ],
    reply: {
      en: `# The *Veterans Emergency Fund* can help fast with food, shelter and other essentials.

It’s for Veterans and their current spouses or partners, survivors and orphans facing a financial emergency. Once your application is complete, VAC aims to decide within 2 business days, and to pay within 2 business days of approval. ${cite(1, 'vef', 'en')}

Apply in My VAC Account, or call 1-866-522-2122 for help, Monday to Friday, 8:30 to 4:30 local time. Have any bills, notices or quotes ready. ${cite(1, 'vef', 'en')} ${cite(2, 'vacContact', 'en')}

If it’s all too much right now, you can talk to a mental health professional any time, free, at 1-800-268-7708. ${cite(3, 'assistance', 'en')}`,
      fr: `# Le *Fonds d’urgence pour les vétérans* peut vous aider rapidement pour la nourriture, le logement et d’autres besoins essentiels.

Il s’adresse aux vétérans ainsi qu’à leur époux ou conjoint actuel, aux survivants et aux orphelins qui vivent une urgence financière. Une fois votre demande complète, ACC vise à rendre une décision dans les 2 jours ouvrables et à verser le paiement dans les 2 jours ouvrables suivant l’approbation. ${cite(1, 'vef', 'fr')}

Présentez votre demande dans Mon dossier ACC, ou composez le 1-866-522-2122 pour obtenir de l’aide, du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. Ayez vos factures, avis ou soumissions sous la main. ${cite(1, 'vef', 'fr')} ${cite(2, 'vacContact', 'fr')}

Si tout vous semble trop lourd en ce moment, vous pouvez parler gratuitement à un professionnel de la santé mentale, en tout temps, au 1-800-268-7708. ${cite(3, 'assistance', 'fr')}`,
    },
    toolCalls: [{ toolName: 'veteransDefenceBenefits', input: ({ lang }: Ctx) => ({ status: 'veteran', needs: ['emergency', 'money'], lang }) }],
    followUps: {
      en: ['Mental health support for veterans', 'What support is there after I leave the Forces?'],
      fr: ['Soutien en santé mentale pour les vétérans', 'Quel soutien existe-t-il après mon départ des Forces?'],
    },
  },
  {
    id: 'vac-disability',
    priority: 26,
    match: [
      /\bdisability (benefits?|pension|award|claim)\b.*\b(veterans?|VAC|service|military|forces|PTSD|RCMP|hearing|tinnitus)\b/i,
      /\b(veterans?|VAC|military|forces|RCMP)\b.*\bdisability (benefits?|pension|award|claim)\b/i,
      /\b(benefits?|compensation|pension|claim)\b.*\bfor (my )?(PTSD|hearing loss|tinnitus|service[- ]related)\b/i,
      /\b(PTSD|hearing loss|tinnitus)\b.*\b(veterans?|VAC|military|RCMP)\b.*\b(benefits?|compensation|pension|claim)\b/i,
      /\bprestations? d['’]invalidité\b/i,
      /\b(prestations?|indemnisation|pension)\b.*\b(pour (un |mon )?(TSPT|perte auditive|acouphènes))\b/i,
      /\b(TSPT|perte auditive|acouphènes)\b.*\b(vétérans?|ACC|militaire|GRC)\b.*\b(prestations?|indemnisation|pension)\b/i,
    ],
    reply: {
      en: `# If a condition is related to your service, you can apply for *tax-free* disability benefits.

CAF members and Veterans, and current and former RCMP members, can apply for a diagnosed condition related to their service, like PTSD, hearing loss or tinnitus. The amount depends on how much your condition is related to your service and how severe it is. ${cite(1, 'disability', 'en')}

Apply in My VAC Account. Help is free: VAC staff at 1-866-522-2122, any CAF Transition Centre, or service officers at the Royal Canadian Legion. ${cite(1, 'disability', 'en')}

Applying for anxiety, depression or a trauma-related condition? Mental Health Benefits cover your treatment from the day VAC receives your application, while it’s reviewed. ${cite(2, 'mentalHealthBenefits', 'en')}`,
      fr: `# Si une affection est liée à votre service, vous pouvez demander des prestations d’invalidité *non imposables*.

Les membres et vétérans des FAC, ainsi que les membres actuels et anciens de la GRC, peuvent présenter une demande pour une affection diagnostiquée liée à leur service, comme le TSPT, la perte auditive ou les acouphènes. Le montant dépend du lien entre votre affection et votre service, et de sa gravité. ${cite(1, 'disability', 'fr')}

Présentez votre demande dans Mon dossier ACC. L’aide est gratuite : personnel d’ACC au 1-866-522-2122, centres de transition des FAC ou agents d’entraide de la Légion royale canadienne. ${cite(1, 'disability', 'fr')}

Vous faites une demande pour de l’anxiété, une dépression ou une affection liée à un traumatisme? Les avantages pour la santé mentale couvrent votre traitement dès le jour où ACC reçoit votre demande, pendant son examen. ${cite(2, 'mentalHealthBenefits', 'fr')}`,
    },
    toolCalls: [
      {
        toolName: 'veteransDefenceBenefits',
        input: ({ text, lang }: Ctx) => ({ status: /\b(RCMP|GRC)\b/i.test(text) ? 'rcmp' : 'veteran', serviceRelated: 'yes', needs: ['money', 'health', 'mental'], lang }),
      },
    ],
    followUps: {
      en: ['Mental health support for veterans', 'Will Veterans Affairs pay for school?', 'What support is there after I leave the Forces?'],
      fr: ['Soutien en santé mentale pour les vétérans', 'Anciens Combattants paiera-t-il mes études?', 'Quel soutien existe-t-il après mon départ des Forces?'],
    },
  },
  {
    id: 'veterans-mental-health',
    priority: 25,
    match: [
      /\b(veterans?|military|forces|CAF|RCMP|soldiers?|serving members?|service members?|reservists?)\b.*\b(mental health|PTSD|struggl\w*|depress\w*|anxiety|stress|counsel\w*|therap\w*|talk to (someone|somebody)|someone to talk to|operational stress|OSI)\b/i,
      /\b(mental health|PTSD|struggl\w*|depress\w*|anxiety|counsel\w*|therap\w*|operational stress)\b.*\b(veterans?|military|forces|CAF|RCMP|soldiers?|reservists?)\b/i,
      /\bmilitary famil\w+\b/i,
      /\b(vétérans?|militaires?|forces|FAC|GRC|soldats?|réservistes?)\b.*\b(santé mentale|TSPT|stress|dépress\w*|anxiété|parler à quelqu['’]un|consultation|thérapie|BSO)\b/i,
      /\b(santé mentale|TSPT|dépress\w*|anxiété|thérapie)\b.*\b(vétérans?|militaires?|FAC|GRC|soldats?)\b/i,
      /\bfamilles? (de |des )?militaires?\b/i,
    ],
    reply: {
      en: `# You can talk to a mental health professional *right now*, free and 24/7.

If you’re in danger, call 911. If you’re thinking about suicide, call or text 9-8-8 any time. ${cite(1, 'crisis', 'en')}

Veterans, former RCMP members, their families and caregivers can call the VAC Assistance Service at 1-800-268-7708, day or night. It’s free and confidential, and you don’t need to apply or be a VAC client. ${cite(2, 'assistance', 'en')}

Serving members and their families reach the CF Member Assistance Program at the same number. ${cite(3, 'memberAssistance', 'en')} Peer support from people who’ve been there, OSI clinics and treatment coverage are below.`,
      fr: `# Vous pouvez parler à un professionnel de la santé mentale *dès maintenant*, gratuitement, 24 heures sur 24.

Si vous êtes en danger, composez le 911. Si vous pensez au suicide, appelez ou textez le 9-8-8 en tout temps. ${cite(1, 'crisis', 'fr')}

Les vétérans, les anciens membres de la GRC, leur famille et leurs aidants peuvent appeler le Service d’aide d’ACC au 1-800-268-7708, jour et nuit. C’est gratuit et confidentiel, et vous n’avez pas besoin de présenter une demande ni d’être client d’ACC. ${cite(2, 'assistance', 'fr')}

Les militaires en service et leur famille joignent le Programme d’aide aux membres des FC au même numéro. ${cite(3, 'memberAssistance', 'fr')} Le soutien par les pairs, les cliniques pour blessures de stress opérationnel et la couverture des traitements sont ci-dessous.`,
    },
    toolCalls: [{ toolName: 'veteransDefenceMentalHealth', input: ({ text, lang }: Ctx) => ({ audience: audienceOf(text), lang }) }],
    followUps: {
      en: ['What benefits can I get for PTSD?', 'Support for military families', 'What support is there after I leave the Forces?'],
      fr: ['Quelles prestations puis-je obtenir pour un TSPT?', 'Soutien pour les familles de militaires', 'Quel soutien existe-t-il après mon départ des Forces?'],
    },
  },
  {
    // "Support for military families" (a follow-up chip): lead with the families' own 24/7 line, not the Veteran's.
    id: 'veterans-mental-health-family',
    priority: 26,
    match: [
      /\bmilitary famil\w*/i,
      /\bfamil(y|ies) of (CAF|military|serving) (members?|personnel)\b/i,
      /\bfamilles? .*militaires?\b/i,
    ],
    exclude: [/\b(join|enlist|recruit\w*|rejoindre|enrôl\w*)\b/i],
    reply: {
      en: `# Military families can call the *Family Information Line*, any time, at 1-800-866-4546.

It’s a confidential, bilingual line from the Canadian Armed Forces, open 24/7. It gives families information, support, referrals and help in a crisis. ${cite(1, 'vfp', 'en')}

The VAC Assistance Service covers you too. Family members and caregivers of Veterans and former RCMP members can talk to a mental health professional at 1-800-268-7708, free, confidential and day or night. ${cite(2, 'assistance', 'en')} Families of serving members reach the CF Member Assistance Program at the same number. ${cite(3, 'memberAssistance', 'en')}

If someone is in danger, call 911. If you or someone you love is thinking about suicide, call or text 9-8-8. ${cite(4, 'crisis', 'en')} The supports below are the ones for families.`,
      fr: `# Les familles des militaires peuvent appeler la *Ligne d’information pour les familles* en tout temps, au 1-800-866-4546.

C’est un service confidentiel et bilingue des Forces armées canadiennes, offert 24 heures sur 24. Il donne aux familles de l’information, du soutien, de l’aiguillage et de l’aide en situation de crise. ${cite(1, 'vfp', 'fr')}

Le Service d’aide d’ACC s’adresse aussi à vous. Les membres de la famille et les aidants des vétérans et des anciens membres de la GRC peuvent parler à un professionnel de la santé mentale au 1-800-268-7708, gratuitement, en toute confidentialité, jour et nuit. ${cite(2, 'assistance', 'fr')} Les familles des militaires en service joignent le Programme d’aide aux membres des FC au même numéro. ${cite(3, 'memberAssistance', 'fr')}

Si une personne est en danger, composez le 911. Si vous ou un proche pensez au suicide, appelez ou textez le 9-8-8. ${cite(4, 'crisis', 'fr')} Les soutiens ci-dessous sont ceux offerts aux familles.`,
    },
    toolCalls: [{ toolName: 'veteransDefenceMentalHealth', input: ({ lang }: Ctx) => ({ audience: 'family' as Audience, lang }) }],
    followUps: {
      en: ['What support is there after I leave the Forces?', 'Mental health support for veterans', 'I’m a veteran and I can’t pay my rent'],
      fr: ['Quel soutien existe-t-il après mon départ des Forces?', 'Soutien en santé mentale pour les vétérans', 'Je suis vétéran et je n’arrive pas à payer mon loyer'],
    },
  },
];
