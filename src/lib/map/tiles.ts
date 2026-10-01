/**
 * Basemap tile URLs for the active country pack (isomorphic: client maps + the /tiles route).
 *
 * Layers are addressed by key: `base`, `base-dark`, `labels-<locale>`. When the pack proxies
 * (`mapTiles.proxy !== false`), maps request `/tiles/<key>/<z>/<x>/<y>` from our own origin and the
 * route handler resolves the key to the upstream template; otherwise maps use the upstream URL directly.
 */
import { mapTiles } from '@/countries/active.map';
import type { Locale } from '@/lib/i18n/config';
import { tileX, tileY } from './mercator';

export const TILE_SIZE = mapTiles.tileSize;
export const TILE_MIN_ZOOM = mapTiles.minZoom;
export const TILE_MAX_ZOOM = mapTiles.maxZoom;
export const TILES_PROXIED = mapTiles.proxy !== false;

/** The upstream URL template for a layer key, or null if the pack has no such layer. */
export function upstreamTemplate(key: string): string | null {
  if (key === 'base') return mapTiles.base.light;
  if (key === 'base-dark') return mapTiles.base.dark ?? null;
  if (key.startsWith('labels-') && mapTiles.labels) {
    return (mapTiles.labels as Record<string, string | undefined>)[key.slice('labels-'.length)] ?? null;
  }
  return null;
}

/** Layer keys to draw, bottom to top: the base (dark variant when the pack has one) + labels for the locale. */
export function layerKeys(locale: Locale, dark: boolean): string[] {
  const keys = [dark && mapTiles.base.dark ? 'base-dark' : 'base'];
  if (mapTiles.labels) keys.push(`labels-${mapTiles.labels[locale] ? locale : 'en'}`);
  return keys;
}

/** Fill `{z}/{x}/{y}` (and `{s}`) in an upstream template. */
export function fillTemplate(template: string, z: number, x: number, y: number) {
  const subs = mapTiles.subdomains;
  return template
    .replace('{s}', subs ? subs[(x + y) % subs.length] : '')
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
}

/** The URL a browser should load for one tile of a layer. */
export function tileSrc(key: string, z: number, x: number, y: number): string {
  if (TILES_PROXIED) return `/tiles/${key}/${z}/${x}/${y}`;
  return fillTemplate(upstreamTemplate(key) ?? mapTiles.base.light, z, x, y);
}

/** True when a tile is a real tile of this pack: integer coords, zoom in range, inside `bounds`. */
export function tileAllowed(z: number, x: number, y: number): boolean {
  if (![z, x, y].every(Number.isInteger)) return false;
  if (z < TILE_MIN_ZOOM || z > TILE_MAX_ZOOM) return false;
  const n = 2 ** z;
  if (x < 0 || y < 0 || x >= n || y >= n) return false;
  const b = mapTiles.bounds;
  if (!b) return true;
  const [west, south, east, north] = b;
  return x >= tileX(west, z) && x <= tileX(east, z) && y >= tileY(north, z) && y <= tileY(south, z);
}

/** One small in-coverage tile, for "can tiles load at all?" probes. */
export function probeTileSrc(): string {
  const z = TILE_MIN_ZOOM;
  const b = mapTiles.bounds;
  const [lng, lat] = b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [0, 0];
  return tileSrc('base', z, tileX(lng, z), tileY(lat, z));
}
