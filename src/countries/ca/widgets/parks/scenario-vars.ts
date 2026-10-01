/**
 * The computed parts of the parks scripted answers (scenarios/parks.ts): headings and sentences built from
 * the same lookups and calculators the cards use, so an answer never contradicts its card.
 */
import { HOTSPOT_RADIUS_KM, OTHER_FEES, TIERS, isRemote, parkById, type Lang } from './data';
import { buildConditions, buildFinder } from './live';
import { dangerKey } from './model';
import { passesOutput } from './outputs';
import { rankParks } from './rank';
import { BAN, CLOSED, FIRE, filtersIn, parkIn, party, placeIn } from './scenario-match';
import { DANGER, LAND_LABEL, PHONE, PROV_LABEL, banffFees, cite, dateLong, feesPage, fireRulesPage, frAt, joinList, mixText, money, moneyH, nextSeasonDatesDue, page, parkHome, plural } from './scenario-text';
import { SOURCE_TITLES } from './urls';

type Ctx = { text: string; lang: Lang };
type Vars = Record<string, string>;

/** Wildfire, fire ban, safety and closure questions about one park (live fire danger and bulletins). */
export async function wildfireVars({ text, lang }: Ctx): Promise<Vars> {
  const p = parkIn(text) ?? parkById('banff')!;
  const c = await buildConditions({ park: p.id, lang });
  const fr = lang === 'fr';
  const f = c.fire;
  const key = c.fireLive && f ? dangerKey(f.danger) : null;
  const rated = !!key && key !== 'none';
  const danger = rated ? DANGER[key][lang] : fr ? 'non coté' : 'not rated';
  const short = p.short[lang];
  // A yes/no question about a ban gets a yes/no heading; other wildfire questions lead with the danger rating.
  const closures = c.bulletins.filter((b) => b.kind === 'closure').length;
  const heading = CLOSED.test(text) && !FIRE.test(text)
    ? !c.bulletinsLive
      ? fr ? `Vérifiez les *fermetures* ${frAt(p)} avant de partir.` : `Check *${short}*’s bulletins for closures before you go.`
      : closures
        ? fr ? `Parcs Canada affiche des *fermetures* ${frAt(p)} en ce moment.` : `Parks Canada has *closures* posted for ${short} right now.`
        : c.bulletinsTotal <= c.bulletins.length
          ? fr ? `Aucune *fermeture* n’est affichée ${frAt(p)} en ce moment.` : `No *closures* are posted for ${short} right now.`
          : fr ? `Voici les *bulletins* en vigueur ${frAt(p)}.` : `Here are ${short}’s *current bulletins*.`
    : BAN.test(text)
    ? c.fireBan
      ? fr ? `Oui, une *interdiction de feux* est affichée ${frAt(p)}.` : `Yes, *${short}* has a fire ban posted.`
      : c.bulletinsLive
        ? fr ? `Aucune *interdiction de feux* n’est affichée ${frAt(p)} en ce moment.` : `No fire ban is posted for *${short}* right now.`
        : fr ? `Vérifiez s’il y a une *interdiction de feux* ${frAt(p)} avant de partir.` : `Check *${short}*’s bulletins for a fire ban before you go.`
    : fr ? `Le risque d’incendie ${frAt(p)} est *${danger}* aujourd’hui.` : `Fire danger in ${short} is *${danger}* today.`;
  const dangerFirst = BAN.test(text) && c.fireLive
    ? rated
      ? fr ? `Le risque d’incendie y est ${danger} aujourd’hui. ` : `Fire danger there is ${danger} today. `
      : fr ? 'Le parc n’a pas de cote de risque d’incendie aujourd’hui. ' : 'There’s no fire danger rating for the park today. '
    : '';
  const hot = f?.hotspots?.count ?? 0;
  const km = HOTSPOT_RADIUS_KM;
  const status = !c.fireLive
    ? fr
      ? 'Le Système canadien d’information sur les feux de végétation ne répond pas pour le moment : consultez la carte des feux avant de partir.'
      : 'The Canadian Wildland Fire Information System isn’t responding right now, so check the fire map before you go.'
    : hot
      ? fr
        ? `Les satellites ont détecté ${hot} point${hot > 1 ? 's' : ''} chaud${hot > 1 ? 's' : ''} à moins de ${km}\u00a0km du parc au cours des 24 dernières heures.`
        : `Satellites detected ${hot} fire hotspot${hot > 1 ? 's' : ''} within ${km}\u00a0km of the park in the last 24 hours.`
      : fr
        ? `Aucun point chaud n’a été détecté par satellite à moins de ${km}\u00a0km du parc au cours des 24 dernières heures.`
        : `No satellite fire hotspots were detected within ${km}\u00a0km of the park in the last 24 hours.`;
  const ban = c.fireBan
    ? fr
      ? `Parcs Canada affiche une **interdiction de feux** (« ${c.fireBan.title} »${c.fireBan.date ? `, publiée le ${dateLong(c.fireBan.date, lang)}` : ''}). Ouvrez le bulletin pour savoir où elle s’applique.`
      : `Parks Canada has posted a **fire ban** (“${c.fireBan.title}”${c.fireBan.date ? `, ${dateLong(c.fireBan.date, lang)}` : ''}). Open the bulletin to see where it applies.`
    : c.bulletinsLive
      ? fr
        ? `Aucune interdiction de feux n’est affichée dans les ${c.bulletinsTotal} bulletins du parc en ce moment.`
        : `No fire ban is posted among the park’s ${c.bulletinsTotal} current bulletins.`
      : fr
        ? 'Consultez les bulletins du parc pour les interdictions de feux et les fermetures.'
        : 'Check the park’s bulletins for fire bans and closures.';
  // Never point people to the fire boxes while a ban is posted.
  const fireRule = c.fireBan
    ? fr
      ? 'Tant que l’interdiction est en vigueur, n’allumez pas de feu de camp, et consultez le bulletin pour savoir ce qui reste permis.'
      : 'While the ban is in effect, don’t light a campfire, and check the bulletin for what’s still allowed.'
    : isRemote(p)
      ? fr
        ? 'Les parcs éloignés et nordiques ont leurs propres règles sur les feux et le combustible : consultez la page du parc avant d’en allumer un.'
        : 'Remote and northern parks set their own rules for fires and fuel, so check the park’s page before you light one.'
      : fr
        ? 'Peu importe où vous campez, les feux ne sont permis que dans les foyers métalliques désignés, et il ne faut jamais les laisser sans surveillance.'
        : 'Wherever you camp, fires are only allowed in the designated metal fire boxes, and you should never leave one unattended.';
  // The ban's own bulletin, under its title (its URL ends in an identifier, not in words).
  const fireRuleSource = c.fireBan ? { url: c.fireBan.url, title: c.fireBan.title } : fireRulesPage(p, lang);
  const closureFirst = CLOSED.test(text) && c.bulletinsLive
    ? fr
      ? 'Ouvrez les bulletins du parc pour savoir quels secteurs sont fermés et jusqu’à quand. '
      : 'Open the park’s bulletins to see which areas are closed and until when. '
    : '';
  return {
    heading,
    status: `${dangerFirst}${status} ${cite(1, page('fireDanger', lang))}`,
    ban: `${closureFirst}${ban} ${cite(2, { url: c.bulletinsUrl, title: SOURCE_TITLES.bulletins[lang] })}`,
    fireRule: `${fireRule} ${cite(3, fireRuleSource)}`,
  };
}

