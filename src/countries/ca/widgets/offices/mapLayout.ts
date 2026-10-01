/**
 * Pure layout maths for OfficeMap: fit-to-pins framing (the listed rows, minus far outliers), pin collision
 * avoidance (a pin that would touch another pin, the "you" dot or its tag, or sit under the map's own chips
 * moves to the nearest clear spot, with a leader back to its true spot), edge markers for listed offices that
 * are off the map, the "you" tag's side, and the visible tile grid. No React, no DOM.
 */
import { mapTiles } from '@/countries/active.map';
import { project, worldSize } from '@/lib/map/mercator';
import { tileAllowed, tileSrc } from '@/lib/map/tiles';

export const TILE = mapTiles.tileSize;
export const PIN = 28;
export const MIN_Z = mapTiles.minZoom;
export const MAX_Z = mapTiles.maxZoom;
/** Minimum distance between pin centres: a clear 8px between two pins (and 44px hit areas mostly apart). */
export const GAP = PIN + 8;
/** No pin centre closer than this to the "you" dot. */
export const YOU_R = 30;
/** Clear space kept between a pin and a box it must not cover (the "you" tag, the map's chips). */
const BOX_GAP = 4;
const FIT_MAX = Math.min(14, MAX_Z);
/** Room kept clear around the fitted pins: selection chip on top, controls at the bottom. */
const PAD = { x: 30, top: 66, bottom: 62 };
/** Keep the "you" tag and every pin this far inside the map's edges. */
const EDGE = 6;
/** An edge marker sits a little further in, leaving room for its arrow. */
const EDGE_ARROW = 10;
/** Rows always framed; a later row joins the frame unless it is an outlier. */
const FIT_CORE = 3;
/** A later row is an outlier when it is beyond 30 km and 2.5 times as far as the last core row. */
const OUTLIER = { km: 30, times: 2.5 };

export type LatLng = { lat: number; lng: number };
export type View = { z: number; cx: number; cy: number };

export const toPx = (p: LatLng, z: number) => project(p.lat, p.lng, worldSize(z, TILE));

/**
 * The pins the map frames: the first `count` (the rows the list shows), except rows after the third that are
 * far outliers (a fourth office 800 km away would shrink the three nearby ones to a dot). An outlier still
 * shows, as a marker on the map's edge.
 */
export function framedPins<P extends { index: number; km: number }>(pins: P[], count: number): P[] {
  const listed = pins.filter((p) => p.index <= count);
  const reach = Math.max(OUTLIER.km, OUTLIER.times * Math.max(0, ...listed.filter((p) => p.index <= FIT_CORE).map((p) => p.km)));
  return listed.filter((p) => p.index <= FIT_CORE || p.km <= reach);
}

/** The deepest zoom that shows every point inside the padded frame, centred on them. */
export function fit(points: LatLng[], w: number, h: number): View {
  for (let z = FIT_MAX; z >= MIN_Z; z--) {
    const ps = points.map((p) => toPx(p, z));
    const xs = ps.map((p) => p.x);
    const ys = ps.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    if (x1 - x0 <= w - 2 * PAD.x && y1 - y0 <= h - PAD.top - PAD.bottom) {
      return { z, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + (PAD.bottom - PAD.top) / 2 };
    }
  }
  const o = toPx(points[0], MIN_Z);
  return { z: MIN_Z, cx: o.x, cy: o.y };
}

/** The view zoomed by `dz` levels around its centre, clamped to the levels the tiles have (same object if unchanged). */
export function zoomView(view: View, dz: number): View {
  const z = Math.max(MIN_Z, Math.min(MAX_Z, view.z + dz));
  if (z === view.z) return view;
  const k = 2 ** (z - view.z);
  return { z, cx: view.cx * k, cy: view.cy * k };
}

type Disc = { x: number; y: number; r: number };

/**
 * A point moved out of every disc it sits in: pushed straight out from what it hits, and when it sits exactly
 * on a disc's centre, out at `fan(k)` (so stacked pins spread around the clock). Shared by the map and the radar.
 */
export function pushApart(p: { x: number; y: number }, discs: Disc[], fan: (k: number) => number, tries = 32) {
  let { x, y } = p;
  for (let k = 0; k < tries; k++) {
    const hit = discs.find((o) => Math.hypot(x - o.x, y - o.y) < o.r - 0.5);
    if (!hit) break;
    const d = Math.hypot(x - hit.x, y - hit.y);
    const a = d > 0.5 ? Math.atan2(y - hit.y, x - hit.x) : fan(k);
    x = hit.x + Math.cos(a) * hit.r;
    y = hit.y + Math.sin(a) * hit.r;
  }
  return { x, y };
}

/**
 * `edge`: the true spot can't be seen (off the map, or under one of the map's own chips), so the pin waits at
 * the nearest clear spot with an arrow; the angle (radians) points to the true spot.
 */
export type Placed<P> = P & { x: number; y: number; tx: number; ty: number; edge?: number };
export type Tag = { dx: number; dy: number; tx: string; ty: string };
/** A box on the map surface, in px from its top-left corner. */
export type Rect = { x0: number; y0: number; x1: number; y1: number };

const overlaps = (a: Rect, b: Rect) => a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1;
const pinBox = (x: number, y: number, pad = 0): Rect => ({ x0: x - PIN / 2 - pad, y0: y - PIN / 2 - pad, x1: x + PIN / 2 + pad, y1: y + PIN / 2 + pad });

