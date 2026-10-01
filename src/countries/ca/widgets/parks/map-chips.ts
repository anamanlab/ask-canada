/**
 * Name chips for the parks around the selected one (map-labels.ts runs this as one step of its collision
 * pass). Pins a few pixels apart share one chip with a count ("Glacier +2"); a chip that can't sit beside its
 * pin without covering a pin, a control or another name is left out, and so is one that would sit as close to
 * another park's dot as to its own (a name must never leave a reader guessing which dot it belongs to).
 */
import { MAP_WIDTH, type Box, type Rect, type XY } from './map-geometry';

/** Width of `text` in CSS pixels at a font size and weight; `estimate` is the per-character fallback. */
export type Measure = (text: string, px: number, weight: number, estimate: number) => number;
export type PlacedPin = { id: string; xy: XY; label: string; short?: string };
export type Chip = { id: string; text: string; r: Rect };

const MAX_CHIPS = 8;
/** Pins within this many pixels of a higher-ranked pin share its chip ("Glacier +2")… */
const CLUSTER_REACH = 26;
/** …and in a close-up only dots that actually touch do, so a chip never stands for a handful of parks. */
const CLOSE_REACH = 13;
const CLOSE_UP = MAP_WIDTH * 0.3;
/** A name sits this much closer (px) to its own dot than to any other park's, or it is left out. */
const OWN_MARGIN = 7;

/** Pixels from a point to the nearest edge of a rectangle (0 inside it). */
const gapTo = (r: Rect, [x, y]: XY) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1));

export function placeChips(a: {
  box: Box;
  /** Pins drawn in this view, without the selected one. */
  pins: PlacedPin[];
  /** The framed pins: named first. */
  focus: Set<string>;
  /** Wider than a regional view: only the framed pins and pins standing on their own are named. */
  wide: boolean;
  /** Ranking centre in pixels (the selected pin, or the middle of the frame). */
  centre: XY;
  /** The selected pin, in pixels: it has its own name, and no other name may read as belonging to it. */
  selected?: XY | null;
  /** Frame width in pixels: a name above or below a pin near the edge slides inward instead of going diagonal. */
  width: number;
  px: (xy: XY) => XY;
  /** Free of pins, controls and names placed so far, and inside the frame. */
  free: (r: Rect) => boolean;
  /** On a province name: used only when nowhere else is free (the province name then gives way). */
  soft: (r: Rect) => boolean;
  claim: (r: Rect) => void;
  measure: Measure;
  cluster: (name: string, more: number) => string;
  clusterCount: (count: number) => string;
}): Chip[] {
  const { px, centre } = a;
  const d = (p: PlacedPin) => {
    const [x, y] = px(p.xy);
    return (x - centre[0]) ** 2 + (y - centre[1]) ** 2;
  };
  const ranked = [...a.pins].sort((p, q) => Number(a.focus.has(q.id)) - Number(a.focus.has(p.id)) || d(p) - d(q));
  // Each pin joins the first higher-ranked pin within reach.
  const reach = a.box.w < CLOSE_UP ? CLOSE_REACH : CLUSTER_REACH;
  const clusters: { lead: PlacedPin; at: XY; ids: Set<string>; more: number; x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const p of ranked) {
    const [x, y] = px(p.xy);
    const home = clusters.find((c) => Math.hypot(c.at[0] - x, c.at[1] - y) < reach);
    if (home) {
      home.more++;
      home.ids.add(p.id);
      home.x0 = Math.min(home.x0, x);
      home.x1 = Math.max(home.x1, x);
      home.y0 = Math.min(home.y0, y);
      home.y1 = Math.max(home.y1, y);
    } else clusters.push({ lead: p, at: [x, y], ids: new Set([p.id]), more: 0, x0: x, y0: y, x1: x, y1: y });
  }
  const named = a.wide ? clusters.filter((c) => a.focus.has(c.lead.id) || !c.more) : clusters;

  const chips: Chip[] = [];
  const dots = a.pins.map((p) => ({ id: p.id, at: px(p.xy) }));
  for (const { lead, ids, more, x0: bx0, y0: by0, x1: bx1, y1: by1 } of named.slice(0, MAX_CHIPS)) {
    const own = dots.filter((p) => ids.has(p.id)).map((p) => p.at);
    const others = [...dots.filter((p) => !ids.has(p.id)).map((p) => p.at), ...(a.selected ? [a.selected] : [])];
    /** Unmistakably this pin's name: clearly nearer to its own dot than to any other. */
    const reads = (r: Rect) => {
      const mine = Math.min(...own.map((p) => gapTo(r, p)));
      return others.every((p) => gapTo(r, p) >= mine + OWN_MARGIN);
    };
    const name = lead.short ?? lead.label;
    // A cluster is named after its lead ("Glacier +2"), or, when that can't fit, counted ("3 parks").
    for (const label of more ? [a.cluster(name, more), a.clusterCount(more + 1)] : [name]) {
      const w = a.measure(label, 11.5, 500, 6.4) + 14;
      const h = 20;
      // Around the pin (or the cluster's extent): beside, then above/below (centred, or slid inward at the
      // frame's edge while the pin stays under the name), then the four diagonals (a corner against the pin).
      const mx = (bx0 + bx1) / 2;
      const my = (by0 + by1) / 2;
      const slid = Math.min(Math.max(6, mx - w / 2), a.width - 6 - w);
      const tries: Rect[] = [
        { x0: bx1 + 10, y0: my - h / 2, x1: bx1 + 10 + w, y1: my + h / 2 },
        { x0: bx0 - 10 - w, y0: my - h / 2, x1: bx0 - 10, y1: my + h / 2 },
        { x0: mx - w / 2, y0: by0 - 9 - h, x1: mx + w / 2, y1: by0 - 9 },
        { x0: mx - w / 2, y0: by1 + 9, x1: mx + w / 2, y1: by1 + 9 + h },
        ...(slid === mx - w / 2 || mx < slid + 8 || mx > slid + w - 8
          ? []
          : [
              { x0: slid, y0: by0 - 9 - h, x1: slid + w, y1: by0 - 9 },
              { x0: slid, y0: by1 + 9, x1: slid + w, y1: by1 + 9 + h },
            ]),
        { x0: bx1 + 5, y0: by0 - 8 - h, x1: bx1 + 5 + w, y1: by0 - 8 },
        { x0: bx0 - 5 - w, y0: by0 - 8 - h, x1: bx0 - 5, y1: by0 - 8 },
        { x0: bx1 + 5, y0: by1 + 8, x1: bx1 + 5 + w, y1: by1 + 8 + h },
        { x0: bx0 - 5 - w, y0: by1 + 8, x1: bx0 - 5, y1: by1 + 8 + h },
      ];
      const fits = (r: Rect) => a.free(r) && reads(r);
      const ok = tries.find((r) => fits(r) && !a.soft(r)) ?? tries.find(fits);
      if (!ok) continue;
      a.claim(ok);
      chips.push({ id: lead.id, text: label, r: ok });
      break;
    }
  }
  return chips;
}
