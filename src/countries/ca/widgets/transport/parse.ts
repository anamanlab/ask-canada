/**
 * Plain-text parsers for the scripted scenarios (EN + FR): pull a vehicle, a drone weight, a boater's age and
 * horsepower, a kind of trip or an EV model out of the person's question. Pure and isomorphic.
 */
import type { DroneOp } from './drone';
import { searchEv } from './ev';
import { EV_SNAPSHOT } from './ev-snapshot';
import type { Pet, Trip } from './travel';

const MAKE_RE =
  /\b(acura|alfa romeo|audi|bmw|buick|cadillac|chevrolet|chevy|chrysler|dodge|fiat|ferrari|ford|genesis|gmc|honda|hyundai|infiniti|jaguar|jeep|kia|land rover|lexus|lincoln|maserati|mazda|mercedes(?:-benz)?|mini|mitsubishi|nissan|polestar|porsche|ram|subaru|suzuki|tesla|toyota|volkswagen|vw|volvo|harley(?:-davidson)?|kawasaki|yamaha|ducati)\b/i;
export const MAKES_PATTERN = MAKE_RE.source;

const STOP = /^(recalls?|rappels?|have|has|had|is|are|any|et|a|an|the|le|la|les|de|du|des|pour|for|on|in|en|with|avec|truck|car|suv|van|voiture|auto|camion|vus|model-year|année|year|\?|!|\.)$/i;
const PREFIX_MODELS = /^(model|grand|santa|range|town|new|land|e-?tron|id\.?|mach-?e|monte|el|la|crown|sierra)$/i;