/** The clear spot nearest to `p`: `p` itself, else the first free point on widening rings around it. */
function nearestFree(p: { x: number; y: number }, free: (x: number, y: number) => boolean) {
  if (free(p.x, p.y)) return p;
  for (let r = 6; r <= 132; r += 6) {
    const steps = Math.max(8, Math.round((2 * Math.PI * r) / 12));
    for (let k = 0; k < steps; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / steps;
      const x = p.x + Math.cos(a) * r;
      const y = p.y + Math.sin(a) * r;
      if (free(x, y)) return { x, y };
    }
  }
  return p;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Screen positions for "you" and each pin (in index order), every one whole and inside the map. A pin keeps
 * its true spot unless it would come within GAP of an earlier pin, touch the "you" dot, cross the map's edge
 * or sit under one of the `blocked` boxes (the selected-office chip, the zoom controls, the credit); then it
 * takes the nearest clear spot. Only listed rows get a pin (`index <= listed`), so the map and the list always
 * show the same offices. A listed pin whose true spot is off the map, or hidden under one of the boxes, waits
 * at the nearest clear spot, marked `edge` (an arrow, never a leader to a spot nobody can see).
 * The "you" tag (about `tagW` px wide) goes on the first side of the dot that is inside the map and clear of
 * pins and boxes; when no side is clear, it takes a side anyway and the pins make room for it.
 */
export function layoutPins<P extends LatLng & { index: number }>(origin: LatLng, pins: P[], view: View, w: number, h: number, tagW: number, blocked: Rect[] = [], listed = Infinity) {
  const ox = view.cx - w / 2;
  const oy = view.cy - h / 2;
  const at = (p: LatLng) => {
    const q = toPx(p, view.z);
    return { x: q.x - ox, y: q.y - oy };
  };
  const you = at(origin);
  const inset = (d: number): Rect => ({ x0: PIN / 2 + d, y0: PIN / 2 + d, x1: w - PIN / 2 - d, y1: h - PIN / 2 - d });
  const ordered = [...pins].sort((a, b) => a.index - b.index);
  const place = (boxes: Rect[]) => {
    const placed: Placed<P>[] = [];
    for (const p of ordered) {
      const tp = at(p);
      if (p.index > listed) continue;
      const onMap = tp.x >= 0 && tp.x <= w && tp.y >= 0 && tp.y <= h;
      const seen = onMap && !boxes.some((b) => tp.x > b.x0 && tp.x < b.x1 && tp.y > b.y0 && tp.y < b.y1);
      const frame = inset(onMap ? EDGE : EDGE_ARROW);
      const free = (x: number, y: number) =>
        Math.hypot(x - you.x, y - you.y) >= YOU_R &&
        placed.every((q) => Math.hypot(x - q.x, y - q.y) >= GAP) &&
        !boxes.some((b) => overlaps(pinBox(x, y, BOX_GAP), b)) &&
        x >= frame.x0 && x <= frame.x1 && y >= frame.y0 && y <= frame.y1;
      const spot = nearestFree({ x: clamp(tp.x, frame.x0, frame.x1), y: clamp(tp.y, frame.y0, frame.y1) }, free);
      placed.push({ ...p, ...spot, tx: tp.x, ty: tp.y, edge: seen ? undefined : Math.atan2(tp.y - spot.y, tp.x - spot.x) });
    }
    return placed;
  };
  const half = tagW / 2;
  const sides = [
    { dx: 14, dy: 0, tx: '0', ty: '-50%', bx: [10, 14 + tagW], by: [-12, 12] },
    { dx: -14, dy: 0, tx: '-100%', ty: '-50%', bx: [-14 - tagW, -10], by: [-12, 12] },
    { dx: 0, dy: 14, tx: '-50%', ty: '0', bx: [-half, half], by: [10, 38] },
    { dx: 0, dy: -14, tx: '-50%', ty: '-100%', bx: [-half, half], by: [-38, -10] },
  ];
  type Side = (typeof sides)[number];
  const box = (s: Side): Rect => ({ x0: you.x + s.bx[0], y0: you.y + s.by[0], x1: you.x + s.bx[1], y1: you.y + s.by[1] });
  const inside = (s: Side) => you.x + s.bx[0] >= EDGE && you.x + s.bx[1] <= w - EDGE && you.y + s.by[0] >= EDGE && you.y + s.by[1] <= h - EDGE;
  const offBoxes = (s: Side) => !blocked.some((b) => overlaps(box(s), b));
  let placed = place(blocked);
  let pick = sides.find((s) => inside(s) && offBoxes(s) && !placed.some((p) => overlaps(pinBox(p.x, p.y), box(s))));
  if (!pick) {
    pick = sides.find((s) => inside(s) && offBoxes(s)) ?? sides.find(inside) ?? sides[0];
    placed = place([...blocked, box(pick)]);
  }
  const tag: Tag = { dx: pick.dx, dy: pick.dy, tx: pick.tx, ty: pick.ty };
  return { you, placed, tag };
}

export type MapTile = { key: string; layer: number; src: string; left: number; top: number };

/** Tiles covering the view, for each layer (base, then labels). Outside the pack's coverage: none. */
export function tilesFor(layers: string[], view: View, w: number, h: number) {
  const ox = view.cx - w / 2;
  const oy = view.cy - h / 2;
  const out: MapTile[] = [];
  const max = 2 ** view.z;
  layers.forEach((layer, li) => {
    for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + w) / TILE); tx++) {
      for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + h) / TILE); ty++) {
        if (ty < 0 || ty >= max) continue;
        const x = ((tx % max) + max) % max;
        if (!tileAllowed(view.z, x, ty)) continue;
        const src = tileSrc(layer, view.z, x, ty);
        out.push({ key: `${li}:${src}`, layer: li, src, left: tx * TILE - ox, top: ty * TILE - oy });
      }
    }
  });
  return out;
}
