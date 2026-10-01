/**
 * "I need my passport in 10 days": the same plan the widget shows (regular, express or urgent pick-up, or a
 * call to the Passport Program), said in a headline and one line. The card under it carries the dates, the
 * proof of travel and the phone hours, counted from the reader's own date, so the text doesn't repeat them.
 */
import { PASSPORT, URLS } from '../data';
import { planRenewal } from '../plan';
import { agreed, readerMoments, type Moment } from './days';
import { cite, dayMonth, money } from './format';
import { travelSoonReply } from './general';
import { travelDateFrom, tripInput, type L } from './parse';

function answerOn(text: string, lang: L, { today, clock }: Moment, dated: boolean) {
  // The reader's time of day counts too: in the evening, in-person dates start the next business day.
  const plan = planRenewal(tripInput(text, lang, today), today, undefined, clock);
  const trip = plan.trip;
  // No usable date after all ("May 45"): the general travelling-soon answer.
  if (!trip) return travelSoonReply(lang);
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  const fr = lang === 'fr';
  // "in 10 days" means a different date on each side of midnight: without the reader's date, keep their words.
  const said = travelDateFrom(text, today);
  const when = !dated && said?.relative ? said.phrase.toLowerCase().replace(/\s+/g, ' ') : fr ? `le ${dayMonth(trip.date, lang)}` : dayMonth(trip.date, lang);
  const lead = fr ? `Vous partez ${when}?` : `Leaving ${when}?`;
  const noOnline = (n: number) =>
    fr
      ? `Ne faites pas la demande en ligne : elle **annule immédiatement votre passeport actuel**, et le traitement prend jusqu’à 20 jours ouvrables, plus la livraison. [${n}](${u('online')})`
      : `Don’t apply online: it **cancels your current passport right away**, and it takes up to 20 business days plus mailing. [${n}](${u('online')})`;
  const outro = fr ? 'Votre plan ci-dessous indique vos dates et quoi apporter.' : 'Your plan below has your dates and what to bring.';

  if (trip.option === 'emergency') {
    return fr
      ? `# ${lead} Le service de retrait urgent ne sera pas prêt à temps : *appelez le Programme de passeport* dès que possible.

Le service de retrait urgent, le plus rapide dans un bureau des passeports, est prêt avant la fin du jour ouvrable suivant : trop tard pour votre départ. Demandez au Programme de passeport comment obtenir votre passeport à temps, y compris par son service d’urgence offert la fin de semaine ou un jour férié. Des frais supplémentaires peuvent s’appliquer. [1](${u('urgent')}) [2](${u('inPerson')})

Ne faites pas la demande en ligne : elle **annule immédiatement votre passeport actuel**. [3](${u('online')})

Votre plan ci-dessous indique quand ses lignes répondent et quoi préparer.`
      : `# ${lead} Urgent pick-up won’t be ready in time, so *call the Passport Program* as soon as you can.

Urgent pick-up, the fastest service at a passport office, is ready by the end of the next business day, which is too late for your trip. Ask the Passport Program how to get your passport in time, including its emergency weekend or statutory holiday service. Extra fees may apply. [1](${u('urgent')}) [2](${u('inPerson')})

Don’t apply online: it **cancels your current passport right away**. [3](${u('online')})

Your plan below shows when its phone lines answer and what to have ready.`;
  }
  if (trip.option === 'urgent') {
    const fee = money(PASSPORT.fees.urgentPickup, lang);
    // Express might also make it (ready in 2 business days at best, 9 at worst): the cheaper service is worth asking about.
    const express = !trip.expressMayFit
      ? ''
      : fr
        ? ` Le service de retrait express (${money(PASSPORT.fees.expressPickup, lang)}) peut être prêt en 2 jours ouvrables seulement, mais il peut en falloir jusqu’à 9 : demandez au bureau s’il peut être prêt à temps. [1](${u('urgent')})`
        : ` Express pick-up (${money(PASSPORT.fees.expressPickup, lang)}) can be ready in as few as 2 business days, but it can take up to 9, so ask the office if it can be ready in time. [1](${u('urgent')})`;
    return fr
      ? `# ${lead} Demandez le *service de retrait urgent* dans un bureau des passeports.

Le traitement régulier ne vous livrera pas votre passeport à temps. Dans un bureau des passeports, le service de retrait urgent est prêt avant la fin du jour ouvrable suivant, pour **${fee}** en plus des frais de passeport. [1](${u('urgent')}) [2](${u('fees')})${express}

${noOnline(3)}

${outro}`
      : `# ${lead} Ask for *urgent pick-up* at a passport office.

Regular processing can’t get your passport to you in time. At a passport office, urgent pick-up is ready by the end of the next business day, for **${fee}** on top of the passport fee. [1](${u('urgent')}) [2](${u('fees')})${express}

${noOnline(3)}

${outro}`;
  }
  if (trip.option === 'express') {
    const fee = money(PASSPORT.fees.expressPickup, lang);
    return fr
      ? `# ${lead} Demandez le *service de retrait express* dans un bureau des passeports.

Le traitement régulier en personne prend 10 jours ouvrables, plus la livraison : trop juste pour votre départ. Le service de retrait express est prêt en 2 à 9 jours ouvrables, pour **${fee}** en plus des frais de passeport. [1](${u('urgent')}) [2](${u('fees')})

${noOnline(3)}

${outro}`
      : `# ${lead} Ask for *express pick-up* at a passport office.

Regular in-person processing takes 10 business days plus mailing, which is too close to your trip. Express pick-up is ready in 2 to 9 business days, for **${fee}** on top of the passport fee. [1](${u('urgent')}) [2](${u('fees')})

${noOnline(3)}

${outro}`;
  }

  const on = plan.methods.online;
  const change = (n: number) =>
    fr ? `Vos plans changent? Le service de retrait express ou urgent est offert dans les bureaux des passeports. [${n}](${u('urgent')})` : `Plans change? Express and urgent pick-up are available at passport offices. [${n}](${u('urgent')})`;
  if (on.available) {
    // Same call as the planner: online is open and still arrives before the trip.
    return fr
      ? `# ${lead} Vous avez le temps de renouveler *en ligne*.

Le renouvellement en ligne prend jusqu’à 20 jours ouvrables, puis environ 5 jours ouvrables de livraison : votre nouveau passeport devrait arriver avant votre départ. Attention : la demande en ligne **annule immédiatement votre passeport actuel**. [1](${u('online')}) [2](${u('afterApply')})

En personne, dans un bureau des passeports, c’est plus rapide : 10 jours ouvrables, puis la livraison. [3](${u('processing')}) ${change(4)}

${outro}`
      : `# ${lead} You have time to renew *online*.

Online renewal takes up to 20 business days, then about 5 business days of mailing, so your new passport should arrive before your trip. Applying online **cancels your current passport right away**. [1](${u('online')}) [2](${u('afterApply')})

In person at a passport office is faster: 10 business days, then mailing. [3](${u('processing')}) ${change(4)}

${outro}`;
  }
  // Online can't be recommended: the trip is too close, or it isn't open (or we don't know the expiry).
  const onlineLine =
    on.reason === 'travel-soon'
      ? noOnline(3)
      : on.reason === 'unknown-expiry'
        ? fr
          ? `Si votre passeport expire dans les 6 prochains mois, vous pouvez aussi renouveler en ligne, mais le traitement prend jusqu’à 20 jours ouvrables, plus la livraison, et la demande **annule immédiatement votre passeport actuel**. [3](${u('online')})`
          : `If your passport expires within 6 months you could also renew online, but it takes up to 20 business days plus mailing and **cancels your current passport right away**. [3](${u('online')})`
        : '';
  const rest = `${onlineLine ? `${onlineLine}\n\n` : ''}${change(onlineLine ? 4 : 3)}\n\n${outro}`;
  return fr
    ? `# ${lead} En personne, vous devriez l’avoir *à temps*.

Dans un bureau des passeports, le traitement régulier prend 10 jours ouvrables, puis environ 5 jours ouvrables de livraison : votre passeport devrait arriver avant votre départ. [1](${u('processing')}) [2](${u('afterApply')})

${rest}`
    : `# ${lead} Apply in person and you should have it *in time*.

At a passport office, regular processing takes 10 business days, then about 5 business days to mail it to you, so it should arrive before your trip. [1](${u('processing')}) [2](${u('afterApply')})

${rest}`;
}

/** `timeZone` is the reader's, when the question came with it: the answer then counts from their date. */
export function tripAnswer(text: string, lang: L, timeZone?: string) {
  const moments = readerMoments(timeZone);
  const dated = new Set(moments.map((m) => m.today)).size === 1;
  // When the possible dates (or times of day) lead to different services, only the general travelling-soon answer holds for all.
  return cite(agreed(moments, (at) => answerOn(text, lang, at, dated)) ?? travelSoonReply(lang));
}
