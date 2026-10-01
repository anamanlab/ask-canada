/**
 * Matching for the parks scripted scenarios (scenarios/parks.ts): which park, province, landscape, party
 * and place a question names. Pure text work, no network.
 */
import { PARKS, PROVINCE_NAMES, type Landscape, type Park, type Province } from './data';
import { fold, matchPark, matchProvince } from './model';

/** Everyday words and places that shouldn't, on their own, turn a question into a parks question. */
const AMBIGUOUS = new Set(['north', 'rouge', 'sable', 'glacier', 'glaciers', 'prairies', 'grasslands', 'field', 'toronto', 'pei', 'resolute', 'marathon', 'grey owl', 'dark sky', 'dark sky preserve', 'polar bears', 'wild horses', 'monarch butterflies', 'lake superior', 'st lawrence', 'great slave lake', 'bay of fundy', 'scarborough', 'markham', 'pickering', 'inuvik', 'churchill', 'alma', 'sable', 'monoliths', 'banks island', 'field']);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Any park name or well-known place inside a park, as typed (accents optional). */
const PARK_WORDS = [
  ...new Set(
    PARKS.flatMap((p) => [p.short.en, p.short.fr, ...(p.aka ?? [])])
      .flatMap((w) => [w.toLowerCase().replace(/^(l'|la |le )/, ''), fold(w)])
      .filter((w) => w.length >= 4 && !AMBIGUOUS.has(fold(w))),
  ),
]
  .sort((a, b) => b.length - a.length)
  .map((w) => esc(w).replace(/ /g, '[\\s-]+'));
// "Glacier", "Grasslands" and "Rouge" are common words: only count them next to "park"/"parc".
const PARK_RE = `(?:\\b(?:${PARK_WORDS.join('|')})\\b|\\b(?:glacier|grasslands|rouge|sable island)\\s+(?:national\\s+)?park|parc\\s+(?:national\\s+)?(?:des\\s+)?(?:glaciers|prairies)|parc\\s+urbain)`;
export const withPark = (re: RegExp) => new RegExp(`(?=[\\s\\S]*${PARK_RE})(?=[\\s\\S]*(?:${re.source}))`, 'i');

/** Fold accents so "Gros-Morne", "la Mauricie" and "Kejimkujik" match the same way. */
export const parkIn = (text: string): Park | null => matchPark(fold(text).replace(/\b(glacier|grasslands|rouge|sable)\b(?! island| national| park)/g, ''));

const num = (text: string, re: RegExp) => {
  const m = text.match(re);
  if (!m) return undefined;
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
  return Number(m[1]) || words[m[1].toLowerCase()];
};
const N = '(\\d+|one|two|three|four|five|six|un|une|deux|trois|quatre|cinq)';
export function party(text: string) {
  const family = num(text, new RegExp(`\\bfamily of ${N}\\b|\\bfamille de ${N}\\b`, 'i'));
  const adults = num(text, new RegExp(`\\b${N} (?:adults?|adultes?|grown-?ups)(?![a-zà-ÿ])`, 'i'));
  const youth = num(text, new RegExp(`\\b${N} (?:kids?|children|youth|teens?|enfants?|jeunes|ados?)(?![a-zà-ÿ])`, 'i'));
  const seniors = num(text, new RegExp(`\\b${N} (?:seniors?|a[iî]n[ée]s?|retirees?)(?![a-zà-ÿ])`, 'i'));
  const days = num(text, new RegExp(`\\b${N} (?:days?|jours?)(?![a-zà-ÿ])`, 'i'));
  const out: { adults?: number; youth?: number; seniors?: number; days?: number } = { days };
  if (family && !adults && !youth) Object.assign(out, { adults: 2, youth: Math.max(0, family - 2) });
  else Object.assign(out, { adults: adults ?? (seniors ? 0 : undefined), youth, seniors });
  if (/\b(just me|myself|alone|seul|seule)\b/i.test(text)) out.adults = out.adults ?? 1;
  return out;
}


/** "Is there a fire ban…?", "Can I have a campfire?": a yes/no question about bans, answered first. */
export const BAN = /\b(fire ?bans?|campfires?|camp ?fires?|fire restrictions?|interdictions? (de |des |d.)?(faire (des |du )?)?feux?|feux? de camp)\b/i;
export const FIRE = /\b(wild ?fires?|forest fires?|fire (ban|danger|risk|restrictions?)|fires? (near|in|around)|smoke|burning|campfires?|on fire|feux? de (for[eê]t|camp|v[ée]g[ée]tation)|interdiction (de |des )?feux?|risque d.incendie|incendies?)\b/i;
export const CAMP = /\b(camp ?sites?|campgrounds?|camping|book(ing)? a (site|spot)|reserv(e|ation|ations)|otentik|emplacements?|terrains? de camping|r[ée]serv(er|ation|ations))\b/i;
export const PASS = /\b(discovery pass|parks? pass|annual pass|park (admission|entry|entrance|fees?)|admission|entrance fee|entry fee|how much (is|does|to)|cost|carte d.entr[ée]e|d[ée]couverte|laissez-passer|droits? d.entr[ée]e|combien|co[uû]te?|tarifs?|prix)\b/i;
export const NP = /\b(national parks?|parks canada|parcs? nationaux|parc national|parcs canada)\b/i;
/** "Is it safe to go to Kootenay?": answered with the live fire danger and bulletins, not a travel advisory. */
export const SAFE = /\b(safe|unsafe|dangerous|danger|s[ée]curitaire|s[ûu]r|dangereux|dangereuse)\b/i;
/** "Closures in Pacific Rim", "Is the road closed in Banff?" */
export const CLOSED = /\b(closures?|closed|close[ds]? down|fermetures?|ferm[ée]s?)\b/i;

/* ---------- "which parks in Nova Scotia have camping?", "mountain parks", "parcs nationaux en montagne" */

const ACCENTS: Record<string, string> = { a: '[aàâ]', c: '[cç]', e: '[eéèêë]', i: '[iîï]', o: '[oô]', u: '[uùûü]' };
/** A province or territory named in the text, accents and hyphens optional ("Nouvelle-Écosse", "nouvelle ecosse"). */
export const PROV_RE = `(?<![a-zà-ÿ])(?:${[...new Set(Object.values(PROVINCE_NAMES).flat().map(fold))]
  .sort((a, b) => b.length - a.length)
  .map((n) => n.split(' ').map((w) => w.replace(/[aceiou]/g, (ch) => ACCENTS[ch])).join('[\\s.’\'-]*'))
  .join('|')})(?![a-zà-ÿ])`;
const LAND: [Landscape, RegExp][] = [
  ['mountains', /\b(mountains?|mountainous|rockies|rocky mountains|alpine|montagnes?|montagneux|rocheuses)\b/i],
  ['coast', /\b(coast(al)?|oceans?|beach(es)?|seaside|sea|islands?|c[ôo]tes?|c[ôo]ti(er|ers|[èe]re|[èe]res)|oc[ée]ans?|plages?|mer|littoral)\b/i],
  ['lakes', /\b(lakes?|lakeside|forests?|lacs?|for[êe]ts?)\b/i],
  ['prairie', /\b(prairies?|grasslands?)\b/i],
  ['north', /\b(arctic|subarctic|far north|the north|northern|arctique|subarctique|grand nord|du nord)\b/i],
];
export const LAND_RE = LAND.map(([, re]) => re.source).join('|');
export const PARKS_WORD = /\b(parks?|parcs?)\b/i;
export const NO_PARK = `^(?![\\s\\S]*${PARK_RE})`;
/** Agencies for provincial parks: not ours to answer. */
export const PROVINCIAL = /\b(provincial|provinciaux|ontario parks|bc parks|alberta parks|s[ée]paq|parcs? qu[ée]bec|saskatchewan parks|manitoba parks)\b/i;
/** Filters asked for in the text; the landscape ignores province names ("Prince Edward Island", "Nord-Ouest"). */
export function filtersIn(text: string): { province?: Province; landscape?: Landscape; camping?: boolean } {
  const rest = text.replace(new RegExp(PROV_RE, 'gi'), ' ').replace(/nord-ouest/gi, ' ');
  const landscape = LAND.find(([, re]) => re.test(rest))?.[0];
  return { province: matchProvince(text), landscape, ...(CAMP.test(text) ? { camping: true } : {}) };
}

/** The place after "near …" / "près de …", tidied ("Calgary", "Rimouski"). */
export function placeIn(text: string) {
  const m = text.match(/\b(?:near|close to|around|by|from|pr[eè]s de|autour de|proche de|pr[eè]s d[’'])\s*(?:me\b)?\s*([^?.!,]{2,40})/i);
  const place = (m?.[1] ?? '').replace(/\b(please|s'il vous pla[iî]t|svp)\b/gi, '').trim();
  return place.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Ottawa';
}
