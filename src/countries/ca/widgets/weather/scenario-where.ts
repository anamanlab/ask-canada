/**
 * Scripted wording for "where?" (EN + FR): what the answer says when a question's place wasn't given, wasn't
 * found, is ambiguous, or couldn't be looked up just now. One wording for the forecast, alert and air quality
 * answers, and always the same outcome as the widget below it (live.ts shares one lookup between them).
 */
import { URLS, type Lang } from './data';
import type { LocateFailure } from './types';

/** `need`: the builder's own "pick a place" answer (it differs by question). */
export function whereVars(out: LocateFailure, lang: Lang, need: Record<string, string>): Record<string, string> {
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  const official = L(`You can also search on weather.gc.ca. [1](${URLS.forecastHome.en})`, `Vous pouvez aussi chercher sur meteo.gc.ca. [1](${URLS.forecastHome.fr})`);
  switch (out.status) {
    case 'need-location':
      return need;
    case 'ambiguous':
      return {
        head: L(`There’s more than one *${out.query}*. Which one?`, `Il y a plus d’un endroit nommé *${out.query}*. Lequel?`),
        body: L(`Pick the one you mean below, or add the province to your question. ${official}`, `Choisissez le bon ci-dessous, ou ajoutez la province à votre question. ${official}`),
      };
    case 'lookup-unavailable':
      // The lookup failed, which says nothing about the place: never "couldn't find".
      return {
        head: L(`I couldn’t look up *${out.query}* just now.`, `Je n’ai pas pu chercher *${out.query}* pour le moment.`),
        body: L(`The place search didn’t answer in time. Try again in a moment, or pick a city below. ${official}`, `La recherche d’endroits n’a pas répondu à temps. Réessayez dans un instant ou choisissez une ville ci-dessous. ${official}`),
      };
    case 'not-found':
      return {
        head: L(`I couldn’t find *${out.query}* in Environment Canada’s forecast places.`, `Je n’ai pas trouvé *${out.query}* parmi les endroits prévus par Environnement Canada.`),
        body: L(`Try the nearest town or city, or the first 3 characters of a postal code. ${official}`, `Essayez la ville la plus proche, ou les 3 premiers caractères d’un code postal. ${official}`),
      };
  }
}
