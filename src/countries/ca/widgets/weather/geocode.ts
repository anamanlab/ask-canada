/**
 * Choosing a point from NRCan Geolocator hits (pure, isomorphic, unit-tested in geocode.test.mjs). live.ts
 * fetches the hits; these functions decide which one a postal-code area or a place name means, and when a
 * name is ambiguous (several towns of that name in different provinces).
 */
import type { Lang, Province } from './data';
import { fold } from './geo';
import { nearestCity } from './nearest';
import { FSA_PROVINCE, provinceFromName } from './places';
import type { PlaceOption } from './types';

export type GeoHit = { key: string; name: string; category: string; province?: string | null; lat: number; lon: number };

export type GeoPick =
  | { kind: 'point'; lat: number; lon: number; provinces?: Province[] }
  | { kind: 'many'; points: { name: string; lat: number; lon: number; province: Province }[] }
  | { kind: 'none' };

const POPULATED = /city|town|village|municipal|hamlet|community|settlement|cit[ée]|ville|district|urban|agglom|unorganized|indian|reserve|first nation|borough|county|region/i;

/**
 * A postal-code area (FSA). The `locate` hit is the interpolated centre of the area's addresses (downtown
 * Calgary for T2P); the `fsa` hit is the centroid of the area's polygon, which lands well outside town for
 * some areas (28 km east for T2P), so it is only the fallback. The first letter gives the province, so the
 * forecast city is then chosen inside it (K1A is Ottawa, not Gatineau across the river).
 */
export function pickFsa(hits: GeoHit[], fsa: string): GeoPick {
  const named = (key: string) => hits.find((d) => d.key === key && d.name.toUpperCase() === fsa);
  const hit = named('locate') ?? named('fsa');
  if (!hit) return { kind: 'none' };
  const fromHit = provinceFromName(hit.province);
  return { kind: 'point', lat: hit.lat, lon: hit.lon, provinces: FSA_PROVINCE[fsa[0]] ?? (fromHit ? [fromHit] : undefined) };
}

/**
 * A place name (already folded), with an optional province hint ("Springfield, NS"). Exact-name populated
 * places in two or more provinces, with no hint, are ambiguous: one point per province, in the feed's order.
 */
export function pickNamed(hits: GeoHit[], name: string, hint?: Province): GeoPick {
  const named = hits.flatMap((d) => {
    const province = provinceFromName(d.province);
    return d.key === 'geonames' && province && (!hint || province === hint) ? [{ ...d, province }] : [];
  });
  const exact = named.filter((d) => fold(d.name) === name);
  const towns = exact.filter((d) => POPULATED.test(d.category));
  const byProvince = towns.filter((d, i) => towns.findIndex((o) => o.province === d.province) === i);
  if (byProvince.length > 1) return { kind: 'many', points: byProvince.slice(0, 6).map(({ name: n, lat, lon, province }) => ({ name: n, lat, lon, province })) };
  const hit = towns[0] ?? exact[0] ?? named.find((d) => fold(d.name).startsWith(name) && POPULATED.test(d.category));
  return hit ? { kind: 'point', lat: hit.lat, lon: hit.lon, provinces: [hit.province] } : { kind: 'none' };
}

/** The forecast location for a picked point: the nearest one in the point's own province when it is known. */
export const forecastCityFor = (pick: Extract<GeoPick, { kind: 'point' }>, lang: Lang) => nearestCity(pick.lat, pick.lon, lang, pick.provinces);

/**
 * The choices for an ambiguous name: the name as typed in each province ("Springfield, Nova Scotia"), with
 * the forecast location that would answer for it ("near Greenwood"). Choosing one asks "Springfield, NS".
 */
export function optionsFor(pick: Extract<GeoPick, { kind: 'many' }>, lang: Lang): PlaceOption[] {
  return pick.points.map((p) => ({ id: `geo-${p.province}`, name: p.name, province: p.province, lat: p.lat, lon: p.lon, near: nearestCity(p.lat, p.lon, lang, [p.province]).place.name }));
}
