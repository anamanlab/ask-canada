/** Scripted answer for the Pleasure Craft Operator Card: who needs it, youth limits, replacing a lost card. */
import type { Scenario } from '@/lib/scripted/types';
import { HP, soloLimit } from '../boating';
import { URLS } from '../data';
import { ageOf, horsepowerOf, pwcOf } from '../parse';
import type { Ctx, Lang } from './text';

const BOAT_BODY: Record<Lang, string> = {
  en: `What most people call a “boating licence” is the Pleasure Craft Operator Card. You need it (or another proof of competency) to operate any recreational boat with a motor, even an electric trolling motor, and even when the motor is off. [1](${URLS.pcoc.en})

You get the card by passing a boating safety test from a course provider accredited by Transport Canada, usually at the end of a course online or in class. It’s valid for life, and providers set the fees. [1](${URLS.pcoc.en}) [2](${URLS.pcocProviders.en})

Young operators have horsepower limits without direct supervision: up to 10 hp under 12, up to 40 hp from 12 to 15, and no personal watercraft under 16. [1](${URLS.pcoc.en}) Set the driver’s age and the engine below to check.`,
  fr: `Ce qu’on appelle souvent le « permis de bateau » est la carte de conducteur d’embarcation de plaisance. Il vous la faut (ou une autre preuve de compétence) pour conduire toute embarcation de plaisance munie d’un moteur, même un moteur électrique de pêche à la traîne, et même lorsque le moteur est arrêté. [1](${URLS.pcoc.fr})

Vous obtenez la carte en réussissant un examen de sécurité nautique d’un fournisseur de cours agréé par Transports Canada, habituellement à la fin d’un cours en ligne ou en classe. Elle est valide à vie, et les fournisseurs fixent les frais. [1](${URLS.pcoc.fr}) [2](${URLS.pcocProviders.fr})

Les jeunes conducteurs ont des limites de puissance sans surveillance directe : jusqu’à 10 HP avant 12 ans, jusqu’à 40 HP de 12 à 15 ans, et aucune motomarine avant 16 ans. [1](${URLS.pcoc.fr}) Indiquez l’âge du conducteur et le moteur ci-dessous pour vérifier.`,
};

/** Under 16 without an engine size: the solo limit, and what a bigger engine takes (direct supervision = someone 16+ aboard). */
const youthLead = (age: number, lang: Lang) => {
  const hp = soloLimit(age);
  const kw = hp === HP.under12 ? '7,5' : '30';
  return lang === 'fr'
    ? `Sans surveillance directe, un jeune de ${age} ans peut conduire une embarcation d’au plus ${hp} HP (${kw} kW). Pour un moteur plus puissant, une personne de 16 ans ou plus doit être à bord et le surveiller directement. [1](${URLS.pcoc.fr})`
    : `Without direct supervision, a ${age}-year-old can drive a boat of up to ${hp} hp (${kw.replace(',', '.')} kW). For a bigger engine, someone 16 or older must be in the boat, directly supervising them. [1](${URLS.pcoc.en})`;
};
/** The youth lead, then what the card is and how to get it (BOAT_BODY without its horsepower paragraph, already covered). */
const youthBody = (age: number, lang: Lang) => {
  const [what, how] = BOAT_BODY[lang].split('\n\n');
  const check = lang === 'fr' ? 'Indiquez la puissance du moteur ci-dessous pour vérifier un bateau en particulier.' : 'Set the engine size below to check a specific boat.';
  return [youthLead(age, lang), what, `${how} ${check}`].join('\n\n');
};

