/** Scripted answer for the Electric Vehicle Affordability Program: the heading uses the widget's own calculator. */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../../../data/holidays';
import { URLS } from '../data';
import { evapIncentive, levelFor, searchEv, type Fuel } from '../ev';
import { EV_SNAPSHOT } from '../ev-snapshot';
import { evQueryOf, leaseOf } from '../parse';
import { Le, escape, le, money, type Ctx, type Lang } from './text';

function evHead(text: string, lang: Lang): string {
  const fr = lang === 'fr';
  const date = todayInCanada(new Date());
  const lvl = levelFor(Number(date.slice(0, 4)));
  const phev = /\b(plug-?in hybrids?|phev|hybrides? rechargeables?)\b/i.test(text);
  const lease = leaseOf(text);
  if (lease != null) {
    const fuel: Fuel = phev ? 'PHEV' : 'BEV';
    const r = evapIncentive({ fuel, price: null, canadianMade: false, leaseMonths: lease, date });
    if (!r.eligible) return fr ? 'Les locations de moins de 12 mois *ne sont pas admissibles*.' : 'Leases under 12 months *don’t qualify*.';
    return fr
      ? `Sur une location de ${lease} mois, ${phev ? 'un hybride rechargeable neuf' : 'un VE neuf'} donne droit à *${money(r.amount, lang)}* de rabais.`
      : `On a ${lease}-month lease, a new ${phev ? 'plug-in hybrid' : 'EV'} gets *${money(r.amount, lang)}* off.`;
  }
  const found = evQueryOf(text);
  if (found) {
    const q = new RegExp(`${escape(found)}(\\s+EV)?`, 'i').exec(text)?.[0] ?? found;
    const hits = searchEv(EV_SNAPSHOT, found);
    if (hits.length) {
      const fuel = EV_SNAPSHOT[hits[0]][4];
      const amount = fuel === 'PHEV' ? lvl.phev : lvl.zev;
      return fr ? `Oui : ${le(q)} figure sur la liste, pour jusqu’à *${money(amount, lang)}* de rabais.` : `Yes: the ${q} is on the list, for up to *${money(amount, lang)}* off.`;
    }
    return fr ? `${Le(q)} n’est pas sur la liste, mais il *pourrait quand même être admissible*.` : `The ${q} isn’t on the list, but it *may still qualify*.`;
  }
  if (phev) return fr ? `Oui : jusqu’à *${money(lvl.phev, lang)}* de rabais sur un hybride rechargeable neuf.` : `Yes: up to *${money(lvl.phev, lang)} off* a new plug-in hybrid.`;
  return fr ? `Oui : jusqu’à *${money(lvl.zev, lang)} de rabais* sur un VE neuf, directement chez le concessionnaire.` : `Yes: up to *${money(lvl.zev, lang)} off* a new EV, right at the dealer.`;
}

export const evScenario: Scenario = {
  id: 'transport-ev',
  priority: 9,
  match: [
    /\b(ev|evs|electric (car|vehicle|suv|truck)s?|plug-?in hybrids?|phev|izev|evap|zev)\b.*\b(rebate|incentive|credit|subsid\w*|qualif\w*|eligible|grant|discount|money back)\b/i,
    /\b(rebate|incentive|credit|subsid\w*)\b.*\b(ev|evs|electric (car|vehicle)s?|plug-?in|izev|evap)\b/i,
    /\b(does|do|is|will)\b.*\b(qualify|eligible)\b.*\b(ev|incentive|rebate)\b/i,
    /\b(rabais|incitatifs?|subventions?|admissibles?|remise)\b.*\b(v[ée]hicules? [ée]lectriques?|voitures? [ée]lectriques?|autos? [ée]lectriques?|hybrides? rechargeables?|pave|ivze)\b/i,
    /\b(v[ée]hicules? [ée]lectriques?|voitures? [ée]lectriques?|autos? [ée]lectriques?|\bve\b|hybrides? rechargeables?|pave|ivze)\b.*\b(rabais|incitatifs?|subventions?|admissibles?|cr[ée]dit|remise)\b/i,
    /\b(rabais|incitatifs?|subventions?|remise)\b.*\b([ée]lectriques?|\bve\b|pave)\b/i,
    /\b(programme pour l['’]abordabilit[ée] des v[ée]hicules [ée]lectriques|electric vehicle affordability program)\b/i,
  ],
  reply: {
    en: `# {headEn}

Canada’s new Electric Vehicle Affordability Program takes up to $5,000 off a new battery-electric or hydrogen vehicle, and up to $2,500 off a plug-in hybrid, when you buy or lease it for 48 months or more on or after February 16, 2026. Shorter leases of 12 months or more get a prorated amount. [1](${URLS.evOverview.en})

The final transaction value must be $50,000 or less, unless the vehicle is made in Canada. There’s nothing to apply for yourself: an enrolled dealer checks your eligibility and takes it off the bill. Each person can get one incentive. [1](${URLS.evOverview.en})

Amounts step down each year (to $4,000 and $2,000 in 2027), and the program ends March 31, 2031, or earlier if the money runs out. [1](${URLS.evOverview.en}) [2](${URLS.ev.en}) Check your vehicle against Transport Canada’s list below.`,
    fr: `# {headFr}

Le nouveau Programme pour l’abordabilité des véhicules électriques retranche jusqu’à 5 000 $ du prix d’un véhicule neuf électrique à batterie ou à hydrogène, et jusqu’à 2 500 $ d’un hybride rechargeable, acheté ou loué pour 48 mois ou plus à compter du 16 février 2026. Les locations plus courtes, de 12 mois ou plus, donnent droit à un montant au prorata. [1](${URLS.evOverview.fr})

La valeur finale de la transaction doit être de 50 000 $ ou moins, sauf si le véhicule est fabriqué au Canada. Vous n’avez aucune demande à faire : un concessionnaire inscrit vérifie votre admissibilité et déduit l’incitatif de la facture. Chaque personne a droit à un seul incitatif. [1](${URLS.evOverview.fr})

Les montants diminuent chaque année (à 4 000 $ et 2 000 $ en 2027), et le programme prend fin le 31 mars 2031, ou plus tôt si les fonds sont épuisés. [1](${URLS.evOverview.fr}) [2](${URLS.ev.fr}) Vérifiez votre véhicule dans la liste de Transports Canada ci-dessous.`,
  },
  vars: ({ text }) => ({ headEn: evHead(text, 'en'), headFr: evHead(text, 'fr') }),
  toolCalls: [
    {
      toolName: 'transportEvIncentive',
      input: ({ text, lang, timeZone }: Ctx) => ({
        query: evQueryOf(text),
        fuel: /\b(plug-?in hybrid|phev|hybride rechargeable)\b/i.test(text) ? 'PHEV' : undefined,
        leaseMonths: leaseOf(text),
        lang,
        timeZone,
      }),
    },
  ],
};
