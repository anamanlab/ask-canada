/**
 * Follow-up chips for the transport scenarios: the pool per topic and the variants that keep a chip just clicked (or a
 * question just asked) from coming straight back.
 */
import type { Scenario } from '@/lib/scripted/types';
import { escape } from './scenario-copy/text';

/**
 * A pool of follow-up chips per scenario. `when` says which questions a chip is "about" (default: its own text). For
 * each chip that routes back to the same scenario we add a variant of that scenario, matched only when the question
 * is about that chip, whose follow-ups leave it out, so the chip just clicked (or the question just asked) never comes
 * straight back. A first answer offers `same` chips on its own topic, then chips on other topics.
 */
type Chip = { en: string; fr: string; when?: RegExp };
/**
 * JavaScript's `\b` only knows ASCII letters, so `\b[ée]tats-unis` never matches « aux États-Unis » (É is a
 * "non-word" character). `when` patterns are rewritten with Latin-1-aware boundaries before use.
 */
const WORD = 'A-Za-z0-9_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u024F';
const B = `(?:(?<![${WORD}])(?=[${WORD}])|(?<=[${WORD}])(?![${WORD}]))`;
const latin = (re: RegExp) => re.source.replace(/(?<!\\)\\b/g, B);
function withFollowUps(base: Scenario, pool: Chip[], same = 2, total = 3): Scenario[] {
  const routesHere = (c: Chip) => base.match.some((re) => re.test(c.en)) && base.match.some((re) => re.test(c.fr));
  const here = pool.filter(routesHere);
  const others = pool.filter((c) => !routesHere(c));
  const out = (list: Chip[]) => ({ en: list.map((c) => c.en), fr: list.map((c) => c.fr) });
  /**
   * After a chip on this topic, offer the *next* sibling (cyclic) and then other topics, so two clicks in a row never
   * bring back the question asked one turn earlier (Sea-Doo → lost card → Sea-Doo).
   */
  const nextOf = (i: number) => (here.length > 1 ? [here[(i + 1) % here.length]] : []);
  const after = (i: number) => out([...nextOf(i), ...others].slice(0, total));
  const about = (c: Chip) => (c.when ? latin(c.when) : `^\\s*(?:${escape(c.en)}|${escape(c.fr)})\\s*$`);
  const variants = here.map(
    (c, i): Scenario => ({
      ...base,
      id: `${base.id}~${i + 1}`,
      priority: (base.priority ?? 0) + 0.5,
      match: base.match.map((re) => new RegExp(`^(?=[\\s\\S]*?(?:${about(c)}))[\\s\\S]*?(?:${re.source})`, 'i')),
      followUps: after(i),
    }),
  );
  /**
   * A chip with a model year ("Recalls for a 2019 Toyota RAV4"), when the question named the same vehicle without a
   * year: the answer is a per-year chart, so the natural next step, that vehicle with a year, comes first.
   */
  const yearless = here.flatMap((c, i): Scenario[] =>
    YEAR.test(c.en)
      ? [
          {
            ...base,
            id: `${base.id}~${i + 1}-year`,
            priority: (base.priority ?? 0) + 0.6,
            match: base.match.map((re) => new RegExp(`^(?![\\s\\S]*${YEAR.source})(?=[\\s\\S]*?(?:${about(c)}))[\\s\\S]*?(?:${re.source})`, 'i')),
            followUps: out([c, ...nextOf(i), ...others].slice(0, total)),
          },
        ]
      : [],
  );
  const mine = here.slice(0, same);
  return [...yearless, ...variants, { ...base, followUps: out([...mine, ...others].slice(0, total)) }];
}
/** A model year in a question or chip. */
const YEAR = /\b(?:19[5-9]\d|20[0-4]\d)\b/;

/* ───────────── Follow-up pools (see withFollowUps) ───────────── */

