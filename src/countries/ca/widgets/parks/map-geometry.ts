/**
 * Geometry for the parks map: the Canada Atlas Lambert projection (EPSG:3978) of the base map
 * (canada-map-data.ts), view boxes that frame a set of points, the view a map settles on, and a test for
 * province lines crossing a rectangle. Pure; all coordinates are view-box units of the base map unless a name says pixels.
 */
import { BORDERS, MAP } from './canada-map-data';

export type XY = [number, number];
export type Box = { x: number; y: number; w: number; h: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };

/* EPSG:3978: Lambert conformal conic, GRS80, standard parallels 49° and 77°, origin 49°N 95°W. */
const A = 6378137;
const F = 1 / 298.257222101;
const E = Math.sqrt(2 * F - F * F);
const rad = (d: number) => (d * Math.PI) / 180;
const m = (p: number) => Math.cos(p) / Math.sqrt(1 - E * E * Math.sin(p) ** 2);
const tt = (p: number) => Math.tan(Math.PI / 4 - p / 2) / ((1 - E * Math.sin(p)) / (1 + E * Math.sin(p))) ** (E / 2);
const P1 = rad(49);
const P2 = rad(77);
const N = (Math.log(m(P1)) - Math.log(m(P2))) / (Math.log(tt(P1)) - Math.log(tt(P2)));
const FF = m(P1) / (N * tt(P1) ** N);
const RHO0 = A * FF * tt(rad(49)) ** N;

/** Latitude/longitude → view-box units of the base map. */
export function project(lat: number, lng: number): XY {
  const rho = A * FF * tt(rad(lat)) ** N;
  const th = N * rad(lng + 95);
  const x = rho * Math.sin(th);
  const y = RHO0 - rho * Math.cos(th);
  return [(x - MAP.minx) * MAP.s, (MAP.maxy - y) * MAP.s];
}

/** Width of the whole base map, for "how far in are we?" tests. */
export const MAP_WIDTH = MAP.w;

/** Corners that frame the whole country (southern Ontario to Ellesmere Island, Yukon to Newfoundland). */
export const ALL_PARKS_BOX: XY[] = (
  [
    [41.9, -82.5],
    [82.1, -71.6],
    [69, -139.8],
    [48.5, -53.9],
    [48.7, -125.7],
  ] as const
).map(([lat, lng]) => project(lat, lng));

/** Where province and territory names sit on the map (cartographic label points, not boundaries). */
export const PROVINCE_LABELS: { id: string; xy: XY }[] = [
  { id: 'bc', lat: 54.2, lng: -125.2 },
  { id: 'ab', lat: 55.8, lng: -114.8 },
  { id: 'sk', lat: 55.6, lng: -106.2 },
  { id: 'mb', lat: 55.3, lng: -97.8 },
  { id: 'on', lat: 50.2, lng: -86.5 },
  { id: 'qc', lat: 52.6, lng: -72.4 },
  { id: 'nl', lat: 53.4, lng: -62.2 },
  { id: 'yt', lat: 63.4, lng: -135.6 },
  { id: 'nt', lat: 64.6, lng: -120.4 },
  { id: 'nu', lat: 66.4, lng: -96 },
].map((l) => ({ id: l.id, xy: project(l.lat, l.lng) }));

/** Province and territory borders as line segments, parsed once from the base map's path. */
let borderSegs: [number, number, number, number][] | null = null;
function borderSegments() {
  if (borderSegs) return borderSegs;
  borderSegs = [];
  for (const run of BORDERS.split('M').filter(Boolean)) {
    const pts = run.split('L').map((q) => q.trim().split(/\s+/).map(Number));
    for (let i = 1; i < pts.length; i++) borderSegs.push([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]]);
  }
  return borderSegs;
}

/** Does any border line pass through this rectangle? Liang–Barsky clipping per segment. */
export function crossesBorder({ x0, y0, x1, y1 }: Rect) {
  return borderSegments().some(([ax, ay, bx, by]) => {
    const dx = bx - ax;
    const dy = by - ay;
    let lo = 0;
    let hi = 1;
    for (const [pp, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]] as const) {
      if (pp === 0) {
        if (q < 0) return false;
        continue;
      }
      const r = q / pp;
      if (pp < 0) lo = Math.max(lo, r);
      else hi = Math.min(hi, r);
      if (lo > hi) return false;
    }
    return true;
  });
}

/** Pins closer than this many pixels to the frame are left out, so no dot is ever half-clipped or crowding the edge. */
export const EDGE_PX = 16;

