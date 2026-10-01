/**
 * Label layout for the parks map: which pins are drawn, and where every name sits (province names, the
 * selected park's chip, the starting place, park chips with clusters, reference towns), in one collision
 * pass in priority order. A name that can't fit without covering another name, pin or control is left out
 * (the list beside the map and each pin's accessible name still carry it). check-map-layout.mjs tests it.
 *
 * Pure: everything is computed for the view the map is settling on (`box`), in CSS pixels of the frame, so
 * it runs once per view rather than on every frame of a glide. Text is measured through `measure` only.
 */
import { EDGE_PX, MAP_WIDTH, NARROW_PX, PROVINCE_LABELS, crossesBorder, project, type Box, type Rect, type XY } from './map-geometry';
import { placeChips, type Chip, type Measure, type PlacedPin } from './map-chips';
import { TOWNS } from './towns';

export type { Measure };
/** Before the page's font can be measured (server render, first paint): an average character width. */
export const estimateWidth: Measure = (text, _px, _weight, estimate) => text.length * estimate;

/**
 * Text widths from a canvas in the frame's own font. Call it once the frame is in the page, never during
 * render. An OffscreenCanvas where the browser has one (no DOM node is made); a detached <canvas> otherwise.
 */
export function canvasMeasure(family: string): Measure {
  const ctx = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(1, 1).getContext('2d') : document.createElement('canvas').getContext('2d');
  if (!ctx || !family) return estimateWidth;
  const seen = new Map<string, number>();
  return (text, px, weight) => {
    const key = `${weight} ${px} ${text}`;
    let w = seen.get(key);
    if (w === undefined) {
      ctx.font = `${weight} ${px}px ${family}`;
      w = Math.ceil(ctx.measureText(text).width);
      seen.set(key, w);
    }
    return w;
  };
}

/** Where the name of the pin under the keyboard focus or the mouse goes: centred above the pin, or below it at the top edge. */
export function peekRect([x, y]: XY, w: number, width: number): Rect {
  const x0 = Math.min(Math.max(4, x - w / 2), width - 4 - w);
  const y0 = y - 36 < 4 ? y + 14 : y - 36;
  return { x0, y0, x1: x0 + w, y1: y0 + 22 };
}

export type TownLabel = { id: string; text: string; x: number; y: number; end: boolean; /** The name's box (the layout test reads it). */ r: Rect };

export type MapLayout = {
  showToggle: boolean;
  /** Pins drawn in this view: clear of the frame and of the controls. */
  visible: Set<string>;
  /** The drawn pins from west to east: the order the arrow keys walk them in. */
  order: string[];
  originInView: boolean;
  provinces: { id: string; text: string; x: number; y: number; r: Rect }[];
  chips: Chip[];
  selected: { text: string; r: Rect } | null;
  origin: Rect | null;
  towns: TownLabel[];
};

/** Reference towns, projected once, in the order the map prefers them. */
const TOWN_POINTS = TOWNS.map((c) => ({ id: c.names[0], xy: project(c.lat, c.lng), label: c.label }));
/** In overview the starting place this close to the selected pin keeps its dot and gives up its name. */
const ORIGIN_CROWDED_PX = 40;

const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const around = ([x, y]: XY, r: number): Rect => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
const grow = (r: Rect, by: number): Rect => ({ x0: r.x0 - by, y0: r.y0 - by, x1: r.x1 + by, y1: r.y1 + by });

