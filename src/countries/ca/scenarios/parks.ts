/**
 * Scripted scenarios for the `parks` widget (EN + FR). Facts: widgets/parks/data.ts. Matching, wording and
 * the computed parts of each answer live in widgets/parks/scenario-{match,text,vars}.ts.
 * Tool calls really execute (live CWFIS + Parks Canada bulletins for wildfire questions).
 */
import { detectLang } from '@/lib/scripted/engine';
import type { Scenario } from '@/lib/scripted/types';
import frMessages from '../widgets/parks/messages/fr.json';
import { DISCOVERY, RESERVATION, STRONG_PASS, TIERS, parkById, type Lang } from '../widgets/parks/data';
import { CAMP, CLOSED, FIRE, LAND_RE, NO_PARK, NP, PARKS_WORD, PASS, PROVINCIAL, PROV_RE, SAFE, filtersIn, parkIn, party, placeIn, withPark } from '../widgets/parks/scenario-match';
import { PHONE, cite, dateLong, money, page, parksPage } from '../widgets/parks/scenario-text';
import { aboutVars, campingVars, filterVars, nearVars, passVars, wildfireVars } from '../widgets/parks/scenario-vars';

type Ctx = { text: string; lang: Lang; timeZone?: string };

const parks: Scenario[] = [
  {
    id: 'parks-wildfire-park',
    // Above the weather widget's smoke answer (9, 9.01 with a place): this one needs a named park, so it's
    // strictly more specific, and a park-by-park answer beats "pick a place".
    priority: 9.5,
    match: [
      withPark(FIRE),
      // "Is it safe to run outside in Banff?" is an air-quality question: leave it to the weather widget.
      new RegExp(`^(?![\\s\\S]*\\b(air|aqhi|breathe|run|running|jog|jogging|exercise|respirer|courir|qualit[ée] de l.air)\\b)${withPark(SAFE).source}`, 'i'),
      withPark(CLOSED),
    ],
    reply: {
      en: `# {heading}

{status}

{ban}

{fireRule} Evacuation orders come from provincial and territorial officials: follow their alerts and call 911 in an emergency. ${cite(4, page('emergency', 'en'))}

Here’s the live picture from Natural Resources Canada and Parks Canada.`,
      fr: `# {heading}

{status}

{ban}

{fireRule} Les ordres d’évacuation viennent des autorités provinciales et territoriales : suivez leurs alertes et composez le 911 en cas d’urgence. ${cite(4, page('emergency', 'fr'))}

Voici la situation en direct, selon Ressources naturelles Canada et Parcs Canada.`,
    },
    vars: wildfireVars,
    toolCalls: [{ toolName: 'parksConditions', input: ({ text, lang, timeZone }: Ctx) => ({ park: (parkIn(text) ?? parkById('banff')!).id, lang, timeZone }) }],
    followUps: {
      en: ['Fire danger in every national park today', 'How do I book a Parks Canada campsite?', 'Is a Discovery Pass worth it for my family?'],
      fr: ['Quel est le risque d’incendie dans les parcs nationaux aujourd’hui?', 'Comment réserver un camping de Parcs Canada?', 'La carte Découverte vaut-elle la peine pour ma famille?'],
    },
  },
  {
    id: 'parks-wildfire-national',
    // Above weather-smoke (9): it needs "national park(s)/Parks Canada". Just under the named-park answer.
    priority: 9.4,
    match: [new RegExp(`(?=[\\s\\S]*${NP.source})(?=[\\s\\S]*${FIRE.source})`, 'i')],
    reply: {
      en: `# Here’s today’s *fire danger* in every national park.

The rating comes from the Canadian Wildland Fire Information System at Natural Resources Canada, updated daily, along with satellite fire hotspots detected near each park in the last 24 hours. ${cite(1, page('fireDanger', 'en'))} ${cite(2, page('fireMap', 'en'))}

Fire bans and closures are posted park by park in Parks Canada’s Important bulletins. ${cite(3, page('bulletins', 'en'))} Tap a park for its details.`,
      fr: `# Voici le *risque d’incendie* aujourd’hui dans chaque parc national.

La cote vient du Système canadien d’information sur les feux de végétation de Ressources naturelles Canada, mise à jour chaque jour, avec les points chauds détectés par satellite près de chaque parc au cours des 24 dernières heures. ${cite(1, page('fireDanger', 'fr'))} ${cite(2, page('fireMap', 'fr'))}

Les interdictions de feux et les fermetures sont affichées parc par parc dans les bulletins importants de Parcs Canada. ${cite(3, page('bulletins', 'fr'))} Touchez un parc pour voir ses détails.`,
    },
    toolCalls: [{ toolName: 'parksConditions', input: ({ lang, timeZone }: Ctx) => ({ lang, timeZone }) }],
    followUps: {
      en: ['Is there a fire ban in Jasper?', 'Wildfire status in Banff National Park', 'National parks near Calgary'],
      fr: ['Y a-t-il une interdiction de feux à Jasper?', 'Y a-t-il des feux de forêt au parc national Banff?', 'Quels parcs nationaux sont près de Calgary?'],
    },
  },
  {
    id: 'parks-camping',
    priority: 8,
    // "National parks in Nova Scotia with camping" goes to the finder, which can filter by province and landscape.
    match: [withPark(CAMP), new RegExp(`^(?![\\s\\S]*(?:${PROV_RE}|${LAND_RE}))(?=[\\s\\S]*${NP.source})(?=[\\s\\S]*${CAMP.source})`, 'i')],
    reply: {
      en: `# {heading}

Parks Canada takes camping reservations at ${RESERVATION.destinations} destinations, online or at ${PHONE}. For 2026, national park campgrounds opened between January 20 and February 12, each on its own launch day. ${cite(1, page('reserve', 'en'))}

On launch day, a waiting page opens 30 minutes early. At 8\u00a0am local time (8:30\u00a0am in Newfoundland and Labrador), everyone waiting gets a random place in line, and the whole season opens at once. ${cite(2, page('howToReserve', 'en'))}

Each reservation, change or cancellation costs ${money(RESERVATION.online, 'en')} online or ${money(RESERVATION.phone, 'en')} by phone, on top of the nightly campsite fee. {fees}

Here’s your launch-day plan{forPark}. Your checklist stays on this device.`,
      fr: `# {heading}

Parcs Canada prend les réservations de camping dans ${RESERVATION.destinations} destinations, en ligne ou au ${PHONE}. Pour 2026, les terrains de camping des parcs nationaux ont ouvert entre le 20\u00a0janvier et le 12\u00a0février, chacun à sa propre date de lancement. ${cite(1, page('reserve', 'fr'))}

Le jour du lancement, une page d’attente ouvre 30 minutes à l’avance. À 8\u00a0h, heure locale (8\u00a0h\u00a030 à Terre-Neuve-et-Labrador), chaque personne qui attend reçoit une place au hasard dans la file, et toute la saison ouvre d’un coup. ${cite(2, page('howToReserve', 'fr'))}

Chaque réservation, modification ou annulation coûte ${money(RESERVATION.online, 'fr')} en ligne ou ${money(RESERVATION.phone, 'fr')} par téléphone, en plus du tarif de camping par nuit. {fees}

Voici votre plan pour le jour du lancement{forPark}. Votre liste reste sur cet appareil.`,
    },
    vars: campingVars,
    toolCalls: [{ toolName: 'parksCamping', input: ({ text, lang, timeZone }: Ctx) => ({ park: parkIn(text)?.id, lang, timeZone }) }],
    followUps: {
      en: ['Is a Discovery Pass worth it for my family?', 'Is there a fire ban in Banff?', 'National parks near Halifax'],
      fr: ['La carte Découverte vaut-elle la peine pour ma famille?', 'Y a-t-il une interdiction de feux à Banff?', 'Quels parcs nationaux sont près de Halifax?'],
    },
  },
  {
    id: 'parks-pass',
    priority: 6,
    match: [
      /\b(discovery pass|parks canada pass|national parks? pass)\b/i,
      new RegExp(`(?=[\\s\\S]*${NP.source})(?=[\\s\\S]*${PASS.source})`, 'i'),
      withPark(/\b(admission|entrance fee|entry fee|how much|cost|fees?|pass|droits? d.entr[ée]e|combien|co[uû]te?|tarifs?|laissez-passer)\b/i),
      /\b(carte d.entr[ée]e d[ée]couverte|carte d[ée]couverte|laissez-passer (de )?parcs canada)\b/i,
    ],
    reply: {
      en: `# {heading}

A Discovery Pass is ${money(DISCOVERY.adult, 'en')} for an adult, ${money(DISCOVERY.senior, 'en')} for a senior or ${money(DISCOVERY.family, 'en')} for a family or group of up to 7 people in one vehicle, and it covers 80+ places for 12 months. Youth 17 and under always get in free. ${cite(1, page('admission', 'en'))} {fees}

{detail}Daily admission is ${money(TIERS[1].adult, 'en')} per adult (or ${money(TIERS[1].family, 'en')} per family) in the busiest parks like Banff and Jasper, so the pass pays off after about 7 park days there. {banff}

The free Canada Strong Pass ended on ${dateLong(STRONG_PASS.ended, 'en')}, so regular fees apply again, and a Discovery Pass that was valid during a Strong Pass period was automatically extended. ${cite(1, page('admission', 'en'))} Adjust your group and days below to see what’s cheaper.`,
      fr: `# {heading}

La carte d’entrée Découverte coûte ${money(DISCOVERY.adult, 'fr')} pour un adulte, ${money(DISCOVERY.senior, 'fr')} pour un aîné ou ${money(DISCOVERY.family, 'fr')} pour une famille ou un groupe de jusqu’à 7 personnes dans un même véhicule, et elle donne accès à plus de 80 lieux pendant 12 mois. Les jeunes de 17 ans et moins entrent toujours gratuitement. ${cite(1, page('admission', 'fr'))} {fees}

{detail}Les droits quotidiens sont de ${money(TIERS[1].adult, 'fr')} par adulte (ou ${money(TIERS[1].family, 'fr')} par famille) dans les parcs les plus fréquentés comme Banff et Jasper : la carte devient rentable après environ 7 jours de visite. {banff}

Le laissez-passer gratuit Un Canada fort a pris fin le ${dateLong(STRONG_PASS.ended, 'fr')} : les droits habituels s’appliquent de nouveau, et une carte Découverte valide pendant une période du laissez-passer a été automatiquement prolongée. ${cite(1, page('admission', 'fr'))} Ajustez votre groupe et vos jours ci-dessous pour voir l’option la moins chère.`,
    },
    vars: passVars,
    toolCalls: [
      {
        toolName: 'parksPasses',
        input: ({ text, lang }: Ctx) => {
          const p = parkIn(text);
          return { ...party(text), ...(p ? { park: p.id } : {}), ...(/\b(family|famille)\b/i.test(text) ? { family: true } : {}), lang };
        },
      },
    ],
    followUps: {
      en: ['How do I book a Parks Canada campsite?', 'Fire danger in every national park today', 'National parks near Calgary'],
      fr: ['Comment réserver un camping de Parcs Canada?', 'Quel est le risque d’incendie dans les parcs nationaux aujourd’hui?', 'Quels parcs nationaux sont près de Calgary?'],
    },
  },
  {
    id: 'parks-near',
    priority: 6,
    match: [
      /\b(national )?parks?\b.*\b(near|close to|around|by|from)\s+([a-zà-ÿ' .,-]{3,40})\??$/i,
      /\bparcs?( nationaux| national)?\b.*\b(pr[eè]s de|autour de|proche de|pr[eè]s d’|pr[eè]s d')\s*([a-zà-ÿ' .,-]{3,40})\??$/i,
    ],
    exclude: [/\bprovincial\b/i],
    reply: {
      en: `# {heading}

{body}Daily admission is free for youth 17 and under at every Parks Canada place, and adult fees range from ${money(TIERS[3].adult, 'en')} to ${money(TIERS[1].adult, 'en')} a day. ${cite(1, page('admission', 'en'))} ${cite(2, page('feesByPlace', 'en'))}

Tap a park for fees, camping and what to know before you go.`,
      fr: `# {heading}

{body}L’entrée est gratuite pour les jeunes de 17 ans et moins dans tous les lieux de Parcs Canada, et les droits pour adulte varient de ${money(TIERS[3].adult, 'fr')} à ${money(TIERS[1].adult, 'fr')} par jour. ${cite(1, page('admission', 'fr'))} ${cite(2, page('feesByPlace', 'fr'))}

Touchez un parc pour voir les frais, le camping et ce qu’il faut savoir avant de partir.`,
    },
    vars: nearVars,
    toolCalls: [{ toolName: 'parksFinder', input: ({ text, lang, timeZone }: Ctx) => ({ near: placeIn(text), lang, timeZone }) }],
    followUps: {
      en: ['Is there a fire ban in Banff?', 'Is a Discovery Pass worth it for my family?', 'How do I book a campsite in Jasper?'],
      fr: ['Y a-t-il une interdiction de feux à Banff?', 'La carte Découverte vaut-elle la peine pour ma famille?', 'Comment réserver un camping à Jasper?'],
    },
  },
  {
    id: 'parks-about',
    priority: 5,
    match: [
      withPark(/\b(tell me about|about|visit(ing)?|trip|going to|before (i go|going|visiting|you go)|know|plan|things to|what to|national park|park)\b/i),
      withPark(/\b(visiter|visite|voyage|aller [àa]|avant de|savoir|planifier|parc national|parc)\b/i),
    ],
    reply: {
      en: `# {name}: here’s what to *know before you go*.

{fees} The Parks Canada Discovery Pass covers daily admission wherever it applies, for 12 months. ${cite(2, page('admission', 'en'))}

Stay at least 30\u00a0m from deer, moose and elk and 100\u00a0m from bears, wolves, coyotes and cougars, keep dogs on a leash at all times, and leave the drone at home: drones are prohibited in all Parks Canada places. ${cite(3, page('wildlife', 'en'))} {fires}

Cell coverage isn’t reliable in the backcountry, so leave a trip plan with someone and call 911 in an emergency. ${cite(5, page('emergency', 'en'))} The park card below includes today’s fire danger and Parks Canada’s current bulletins.`,
      fr: `# {name} : ce qu’il faut *savoir avant de partir*.

{fees} La carte d’entrée Découverte de Parcs Canada couvre l’entrée quotidienne là où elle s’applique, pendant 12 mois. ${cite(2, page('admission', 'fr'))}

Restez à au moins 30\u00a0m des cerfs, orignaux et wapitis, et à 100\u00a0m des ours, loups, coyotes et couguars, gardez votre chien en laisse en tout temps et laissez le drone à la maison : les drones sont interdits dans tous les lieux de Parcs Canada. ${cite(3, page('wildlife', 'fr'))} {fires}

Le réseau cellulaire n’est pas fiable dans l’arrière-pays : laissez votre plan de sortie à quelqu’un et composez le 911 en cas d’urgence. ${cite(5, page('emergency', 'fr'))} La fiche du parc ci-dessous présente le risque d’incendie d’aujourd’hui et les bulletins en vigueur de Parcs Canada.`,
    },
    vars: aboutVars,
    toolCalls: [{ toolName: 'parksFinder', input: ({ text, lang, timeZone }: Ctx) => ({ park: (parkIn(text) ?? parkById('banff')!).id, lang, timeZone }) }],
    followUps: {
      en: ['How do I book a Parks Canada campsite?', 'Is a Discovery Pass worth it for my family?', 'Fire danger in every national park today'],
      fr: ['Comment réserver un camping de Parcs Canada?', 'La carte Découverte vaut-elle la peine pour ma famille?', 'Quel est le risque d’incendie dans les parcs nationaux aujourd’hui?'],
    },
  },
  {
    id: 'parks-filter',
    priority: 5.5,
    match: [
      // "…near Halifax, Nova Scotia" ranks by distance instead (parks-near).
      new RegExp(`${NO_PARK}(?![\\s\\S]*\\b(near|close to|pr[eè]s d|proche d|autour d))(?=[\\s\\S]*${PROV_RE})(?=[\\s\\S]*(?:${PARKS_WORD.source}|${CAMP.source}))`, 'i'),
      new RegExp(`${NO_PARK}(?=[\\s\\S]*(?:${LAND_RE}))(?=[\\s\\S]*${PARKS_WORD.source})`, 'i'),
    ],
    exclude: [PROVINCIAL],
    reply: {
      en: `# {heading}

Youth 17 and under get in free at every Parks Canada place, and adult daily admission ranges from ${money(TIERS[3].adult, 'en')} to ${money(TIERS[1].adult, 'en')}. ${cite(1, page('admission', 'en'))} ${cite(2, page('parksSearch', 'en'))}

{camp}Tap a park for fees, camping and what to know before you go, or change the filters to see more.`,
      fr: `# {heading}

L’entrée est gratuite pour les jeunes de 17 ans et moins dans tous les lieux de Parcs Canada, et le droit quotidien pour adulte varie de ${money(TIERS[3].adult, 'fr')} à ${money(TIERS[1].adult, 'fr')}. ${cite(1, page('admission', 'fr'))} ${cite(2, page('parksSearch', 'fr'))}

{camp}Touchez un parc pour voir les frais, le camping et ce qu’il faut savoir avant de partir, ou modifiez les filtres pour en voir plus.`,
    },
    vars: filterVars,
    toolCalls: [{ toolName: 'parksFinder', input: ({ text, lang, timeZone }: Ctx) => ({ ...filtersIn(text), lang, timeZone }) }],
    followUps: {
      en: ['How do I book a Parks Canada campsite?', 'Is a Discovery Pass worth it for my family?', 'Fire danger in every national park today'],
      fr: ['Comment réserver un camping de Parcs Canada?', 'La carte Découverte vaut-elle la peine pour ma famille?', 'Quel est le risque d’incendie dans les parcs nationaux aujourd’hui?'],
    },
  },
  {
    id: 'parks-browse',
    priority: 3,
    match: [/^\s*(show me |find |list )?(all )?(the )?(canada'?s |canadian )?national parks\??\s*$/i, /\b(which|what) national parks?\b/i, /\b(find|choose|pick) a national park\b/i, /^\s*(les )?parcs nationaux( du canada)?\??\s*$/i, /\b(quels?|trouver un) parcs? nationa(l|ux)\b/i],
    reply: {
      en: `# Canada has *48* national parks and park reserves, plus Rouge National Urban Park.

That’s 37 national parks and 11 park reserves, from Point Pelee on Lake Erie to Quttinirpaaq on Ellesmere Island. ${cite(1, parksPage('en'))} ${cite(2, page('parksSearch', 'en'))} Youth 17 and under get in free everywhere, and adult daily admission ranges from ${money(TIERS[3].adult, 'en')} to ${money(TIERS[1].adult, 'en')}. ${cite(3, page('admission', 'en'))}

Filter by landscape or camping, or tap a park for fees and what to know before you go.`,
      fr: `# Le Canada compte *48* parcs nationaux et réserves de parc national, en plus du parc urbain national de la Rouge.

Ce sont 37 parcs nationaux et 11 réserves, de la Pointe-Pelée, sur le lac Érié, à Quttinirpaaq, sur l’île d’Ellesmere. ${cite(1, parksPage('fr'))} ${cite(2, page('parksSearch', 'fr'))} L’entrée est gratuite partout pour les jeunes de 17 ans et moins, et le droit quotidien pour adulte varie de ${money(TIERS[3].adult, 'fr')} à ${money(TIERS[1].adult, 'fr')}. ${cite(3, page('admission', 'fr'))}

Filtrez par paysage ou par camping, ou touchez un parc pour voir les frais et ce qu’il faut savoir avant de partir.`,
    },
    toolCalls: [{ toolName: 'parksFinder', input: ({ lang, timeZone }: Ctx) => ({ lang, timeZone }) }],
    followUps: {
      en: ['National parks near Calgary', 'Is a Discovery Pass worth it for my family?', 'Fire danger in every national park today'],
      fr: ['Quels parcs nationaux sont près de Calgary?', 'La carte Découverte vaut-elle la peine pour ma famille?', 'Quel est le risque d’incendie dans les parcs nationaux aujourd’hui?'],
    },
  },
];

/*
 * On the English interface the engine only has the text to go on: a French chip (a follow-up, or a card's
 * "ask" button) that doesn't read as French to detectLang gets an English answer and the conversation
 * switches language. Checked in development for every French question the parks answers and cards offer.
 */
if (process.env.NODE_ENV !== 'production') {
  const asks = Object.entries(frMessages as Record<string, string>).flatMap(([k, v]) => (k.startsWith('ask.') ? [v.replace('{park}', 'Banff')] : []));
  const english = [...parks.flatMap((s) => s.followUps?.fr ?? []), ...asks].filter((q) => detectLang(q, 'en') !== 'fr');
  if (english.length) console.error(`[parks] French questions the scripted engine would answer in English: ${english.join(' | ')}`);

  // Every citation carries its page title (see `cite`). One without would show a slug from its URL in the
  // Sources list unless the card happens to list the same page. Checked in the templates and in what the
  // computed parts return.
  const BARE = /\[\d{1,2}\]\((?:https?:\/\/[^)\s"]+|\{\w+\})\)/g;
  const checkTitles = (id: string, text: string) => {
    const bare = text.match(BARE);
    if (bare) console.error(`[parks] ${id}: citations without a page title: ${bare.join(' ')}`);
  };
  for (const s of parks) {
    checkTitles(s.id, `${s.reply.en}\n${s.reply.fr}`);
    const vars = s.vars;
    if (vars) {
      s.vars = async (ctx) => {
        const filled = await vars(ctx);
        checkTitles(s.id, Object.values(filled).join('\n'));
        return filled;
      };
    }
  }
}

export default parks;
