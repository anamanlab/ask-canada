/**
 * Framing for the riding map (pure): fits the riding's outline inside a box, works out which basemap tiles sit
 * behind it, and sizes a scale bar. The outline is already projected in Web Mercator (see build/ridings.ts), so
 * one uniform scale lines it up with the tiles.
 */
import { project } from '@/lib/map/mercator';
import { TILE_MAX_ZOOM, TILE_MIN_ZOOM, TILE_SIZE, tileAllowed, tileSrc } from '@/lib/map/tiles';
import type { RidingShape } from './types';

/** Room kept clear around the outline: the "you" tag above the pin, and the scale bar and map credit below. */
const INSET = { top: 20, side: 16, bottom: 30 };
const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

export type MapTile = { key: string; src: string; left: number; top: number; width: number; height: number; layer: number };

export type RidingFrame = {
  /** Where the outline's box starts on screen, and the pixels per outline unit. */
  x: number;
  y: number;
  k: number;
  tiles: MapTile[];
  /** Ground distance of one screen pixel at the riding's latitude (only with `shape.bounds`). */
  metresPerPx?: number;
};

export function frameRiding(shape: RidingShape, w: number, h: number, layers: string[]): RidingFrame {
  const availW = Math.max(1, w - INSET.side * 2);
  const availH = Math.max(1, h - INSET.top - INSET.bottom);
  const k = Math.min(availW / shape.w, availH / shape.h);
  const x = (w - shape.w * k) / 2;
  const y = INSET.top + (availH - shape.h * k) / 2;
  if (!shape.bounds) return { x, y, k, tiles: [] };

  const [west, south, east, north] = shape.bounds;
  // The outline's north-west corner in zoom-0 pixels, and how many screen pixels one of those pixels covers.
  const nw = project(north, west, TILE_SIZE);
  const se = project(south, east, TILE_SIZE);
  const perWorldPx = (shape.w * k) / Math.max(1e-12, se.x - nw.x);
  // The nearest zoom the tile service has; tiles are then scaled a little (×0.71 to ×1.41) to fit exactly.
  const z = Math.max(TILE_MIN_ZOOM, Math.min(TILE_MAX_ZOOM, Math.round(Math.log2(perWorldPx))));
  const s = perWorldPx / 2 ** z;
  const originX = nw.x * 2 ** z - x / s;
  const originY = nw.y * 2 ** z - y / s;
  const n = 2 ** z;
  const tiles: MapTile[] = [];
  layers.forEach((layer, li) => {
    for (let tx = Math.floor(originX / TILE_SIZE); tx <= Math.floor((originX + w / s) / TILE_SIZE); tx++) {
      for (let ty = Math.floor(originY / TILE_SIZE); ty <= Math.floor((originY + h / s) / TILE_SIZE); ty++) {
        if (tx < 0 || tx >= n || !tileAllowed(z, tx, ty)) continue;
        // Whole-pixel edges, shared with the neighbouring tile, so scaled tiles meet without hairlines.
        const left = Math.round((tx * TILE_SIZE - originX) * s);
        const top = Math.round((ty * TILE_SIZE - originY) * s);
        const width = Math.round(((tx + 1) * TILE_SIZE - originX) * s) - left;
        const height = Math.round(((ty + 1) * TILE_SIZE - originY) * s) - top;
        tiles.push({ key: `${layer}/${z}/${tx}/${ty}`, src: tileSrc(layer, z, tx, ty), left, top, width, height, layer: li });
      }
    }
  });
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  return { x, y, k, tiles, metresPerPx: (EARTH_CIRCUMFERENCE_M * Math.cos(midLat)) / (TILE_SIZE * perWorldPx) };
}

/** The longest round distance (1, 2 or 5 × 10ⁿ metres) whose bar is at most `maxPx` wide. */
export function scaleBar(metresPerPx: number, maxPx: number): { metres: number; px: number } {
  const limit = metresPerPx * maxPx;
  const pow = 10 ** Math.floor(Math.log10(limit));
  const metres = ([5, 2, 1].find((m) => m * pow <= limit) ?? 1) * pow;
  return { metres, px: Math.round(metres / metresPerPx) };
}
