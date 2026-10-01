/**
 * The travel answer, worded on the live notices and on what the question gave (server only for the fetch; the
 * wording itself is pure). Answer first: a question about notices for a place gets the count for that place
 * ("Yes: 3 travel health notices apply to Cuba, the highest at level 2 of 4."), a question with a departure
 * date gets the day to book by ("See a travel health clinic by November 8"), "any notices right now?" gets the
 * count in effect, and a vaccine question gets the 6-week rule. The paragraph that backs the heading comes
 * first, so the citations stay numbered in reading order. Shares its reading of the question with the tool call.
 */
import { URLS } from './data';
import type { Lang } from './facts';
import { liveTravel } from './live-travel';
import { inPlaceFr, NB } from './scenario-fr';
import type { Ctx } from './scenario-queries';
import { todayIn, travelInputOf } from './scenario-travel';
import type { TravelOutput } from './travel';

type Vars = Record<string, string>;

/** Whole days from a to b (YYYY-MM-DD). */
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const longDate = (iso: string, lang: Lang) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

/** The question is about notices ("Any health notices for Cuba?"), not about vaccines or what to do before leaving. */
const ASKS_NOTICES = /(?<![\p{L}])(notices?|advisor(?:y|ies)|alerts?|outbreaks?|health risks?|conseils? de santé|avis|éclosions?|risques?)(?![\p{L}])/iu;
const ASKS_VACCINES = /\b(vaccin\w*|shots?|jabs?|immuni[sz]\w*|clinic|clinique|malaria|paludisme)/i;

/** "3 travel health notices" / « 3 conseils de santé aux voyageurs », emphasized, with its verb agreeing. */
const count = (n: number, fr: boolean, verb: [one: string, many: string]) =>
  fr ? `*${n} ${n === 1 ? 'conseil' : 'conseils'} de santé aux voyageurs* ${verb[n === 1 ? 0 : 1]}` : `*${n} travel health ${n === 1 ? 'notice' : 'notices'}* ${verb[n === 1 ? 0 : 1]}`;
/** ", the highest at level 2 of 4" (one notice: ", at level 2 of 4"). */
const top = (n: number, level: number, fr: boolean) =>
  fr ? `${n > 1 ? ', le plus élevé au niveau' : ', au niveau'} ${level} sur 4` : `${n > 1 ? ', the highest at level' : ', at level'} ${level} of 4`;

/** The two paragraphs under the heading: the one the heading is about first, cited [1], then the other. */
function body(lang: Lang, noticesFirst: boolean, place: string | null, placeIn: string): string {
  const fr = lang === 'fr';
  const [a, b] = noticesFirst ? [2, 1] : [1, 2];
  const also = noticesFirst ? '' : fr ? ' aussi' : ' also';
  const notices = fr
    ? `L’Agence de la santé publique du Canada publie${also} des conseils de santé aux voyageurs sur les risques actuels, du niveau 1 (prendre les précautions sanitaires) au niveau 4 (éviter tout voyage). [${b}](${URLS.thn.fr})`
    : `The Public Health Agency of Canada${also} posts travel health notices about current risks, from level 1 (practise health precautions) to level 4 (avoid all travel). [${b}](${URLS.thn.en})`;
  const who = fr ? 'une clinique santé-voyage ou votre professionnel de la santé' : 'a travel health clinic or your health care provider';
  const can = fr
    ? `vérifier que vos vaccins de routine sont à jour et vous indiquer les autres vaccins ou médicaments dont vous pourriez avoir besoin pour votre séjour${placeIn}. Même si vous partez dans moins de six semaines, ça vaut quand même la peine de prendre rendez-vous. [${a}](${URLS.travelVaccines.fr})`
    : `check that your routine vaccines are up to date and tell you about other vaccines or medications you may need for ${place ?? 'your destination'}. Even if you leave in less than 6 weeks, it’s still worth booking. [${a}](${URLS.travelVaccines.en})`;
  // After a heading about notices, the clinic paragraph has to carry the 6-week rule itself.
  const clinic = noticesFirst
    ? fr
      ? `Consultez ${who} environ 6 semaines avant le départ${NB}: on pourra ${can}`
      : `See ${who} about 6 weeks before you go: they can ${can}`
    : fr
      ? `U${who.slice(1)} peut ${can}`
      : `A${who.slice(1)} can ${can}`;
  return noticesFirst ? `${notices}\n\n${clinic}` : `${clinic}\n\n${notices}`;
}