/** "How do I book a campsite in Jasper?" */
export function campingVars({ text, lang }: Ctx): Vars {
  const p = parkIn(text);
  const fr = lang === 'fr';
  return {
    heading: nextSeasonDatesDue()
      ? fr ? 'Vérifiez les dates de lancement de la *saison 2027* à Parcs Canada.' : 'Check Parks Canada’s launch dates for the *2027 season*.'
      : fr ? 'Les réservations pour la *saison 2027* ne sont pas encore ouvertes.' : 'Reservations for the *2027 season* haven’t opened yet.',
    forPark: p ? (fr ? ` à ${p.short.fr}` : ` for ${p.short.en}`) : '',
    fees: cite(3, feesPage(p ?? parkById('banff'), lang)),
  };
}

/** Discovery Pass or daily admission: the verdict comes from the same calculator the card runs. */
export function passVars({ text, lang }: Ctx): Vars {
  const p = parkIn(text);
  const pty = party(text);
  const feesSource = feesPage(p ?? parkById('banff'), lang);
  const fees = cite(2, feesSource);
  // The busiest parks' rate is Banff's: the same source again when the question is about Banff (or no park).
  const banff = cite(feesSource.url === banffFees(lang).url ? 2 : 3, banffFees(lang));
  // "My family" counts as a group even without numbers: the calculator starts from two adults and two youth.
  const family = /\b(family|famille)\b/i.test(text);
  const given = family || [pty.days, pty.adults, pty.youth, pty.seniors].some((n) => n != null);
  if (!given) {
    return {
      heading: lang === 'fr' ? 'La carte Découverte devient rentable après environ *7 jours* à Banff ou à Jasper.' : 'A Discovery Pass pays off after about *7 park days* in Banff or Jasper.',
      detail: '',
      fees,
      banff,
    };
  }
  const o = passesOutput({ ...pty, ...(p ? { park: p.id } : {}), family, lang });
  const c = o.calc;
  const { adults, seniors, youth } = o.party;
  const people = adults + seniors + youth;
  const days = o.days;
  const where = p ? p.short[lang] : lang === 'fr' ? 'Banff ou Jasper' : 'Banff or Jasper';
  const heading =
    c.recommend === 'free'
      ? lang === 'fr' ? 'Votre groupe entre *gratuitement*.' : 'Your group gets in *free*.'
      : c.savings === 0
        ? lang === 'fr' ? 'C’est égal : la carte Découverte coûte *autant* que les droits quotidiens.' : 'It’s a tie: a Discovery Pass costs *the same* as paying daily.'
        : c.recommend === 'pass'
          ? lang === 'fr'
            ? `Oui : la carte Découverte ${people > 1 ? (family ? 'fait économiser à votre famille' : 'fait économiser à votre groupe') : 'vous fait économiser'} *${moneyH(c.savings, 'fr')}*.`
            : `Yes, a Discovery Pass saves ${people > 1 ? (family ? 'your family' : 'your group') : 'you'} *${moneyH(c.savings, 'en')}*.`
          : lang === 'fr'
            ? `Pour ${days}\u00a0${days > 1 ? 'jours' : 'jour'}, *payer à l’entrée* coûte moins cher.`
            : `For ${days}\u00a0${days > 1 ? 'days' : 'day'}, *paying at the gate* is cheaper.`;
  const who = joinList(
    lang === 'fr'
      ? [adults ? plural(adults, 'adulte', 'adultes') : '', seniors ? plural(seniors, 'aîné', 'aînés') : '', youth ? plural(youth, 'jeune', 'jeunes') : ''].filter(Boolean)
      : [adults ? plural(adults, 'adult', 'adults') : '', seniors ? plural(seniors, 'senior', 'seniors') : '', youth ? plural(youth, 'youth', 'youth') : ''].filter(Boolean),
    lang,
  );
  const detail =
    c.recommend === 'free'
      ? lang === 'fr'
        ? `Pour ${who}, il n’y a rien à payer : l’entrée est gratuite pour les jeunes de 17 ans et moins.\n\n`
        : `For ${who}, there’s nothing to pay: admission is free for youth 17 and under.\n\n`
      : lang === 'fr'
        ? `Pour ${who} à ${where} pendant ${days}\u00a0${days > 1 ? 'jours' : 'jour'}, les droits quotidiens coûteraient ${money(c.dailyTotal, 'fr')} (${money(c.dayCost, 'fr')} par jour), alors que ${mixText(c.passMix, 'fr')} ${c.passMix.family + c.passMix.adults + c.passMix.seniors > 1 ? 'coûtent' : 'coûte'} ${money(c.passCost, 'fr')}.${c.overFamilyLimit ? ` Avec plus de 7 personnes, il faut ${c.vehicles} véhicules : nous avons calculé chaque véhicule séparément.` : ''} ${fees}\n\n`
        : `For ${who} visiting ${where} for ${days}\u00a0${days > 1 ? 'days' : 'day'}, paying daily would cost ${money(c.dailyTotal, 'en')} (${money(c.dayCost, 'en')} a day), while ${mixText(c.passMix, 'en')} ${c.passMix.family + c.passMix.adults + c.passMix.seniors > 1 ? 'cost' : 'costs'} ${money(c.passCost, 'en')}.${c.overFamilyLimit ? ` With more than 7 people you’ll need ${c.vehicles} vehicles, so we priced each one separately.` : ''} ${fees}\n\n`;
  return { heading, detail, fees, banff };
}

