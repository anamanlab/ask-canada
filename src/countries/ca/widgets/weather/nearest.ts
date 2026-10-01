/**
 * The nearest Environment Canada forecast location to a point (pure, isomorphic). Kept apart from places.ts
 * so the "Use my location" button, which runs this on the device, loads the forecast locations and nothing else.
 */
import { CITIES, type CityRow } from './cities/index';
import type { Lang, Province } from './data';
import { distanceKm } from './geo';
import type { PlaceLite } from './types';

export const provinceOf = (id: string) => id.split('-')[0] as Province;

export const toLite = (row: CityRow, lang: Lang = 'en'): PlaceLite => ({
  id: row[0],
  name: (lang === 'fr' && row[2]) || row[1],
  province: provinceOf(row[0]),
  lat: row[3],
  lon: row[4],
});

/**
 * Sub-locations of a town: "Calgary (Olympic Park)", and a name that extends a forecast location within
 * 15 km of it ("Toronto Island" beside "Toronto", "Victoria Harbour" beside "Victoria").
 */
let SUB: Set<string> | null = null;
function subLocations() {
  if (!SUB) {
    SUB = new Set(
      CITIES.filter((r) => /\(/.test(r[1]) || CITIES.some((b) => b !== r && r[1].startsWith(`${b[1]} `) && distanceKm(r[3], r[4], b[3], b[4]) < 15)).map((r) => r[0]),
    );
  }
  return SUB;
}

/** In-province wins unless the nearest location anywhere is this much closer (a border town far from its own province's stations). */
const BORDER_KM = 60;

/**
 * The nearest forecast location to a point. A sub-location (park, island, harbour) counts as 3 km farther, so
 * the town itself wins when it is about as close. With `within` (the point's own province or territory, known
 * from a postal code or the geocoder), the nearest location inside it is chosen: a point in Ottawa is never
 * answered with Gatineau's forecast.
 */
export function nearestCity(lat: number, lon: number, lang: Lang = 'en', within?: Province[]): { place: PlaceLite; km: number } {
  const sub = subLocations();
  const scan = (rows: readonly CityRow[]) => {
    let best: CityRow | null = null;
    let bestD = Infinity;
    for (const row of rows) {
      const d = distanceKm(lat, lon, row[3], row[4]) + (sub.has(row[0]) ? 3 : 0);
      if (d < bestD) {
        bestD = d;
        best = row;
      }
    }
    return { row: best ?? CITIES[0], d: bestD };
  };
  const anywhere = scan(CITIES);
  const inside = within?.length ? scan(CITIES.filter((r) => within.includes(provinceOf(r[0])))) : anywhere;
  const best = inside.d - anywhere.d <= BORDER_KM ? inside.row : anywhere.row;
  return { place: toLite(best, lang), km: Math.round(distanceKm(lat, lon, best[3], best[4])) };
}
