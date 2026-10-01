/**
 * Ranking for the `parks` tools: parks as output rows, filtered and ordered (nearest first from a starting
 * point, otherwise west to east). Runs on the server (outputs.ts) and in the lab fixtures; the renderers only
 * read the ranked rows.
 */
import { PARKS, type Lang, type Park, type Province } from './data';
import { parkUrls } from './urls';
import { distanceKm, type Filters, type Origin, type ParkLite } from './model';

export const lite = (p: Park, lang: Lang, km?: number): ParkLite => ({
  id: p.id,
  name: p.name[lang],
  short: p.short[lang],
  prov: p.prov,
  lat: p.lat,
  lng: p.lng,
  des: p.des,
  land: p.land,
  admission: p.admission,
  camping: !!p.campgrounds?.length,
  otentik: !!p.otentik,
  ...(km != null ? { km: Math.round(km) } : {}),
  url: parkUrls(p, lang).home,
});

/** Provinces west to east, then the territories (the usual Canadian order). */
export const PROVINCE_ORDER: Province[] = ['bc', 'ab', 'sk', 'mb', 'on', 'qc', 'nb', 'ns', 'pe', 'nl', 'yt', 'nt', 'nu'];

/** Filter and rank parks: nearest first when there is an origin, otherwise by province, west to east. */
export function rankParks(filters: Filters, origin: Origin | null, lang: Lang): ParkLite[] {
  const list = PARKS.filter(
    (p) =>
      (!filters.province || p.prov === filters.province) &&
      (!filters.landscape || p.land.includes(filters.landscape)) &&
      (!filters.camping || !!p.campgrounds?.length),
  ).map((p) => lite(p, lang, origin ? distanceKm(origin, p) : undefined));
  return origin
    ? list.sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
    : list.sort((a, b) => PROVINCE_ORDER.indexOf(a.prov) - PROVINCE_ORDER.indexOf(b.prov) || a.lng - b.lng);
}

/** Parks with reservable campgrounds, nearest first when there is an origin. */
export const campingParks = (lang: Lang, origin: Origin | null) => rankParks({ camping: true }, origin, lang);