/** Heading, body and closing line of the travel answer for a question, the tool input read from it and the tool's result. */
export function travelWords({ text, lang }: Pick<Ctx, 'text' | 'lang'>, trip: string | null, out: TravelOutput | null, today: string): Vars {
  const fr = lang === 'fr';
  const place = out?.destination ?? null;
  const clinicBy = out?.clinicBy ?? null;
  const placeIn = place ? ` ${inPlaceFr(place)}` : '';
  const asksVaccines = ASKS_VACCINES.test(text);
  const asksNotices = ASKS_NOTICES.test(text) && !asksVaccines;
  // No destination in the question: the count of notices in effect answers it, unless it asked about vaccines.
  const general = Boolean(out?.live && !place && !out.unknownDestination && !asksVaccines);
  // The heading is about notices when that's what was asked and the live list can answer it.
  const noticesFirst = Boolean(out?.live) && ((asksNotices && Boolean(place)) || (general && !(trip && clinicBy)));

  // The heading names a date only when the question gave one ("I leave December 20"); otherwise it gives the
  // rule, and the reply points at the countdown in the widget, which follows the date the person sets there.
  let head = fr ? 'Consultez une clinique santé-voyage *environ 6 semaines* avant le départ.' : 'See a travel health clinic *about 6 weeks* before you go.';
  if (out?.live && place && asksNotices) {
    const n = out.notices.length;
    const named = out.specific ?? 0;
    if (!n) {
      head = fr ? `Non${NB}: *aucun conseil de santé aux voyageurs* n’est en vigueur${placeIn} en ce moment.` : `No: *no travel health notices* apply to ${place} right now.`;
    } else if (!named) {
      head = fr
        ? `Aucun conseil ne vise cette destination en particulier${NB}; ${count(n, true, ['s’applique', 's’appliquent'])} à toutes les destinations${top(n, out.highestLevel, true)}.`
        : `No notice names ${place} right now; ${count(n, false, ['applies', 'apply'])} to every destination${top(n, out.highestLevel, false)}.`;
    } else {
      head = fr
        ? `Oui${NB}: ${count(n, true, ['est en vigueur', 'sont en vigueur'])}${placeIn}${top(n, out.highestLevel, true)}.`
        : `Yes: ${count(n, false, ['applies', 'apply'])} to ${place}${top(n, out.highestLevel, false)}.`;
    }
  } else if (trip && clinicBy) {
    const left = days(today, trip);
    if (clinicBy > today) {
      head = fr
        ? `Consultez une clinique santé-voyage d’ici le *${longDate(clinicBy, 'fr')}*, environ 6 semaines avant votre départ.`
        : `See a travel health clinic by *${longDate(clinicBy, 'en')}*, about 6 weeks before you leave.`;
    } else {
      head = fr
        ? `Consultez une clinique santé-voyage *dès maintenant*${NB}: ${left <= 0 ? 'vous partez aujourd’hui' : left === 1 ? 'vous partez demain' : `vous partez dans ${left} jours`}.`
        : `See a travel health clinic *now*: ${left <= 0 ? 'you leave today' : left === 1 ? 'you leave tomorrow' : `you leave in ${left} days`}.`;
    }
  } else if (out?.live && general) {
    const n = out.totalNotices;
    head = `${count(n, fr, fr ? ['est', 'sont'] : ['is', 'are'])} ${fr ? 'en vigueur en ce moment' : 'in effect right now'}${top(n, out.highestLevel, fr)}.`;
  }

  const date = trip && clinicBy && clinicBy <= today ? '' : trip && clinicBy ? (fr ? ' Le compte à rebours ci-dessous indique quand prendre rendez-vous.' : ' The countdown below shows when to book.') : fr ? ' Entrez votre date de départ ci-dessous pour savoir quand prendre rendez-vous.' : ' Enter your departure date below to see when to book.';
  let closing: string;
  if (!out?.live) {
    // Two different failures, never blamed on each other: the site didn't answer, or it answered and its list
    // of notices couldn't be read here.
    const site = fr ? 'voyage.gc.ca' : 'travel.gc.ca';
    if (out?.offline === 'unreadable') {
      closing = fr
        ? `Je n’ai pas pu lire la liste des conseils de ${site} pour le moment${NB}: le lien ci-dessous ouvre les conseils en vigueur.${date}`
        : `I couldn’t read the list of notices from ${site} just now: the link below opens the current notices.${date}`;
    } else {
      closing = fr ? `Le site ${site} n’a pas répondu${NB}: le lien ci-dessous ouvre les conseils en vigueur.${date}` : `${site} didn’t answer just now: the link below opens the current notices.${date}`;
    }
  } else if (place && out.specific === 0) {
    closing = fr
      ? `Aucun conseil ne vise cette destination en particulier en ce moment${NB}: voici ceux qui s’appliquent à toutes les destinations.${date}`
      : `No notice names ${place} right now, so here are the ones that apply to every destination.${date}`;
  } else if (place) {
    closing = fr ? `Voici les conseils en vigueur pour votre séjour${placeIn}.${date}` : `Here’s what applies to ${place} right now.${date}`;
  } else if (out.unknownDestination) {
    closing = fr ? `Je n’ai pas trouvé cette destination sur voyage.gc.ca${NB}: voici tous les conseils en vigueur.${date}` : `I couldn’t find that destination on travel.gc.ca, so here’s every current notice.${date}`;
  } else {
    closing = fr ? `Voici tous les conseils en vigueur. Dites-moi où vous allez pour voir ceux qui s’appliquent.${trip ? date : ''}` : `Here’s every current notice. Tell me where you’re going to see the ones that apply.${trip ? date : ''}`;
  }
  return { head, body: body(lang, noticesFirst, place, placeIn), closing };
}

export async function travelVars(ctx: Ctx, now = new Date()): Promise<Vars> {
  const input = travelInputOf(ctx, now);
  const out = await liveTravel(input, undefined, now).catch(() => null);
  return travelWords(ctx, input.travelDate ?? null, out, todayIn(ctx.timeZone, now));
}
