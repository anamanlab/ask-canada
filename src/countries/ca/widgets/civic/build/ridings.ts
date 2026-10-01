/** Riding helpers for civicFindMp (pure): seat matching, city names and the riding silhouette. */
import { project } from '@/lib/map/mercator';
import type { Lang } from '../data';
import type { RidingShape } from '../types';
import { fold, tokens } from './text';

/**
 * Canada Post / Represent give city names in capitals without accents ("MONTREAL"). French answers show the
 * official French spelling for the places we know; anything else is shown as given (title case).
 */
const FR_CITIES: Record<string, string> = Object.fromEntries(
  [
    'Montréal', 'Montréal-Nord', 'Montréal-Est', 'Montréal-Ouest', 'Québec', 'Trois-Rivières', 'Lévis', 'Saint-Jérôme',
    'Sainte-Thérèse', 'Rivière-du-Loup', 'Sept-Îles', 'Val-d’Or', 'Châteauguay', 'Gaspé', 'Lac-Mégantic', 'L’Île-Perrot',
    'Saint-Léonard', 'Côte-Saint-Luc', 'Saint-Rémi', 'Sainte-Adèle', 'Saint-Félicien', 'Bécancour', 'Percé', 'Chéticamp',
    'L’Assomption', 'Îles-de-la-Madeleine', 'Sainte-Anne-de-Bellevue', 'Pointe-Claire', 'Saint-Hyacinthe', 'Rouyn-Noranda',
  ].map((c) => [fold(c), c]),
);

export function cityName(city: string | undefined, lang: Lang): string | undefined {
  if (!city) return undefined;
  const title = city.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
  return lang === 'fr' ? (FR_CITIES[fold(city)] ?? title) : title;
}

/* ───────────────────────── Seat matching ───────────────────────── */

export type Seat = { personId?: string; name: string; province: string; first?: string; last?: string; honorific?: string; caucus?: string };

/**
 * Which House of Commons seat is this riding? The riding list (Represent) can lag renamed ridings and
 * by-elections, so match in order of confidence: the MP's House of Commons id, the exact riding name,
 * then the closest name in the same province (e.g. a riding renamed in 2026).
 */
export function matchSeat(seats: Seat[], riding: { name: string; provinceName: string; personId?: string }): Seat | undefined {
  if (riding.personId) {
    const byId = seats.find((s) => s.personId === riding.personId);
    if (byId) return byId;
  }
  const f = fold(riding.name);
  const byName = seats.find((s) => fold(s.name) === f);
  if (byName) return byName;
  const want = tokens(riding.name);
  let best: Seat | undefined;
  let bestScore = 0;
  for (const s of seats) {
    if (fold(s.province) !== fold(riding.provinceName)) continue;
    const have = tokens(s.name);
    const inter = [...want].filter((t) => have.has(t)).length;
    const score = inter / (want.size + have.size - inter);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 0.5 ? best : undefined;
}

/* ───────────────────────── Riding silhouettes ───────────────────────── */

/** GeoJSON position: longitude, latitude (and sometimes elevation). */
type Position = [number, number, ...number[]];
type RidingGeometry = { type: 'Polygon'; coordinates: Position[][] } | { type: 'MultiPolygon'; coordinates: Position[][][] };

type Pt = [number, number];

/** Ramer–Douglas–Peucker: drops points closer than `tolerance` to the line between their kept neighbours. */
function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length <= 3) return points;
  const sq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  for (let span = stack.pop(); span; span = stack.pop()) {
    const [a, b] = span;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (idx > -1 && max > sq) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Projects a riding's GeoJSON (Multi)Polygon (Web Mercator, like every other map here) into an SVG path that
 * fits a box `size` wide/tall, simplified to a few hundred points. `pin` (lng, lat) marks the postal code.
 * `bounds` is the same box in degrees (west, south, east, north), for laying the outline over the basemap.
 * Rings smaller than a pixel are dropped.
 */
export function projectShape(geometry: RidingGeometry, pin?: [number, number], size = 240): RidingShape | undefined {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const r of polygons.flat())
    for (const [lng, lat] of r) {
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
  const world = ([lng, lat]: readonly [number, number, ...number[]]): Pt => {
    const p = project(lat, lng, 1);
    return [p.x, p.y];
  };
  const rings = polygons.flat().filter((r) => r.length > 2).map((r) => r.map(world));
  if (!rings.length) return undefined;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const r of rings)
    for (const [x, y] of r) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  const spanX = maxX - minX || 1e-12;
  const spanY = maxY - minY || 1e-12;
  const scale = size / Math.max(spanX, spanY);
  const fit = ([x, y]: Pt): Pt => [(x - minX) * scale, (y - minY) * scale];
  const parts: string[] = [];
  for (const r of rings) {
    const pts = simplify(r.map(fit), 0.6);
    const xs = pts.map(([x]) => x);
    const ys = pts.map(([, y]) => y);
    const tiny = Math.max(...xs) - Math.min(...xs) < 1.2 && Math.max(...ys) - Math.min(...ys) < 1.2;
    if (pts.length < 3 || tiny) continue;
    parts.push(`M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`);
  }
  if (!parts.length) return undefined;
  const at = pin ? world(pin) : undefined;
  const inside = at && at[0] >= minX && at[0] <= maxX && at[1] >= minY && at[1] <= maxY;
  const [px, py] = inside ? fit(at) : [];
  return {
    d: parts.join(''),
    w: Math.max(1, round1(spanX * scale)),
    h: Math.max(1, round1(spanY * scale)),
    ...(px != null && py != null ? { pin: [round1(px), round1(py)] as [number, number] } : {}),
    bounds: [round5(west), round5(south), round5(east), round5(north)],
  };
}