export function layoutMap(a: {
  box: Box;
  width: number;
  height: number;
  pins: PlacedPin[];
  selectedId?: string | null;
  focusIds?: string[];
  focus: 'all' | 'fit' | 'selected';
  overview: boolean;
  origin: { xy: XY; label: string } | null;
  lang: 'en' | 'fr';
  measure: Measure;
  text: {
    toggle: string;
    attribution: string;
    province: (id: string) => string;
    cluster: (name: string, more: number) => string;
    clusterCount: (count: number) => string;
  };
}): MapLayout {
  const { box, width, height, pins, selectedId, focus, overview, origin, measure, text } = a;
  const u = box.w / width; // view-box units per CSS pixel
  const inView = (xy: XY, edge = EDGE_PX) => xy[0] >= box.x + edge * u && xy[0] <= box.x + box.w - edge * u && xy[1] >= box.y + edge * u && xy[1] <= box.y + box.h - edge * u;
  const px = (xy: XY): XY => [(xy[0] - box.x) / u, (xy[1] - box.y) / u];
  // Closer than about 80% of the country's width: province names are spelled out and every park can be named.
  const zoomed = box.w < MAP_WIDTH * 0.8;
  const narrow = width < NARROW_PX;
  const selected = pins.find((p) => p.id === selectedId);
  const focusSet = new Set(a.focusIds ?? []);

  // The "All of Canada" button (top end corner; the map is always laid out left to right) and the attribution.
  const showToggle = focus !== 'all' && (zoomed || overview);
  const toggleW = measure(text.toggle, 13, 500, 7.4) + 28 + 14 + 6 + 2;
  const toggleRect: Rect = { x0: width - 8 - toggleW - 6, y0: 0, x1: width, y1: 8 + 44 + 6 };
  const attrRect: Rect = { x0: width - measure(text.attribution, 10, 400, 5.6) - 14, y0: height - 20, x1: width, y1: height };
  const bottom = height - 20; // attribution line

  // A pin is drawn when it sits clear of the frame and of the controls: the selected pin always; the framed
  // pins are kept clear by the fit; any other pin that would be half-hidden is left to the list.
  const chrome = [...(showToggle ? [toggleRect] : []), attrRect];
  const underChrome = ([x, y]: XY) => chrome.some((r) => x > r.x0 - 8 && x < r.x1 + 8 && y > r.y0 - 8 && y < r.y1 + 8);
  const isVisible = (p: PlacedPin) => (p.id === selectedId ? inView(p.xy, 4) : inView(p.xy) && (focusSet.has(p.id) || !underChrome(px(p.xy))));
  const shown = pins.filter(isVisible);
  const at = new Map(shown.map((p) => [p.id, px(p.xy)]));
  const order = shown.map((p) => p.id).sort((p, q) => at.get(p)![0] - at.get(q)![0] || at.get(p)![1] - at.get(q)![1]);

  // Province and territory names: inside the frame, never clipped, never under the "All of Canada" button.
  // Spelled out in a regional view; abbreviated when the view is wider or the full names would run together.
  const provinceNames = (spell: boolean) =>
    PROVINCE_LABELS.flatMap((l) => {
      const mx = box.w * 0.12;
      if (l.xy[0] < box.x + mx || l.xy[0] > box.x + box.w - mx || l.xy[1] < box.y + box.h * 0.08 || l.xy[1] > box.y + box.h * 0.92) return [];
      const label = spell ? text.province(l.id) : l.id.toUpperCase();
      const half = (measure(label, 9.5, 500, 7.2) + label.length * 1.5) / 2;
      const [x, y] = px(l.xy);
      if (x - half < 6 || x + half > width - 6) return [];
      const r: Rect = { x0: x - half - 3, y0: y - 8, x1: x + half + 3, y1: y + 8 };
      if (showToggle && overlaps(r, toggleRect)) return [];
      return [{ id: l.id, text: label, x, y, r }];
    });
  const apart = (list: { r: Rect }[]) => list.every((p, i) => list.every((q, j) => j <= i || !overlaps(grow(p.r, 4), q.r)));
  const spelled = zoomed ? provinceNames(true) : null;
  // On the smallest maps even two abbreviations can touch: the later one is left out.
  const provinces = spelled && apart(spelled) ? spelled : provinceNames(false).filter((p, i, list) => !list.slice(0, i).some((q) => overlaps(p.r, q.r)));
  const onProvince = (q: Rect) => provinces.some((p) => overlaps(q, p.r));

  // Everything a name must stay off: the other pins, the controls, the starting place's dot, then each name
  // as it is placed.
  const taken: Rect[] = [];
  const hit = (r: Rect, clearance = 0) => taken.some((o) => overlaps(clearance ? grow(r, clearance) : r, o));
  const inside = (r: Rect, edge = 4) => r.x0 >= edge && r.y0 >= edge && r.x1 <= width - edge && r.y1 <= bottom;
  for (const p of shown) if (p.id !== selectedId) taken.push(around(px(p.xy), 8));
  if (focus !== 'all') taken.push(toggleRect);
  taken.push(attrRect);
  const originInView = !!origin && inView(origin.xy);
  const originAt = origin && originInView ? px(origin.xy) : null;
  const originDot = originAt ? around(originAt, 8) : null;
  if (originDot) taken.push(originDot);

  // The selected pin's chip first: right beside its pin (end side, then start, then above or below, clamped
  // inside the frame). Short of room it may cover another park's dot, never the starting place or a control.
  let sel: MapLayout['selected'] = null;
  const selAt = selected && inView(selected.xy, 4) ? px(selected.xy) : null;
  if (selected && selAt) {
    const [x, y] = selAt;
    const label = selected.short ?? selected.label;
    const w = measure(label, 12, 600, 7.3) + 22;
    const h = 26;
    const gap = 15; // clears the selected dot and its halo
    const clampX = (x0: number) => Math.min(Math.max(4, x0), width - 4 - w);
    const tries: Rect[] = [
      { x0: x + gap, y0: y - h / 2, x1: x + gap + w, y1: y + h / 2 },
      { x0: x - gap - w, y0: y - h / 2, x1: x - gap, y1: y + h / 2 },
      // Above or below: centred, then starting or ending at the pin, then a step further off.
      ...[x - w / 2, x - 10, x - w + 10, null].flatMap((left) =>
        [y - gap - h, y + gap].map((near, i) => {
          const x0 = clampX(left ?? x - w / 2);
          const y0 = left === null ? near + (i ? 18 : -18) : near;
          return { x0, y0, x1: x0 + w, y1: y0 + h };
        }),
      ),
    ];
    const hard = [...chrome, ...(originDot ? [originDot] : [])];
    const r =
      tries.find((q) => inside(q) && !hit(q)) ??
      tries.find((q) => inside(q) && !hard.some((o) => overlaps(q, o))) ??
      tries.find((q) => inside(q) && !(originDot && overlaps(q, originDot))) ??
      tries.find((q) => inside(q)) ??
      tries[y - gap - h > 4 ? 2 : 3];
    sel = { text: label, r };
    taken.push(r, around(selAt, 11));
  }

  // Then the starting place: under its dot, above it, beside it or at a corner, wherever nothing else is.
  // Short of room it may cover another park's dot, never the selected park, its name or a control; with no
  // side left the dot stands alone (the card's subtitle names the place).
  let org: Rect | null = null;
  const crowded = overview && !!selAt && !!originAt && Math.hypot(selAt[0] - originAt[0], selAt[1] - originAt[1]) < ORIGIN_CROWDED_PX;
  if (origin && originAt && !crowded) {
    const [x, y] = originAt;
    const w = measure(origin.label, 11, 500, 6.6) + 16;
    const x0 = Math.min(Math.max(4, x - w / 2), width - 4 - w);
    const tries: Rect[] = [
      { x0, y0: y + 10, x1: x0 + w, y1: y + 30 },
      { x0, y0: y - 30, x1: x0 + w, y1: y - 10 },
      { x0: x + 11, y0: y - 10, x1: x + 11 + w, y1: y + 10 },
      { x0: x - 11 - w, y0: y - 10, x1: x - 11, y1: y + 10 },
      ...[y + 9, y - 29].flatMap((y0) => [x + 7, x - 7 - w].map((left) => ({ x0: left, y0, x1: left + w, y1: y0 + 20 }))),
    ];
    const hard = [...chrome, ...(sel && selAt ? [sel.r, around(selAt, 11)] : [])];
    org = tries.find((q) => inside(q) && !hit(q)) ?? tries.find((q) => inside(q) && !hard.some((o) => overlaps(q, o))) ?? null;
    if (org) taken.push(org);
  }

  // Framed views name the framed pins first (nearest to the selected park first), then any other pin in
  // view, nearest first. Wider than a regional view (the far North) the framed pins still get their names.
  const chips =
    !overview && (zoomed || (focus === 'fit' && focusSet.size > 0))
      ? placeChips({
          box,
          pins: shown.filter((p) => p.id !== selectedId),
          focus: focusSet,
          wide: !zoomed,
          centre: selected ? px(selected.xy) : [width / 2, height / 2],
          selected: selAt,
          width,
          px,
          free: (r) => inside(r) && !hit(r),
          soft: onProvince,
          claim: (r) => taken.push(r),
          measure,
          cluster: text.cluster,
          clusterCount: text.clusterCount,
        })
      : [];

  // Reference towns (regional zoom only), so a close-up frame reads like a map rather than empty paper. A
  // phone has room for a few, each well clear of pins, chips and the frame.
  const towns: TownLabel[] = [];
  if (!overview && box.w < MAP_WIDTH * 0.45) {
    const most = narrow ? 3 : 6;
    const clearance = narrow ? 6 : 2;
    const edge = narrow ? 10 : 4;
    for (const c of TOWN_POINTS) {
      if (towns.length >= most) break;
      if (!inView(c.xy, 18)) continue;
      const [x, y] = px(c.xy);
      const label = c.label[a.lang];
      // A park of the same name is already labelled ("Prince Albert").
      if (chips.some((l) => l.text.startsWith(label)) || sel?.text.startsWith(label)) continue;
      // The starting place has its own dot and chip ("Calgary").
      if (origin && (label === origin.label || (originAt && Math.hypot(originAt[0] - x, originAt[1] - y) < 24))) continue;
      const w = measure(label, 10.5, 500, 6) + 4;
      const dot = around([x, y], 5);
      if (hit(dot, clearance)) continue;
      const endR: Rect = { x0: x + 6, y0: y - 8, x1: x + 6 + w, y1: y + 8 };
      const startR: Rect = { x0: x - 6 - w, y0: y - 8, x1: x - 6, y1: y + 8 };
      // Never let a province line run through a town's name: try the other side, else leave the town out.
      const onBorder = (q: Rect) => crossesBorder({ x0: box.x + q.x0 * u, y0: box.y + q.y0 * u, x1: box.x + q.x1 * u, y1: box.y + q.y1 * u });
      const r = [endR, startR].find((q) => inside(q, edge) && !hit(q, clearance) && !onBorder(q) && !onProvince(q));
      if (!r) continue;
      taken.push(dot, r);
      towns.push({ id: c.id, text: label, x, y, end: r === endR, r });
    }
  }

  // A province name gives way to any park or place name that had to sit on it.
  const names = [...chips.map((c) => c.r), ...(sel ? [sel.r] : []), ...(org ? [org] : [])];
  return {
    showToggle,
    visible: new Set(order),
    order,
    originInView,
    provinces: provinces.filter((p) => !names.some((r) => overlaps(r, p.r))),
    chips,
    selected: sel,
    origin: org,
    towns,
  };
}