const DRONE_CHIP: Chip = { en: 'Do I need a licence to fly a drone?', fr: 'Ai-je besoin d’un permis pour piloter un drone?' };
const POOLS: Record<string, [Chip[], number]> = {
  'transport-recalls': [
    [
      { en: 'Recalls for a 2019 Toyota RAV4', fr: 'Rappels pour un véhicule Toyota RAV4 2019', when: /\brav ?4\b/ },
      { en: 'Recalls for a 2020 Honda CR-V', fr: 'Rappels pour un véhicule Honda CR-V 2020', when: /\bcr-?v\b/ },
      { en: 'Is there a recall on a 2021 Ford F-150?', fr: 'Y a-t-il un rappel sur un véhicule Ford F-150 2021?', when: /\bf-?150\b/ },
      { en: 'Does the Equinox EV qualify for the EV incentive?', fr: 'L’Equinox EV est-il admissible à l’incitatif pour VE?' },
      DRONE_CHIP,
    ],
    1,
  ],
  'transport-drone': [
    [
      { en: 'Can my 12-year-old fly a 570 g drone?', fr: 'Mon enfant de 12 ans peut-il piloter un drone de 570 g?', when: /\b\d{1,2}[\s-]*(?:years?[\s-]*old|ans?\b)/ },
      { en: 'Can I fly my drone near an airport?', fr: 'Puis-je piloter mon drone près d’un aéroport?', when: /\b(airport|a[ée]roport|heliport|h[ée]liport|controlled airspace|espace a[ée]rien contr[ôo]l[ée])\b/ },
      { en: 'Do I need a licence for a DJI Mini?', fr: 'Ai-je besoin d’un permis pour un DJI Mini?', when: /\b(mini|micro-?drone|under 250|moins de 250)\b/ },
      { en: 'Do I need a boating licence?', fr: 'Ai-je besoin d’un permis de bateau?' },
      { en: 'How much cannabis can I fly with?', fr: 'Combien de cannabis puis-je apporter en avion?' },
    ],
    2,
  ],
  'transport-boating': [
    [
      { en: 'Can my 13-year-old drive a 90 hp boat?', fr: 'Mon enfant de 13 ans peut-il conduire un bateau de 90 HP?', when: /\b\d{1,4}\s*(?:-\s*)?(hp|horse\s?power|ch|chevaux|cv)\b/ },
      { en: 'Can a 14-year-old drive a Sea-Doo?', fr: 'Un jeune de 14 ans peut-il conduire un Sea-Doo?', when: /\b(sea-?doo|jet ?skis?|personal watercraft|pwc|waverunner|motomarines?)\b/ },
      { en: 'I lost my boating card. How do I replace it?', fr: 'J’ai perdu ma carte de conducteur d’embarcation. Comment la remplacer?', when: /\b(lost|replace|perdu|remplacer)\b/ },
      DRONE_CHIP,
      { en: 'Bringing my dog back from the US', fr: 'Revenir au Canada avec mon chien des États-Unis' },
    ],
    2,
  ],
  'transport-cannabis': [
    [
      { en: 'Can I bring cannabis to the US?', fr: 'Puis-je apporter du cannabis aux États-Unis?', when: /\b(us|u\.s\.|states|border|abroad|[ée]tats-unis|fronti[èe]re|[ée]tranger)\b/ },
      { en: 'Can I fly with edibles in Canada?', fr: 'Puis-je prendre l’avion avec des produits comestibles au Canada?', when: /\b(fly|flying|flight|plane|airport|avion|vol|a[ée]roport)\b/ },
      { en: 'How much cannabis can I carry on a road trip?', fr: 'Combien de cannabis puis-je transporter en voiture?', when: /\b(road|drive|driving|car|voiture|route)\b/ },
      { en: 'Bringing my dog back from the US', fr: 'Revenir au Canada avec mon chien des États-Unis' },
      { en: 'Do I need a boating licence?', fr: 'Ai-je besoin d’un permis de bateau?' },
    ],
    2,
  ],
  'transport-pets': [
    [
      { en: 'Flying with my cat within Canada', fr: 'Prendre l’avion au Canada avec mon chat', when: /\b(fly|flying|flight|plane|airline|avion|vol|transporteur)\b/ },
      { en: 'Taking my dog to the US', fr: 'Aller aux États-Unis avec mon chien', when: /\b(to the (us|u\.s\.|states)|aux [ée]tats-unis|vers les [ée]tats-unis|abroad|[ée]tranger)\b/ },
      { en: 'Bringing my dog back from the US', fr: 'Revenir au Canada avec mon chien des États-Unis', when: /\b(back|from the (us|u\.s\.|states)|return\w*|revenir|rentrer|des [ée]tats-unis|into canada|au canada depuis)\b/ },
      { en: 'Can I fly with cannabis in Canada?', fr: 'Puis-je prendre l’avion avec du cannabis au Canada?' },
      DRONE_CHIP,
    ],
    2,
  ],
  'transport-ev': [
    [
      { en: 'EV incentive on a 36-month lease', fr: 'Incitatif pour VE sur une location de 36 mois', when: /\b(lease|leasing|location|louer|lou[ée]e?)\b/ },
      { en: 'Does a plug-in hybrid qualify?', fr: 'Un hybride rechargeable est-il admissible?', when: /\b(plug-?in hybrids?|phev|hybrides? rechargeables?)\b/ },
      { en: 'Does the Dodge Charger get the EV incentive?', fr: 'La Dodge Charger est-elle admissible à l’incitatif pour VE?', when: /\bcharger\b/ },
      { en: 'Recalls for a 2024 Tesla Model 3', fr: 'Rappels pour un véhicule Tesla Model 3 2024' },
      DRONE_CHIP,
    ],
    2,
  ],
};

