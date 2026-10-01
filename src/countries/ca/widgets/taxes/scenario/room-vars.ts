/** The savings-room answer (TFSA / RRSP / FHSA): heading and bullets for the plan the question asked about. */
import { savingsRoom } from '../calc/room';
import { TFSA_CURRENT_YEAR } from '../data';
import { URLS } from '../urls';
import { dollars, roomInput, type Lang } from './parse-question';

/** The three plans as bullets, the one asked about first, with citations numbered in reading order. */
function roomBullets(focus: 'tfsa' | 'rrsp' | 'fhsa', lang: Lang) {
  const fr = lang === 'fr';
  const U = (k: keyof typeof URLS) => URLS[k][lang];
  const items: Record<'tfsa' | 'rrsp' | 'fhsa', { text: string; cites: (keyof typeof URLS)[] }> = {
    tfsa: {
      text: fr
        ? '**CELI** : 7 000 $ de nouveaux droits en 2026. Si vous aviez 18 ans ou plus et habitiez au Canada en 2009, vous avez accumulé **109 000 $** au total.'
        : '**TFSA**: $7,000 of new room in 2026. If you were 18 or older and living in Canada in 2009, you’ve built up **$109,000** in total.',
      cites: ['tfsaRoom', 'limits'],
    },
    rrsp: {
      text: fr
        ? '**REER** : les nouveaux droits correspondent à 18 % du revenu gagné l’an dernier, jusqu’à **33 810 $** pour 2026. Cotisez au plus tard le 1er mars 2027 pour déduire le montant dans votre déclaration de 2026.'
        : '**RRSP**: new room is 18% of last year’s earned income, up to **$33,810** for 2026. Contribute by March 1, 2027 to deduct it on your 2026 return.',
      cites: ['rrspLimit'],
    },
    fhsa: {
      text: fr
        ? '**CELIAPP** : 8 000 $ par année, jusqu’à 8 000 $ de droits inutilisés reportés, et **40 000 $** au total. Pour en ouvrir un, vous devez être résident du Canada, avoir 18 ans ou plus (19 ans dans certaines provinces) et 71 ans ou moins, et être un acheteur d’une première habitation.'
        : '**FHSA**: $8,000 a year, up to $8,000 of unused room carried forward, and **$40,000** in total. To open one, you must be a resident of Canada, 18 or older (19 in some provinces), 71 or younger, and a first-time home buyer.',
      cites: ['fhsa', 'fhsaOpen'],
    },
  };
  const order = [focus, ...(['tfsa', 'rrsp', 'fhsa'] as const).filter((k) => k !== focus)];
  let n = 0;
  return order.map((k) => `- ${items[k].text} ${items[k].cites.map((c) => `[${++n}](${U(c)})`).join(' ')}`).join('\n');
}

/** A heading that answers the plan asked about. */
function roomHeading(i: ReturnType<typeof roomInput>, lang: Lang) {
  const fr = lang === 'fr';
  if (i.focus === 'fhsa') {
    return fr
      ? 'Vous pouvez verser jusqu’à *8 000 $* dans votre CELIAPP en 2026, plus jusqu’à 8 000 $ de droits inutilisés reportés (40 000 $ à vie).'
      : 'You can put up to *$8,000* in your FHSA in 2026, plus up to $8,000 of unused room carried forward ($40,000 for life).';
  }
  if (i.focus === 'rrsp') {
    return fr
      ? 'Vos nouveaux droits au REER correspondent à *18 %* de votre revenu gagné en 2025, jusqu’à 33 810 $.'
      : 'Your new RRSP room is *18%* of your 2025 earned income, up to $33,810.';
  }
  const by = i.birthYear ?? (i.age != null ? TFSA_CURRENT_YEAR - i.age : undefined);
  if (by) {
    const r = savingsRoom({ birthYear: by, residentSince: i.residentSince ?? null });
    const amt = dollars(r.tfsa.limitTotal, lang);
    if (r.tfsa.eligible && r.tfsa.startYear) {
      return fr
        ? `Vous avez accumulé *${amt}* de droits au CELI depuis ${r.tfsa.startYear}, moins ce que vous avez déjà versé.`
        : `You’ve built up *${amt}* in TFSA room since ${r.tfsa.startYear}, minus what you’ve already put in.`;
    }
  }
  return fr
    ? 'Vos droits au CELI augmentent de *7 000 $* en 2026, en plus des droits inutilisés des années passées.'
    : 'Your TFSA room grows by *$7,000* in 2026, plus any room you haven’t used in past years.';
}

export function roomVars(text: string, lang: Lang) {
  const i = roomInput(text);
  return { heading: roomHeading(i, lang), bullets: roomBullets(i.focus, lang) };
}
