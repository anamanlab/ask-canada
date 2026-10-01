/** Answer text for the duty-free scenario: the verdict for the trip described, then every exemption tier. */
import { buildDutyFree } from '../build';
import { EXEMPTION } from '../data';
import type { Lang } from '../types';
import { tierOf, tripFromText } from './match';
import { cite, money } from './text';

export function dutyFor(text: string, lang: Lang) {
  const x = tripFromText(text);
  const tier = tierOf(x);
  const fr = lang === 'fr';
  const r = buildDutyFree({ ...x, lang }).result;
  const all = fr
    ? `- **Moins de 24 heures :** aucune exemption.\n- **24 heures ou plus :** jusqu’à ${money(200, 'fr')}, sans alcool ni tabac. Si vous dépassez ${money(200, 'fr')}, les droits et les taxes s’appliquent au montant total.\n- **48 heures ou plus :** jusqu’à ${money(800, 'fr')}, y compris l’alcool et le tabac selon certaines limites.\n- **7 jours ou plus :** jusqu’à ${money(800, 'fr')}, et les biens autres que l’alcool et le tabac peuvent suivre par la poste. ${cite(1, 'declare', 'fr')}`
    : `- **Under 24 hours:** no exemption.\n- **24 hours or more:** up to ${money(200, 'en')}, no alcohol or tobacco. Go over ${money(200, 'en')} and duty and taxes apply to the whole amount.\n- **48 hours or more:** up to ${money(800, 'en')}, including alcohol and tobacco within limits.\n- **7 days or more:** up to ${money(800, 'en')}, and goods other than alcohol and tobacco can follow by mail. ${cite(1, 'declare', 'en')}`;
  if (!tier) {
    return fr
      ? { headline: 'Tout dépend *de la durée de votre absence.*', body: `Votre exemption personnelle dépend du temps passé à l’extérieur du Canada :\n\n${all}` }
      : { headline: 'It depends on *how long you were away.*', body: `Your personal exemption depends on how long you were outside Canada:\n\n${all}` };
  }
  const allowance = EXEMPTION[tier];
  let headline: string;
  if (x.spent == null) {
    headline =
      tier === 'under24'
        ? fr
          ? 'Pour un aller-retour de moins de 24 heures, *il n’y a pas d’exemption.*'
          : 'Same-day trips get *no personal exemption.*'
        : fr
          ? `Vous pouvez rapporter *${money(allowance, 'fr')}* en franchise.`
          : `You can bring back *${money(allowance, 'en')}* duty-free.`;
  } else if (r.outcome === 'free') {
    headline = fr ? `Bonne nouvelle : vos *${money(r.spent, 'fr')}* entrent en franchise.` : `Good news: your *${money(r.spent, 'en')}* comes in duty-free.`;
  } else if (r.outcome === 'over') {
    headline = fr
      ? `Vous paierez des droits et des taxes sur *${money(r.dutiable, 'fr')}*, la partie qui dépasse ${money(allowance, 'fr')}.`
      : `You’ll pay duty and taxes on *${money(r.dutiable, 'en')}*, the part over ${money(allowance, 'en')}.`;
  } else if (r.outcome === 'cliff') {
    headline = fr
      ? `Attention : au-delà de 200 $ après 24 heures, les droits s’appliquent aux *${money(r.spent, 'fr')} au complet.*`
      : `Careful: over $200 after 24 hours means duty on *all ${money(r.spent, 'en')}.*`;
  } else {
    headline = fr ? 'Pour un aller-retour de moins de 24 heures, *il n’y a pas d’exemption.*' : 'Same-day trips get *no personal exemption.*';
  }
  const notes: string[] = [];
  if (x.weekend)
    notes.push(
      fr
        ? 'Cela suppose une absence d’au moins 48 heures : si vous êtes parti le vendredi à 19 h, revenez au plus tôt le dimanche à 19 h.'
        : 'That assumes you were away at least 48 hours: leave Friday at 7 p.m., and come back no earlier than 7 p.m. Sunday.',
    );
  if (x.alcohol && (tier === 'h48' || tier === 'd7'))
    notes.push(
      fr
        ? 'Pour l’alcool, vous pouvez inclure un seul de ces choix : 1,5 L de vin, 1,14 L de spiritueux ou 8,5 L de bière.'
        : 'For alcohol, you can include one of: 1.5 L of wine, 1.14 L of liquor or 8.5 L of beer.',
    );
  const intro = notes.length ? `${notes.join(' ')} ${cite(1, 'declare', lang)}\n\n` : '';
  return {
    headline,
    body: `${intro}${fr ? `Votre exemption dépend du temps passé à l’extérieur du Canada :\n\n${all}` : `Your exemption depends on how long you were outside Canada:\n\n${all}`}`,
  };
}