/** "National parks near Calgary": the same lookup as the card, so the heading never claims a ranking it couldn't make. */
export async function nearVars({ text, lang }: Ctx): Promise<Vars> {
  const place = placeIn(text);
  const f = await buildFinder({ near: place, lang });
  const top = f.results[0];
  if (f.origin && top) {
    const km = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA').format(Math.round(top.km ?? 0));
    return {
      heading:
        lang === 'fr'
          ? `Le parc national le plus près de ${f.origin.label} est *${top.short}*, à environ ${km}\u00a0km.`
          : `The closest national park to ${f.origin.label} is *${top.short}*, about ${km}\u00a0km away.`,
      body:
        lang === 'fr'
          ? 'Les distances sont à vol d’oiseau : vérifiez l’itinéraire routier avant de partir. '
          : 'Distances are straight-line, so check driving routes before you go. ',
    };
  }
  if (f.filters.province) {
    return {
      heading: lang === 'fr' ? `Voici les parcs nationaux en *${place}*.` : `Here are the national parks in *${place}*.`,
      body: '',
    };
  }
  return {
    heading:
      lang === 'fr'
        ? `Nous n’avons pas pu situer *${place}* : voici tous les parcs nationaux.`
        : `We couldn’t place *${place}*, so here are all the national parks.`,
    body:
      lang === 'fr'
        ? 'Essayez une ville ou un village à proximité pour les classer par distance. '
        : 'Try a nearby city or town to rank them by distance. ',
  };
}