/** Replacing a lost or damaged card (Operator Card FAQ, 2026-05-12; PCOC page for the copy rule). */
const BOAT_LOST: Record<Lang, string> = {
  en: `Only course providers that are currently accredited by Transport Canada can issue a replacement card, and they charge a fee for it. Contact the provider who issued yours: Transport Canada’s Course Provider Lookup finds it. [1](${URLS.pcocLookup.en}) [2](${URLS.pcocFaq.en})

Your card is valid for life. A paper or electronic copy isn’t accepted as proof of competency, so carry the card itself on board. [3](${URLS.pcoc.en}) For other questions, call the Boating Safety Infoline at 1-800-267-6687. [3](${URLS.pcoc.en})

The steps and the provider lookup are below.`,
  fr: `Seuls les fournisseurs de cours actuellement agréés par Transports Canada peuvent délivrer une carte de remplacement, et ils exigent des frais pour le faire. Communiquez avec le fournisseur qui a délivré la vôtre : l’outil de recherche de fournisseurs de cours de Transports Canada vous aide à le trouver. [1](${URLS.pcocLookup.fr}) [2](${URLS.pcocFaq.fr})

Votre carte est valide à vie. Une copie papier ou électronique n’est pas acceptée comme preuve de compétence : ayez la carte elle-même à bord. [3](${URLS.pcoc.fr}) Pour toute autre question, appelez la Ligne d’information sur la sécurité nautique au 1-800-267-6687. [3](${URLS.pcoc.fr})

Les étapes et l’outil de recherche sont ci-dessous.`,
};
const LOST = /\b(lost|lose|replace\w*|damaged|perdu\w*|remplac\w*|endommag\w*)\b/i;

export const boatingScenario: Scenario = {
  id: 'transport-boating',
  priority: 8,
  match: [
    /\b(boat(ing)?|pleasure craft|sea-?doo|jet ?ski|personal watercraft|pwc|outboard|motorboat)\b.*\b(licen[cs]e|card|operator|need|allowed|drive|operate|age|old|pcoc)\b/i,
    /\b(licen[cs]e|card|can|allowed|need)\b.*\b(boat(ing)?|sea-?doo|jet ?ski|personal watercraft)\b/i,
    /\bpcoc\b/i,
    /\b(carte de conducteur d['’]embarcation|ccep|permis de bateau|permis d['’]embarcation|permis de conduire un bateau)\b/i,
    /\b(bateau|embarcation|motomarine|sea-?doo|moteur hors-bord)\b.*(permis|carte|conduire|âge|\bans\b|besoin)/i,
    /\b(permis|carte|conduire|piloter)\b.*\b(bateau|embarcation|motomarine|sea-?doo)\b/i,
  ],
  exclude: [/\b(pleasure craft licen[cs]e|licen[cs]e number|pcl|permis d['’]embarcation de plaisance)\b/i],
  reply: {
    en: `# {headEn}

{bodyEn}`,
    fr: `# {headFr}

{bodyFr}`,
  },
  vars: ({ text }) => {
    const age = ageOf(text);
    const hp = horsepowerOf(text);
    const pwc = pwcOf(text);
    const body = { bodyEn: BOAT_BODY.en, bodyFr: BOAT_BODY.fr };
    if (LOST.test(text))
      return {
        headEn: 'Your *course provider* can replace your card.',
        headFr: 'C’est votre *fournisseur de cours* qui remplace la carte.',
        bodyEn: BOAT_LOST.en,
        bodyFr: BOAT_LOST.fr,
      };
    if (age != null && age < 16 && pwc)
      return { ...body, headEn: `No: at ${age}, they *can’t* drive a personal watercraft.`, headFr: `Non : à ${age} ans, on ne peut *pas* conduire une motomarine.` };
    if (age != null && age < 16 && hp != null && hp > (age < 12 ? 10 : 40))
      return {
        ...body,
        headEn: `At ${age}, only with *someone 16 or older* in the boat.`,
        headFr: `À ${age} ans, seulement avec *une personne de 16 ans ou plus* à bord.`,
      };
    // Under 16, no engine given: answer the question asked (how big an engine), not whether a card is needed.
    if (age != null && age < 16 && !pwc)
      return {
        headEn: `Yes: at ${age}, they can drive up to *${soloLimit(age)}\u00a0hp* on their own.`,
        headFr: `Oui : à ${age} ans, on peut conduire seul jusqu’à *${soloLimit(age)}\u00a0HP*.`,
        bodyEn: youthBody(age, 'en'),
        bodyFr: youthBody(age, 'fr'),
      };
    return { ...body, headEn: 'You need *proof of competency*, usually the boater card.', headFr: 'Il vous faut une *preuve de compétence*, habituellement la carte de conducteur.' };
  },
  toolCalls: [
    {
      toolName: 'transportBoating',
      input: ({ text, lang }: Ctx) => ({
        age: ageOf(text),
        horsepower: horsepowerOf(text),
        pwc: pwcOf(text) || undefined,
        north: /\b(nunavut|nwt|northwest territories|territoires du nord-ouest)\b/i.test(text) || undefined,
        lost: LOST.test(text) || undefined,
        lang,
      }),
    },
  ],
};
