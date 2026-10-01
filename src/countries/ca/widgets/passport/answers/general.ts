/**
 * The two general passport answers that hold on any day: "renewing is simpler" and "travelling soon? apply in
 * person". The scenario table uses them as replies, and the computed answers fall back to them when the date
 * decides the answer and the reader's date isn't known for sure (see days.ts).
 */
import { URLS } from '../data';
import type { L } from './parse';

const OUTRO = {
  ask: { en: 'Tell the planner when your passport expires and it will map out your dates.', fr: 'Indiquez au planificateur quand votre passeport expire pour voir vos dates.' },
  plan: {
    en: 'Here’s your plan. Untick anything that doesn’t match your passport, and add your departure date if you’re travelling.',
    fr: 'Voici votre plan. Décochez ce qui ne correspond pas à votre passeport et indiquez votre date de départ si vous voyagez.',
  },
};
export const planOutro = (lang: L) => OUTRO.plan[lang];

export function renewReply(lang: L, outro: keyof typeof OUTRO = 'ask') {
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  return lang === 'fr'
    ? `# Bonne nouvelle : renouveler est *plus simple* que présenter une nouvelle demande.

Si votre dernier passeport était un passeport pour adulte délivré au cours des 15 dernières années, vous pouvez le renouveler sans répondant, preuve de citoyenneté ni pièce d’identité. Il vous faudra **2 références**. [1](${u('renew')}) [2](${u('whoCanRenew')})

Vous pouvez renouveler **en ligne** quand votre passeport expire dans les 6 prochains mois (ou s’il est déjà expiré). Le traitement prend jusqu’à **20 jours ouvrables, plus la livraison**. En personne, à un bureau des passeports, c’est le plus rapide. [3](${u('online')}) [4](${u('processing')})

${OUTRO[outro].fr}`
    : `# Good news: renewing is *simpler* than applying for a new passport.

If your last passport was an adult passport issued in the last 15 years, you can renew it without a guarantor, proof of citizenship or supporting ID. You’ll need **2 references**. [1](${u('renew')}) [2](${u('whoCanRenew')})

You can renew **online** once your passport is within 6 months of expiring (or already expired), which takes up to **20 business days plus mailing**. In person at a passport office is the fastest option. [3](${u('online')}) [4](${u('processing')})

${OUTRO[outro].en}`;
}

export function travelSoonReply(lang: L) {
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  return lang === 'fr'
    ? `# Vous voyagez bientôt? *Présentez votre demande en personne à un bureau des passeports*, pas en ligne.

Le renouvellement en ligne ne vous convient pas si vous voyagez dans les 20 prochains jours ouvrables, et une demande en ligne **annule immédiatement votre passeport actuel**. [1](${u('online')})

Dans un bureau des passeports, vous pouvez payer pour un service plus rapide : le service **urgent**, pour récupérer votre passeport avant la fin du jour ouvrable suivant, ou le service **express**, en 2 à 9 jours ouvrables. Vous devez prouver que vous en avez besoin, par exemple avec un billet d’avion, d’autobus ou de train ou un itinéraire payé. [2](${u('urgent')})

Ne finalisez pas vos projets de voyage avant d’avoir votre passeport. [3](${u('processing')})`
    : `# Travelling soon? *Apply in person at a passport office*, not online.

Online renewal isn’t for you if you travel in the next 20 business days, and applying online **cancels your current passport right away**. [1](${u('online')})

At a passport office you can pay for faster service: **urgent** pickup by the end of the next business day, or **express** pickup in 2 to 9 business days. You must show proof you need it, like a plane, bus or train ticket or a paid itinerary. [2](${u('urgent')})

Don’t finalize travel plans until you have your passport. [3](${u('processing')})`;
}