/** "What should I know before visiting Jasper?" */
export async function aboutVars({ text, lang }: Ctx): Promise<Vars> {
  const p = parkIn(text) ?? parkById('banff')!;
  // Same (cached) lookup as the park card, so the fire sentence never contradicts a posted ban.
  const { fireBan } = await buildConditions({ park: p.id, lang });
  const a = p.admission;
  // Torngat Mountains, Mealy Mountains and Rouge have no fees page: cite the park's own page instead.
  const ownFees = feesPage(p, lang).url !== page('feesByPlace', lang).url;
  const fees =
    a.kind === 'daily'
      ? lang === 'fr'
        ? `L’entrée quotidienne coûte ${money(TIERS[a.tier].adult, 'fr')} par adulte, ${money(TIERS[a.tier].senior, 'fr')} par aîné ou ${money(TIERS[a.tier].family, 'fr')} par famille ou groupe; c’est gratuit pour les jeunes de 17 ans et moins.`
        : `Daily admission is ${money(TIERS[a.tier].adult, 'en')} per adult, ${money(TIERS[a.tier].senior, 'en')} per senior or ${money(TIERS[a.tier].family, 'en')} per family or group, and free for youth 17 and under.`
      : a.kind === 'free'
        ? lang === 'fr'
          ? 'Ce parc n’exige pas de droit d’entrée, mais d’autres frais peuvent s’appliquer.'
          : 'There’s no entry fee here, though other fees may apply.'
        : a.kind === 'northern'
          ? a.dayTrip
            ? lang === 'fr'
              ? `C’est un parc du Nord : le permis d’arrière-pays coûte ${money(OTHER_FEES.northernDay, 'fr')} par personne pour une excursion d’un jour, ou ${money(OTHER_FEES.northernNight, 'fr')} par personne par nuit.`
              : `It’s a northern park: a backcountry permit costs ${money(OTHER_FEES.northernDay, 'en')} per person for a day trip, or ${money(OTHER_FEES.northernNight, 'en')} per person per night.`
            : lang === 'fr'
              ? `C’est un parc du Nord : un permis d’excursion et de camping dans l’arrière-pays coûte ${money(OTHER_FEES.northernNight, 'fr')} par personne par ${a.perDay ? 'jour' : 'nuit'}.`
              : `It’s a northern park: a backcountry excursion and camping permit costs ${money(OTHER_FEES.northernNight, 'en')} per person per ${a.perDay ? 'day' : 'night'}.`
          : ownFees
            ? lang === 'fr'
              ? 'Les frais varient : consultez la page des tarifs du parc.'
              : 'Fees vary, so check the park’s fees page.'
            : lang === 'fr'
              ? 'Ce parc n’a pas de page de tarifs : consultez sa page pour les frais et les permis.'
              : 'This park has no fees page of its own, so check its page for fees and permits.';
  const fires = fireBan
    ? lang === 'fr'
      ? 'Une interdiction de feux est affichée en ce moment : n’allumez pas de feu de camp tant qu’elle est en vigueur.'
      : 'A fire ban is posted right now, so don’t light a campfire while it’s in effect.'
    : isRemote(p)
    ? lang === 'fr'
      ? 'Ce parc a ses propres règles sur les feux et le combustible : consultez sa page avant de partir.'
      : 'This park sets its own rules for fires and fuel, so check its page before you go.'
    : lang === 'fr'
      ? 'Les feux ne sont permis que dans les foyers désignés.'
      : 'Fires are only allowed in designated fire boxes.';
  return {
    name: p.name[lang],
    fees: `${fees} ${cite(1, ownFees ? feesPage(p, lang) : parkHome(p, lang))}`,
    fires: `${fires} ${cite(4, fireBan ? { url: fireBan.url, title: fireBan.title } : fireRulesPage(p, lang))}`,
  };
}

