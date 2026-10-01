/**
 * Scripted scenarios for the `travel` widget (EN + FR). Facts: widgets/travel/data.ts. This file is the list
 * of scenarios and their reply templates; the patterns, the answer text built from live data and the
 * follow-up chips are in widgets/travel/scenario/. Headlines use the same live data as the widget: the
 * `vars` call the same builders as the tools, and live.ts shares one read of each feed between the two.
 */
import type { Scenario } from '@/lib/scripted/types';
import { buildAdvisory } from '../widgets/travel/build';
import { findCountry } from '../widgets/travel/countries';
import { CHECKED, EWRC } from '../widgets/travel/data';
import { canadaPhone } from '../widgets/travel/phone';
import { advisoryFor, entryFor } from '../widgets/travel/scenario/advisory-copy';
import { dutyFor } from '../widgets/travel/scenario/duty-copy';
import { emergencyFor, lostPassportFor } from '../widgets/travel/scenario/emergency-copy';
import { FU } from '../widgets/travel/scenario/followups';
import * as MATCH from '../widgets/travel/scenario/match';
import { cite, nb, placeOf, safe } from '../widgets/travel/scenario/text';
import { waitsFor } from '../widgets/travel/scenario/waits-copy';
import type { Lang } from '../widgets/travel/types';

type Ctx = { text: string; lang: Lang };
/** Only a named destination is passed to a tool: a whole question isn't a place ("my trip" is not "Austria"). */
const destinationIn = ({ text, lang }: Ctx) => (findCountry(text) ? { destination: placeOf(text, lang) } : {});

const EMERGENCY: Scenario = {
  id: 'travel-emergency-abroad',
  checked: CHECKED,
  // Above weather-air-quality (8), whose « CAS » (AQHI) would otherwise catch « en cas de problème ».
  priority: 8.5,
  match: MATCH.EMERGENCY,
  exclude: [/\b(embassy|consulate|ambassade|consulat)\b.*\bin canada\b/i, /\bau canada\b/i],
  reply: {
    en: `# {headline}

Canadian citizens abroad can reach the Emergency Watch and Response Centre in Ottawa 24/7: call ${nb(canadaPhone(EWRC.collect.label))} (collect where available), email ${EWRC.email.label} or text ${nb(canadaPhone(EWRC.sms.label))}. Family in Canada can call ${nb(canadaPhone(EWRC.fromCanada.label))}. ${cite(1, 'emergency', 'en')}

{local}

Lost or stolen passport? Contact the nearest Canadian office as soon as you can. If you urgently need to travel, you can apply for an emergency passport, though not every office offers it. {lostCite}`,
    fr: `# {headline}

Les citoyens canadiens à l’étranger peuvent joindre le Centre de surveillance et d’intervention d’urgence à Ottawa 24 heures sur 24 : composez le ${nb(canadaPhone(EWRC.collect.label))} (à frais virés si possible), écrivez à ${EWRC.email.label} ou textez le ${nb(canadaPhone(EWRC.sms.label))}. Vos proches au Canada peuvent composer le ${nb(canadaPhone(EWRC.fromCanada.label))}. ${cite(1, 'emergency', 'fr')}

{local}

Passeport perdu ou volé? Communiquez dès que possible avec le bureau du Canada le plus proche. Si vous devez voyager d’urgence, vous pouvez demander un passeport d’urgence, mais ce service n’est pas offert dans tous les bureaux. {lostCite}`,
  },
  vars: ({ text, lang }) => emergencyFor(text, lang),
  toolCalls: [{ toolName: 'travelEmergencyHelp', input: (ctx: Ctx) => ({ ...destinationIn(ctx), lang: ctx.lang }) }, FU.emergency.call],
  followUps: FU.emergency.static,
};

