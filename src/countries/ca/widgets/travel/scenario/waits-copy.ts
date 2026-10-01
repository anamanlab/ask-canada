/**
 * Answer text for the border-waits scenario. The headline uses the widget's own summary (waits.ts) at the
 * moment the feed was read, so it agrees with the "Longest wait" tile and never states an estimate CBSA
 * stopped updating hours ago as the wait right now.
 */
import { buildBorderWaits } from '../build';
import { stampMs, stampText } from '../select';
import type { Lang } from '../types';
import { DATED_MS, crossingList, isStale, summarizeWaits } from '../waits';

export async function waitsFor(text: string, lang: Lang) {
  const out = await buildBorderWaits({ lang, crossing: text });
  const fr = lang === 'fr';
  if (!out.live) {
    return fr
      ? { headline: 'Consultez les temps d’attente *sur le site de l’ASFC.*', body: 'La page officielle de l’ASFC présente les estimations actuelles pour les 30 postes terrestres les plus fréquentés.' }
      : { headline: 'Check current waits *on the CBSA site.*', body: 'The official CBSA page lists current estimates for the 30 busiest land crossings.' };
  }
  const now = out.asOf ? Date.parse(out.asOf) : 0;
  const wait = (m: number | null) => (m == null ? (fr ? 'sans objet' : 'not applicable') : m === 0 ? (fr ? 'aucune attente' : 'no delay') : `${m} min`);
  const posted = (updated: string) => stampText(updated, lang, { date: !!now && now - stampMs(updated) > DATED_MS });
  const hit = out.crossings.find((c) => c.id === out.highlight);
  if (hit && isStale(hit, now)) {
    // The crossing asked about hasn't posted in over two hours: say when it last did, not "right now".
    return fr
      ? {
          headline: `${hit.name} : *aucune estimation récente* de l’ASFC.`,
          body: `Le dernier relevé pour les voyageurs indiquait ${wait(hit.travellers.minutes)} (${posted(hit.updated)}). Ce poste n’a pas publié de nouvelle estimation depuis plus de 2 heures.`,
        }
      : {
          headline: `${hit.name}: *no current estimate* from CBSA.`,
          body: `The last travellers’ estimate was ${wait(hit.travellers.minutes)}, posted ${posted(hit.updated)}. This crossing hasn’t posted a new one in over 2 hours.`,
        };
  }
  if (hit) {
    return fr
      ? {
          headline: `${hit.name} : *${wait(hit.travellers.minutes)}* pour entrer au Canada en ce moment.`,
          body: `Estimation pour les voyageurs publiée à ${stampText(hit.updated, 'fr')}. Voie commerciale : ${wait(hit.commercial.minutes)}.`,
        }
      : {
          headline: `${hit.name}: *${wait(hit.travellers.minutes)}* entering Canada right now.`,
          body: `Travellers’ estimate posted at ${stampText(hit.updated, 'en')}. Commercial lane: ${wait(hit.commercial.minutes)}.`,
        };
  }
  // Current estimates only (the same function and the same moment as the widget's tiles).
  const sum = summarizeWaits(out.crossings, 'travellers', now);
  const old = !sum.stale
    ? ''
    : fr
      ? ` ${sum.stale === 1 ? '1 autre poste n’a' : `${sum.stale} autres postes n’ont`} pas publié d’estimation depuis plus de 2 heures et ${sum.stale === 1 ? 'n’est pas compté' : 'ne sont pas comptés'}.`
      : ` ${sum.stale === 1 ? '1 more crossing hasn’t' : `${sum.stale} more crossings haven’t`} posted an estimate in over 2 hours and ${sum.stale === 1 ? 'isn’t' : 'aren’t'} counted.`;
  if (sum.max == null) {
    return fr
      ? { headline: 'L’ASFC n’a publié *aucune estimation récente* pour le moment.', body: 'Aucun poste n’a publié de temps d’attente pour les voyageurs depuis plus de 2 heures. La liste ci-dessous indique le dernier relevé de chaque poste.' }
      : { headline: 'CBSA has posted *no current estimates* right now.', body: 'No crossing has posted a travellers’ wait in over 2 hours. The list below shows when each one last reported.' };
  }
  if (!sum.max) {
    return fr
      ? { headline: 'En ce moment, *aucune attente* aux postes frontaliers les plus fréquentés.', body: `${sum.total === 1 ? 'Le seul poste qui publie' : `Les ${sum.total} postes qui publient`} une estimation récente pour les voyageurs n’${sum.total === 1 ? 'indique' : 'indiquent'} aucune attente.${old}` }
      : { headline: 'Right now, there’s *no delay* at the busiest crossings.', body: `${sum.total === 1 ? 'The one crossing' : `All ${sum.total} crossings`} with a current travellers’ estimate ${sum.total === 1 ? 'shows' : 'show'} no delay.${old}` };
  }
  const tied = sum.top.length;
  const including = sum.top.slice(0, 2);
  const next = sum.next;
  if (fr) {
    return {
      headline:
        tied > 3
          ? `L’attente la plus longue pour entrer au Canada : *${sum.max} min* à ${tied} postes, dont ${crossingList(including, 'fr')}.`
          : `L’attente la plus longue pour entrer au Canada : *${sum.max} min* (${crossingList(sum.top, 'fr')}).`,
      body: `${sum.clear} des ${sum.total} postes n’indiquent aucune attente pour les voyageurs.${next ? ` Ensuite : ${next.minutes} min (${crossingList(next.crossings, 'fr')}).` : ''}${old}`,
    };
  }
  return {
    headline:
      tied > 3
        ? `Up to *${sum.max} min* to enter Canada right now, at ${tied} crossings including ${crossingList(including, 'en')}.`
        : tied > 1
          ? `Up to *${sum.max} min* to enter Canada right now, at ${crossingList(sum.top, 'en')}.`
          : `The longest wait into Canada right now: *${sum.max} min* at ${sum.top[0].name}.`,
    body: `${sum.clear} of ${sum.total} crossings show no delay for travellers.${next ? ` Next longest: ${next.minutes} min (${crossingList(next.crossings, 'en')}).` : ''}${old}`,
  };
}