function fitRaw(points: XY[], aspect: number, minW: number): Box {
  if (!points.length) return { x: 0, y: 0, w: MAP.w, h: MAP.h };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const padX = Math.max(26, (x1 - x0) * 0.16);
  const padY = Math.max(22, (y1 - y0) * 0.2);
  x0 -= padX;
  x1 += padX;
  y0 -= padY * 1.4; // room for the label above a pin
  y1 += padY;
  let w = Math.max(minW, x1 - x0);
  let h = Math.max(y1 - y0, w / aspect);
  w = Math.max(w, h * aspect);
  h = w / aspect;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/**
 * A box around the points with padding, at the container's aspect ratio, never narrower than `minW`.
 * `widthPx` (the container width) keeps every point at least `EDGE_PX` from the frame, with extra room at
 * the top for the name chip above a pin.
 */
export function fit(points: XY[], aspect: number, minW = 280, widthPx = 0): Box {
  const box = fitRaw(points, aspect, minW);
  if (!widthPx || points.length < 2) return box;
  let b = box;
  for (let i = 0; i < 4; i++) {
    const u = b.w / widthPx; // view-box units per CSS pixel
    const inset = (EDGE_PX + 8) * u;
    const top = (EDGE_PX + 30) * u;
    const bottom = (EDGE_PX + 18) * u; // clears the attribution line
    const ok = points.every(([x, y]) => x - b.x >= inset && b.x + b.w - x >= inset && y - b.y >= top && b.y + b.h - y >= bottom);
    if (ok) break;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const w = b.w * 1.12;
    const h = w / aspect;
    b = { x: cx - w / 2, y: cy - h / 2 - (top - bottom) / 2, w, h };
  }
  return b;
}

/** Room kept around the whole-country view, in pixels: a dot's width at the top and sides, the attribution line at the bottom. */
const COUNTRY_PX = { top: 22, side: 22, bottom: 32 };

/**
 * The closest box that shows every point with only that room to spare: the country fills the frame, and
 * the neighbours (Alaska, Greenland, the northern states) keep what is left over.
 */
function frame(points: XY[], width: number, height: number): Box {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const bw = Math.max(...xs) - x0;
  const bh = Math.max(...ys) - y0;
  const { top, side, bottom } = COUNTRY_PX;
  // Pixels per view-box unit: the tighter of "fits by height" and "fits by width".
  const s = Math.min((height - top - bottom) / bh, (width - 2 * side) / bw);
  const w = width / s;
  const h = height / s;
  // Centred both ways in the room that is left, shifted up by the difference between top and bottom room.
  return { x: x0 + bw / 2 - w / 2, y: y0 + bh / 2 - h / 2 - (top - bottom) / 2 / s, w, h };
}

/** Narrower than this (a phone's message column) the map frames fewer parks and may zoom further in. */
export const NARROW_PX = 420;

/** Room the view toggle takes in the top end corner of the frame, with a margin (pixels). */
const TOGGLE_PX = { w: 176, h: 68 };

/**
 * The view box a map settles on. all (or the "All of Canada" overview): the whole country; selected: a
 * close-up of the selected pin; fit: the framed pins (`focusIds`, or every pin) and the starting place.
 */
export function settle(a: {
  pins: { id: string; xy: XY }[];
  selectedId?: string | null;
  origin?: XY | null;
  focus: 'all' | 'fit' | 'selected';
  focusIds?: string[];
  overview: boolean;
  width: number;
  height: number;
}): Box {
  const aspect = a.width / a.height;
  const from = a.origin ? [a.origin] : [];
  if (a.overview || a.focus === 'all') {
    const all = a.pins.length > 8 ? a.pins.map((p) => p.xy) : ALL_PARKS_BOX;
    let b = frame(all, a.width, a.height);
    if (a.focus === 'all') return b;
    // The overview has a "Zoom back in" button in its top end corner: pull back, keeping the bottom edge
    // where it is, until no park sits under the button (Quttinirpaaq, at the top of a phone-width map).
    for (let i = 0; i < 8; i++) {
      const u = b.w / a.width;
      const { x, y } = b;
      if (!all.some((p) => (p[0] - x) / u > a.width - TOGGLE_PX.w && (p[1] - y) / u < TOGGLE_PX.h)) break;
      const w = b.w * 1.05;
      b = { x: b.x - (w - b.w) / 2, y: b.y + b.h - w / aspect, w, h: w / aspect };
    }
    return b;
  }
  const selected = a.pins.find((p) => p.id === a.selectedId);
  if (a.focus === 'selected' && selected) return fit([selected.xy, ...from], aspect, 230);
  const ids = a.focusIds ? new Set(a.focusIds) : null;
  const pts = a.pins.filter((p) => !ids || ids.has(p.id)).map((p) => p.xy);
  // A phone shows a third of the ground a wide card does at the same scale, so it may go closer.
  return fit([...pts, ...from], aspect, a.width < NARROW_PX ? 150 : 280, a.width);
}