const travel: Scenario[] = [
  {
    // Same id as the pack's generic starter answer: this live version supersedes it (higher priority).
    id: 'travel-advisory',
    checked: CHECKED,
    priority: 6,
    match: MATCH.SAFETY,
    matchIntl: [/^(?!.*(جواز|گذرنامه|پاسپورٹ)).*(السفر|مسافرت|سفر)/, /旅行警告|旅遊警告|旅游/, /ਯਾਤਰਾ|यात्रा/, /여행/, /поездк|путешеств/i],
    exclude: [/\b(travel|trip|visit\w*)\b.*\b(to|in) canada\b/i, /\bvoyag\w*\b.*\bau canada\b/i],
    reply: {
      en: `# {headline}

{body}

Advisories change quickly, so check again before you book and before you leave. Registering your trip is free and lets the Government of Canada reach you in an emergency. ${cite(3, 'roca', 'en')}

{closing}`,
      fr: `# {headline}

{body}

Les avertissements changent rapidement : vérifiez-les avant de réserver et avant de partir. L’inscription de votre voyage est gratuite et permet au gouvernement du Canada de vous joindre en cas d’urgence. ${cite(3, 'roca', 'fr')}

{closing}`,
    },
    vars: ({ text, lang }) => advisoryFor(text, lang),
    toolCalls: [{ toolName: 'travelAdvisory', input: ({ text, lang }: Ctx) => ({ destination: placeOf(text, lang), lang }) }, FU.safety.call],
    followUps: FU.safety.static,
  },
  {
    id: 'travel-entry-requirements',
    checked: CHECKED,
    // Above immigration-visa (9): only matches when a destination outside Canada is named.
    priority: 9.5,
    match: MATCH.ENTRY,
    exclude: [/\b(to|in|into|visit(ing)?) canada\b/i, /\b(au|pour le) canada\b/i, /\b(eta|ave)\b/i],
    reply: {
      en: `# {headline}

{body}

Entry rules are set by each country and can change at any time. Canada can’t intervene if you don’t meet them, so confirm with the country’s embassy or consulate before you go. [1]({url} "{urlTitle}")`,
      fr: `# {headline}

{body}

Les exigences d’entrée sont fixées par chaque pays et peuvent changer à tout moment. Le Canada ne peut pas intervenir si vous ne les respectez pas : confirmez-les auprès de l’ambassade ou du consulat du pays avant de partir. [1]({url} "{urlTitle}")`,
    },
    vars: ({ text, lang }) => entryFor(text, lang),
    toolCalls: [{ toolName: 'travelAdvisory', input: ({ text, lang }: Ctx) => ({ destination: placeOf(text, lang), lang, focus: 'entry' }) }, FU.entry.call],
    followUps: FU.entry.static,
  },
  {
    id: 'travel-duty-free',
    checked: CHECKED,
    priority: 6,
    match: MATCH.DUTY,
    exclude: [/\bduty[- ]free\b.*\b(store|shop) hours\b/i],
    reply: {
      en: `# {headline}

{body}

Declare everything you bought or received abroad, including duty-free shop purchases and gifts. Each person has their own exemption, and it can’t be combined or transferred. ${cite(1, 'declare', 'en')}

Move the controls to try your own trip.`,
      fr: `# {headline}

{body}

Déclarez tout ce que vous avez acheté ou reçu à l’étranger, y compris les achats en boutique hors taxes et les cadeaux. Chaque personne a sa propre exemption, qui ne peut être ni combinée ni transférée. ${cite(1, 'declare', 'fr')}

Modifiez les réglages pour essayer votre propre voyage.`,
    },
    vars: ({ text, lang }) => dutyFor(text, lang),
    toolCalls: [
      {
        toolName: 'travelDutyFree',
        input: ({ text, lang }: Ctx) => {
          const trip = MATCH.tripFromText(text);
          delete trip.weekend;
          return { ...trip, lang };
        },
      },
      FU.duty.call,
    ],
    followUps: FU.duty.static,
  },
  {
    id: 'travel-border-waits',
    checked: CHECKED,
    // Above immigration-times (9), whose "wait times" means processing times; ours always says border/crossing/bridge.
    priority: 9.5,
    match: MATCH.WAITS,
    reply: {
      en: `# {headline}

{body}

These are CBSA estimates for travellers entering Canada. They don’t include traffic on the roads leading to the border, so check traffic before you head out. ${cite(1, 'waits', 'en')}`,
      fr: `# {headline}

{body}

Ce sont des estimations de l’ASFC pour les voyageurs qui entrent au Canada. Elles ne comprennent pas la circulation sur les routes qui mènent à la frontière : vérifiez l’état des routes avant de partir. ${cite(1, 'waits', 'fr')}`,
    },
    vars: ({ text, lang }) => waitsFor(text, lang),
    toolCalls: [{ toolName: 'travelBorderWaits', input: ({ text, lang }: Ctx) => ({ crossing: text, lang }) }],
    followUps: {
      en: ['How much can I bring back duty-free?', 'Is it safe to travel to the United States?', 'How do I register my trip?'],
      fr: ['Combien puis-je rapporter en franchise?', 'Est-ce sécuritaire de voyager aux États-Unis?', 'Comment inscrire mon voyage?'],
    },
  },
  {
    // Above contact-passport-phone (13): "I lost my passport in Japan, who do I call?" is an emergency abroad,
    // not a question for the passport call centre in Canada (which can't help there).
    id: 'travel-lost-passport-abroad',
    checked: CHECKED,
    priority: 14,
    match: MATCH.LOST_ABROAD,
    reply: {
      en: `# {headline}

{body}`,
      fr: `# {headline}

{body}`,
    },
    vars: ({ text, lang }) => lostPassportFor(text, lang),
    toolCalls: [{ toolName: 'travelEmergencyHelp', input: (ctx: Ctx) => ({ ...destinationIn(ctx), lang: ctx.lang }) }, FU.lost.call],
    followUps: FU.lost.static,
  },
  EMERGENCY,
  /*
   * "Who do I call if something goes wrong in Mexico?" (the chip after an advisory) names a place, so it's an
   * emergency abroad, not a question for the call centres in Canada (contact-who-to-call, priority 10, which
   * only steps aside for "abroad"). Same answer as travel-emergency-abroad, for that destination.
   */
  { ...EMERGENCY, id: 'travel-emergency-in-place', priority: 10.5, match: MATCH.EMERGENCY_IN_PLACE },
  {
    id: 'travel-register-trip',
    checked: CHECKED,
    priority: 7,
    match: MATCH.REGISTER,
    reply: {
      en: `# Registering your trip is *free*, and it lets Canada reach you in an emergency.

Registration of Canadians Abroad lets the Government of Canada notify you if there’s an emergency at your destination, or a personal emergency at home. You also get important information before or during a natural disaster or civil unrest. ${cite(1, 'roca', 'en')}

It’s encouraged whether you’re planning a vacation or living outside Canada, and your information is kept confidential under the Privacy Act. ${cite(1, 'roca', 'en')}

{closing}`,
      fr: `# L’inscription de votre voyage est *gratuite*, et elle permet au Canada de vous joindre en cas d’urgence.

L’Inscription des Canadiens à l’étranger permet au gouvernement du Canada de vous aviser d’une urgence à votre destination, ou d’une urgence personnelle à la maison. Vous recevez aussi des renseignements importants avant ou pendant une catastrophe naturelle ou des troubles civils. ${cite(1, 'roca', 'fr')}

Elle est recommandée, que vous prévoyiez un voyage ou que vous viviez à l’extérieur du Canada, et vos renseignements sont traités de façon confidentielle en vertu de la Loi sur la protection des renseignements personnels. ${cite(1, 'roca', 'fr')}

{closing}`,
    },
    vars: async ({ text, lang }) => {
      const row = findCountry(text);
      const name = row ? (lang === 'fr' ? row[2] : row[1]) : '';
      // The same read as the card that follows (live.ts shares it): "live" is only said when it is.
      const live = row ? (await buildAdvisory({ destination: placeOf(text, lang), lang, focus: 'prepare' })).kind === 'advisory' : false;
      return {
        closing: row
          ? live
            ? lang === 'fr'
              ? `Voici l’avertissement en direct pour cette destination (${safe(name)}), avec une liste de vérification avant le départ.`
              : `Here’s the live advisory for ${safe(name)}, with a before-you-go checklist.`
            : lang === 'fr'
              ? `Voici le lien vers la page officielle de cette destination (${safe(name)}).`
              : `Here’s the link to the official page for ${safe(name)}.`
          : lang === 'fr'
            ? 'Inscrivez-vous en ligne, puis choisissez votre destination pour voir l’avertissement en direct.'
            : 'Register online, then pick your destination to see its live advisory.',
      };
    },
    toolCalls: [{ toolName: 'travelAdvisory', input: (ctx: Ctx) => ({ ...destinationIn(ctx), lang: ctx.lang, focus: 'prepare' }) }, FU.register.call],
    followUps: FU.register.static,
  },
];

export default travel;