/** "Mountain parks in Alberta with camping": the same filters and ranking as the card, so the count matches the list. */
export function filterVars({ text, lang }: Ctx): Vars {
  const f = filtersIn(text);
  const n = rankParks(f, null, lang).length;
  const fr = lang === 'fr';
  const land = f.landscape ? ` ${LAND_LABEL[f.landscape][lang]}` : '';
  const prov = f.province ? (fr ? ` ${PROV_LABEL[f.province].fr}` : ` in ${PROV_LABEL[f.province].en}`) : '';
  const camp = f.camping ? (fr ? ' avec camping sur réservation' : ' with reservable camping') : '';
  const heading = fr
    ? n
      ? `Voici *${n}\u00a0${n > 1 ? 'parcs nationaux' : 'parc national'}*${land}${prov}${camp}.`
      : `Nous n’avons trouvé *aucun parc national*${land}${prov}${camp}.`
    : n
      ? `Here ${n > 1 ? 'are' : 'is'} *${n}\u00a0national park${n > 1 ? 's' : ''}*${land}${prov}${camp}.`
      : `We found *no national park*${land}${prov}${camp}.`;
  const campLine = f.camping
    ? fr
      ? `Les emplacements se réservent auprès du Service de réservation de Parcs Canada, en ligne ou au ${PHONE}. ${cite(3, page('reserve', 'fr'))}\n\n`
      : `Campsites are booked through the Parks Canada Reservation Service, online or at ${PHONE}. ${cite(3, page('reserve', 'en'))}\n\n`
    : '';
  return { heading, camp: campLine };
}