/** Every scenario with its follow-ups: per-chip variants, then cross-topic variants (highest priority first). */
export function withChips(base: Scenario[]): Scenario[] {
  const built = base.flatMap((s) => (POOLS[s.id] ? withFollowUps(s, ...POOLS[s.id]) : [s]));

  /**
   * Cross-topic chips: after « Do I need a boating licence? » clicked under a drone answer, the boating answer shouldn't
   * offer the drone question straight back. For each chip that leads to another topic, add an exact-text variant of the
   * destination whose follow-ups skip chips leading back to any topic that offers it.
   */
  const routes = (s: Scenario, q: string) => s.match.some((re) => re.test(q));
  const leadsTo = (c: Chip, s: Scenario) => routes(s, c.en) && routes(s, c.fr);
  const rank = (q: string) => built.filter((s) => routes(s, q)).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  const crossing = new Map<string, { c: Chip; from: Scenario[] }>();
  for (const from of base)
    for (const c of POOLS[from.id]?.[0] ?? [])
      if (!leadsTo(c, from)) crossing.set(c.en, { c, from: [...(crossing.get(c.en)?.from ?? []), from] });
  const returns: Scenario[] = [...crossing.values()].flatMap(({ c, from }) => {
    const dest = rank(c.en);
    const home = dest && base.find((b) => dest.id.split('~')[0] === b.id);
    if (!dest || !home || !POOLS[home.id] || rank(c.fr)?.id !== dest.id) return [];
    const pool = POOLS[home.id][0];
    const ok = (c2: Chip) => c2.en !== c.en && !from.some((f) => leadsTo(c2, f));
    const first = (dest.followUps?.en ?? []).map((q) => pool.find((c2) => c2.en === q)).filter((c2): c2 is Chip => !!c2 && ok(c2));
    const list = [...first, ...pool.filter((c2) => ok(c2) && !first.includes(c2) && !leadsTo(c2, home))].slice(0, 3);
    if (list.length < 2) return [];
    return [
      {
        ...dest,
        id: `${dest.id}<${from.map((f) => f.id.replace('transport-', '')).join('+')}`,
        priority: (dest.priority ?? 0) + 0.75,
        match: [new RegExp(`^\\s*(?:${escape(c.en)}|${escape(c.fr)})\\s*$`, 'i')],
        followUps: { en: list.map((x) => x.en), fr: list.map((x) => x.fr) },
      },
    ];
  });
  return [...returns, ...built];
}