/** "Is there a recall on my 2016 Honda Civic?" → { year: 2016, make: 'Honda', model: 'Civic' } */
export function vehicleOf(text: string): { make?: string; model?: string; year?: number } {
  const year = /\b(19[5-9]\d|20[0-3]\d)\b/.exec(text)?.[1];
  const m = MAKE_RE.exec(text);
  if (!m) return { year: year ? Number(year) : undefined };
  const after = text
    .slice(m.index + m[0].length)
    .replace(/[?!.,;:]+(\s|$)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const words: string[] = [];
  for (const w of after) {
    if (STOP.test(w) || /^(19|20)\d\d$/.test(w)) break;
    words.push(w);
    if (words.length === 1 && PREFIX_MODELS.test(w)) continue;
    break;
  }
  const model = words.join(' ').replace(/[’'`"]+$/g, '') || undefined;
  return { make: m[1], model, year: year ? Number(year) : undefined };
}

/** Drone weight in grams ("249 g", "a 900-gram drone", "2.5 kg", "DJI Mini" ≈ 249 g). */
export function droneWeightOf(text: string): number | undefined {
  const kg = /(\d+(?:[.,]\d+)?)\s*(kg|kilo\w*)\b/i.exec(text);
  if (kg) return Math.round(Number(kg[1].replace(',', '.')) * 1000);
  const g = /(\d{2,5})\s*(?:-\s*)?(g|grams?|grammes?)\b/i.exec(text);
  if (g) return Number(g[1]);
  if (/\b(dji )?mini\b|\bmicro-?drone|\bmicrodrone|\bunder 250|\bmoins de 250/i.test(text)) return 249;
  return undefined;
}

export function droneOpOf(text: string): DroneOp | undefined {
  if (/\b(bvlos|beyond (the )?visual|out of (my |your )?sight|hors de (ma |votre )?vue|au-del[àa] de la visibilit)/i.test(text)) return 'bvlos';
  if (/\b(event|festival|concert|wedding|mariage|[ée]v[ée]nement|spectacle)\b/i.test(text)) return 'event';
  if (/\b(airport|a[ée]roport|heliport|h[ée]liport|controlled airspace|espace a[ée]rien contr[ôo]l[ée])\b/i.test(text)) return 'controlled-airspace';
  if (/\b(near|over|close to|pr[èe]s des?|au-dessus des?)\b.*\b(people|crowds?|gens|personnes|foule|beach|plage|park|parc)\b/i.test(text)) return 'near-people';
  return undefined;
}

/** "my 13-year-old", "a 13 year old", "mon enfant de 13 ans" */
export function ageOf(text: string): number | undefined {
  const m = /\b(\d{1,2})[\s-]*(?:years?[\s-]*old|yo\b|ans?\b)/i.exec(text) ?? /\b(?:age|âge|aged|âgée?)\s*(?:de\s*)?(\d{1,2})\b/i.exec(text);
  const n = m ? Number(m[1]) : NaN;
  return n > 0 && n < 100 ? n : undefined;
}

export function horsepowerOf(text: string): number | undefined {
  const m = /\b(\d{1,4})\s*(?:-\s*)?(hp|horse\s?power|ch|chevaux|cv)\b/i.exec(text);
  return m ? Number(m[1]) : undefined;
}

export const pwcOf = (text: string) => /\b(sea-?doo|jet ?skis?|personal watercraft|pwc|waverunner|motomarines?|scooters? des mers)\b/i.test(text);

export function tripOf(text: string): Trip | undefined {
  if (/\b(back (in)?to canada|into canada|entering canada|return(ing)? (home|to canada)|coming (back|home)|from the (us|u\.s\.|states)|bring (it |him |her |them )?back|au canada depuis|revenir au canada|rentrer au canada|entrer au canada|de retour|des [ÉE]tats-Unis)\b/i.test(text)) return 'entering-canada';
  if (/\b(to the (us|u\.s\.|states)|across the border|cross(ing)? the border|to (mexico|europe|florida|the uk|france)|abroad|out of canada|international|leave canada|leaving canada|aux [ÉE]tats-Unis|vers les [ÉE]tats-Unis|traverser la fronti[èe]re|à l['’][ée]tranger|quitter le canada|sortir du canada|fronti[èe]re)\b/i.test(text)) return 'leaving-canada';
  if (/\b(fly|flying|flight|plane|airport|carry-?on|checked bag|avion|vol|a[ée]roport|bagage)\b/i.test(text)) return 'domestic-flight';
  if (/\b(drive|driving|road trip|car|voiture|route|en auto)\b/i.test(text)) return 'domestic-road';
  return undefined;
}

export function petOf(text: string): Pet | undefined {
  if (/\b(dogs?|puppy|puppies|chiens?|chiots?)\b/i.test(text)) return 'dog';
  if (/\b(cats?|kittens?|chats?|chatons?)\b/i.test(text)) return 'cat';
  if (/\b(bird|rabbit|ferret|reptile|snake|turtle|hamster|parrot|oiseau|lapin|furet|serpent|tortue|perroquet)s?\b/i.test(text)) return 'other';
  return undefined;
}

/** "Does the Kia EV3 qualify…" → "Kia EV3" */
export function evQueryOf(text: string): string | undefined {
  const m =
    /\b(?:does|do|is|can|will) (?:the |a |my |an )?(.+?) (?:qualify|eligible|count|get)/i.exec(text) ??
    /(?:^|\s)(?:la |le |une |un |ma |mon |l['’])(.+?) (?:est-elle|est-il|est|donne|a droit|admissible|qualifie)/i.exec(text) ??
    /\b(?:for|on|pour) (?:the |a |an |my |la |le |une |un |ma |mon )?(.+?)(?:\?|$)/i.exec(text);
  const q = m?.[1]
    ?.replace(/\b(ev|ve|evs|electric (car|vehicle)|incentive|rebate|federal|new|lease|leasing|\d+-month|véhicule électrique|voiture électrique|incitatif|rabais|location)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q || q.length < 2 || q.length > 40) return undefined;
  // Keep it only if it names a real vehicle: on Transport Canada's list, or a known make.
  return searchEv(EV_SNAPSHOT, q).length || MAKE_RE.test(q) || /\b(rivian|lucid|polestar|vinfast)\b/i.test(q) ? q : undefined;
}

export const leaseOf = (text: string) => {
  const m = /\b(\d{2})[\s-]*(?:months?|mois)\b/i.exec(text);
  return m && /\b(lease|leasing|location|louer|lou[ée])\b/i.test(text) ? Number(m[1]) : undefined;
};
