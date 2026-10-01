#!/usr/bin/env node
// Builds the landing's artwork as standalone, cacheable SVG files in public/art/ca/. Every palette is baked
// in (no CSS variables), so each file works as an <img> or a CSS background, and none of it rides in the
// HTML or the React Server Components payload. The page swaps the light and dark variants in CSS.
//
//   node scripts/build-art.mjs           -> everything below except the combined aurora files
//   node scripts/build-art.mjs --aurora  -> also regenerates aurora-{day,night,dusk}.svg from the design
//                                           source. aurora-day and aurora-dusk carry hand-tuned, softer
//                                           ribbons: don't pass --aurora unless you re-apply that tuning.
//
// Files:
//   land-*.svg               lake + reflected treeline behind a scene (design/direction-a/landing.html)
//   aurora-*.svg             the combined, self-animating aurora (the chat glow and the OG image use it)
//   aurora-*-{1,2,3}.svg     the same aurora split into its three ribbons, static: the landing stacks them
//                            and drifts each one in CSS (transform only, so the compositor animates them
//                            and nothing is repainted per frame; see .l-ribbon in landing.css)
//   shore-{light,dark}.svg   the phone hero's lake at golden hour / under the aurora (static)
//   shore-mist-*.svg         the breath of mist on the water (the page drifts it in CSS)
//   src/components/landing/shore-glints.json
//                            the glitter on the sun's path: each glint's place, size, brightness and twinkle
//                            (the page draws them as small CSS layers that only change opacity)
//   shore-canoe-*.svg        the canoe and its two paddlers
//   shore-fore-*.svg         the near bank: granite and reeds at the viewer's feet
//   prairie-{light,dark}.svg the closing panel's prairie at dusk
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = new URL('../public/art/ca/', import.meta.url);
mkdirSync(out, { recursive: true });
const write = (name, svg) => writeFileSync(new URL(name, out), svg.replace(/\n\s*/g, ''));
const head = (vb, par) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${par ? ` preserveAspectRatio="${par}"` : ''}>`;

/* ---------------------------------------------------------------------------------------------------------
 * Deterministic drawing helpers: fixed seeds, so every build writes the same files.
 * ------------------------------------------------------------------------------------------------------- */

/** mulberry32: a small seeded PRNG in [0, 1). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1-D value noise in [0, 1] with lattice spacing `cell`, valid for x in [-cell, span + cell]. */
function noise1(seed, cell, span = 1700) {
  const r = rng(seed);
  const pts = Array.from({ length: Math.ceil(span / cell) + 5 }, () => r());
  return (x) => {
    const u = (x + cell) / cell;
    const i = Math.max(0, Math.floor(u));
    const f = u - i;
    const s = (1 - Math.cos(f * Math.PI)) / 2;
    return pts[i] * (1 - s) + pts[i + 1] * s;
  };
}

/** One decimal place: keeps path data short. */
const f1 = (n) => Math.round(n * 10) / 10;

/** Path data from absolute points, written as short relative steps (rounded first, so nothing drifts). */
function rel(pts) {
  let px = f1(pts[0][0]);
  let py = f1(pts[0][1]);
  let d = `M${px} ${py}l`;
  for (let i = 1; i < pts.length; i++) {
    const x = f1(pts[i][0]);
    const y = f1(pts[i][1]);
    d += `${i > 1 ? ' ' : ''}${f1(x - px)} ${f1(y - py)}`.replace(/ -/g, '-').replace(/(^|[ -])0\./g, '$1.');
    px = x;
    py = y;
  }
  return `${d}z`;
}

/** One spruce: a leaning spire of drooping branch tiers, each side jittered on its own. */
function spruce(x, b, h, w, r) {
  const tiers = Math.max(3, Math.min(8, Math.round(h / 5.5)));
  const top = b - h;
  const lean = (r() - 0.5) * h * 0.05;
  const right = [];
  const left = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = top + h * 0.9 * t;
    const cx = x + lean * (1 - t);
    const half = (w / 2) * t ** 0.8;
    const lift = h * 0.014;
    right.push([cx + half * (0.78 + r() * 0.44), y], [cx + half * 0.38, y - lift]);
    left.unshift([cx - half * 0.38, y - lift], [cx - half * (0.78 + r() * 0.44), y]);
  }
  // The innermost point of the last tier on each side gives way to the trunk.
  right.pop();
  left.shift();
  const trunk = Math.max(0.45, w * 0.05);
  return rel([[x + lean, top], ...right, [x + trunk, b], [x - trunk, b], ...left]);
}

/** A gradient stop with a baked colour and opacity. */
const stop = (offset, color, opacity = 1) => `<stop offset="${offset}" stop-color="${color}"${opacity === 1 ? '' : ` stop-opacity="${opacity}"`}/>`;

/* ---------------------------------------------------------------------------------------------------------
 * 1. Northern landscapes and the combined aurora, from the hand-built design (lake, treeline, aurora).
 * ------------------------------------------------------------------------------------------------------- */

const src = readFileSync(new URL('../design/direction-a/landing.html', import.meta.url), 'utf8');
const between = (a, b) => {
  const i = src.indexOf(a);
  if (i < 0) throw new Error('missing ' + a);
  const j = src.indexOf(b, i);
  return src.slice(i, j + b.length);
};
const grab = (re) => {
  const m = src.match(re);
  if (!m) throw new Error('missing ' + re);
  return m[0];
};

const landDefs = [
  between('<linearGradient id="lakeG"', '</linearGradient>'),
  between('<linearGradient id="hazeG"', '</linearGradient>'),
  between('<linearGradient id="reflFade"', '</linearGradient>'),
  grab(/<linearGradient id="rippleG">.*?<\/linearGradient>/s),
  grab(/<linearGradient id="fadeDown".*?<\/linearGradient>/s),
  grab(/<linearGradient id="fadeUp".*?<\/linearGradient>/s),
  grab(/<mask id="lakeM".*?<\/mask>/s),
  grab(/<mask id="hazeM1".*?<\/mask>/s),
  grab(/<mask id="hazeM2".*?<\/mask>/s),
  grab(/<mask id="reflMask".*?<\/mask>/s),
  between('<filter id="ripple"', '</filter>'),
  between('<g id="landForms">', '</g>\n    <g id="land">').replace(/\n    <g id="land">$/, ''),
  grab(/<g id="land">.*?<use href="#landForms"\/>\s*<\/g>/s),
].join('\n');

const auDefs = [
  grab(/<linearGradient id="auG".*?<\/linearGradient>/s),
  grab(/<linearGradient id="auV".*?<\/linearGradient>/s),
  grab(/<linearGradient id="auT".*?<\/linearGradient>/s),
  grab(/<filter id="auBlur".*?<\/filter>/s),
  grab(/<filter id="auGlow".*?<\/filter>/s),
  grab(/<g id="au1">.*?<\/g><\/g><\/g>/s),
  grab(/<g id="au2">.*?<\/g><\/g><\/g>/s),
  grab(/<g id="au3">.*?<\/g><\/g><\/g>/s),
].join('\n');

// Light on water: a few short, tapered glints (40–120px on screen) at varied depths and slight angles,
// instead of long uniform hairlines that read as scratches or UI dividers (especially on dark phones).
const LAND_GLINTS = [
  // x, y, width, height, angle (deg)
  [606, 453, 74, 1.2, -1.2],
  [872, 447, 112, 1.2, 0.8],
  [704, 473, 46, 1, 0],
  [948, 490, 84, 1.3, -0.6],
  [388, 467, 58, 1.1, 0.9],
  [1196, 462, 66, 1.1, -0.8],
  [542, 509, 92, 1.4, 0.5],
  [1040, 527, 70, 1.5, -0.4],
];
const landGlints = LAND_GLINTS.map(
  ([x, y, w, h, a]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"${a ? ` transform="rotate(${a} ${x + w / 2} ${y})"` : ''}/>`,
).join('');
const withGlints = (svg) =>
  svg
    .replace(/(<g fill="url\(#rippleG\)" class="ripples")>.*?<\/g>/s, `$1 opacity=".42">${landGlints}</g>`)
    .replace(/(<linearGradient id="rippleG">.*?stop-opacity=")\.8(")/s, '$1.8$2');

const bake = (svg, vars) =>
  svg.replace(/var\(--([a-z-]+)\)/g, (_, k) => {
    if (!(k in vars)) throw new Error('palette missing --' + k);
    return vars[k];
  });

const LAND = {
  'hero-light': { 'sky-glow': '#F6E2D2', far: '#C3CFD8', mid: '#A5B4C1', 'tree-back': '#5B6E82', tree: '#15233A', 'lake-top': '#EFE6DE', 'lake-bot': '#CCD8E0' },
  'hero-dark': { 'sky-glow': '#1E3148', far: '#1C2B40', mid: '#17243A', 'tree-back': '#0C1524', tree: '#070D18', 'lake-top': '#15253A', 'lake-bot': '#0A1220' },
  night: { 'sky-glow': '#1B3350', far: '#16263B', mid: '#111E31', 'tree-back': '#0A1322', tree: '#050A14', 'lake-top': '#13253C', 'lake-bot': '#070D19' },
  'dusk-light': { 'sky-glow': '#F7D3BC', far: '#D9C3CB', mid: '#BFA6B6', 'tree-back': '#5A4760', tree: '#281B32', 'lake-top': '#F1D9CC', 'lake-bot': '#D9C6CF' },
  'dusk-dark': { 'sky-glow': '#3B2536', far: '#2B1F33', mid: '#22182B', 'tree-back': '#150F1D', tree: '#0A0710', 'lake-top': '#2A1B2C', 'lake-bot': '#110B16' },
};
const AURORA = {
  day: { 'a-green': '#78DDB0', 'a-teal': '#6FCFD8', 'a-violet': '#A898F0', 'a-rose': '#F2B5C8' },
  night: { 'a-green': '#62F0B2', 'a-teal': '#4FD8E6', 'a-violet': '#9C86FF', 'a-rose': '#FF8FB6' },
  dusk: { 'a-green': '#9FE3C4', 'a-teal': '#B5A4F0', 'a-violet': '#E7A7D0', 'a-rose': '#F2B5C8' },
};

for (const [name, vars] of Object.entries(LAND)) {
  write(
    `land-${name}.svg`,
    head('0 0 1600 540', 'xMidYMax slice') +
      // #m is the tighter mobile crop: <img src="land.svg#m">
      `<view id="m" viewBox="100 250 800 290" preserveAspectRatio="xMidYMax slice"/>` +
      `<defs>${withGlints(bake(landDefs, vars))}</defs><use href="#land"/></svg>`,
  );
}

const auStyle = `<style>.au{transform-box:fill-box;animation:drift 38s ease-in-out infinite alternate}.b{animation-duration:52s;animation-delay:-12s}.c{animation-duration:30s;animation-delay:-6s}@keyframes drift{0%{transform:translateX(-30px) scaleY(.94)}50%{transform:translateX(10px) scaleY(1.04)}100%{transform:translateX(34px) scaleY(.97)}}@media (prefers-reduced-motion:reduce){.au{animation:none}}</style>`;
if (process.argv.includes('--aurora')) {
  for (const [name, vars] of Object.entries(AURORA)) {
    write(
      `aurora-${name}.svg`,
      head('0 0 1600 600', 'xMidYMid slice') +
        auStyle +
        `<defs>${bake(auDefs, vars)}</defs>` +
        `<g class="au b"><use href="#au2"/></g><g class="au"><use href="#au1"/></g><g class="au c"><use href="#au3"/></g></svg>`,
    );
  }
}

/* ---------------------------------------------------------------------------------------------------------
 * 2. Aurora ribbons: each committed aurora file (tuning included) split into its three ribbons.
 *
 * Each ribbon file keeps the aurora's 1600 × 600 drawing, widened by RIBBON_PAD on both sides so the part of
 * a ribbon that drifts into view is really there (the page clips the stack to the original frame). The page
 * scales each ribbon about the top of its box, as the combined file does (`transform-box: fill-box`), so
 * those tops are printed here and kept in landing.css.
 * ------------------------------------------------------------------------------------------------------- */

const RIBBON_PAD = 40;
const RIBBONS = ['au1', 'au2', 'au3'];
const tops = {};
for (const name of Object.keys(AURORA)) {
  const svg = readFileSync(new URL(`aurora-${name}.svg`, out), 'utf8');
  const defs = svg.slice(svg.indexOf('<defs>') + 6, svg.indexOf('</defs>'));
  const shared = defs.slice(0, defs.indexOf('<g id="au1">'));
  RIBBONS.forEach((id, i) => {
    const start = defs.indexOf(`<g id="${id}">`);
    if (start < 0) throw new Error(`aurora-${name}.svg: missing #${id}`);
    const group = defs.slice(start, defs.indexOf('</g></g></g>', start) + 12);
    const top = Math.min(...[...group.matchAll(/<rect x="[-\d.]+" y="([-\d.]+)"/g)].map((m) => Number(m[1])), ...[...group.matchAll(/ d="([^"]+)"/g)].flatMap((m) => m[1].match(/-?[\d.]+/g).filter((_, k) => k % 2).map(Number)));
    tops[id] ??= top;
    if (tops[id] !== top) throw new Error(`#${id} starts at y=${top} in aurora-${name}.svg but y=${tops[id]} elsewhere`);
    write(`aurora-${name}-${i + 1}.svg`, head(`${-RIBBON_PAD} 0 ${1600 + 2 * RIBBON_PAD} 600`) + `<defs>${shared}${group}</defs><use href="#${id}"/></svg>`);
  });
}

/* ---------------------------------------------------------------------------------------------------------
 * 3. Shore: the phone hero's own landscape, not a crop of the desktop art. A Shield lake at golden hour
 *    (light) or under the aurora (dark), in flat, stratified layers: three ridgelines that step down in
 *    value toward the viewer, a band of valley mist, a far shore, stands of spruce on the near shore with
 *    open water between them (no repeated stamps: every tree has its own height, width, lean and branch
 *    tiers), granite off each point, and a lake that mirrors it all in the sky's own colours, with a glitter
 *    path under the low sun or moon. The page pins the
 *    drawing by its waterline (see .l-shore and --sr-u in landing.css).
 * ------------------------------------------------------------------------------------------------------- */

const W = 800;
/** The waterline: ridges and the shore stand on it, the lake mirrors about it (landing.css: 200 * --sr-u). */
const WL = 200;
/** The drawing runs well below the tiles; CSS carries the water on from there (landing.css: 440 * --sr-u). */
const H = 440;

/** `pass`: a valley the ridge dips into (`d` of its height, over a half-width `w`), where the low sun sits. */
function ridge(seed, base, amp, octaves, bumps = [], pass) {
  const ns = octaves.map(([cell], k) => noise1(seed + k * 101, cell, W + 40));
  let d = `M-20 ${WL}`;
  for (let x = -20; x <= W + 20; x += 4) {
    let v = 0;
    octaves.forEach(([, w], k) => (v += w * ns[k](x)));
    const b = bumps.reduce((s, p) => s + p.h * Math.exp(-(((x - p.x) / p.w) ** 2)), 0);
    const keep = pass ? 1 - pass.d * Math.exp(-(((x - pass.x) / pass.w) ** 2)) : 1;
    d += `L${x} ${f1(WL - (WL - (base - amp * v - b)) * keep)}`;
  }
  return `${d}L${W + 20} ${WL}Z`;
}

/** Phones see about x = 260…540 of the drawing. */
const SUN_X = 452;

/** A height profile through control points [x, h], eased between them. */
function profile(pts) {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const t = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        const s = (1 - Math.cos(t * Math.PI)) / 2;
        return pts[i - 1][1] * (1 - s) + pts[i][1] * s;
      }
    }
    return pts[pts.length - 1][1];
  };
}

/**
 * The near shore, as separate stands with open water between them: a headland coming in from the west, a
 * rock islet, and a point from the east whose two tall pines stand beside the sun, over the canoe. `drop`:
 * how far the stand's own waterline falls below the far shore's (nearer land sits lower in the picture), so
 * the shoreline steps in and out instead of running straight. `heroes`: single pines above the canopy.
 */
const STANDS = [
  {
    x0: -20, x1: 341, drop: 3.2, seed: 7,
    canopy: [[-20, 42], [150, 45], [212, 36], [246, 25], [262, 30], [276, 27], [286, 18], [298, 26], [312, 20], [326, 11], [341, 4]],
    heroes: [[226, 38], [269, 35], [301, 30]],
  },
  {
    x0: 364, x1: 398, drop: 4, seed: 19,
    canopy: [[364, 4], [371, 14], [379, 20], [388, 15], [398, 4]],
    heroes: [[377, 27], [385, 20]],
  },
  {
    x0: 473, x1: 820, drop: 2.6, seed: 29,
    canopy: [[473, 4], [481, 16], [492, 26], [512, 22], [526, 16], [546, 26], [566, 11], [584, 10], [604, 28], [700, 42], [820, 46]],
    heroes: [[488, 38], [498, 31], [551, 28], [623, 37]],
  },
];

function shoreline() {
  const tex = noise1(37, 7);
  // The far shore: a low forest across the lake, small and close-packed, lowest where the sun sets behind it.
  const rb = rng(13);
  const dens = noise1(11, 46);
  const far = [];
  for (let x = -18; x < W + 18; ) {
    const gap = 1 - 0.5 * Math.exp(-(((x - SUN_X) / 34) ** 2));
    // Clumps and low stretches: the stand's height swings widely along the shore.
    const h = (2.5 + 12 * dens(x) ** 1.8) * (0.55 + 0.55 * rb()) * gap + 1.5 * tex(x);
    far.push(spruce(x, WL + 0.3, h, h * (0.34 + rb() * 0.14), rb));
    x += 1.4 + rb() * 2.4;
  }
  // Under the spires, the forest's own mass: one uneven canopy line, so the far shore is a place, not a comb.
  const mass = [[-20, WL + 0.5]];
  for (let x = -20; x <= W + 20; x += 2.5) mass.push([x, WL - 1.2 - 4.6 * dens(x) ** 1.6 - 1.1 * tex(x)]);
  mass.push([W + 20, WL + 0.5]);
  const farBank = rel(mass);
  // The near stands: understory under each canopy line, then the tall pines; and each stand's bank, which
  // dips below the far waterline and tapers to a point where it ends inside the picture.
  const near = [];
  const banks = [];
  const rocks = [];
  for (const { x0, x1, drop, seed, canopy, heroes } of STANDS) {
    const r = rng(seed);
    const top = profile(canopy);
    const hgt = noise1(seed + 16, 26);
    const edge = noise1(seed + 40, 14);
    for (let x = x0 + 2; x < x1 - 1; ) {
      const h = Math.max(3, top(x) * (0.62 + 0.38 * hgt(x)) * (0.86 + 0.14 * r()));
      const w = h * (0.25 + r() * 0.11);
      near.push(spruce(x, WL + 0.6, h, w, r));
      x += Math.max(1.2, w * (0.42 + r() * 0.5));
    }
    for (const [x, h] of heroes) near.push(spruce(x, WL + 0.6, h, h * (0.2 + r() * 0.04), r));
    // Tapers only at an end that lies inside the drawing.
    const taper = (x) => {
      const a = x0 > 0 ? Math.min(1, (x - x0) / 9) : 1;
      const b = x1 < W ? Math.min(1, (x1 - x) / 14) : 1;
      return Math.sin((Math.max(0, Math.min(a, b)) * Math.PI) / 2) ** 0.6;
    };
    const pts = [[x0, WL - 1.4]];
    for (let x = x1; x >= x0; x -= 2) pts.push([x, WL + drop * taper(x) * (0.8 + 0.2 * edge(x))]);
    pts.splice(1, 0, [x1, WL - 1.4]);
    banks.push(rel(pts));
    // Granite off each point that ends in open water.
    const rock = (x, w, h) => rocks.push(`M${f1(x - w)} ${WL + 1.2}C${f1(x - w * 0.7)} ${f1(WL - h)} ${f1(x + w * 0.2)} ${f1(WL - h * 1.15)} ${f1(x + w)} ${WL + 1.2}Z`);
    if (x0 > 0) rock(x0 - 5, 4, 1.8);
    if (x1 < W) {
      rock(x1 + 4, 5, 2.2);
      rock(x1 + 12, 2.4, 1.1);
    }
  }
  return { far: far.join('') + farBank, near: near.join(''), banks: banks.join(''), rocks: rocks.join('') };
}

/**
 * The low sun (light) and the low moon (dark) share one column (SUN_X). Each sits in the valley mist just
 * above the far shore, in the open water between the islet and the eastern point, so the light, its path on
 * the water and the canoe read as one group in the band under the trust line. The aurora's glow stays high.
 */
const SUN_Y = WL - 23;
const SUN_R = 12;
/** The aurora's glow in the night sky: its 80-unit halo ends inside the drawing, so its top edge never shows as a seam. */
const GLOW_Y = WL - 112;
/** How far the valley mist rises above the waterline: the ridges stand in it, and fade into it at the shore. */
const MIST_H = 74;

/**
 * Glitter on the sun's path: short, soft ellipses (a radial falloff, no hard edges) in a narrow column under
 * the sun or the aurora's glow. Near the shore they are thin and long; toward the viewer they grow shorter
 * and a little taller, the way light breaks on nearer ripples. Each twinkles on its own period and phase.
 */
function glints() {
  const r = rng(91);
  const n = 38;
  return Array.from({ length: n }, (_, i) => {
    // Loosely stratified (each glint may wander well into its neighbours' rows), so the column never reads
    // as an evenly dotted line.
    const t = Math.min(1, Math.max(0, (i + (r() - 0.5) * 2.4) / n));
    const y = WL + 12 + t ** 1.2 * 156;
    const spread = 5 + t * 34;
    // A tent-shaped spread: most glints gather near the centre line.
    const off = ((r() + r() + r()) / 1.5 - 1) * spread;
    const centre = 1 - Math.min(1, Math.abs(off) / spread);
    const rx = (7 - 3.6 * t) * (0.55 + 0.6 * r()) * (0.7 + 0.4 * centre);
    const ry = 0.55 + t * 0.6;
    const o = 0.45 + 0.55 * centre * (0.55 + 0.45 * r());
    return { cx: f1(SUN_X + off), cy: f1(y), rx: f1(rx), ry: f1(ry), o: Math.round(o * 100) / 100, dur: f1(2.8 + r() * 3.6), delay: f1(-r() * 6) };
  });
}

// Low Shield hills: in view they stay under about 52 units, below the trust line and clear of the question
// box, and step down toward the shore. Each dips where the sun (or the moon) sits.
const R3 = ridge(3, WL - 30, 21, [[210, 0.62], [70, 0.26], [22, 0.12]], [
  { x: 548, w: 60, h: 7 },
  { x: 300, w: 44, h: 6 },
], { x: SUN_X + 10, w: 70, d: 0.7 });
const R2 = ridge(5, WL - 20, 17, [[150, 0.6], [46, 0.28], [15, 0.12]], [{ x: 352, w: 44, h: 6 }], { x: SUN_X - 6, w: 62, d: 0.8 });
const R1 = ridge(9, WL - 10, 13, [[110, 0.6], [34, 0.3], [11, 0.1]], [], { x: SUN_X + 4, w: 50, d: 0.9 });
const TREES = shoreline();

/**
 * The reflection is a crisp mirror of the land, faded with depth, and broken by ripples: slim lens shapes in
 * the water's own colour (the lake gradient), sparse and hair-thin at the shore, longer and thicker toward
 * the viewer. So the mirrored trees are as sharp as the trees, and the water reads as water; nothing is
 * blurred.
 */
function ripples() {
  const r = rng(53);
  const out = [];
  for (let i = 0; i < 150; i++) {
    const t = (i + r()) / 150;
    const y = WL + 2.4 + t ** 1.25 * 104;
    const rx = (9 + 46 * t) * (0.5 + r());
    const ry = (0.22 + 1.15 * t) * (0.7 + 0.6 * r());
    out.push(`<ellipse cx="${f1(r() * (W + 40) - 20)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${Math.round(ry * 100) / 100}"/>`);
  }
  return out.join('');
}

/** Long, faint streaks of light on the open water below the reflection, so the near lake is never a flat wash. */
function swells() {
  const r = rng(71);
  const out = [];
  for (let i = 0; i < 26; i++) {
    const t = (i + r()) / 26;
    const y = WL + 58 + t * (H - WL - 70);
    out.push(`<ellipse cx="${f1(r() * W)}" cy="${f1(y)}" rx="${f1((26 + 50 * t) * (0.6 + 0.8 * r()))}" ry="${Math.round((0.35 + 0.5 * t) * 100) / 100}"/>`);
  }
  return out.join('');
}
const RIPPLES = ripples();
const SWELLS = swells();

/**
 * Golden hour, in flat stratified layers: an apricot sky, the sun setting into the mist over the far shore,
 * low hills that step down from dusty rose to plum toward the viewer, a far shore tinted by the air, near-black
 * spruce stands on the near shore, and a lake that mirrors the sky from peach to lavender. Night: the aurora
 * over navy hills, a low moon in the same place as the sun, with its halo and its path on the water, so the
 * canoe is a silhouette on lit water in both themes. Some colours are also page CSS (landing.css, `.l-lake`):
 * the lake's floor (`lc`), which the water carries on below the drawing, the mist (`va`), which haloes the
 * trust line, and the glitter (`glint`), which the page draws.
 *
 * `glowY`: the centre of the wide glow in the sky (around the sun by day, the aurora's by night). `path`: the
 * light's path on the water. `lift`: a broad, faint brightening of the water under the light. `feather`: by
 * night the near banks are near-black on dark water with little light to edge them, so each bank's underside
 * dissolves into its own reflection instead of ending in a hard line (which read as a floating slab).
 */
const SHORE = {
  light: {
    ka: ['#fbe3cc', 0], kb: ['#fad7b6', 0.75], kc: ['#f7c195', 1],
    sun: '#fff1d2', sun2: '#ffb467', sunO: 1, disc: '#fffaf0', discR: SUN_R, halo: 4.4,
    s3: ['#dba9a6', '#ecc6b8'], s2: ['#bb8b9a', '#d9b0ae'], s1: ['#906c86', '#b996a3'],
    va: '#f6d9c6', vaO: [0, 0.3, 0.86],
    tree: '#221c2b', far: '#5f4a6c', haze: 0.22, rock: '#3a3040',
    lake: ['#f3c3a1', '#dcc4d0', '#d4cde2'],
    glow: '#ffcf98', glowO: 0.9, glowY: SUN_Y - 22,
    path: '#ffcf98', pathO: 0.5, lift: '#fff1d2', liftO: 0,
    glint: '#fffaf0', wake: 0.6, wakeEnd: 36, refl: 0.5, swell: 0.34, rim: '#ffc890', rimO: 0.55,
    edge: '#fff4e4', edgeO: 0.7, mist: '#fff3e8', mistO: 0.3,
  },
  dark: {
    ka: ['#0b1220', 0], kb: ['#13233a', 0], kc: ['#1b3a48', 0],
    sun: '#eef3ff', sun2: '#8fb4e6', sunO: 0.5, disc: '#f6f3e6', discR: 8.5, halo: 6.4,
    s3: ['#2f4468', '#263a5a'], s2: ['#213250', '#1c2c47'], s1: ['#16243b', '#14233a'],
    va: '#1d3a58', vaO: [0, 0.3, 0.7],
    tree: '#04070f', far: '#0d1a2e', haze: 0.3, rock: '#1a2536',
    lake: ['#1b3654', '#11213a', '#0c1729'],
    glow: '#3fd0a6', glowO: 0.3, glowY: GLOW_Y,
    path: '#cfe0f7', pathO: 0.42, lift: '#a9c8ee', liftO: 0.26,
    glint: '#9fe3d0', wake: 0.3, wakeEnd: 27, refl: 0.8, feather: true, swell: 0.1, rim: '#bcd4f2', rimO: 0.3,
    edge: '#cfe6f2', edgeO: 0.3, mist: '#9fe3d0', mistO: 0.1,
  },
};

/**
 * The disc's own reflection (the mirror carries only its halo): four soft-edged dashes of light under it,
 * each wider and fainter than the one above, the way a low sun breaks on calm water.
 */
function discReflection(r) {
  return [
    [5, 0.5, 0.11, 0.8],
    [10.5, 0.72, 0.1, 0.62],
    [16.5, 0.98, 0.09, 0.44],
    [23.5, 1.3, 0.08, 0.28],
  ]
    .map(([dy, w, h, o]) => `<ellipse cx="${SUN_X}" cy="${f1(WL + dy)}" rx="${f1(r * w)}" ry="${f1(Math.max(0.9, r * h))}" opacity="${o}"/>`)
    .join('');
}

const shoreHead = head(`0 0 ${W} ${H}`, 'xMidYMin slice');
// Mirror about the waterline, squashed a little (a calm lake seen from a low bank).
const MIRROR = `matrix(1 0 0 -0.7 0 ${f1(WL * 1.7)})`;

/** The still scene: sky, sun or moon, hills, mist, both shores, and the lake with its reflection and the path of light. */
const shore = (p) =>
  shoreHead +
  `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="${WL}" gradientUnits="userSpaceOnUse">${stop(0, ...p.ka)}${stop(0.3, ...p.kb)}${stop(0.8, ...p.kc)}</linearGradient>
    ${[p.s3, p.s2, p.s1].map(([a, b], i) => `<linearGradient id="g${3 - i}" x1="0" y1="${WL - [56, 42, 26][i]}" x2="0" y2="${WL}" gradientUnits="userSpaceOnUse">${stop(0, a)}${stop(1, b)}</linearGradient>`).join('')}
    <linearGradient id="vmist" x1="0" y1="${WL - MIST_H}" x2="0" y2="${WL}" gradientUnits="userSpaceOnUse">${stop(0, p.va, p.vaO[0])}${stop(0.4, p.va, p.vaO[1])}${stop(1, p.va, p.vaO[2])}</linearGradient>
    <linearGradient id="haze" x1="0" y1="${WL - 14}" x2="0" y2="${WL}" gradientUnits="userSpaceOnUse">${stop(0, p.va, 0)}${stop(1, p.va, p.haze)}</linearGradient>
    <linearGradient id="lake" x1="0" y1="${WL}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${stop(0, p.lake[0])}${stop(0.4, p.lake[1])}${stop(1, p.lake[2])}</linearGradient>
    <radialGradient id="glow">${stop(0, p.glow, p.glowO)}${stop(1, p.glow, 0)}</radialGradient>
    ${p.liftO ? `<radialGradient id="lift">${stop(0, p.lift, p.liftO)}${stop(0.5, p.lift, p.liftO * 0.45)}${stop(1, p.lift, 0)}</radialGradient>` : ''}
    <radialGradient id="path">${stop(0, p.path, 0.9)}${stop(1, p.path, 0)}</radialGradient>
    <radialGradient id="drefl">${stop(0, p.disc, 1)}${stop(0.55, p.disc, 0.6)}${stop(1, p.disc, 0)}</radialGradient>
    <radialGradient id="sun">${stop(0, p.sun, p.sunO)}${stop(0.3, p.sun2, p.sunO * 0.6)}${stop(1, p.sun2, 0)}</radialGradient>
    <linearGradient id="reflfade" x1="0" y1="${WL}" x2="0" y2="${WL + 118}" gradientUnits="userSpaceOnUse">${stop(0, '#fff')}${stop(0.35, '#fff', 0.85)}${stop(1, '#fff', 0)}</linearGradient>
    ${p.feather ? `<linearGradient id="bank" x1="0" y1="${WL - 1.4}" x2="0" y2="${WL + 3.4}" gradientUnits="userSpaceOnUse">${stop(0, p.tree)}${stop(0.3, p.tree)}${stop(0.5, p.tree, 0.55)}${stop(0.74, p.tree, 0.16)}${stop(1, p.tree, 0)}</linearGradient>` : ''}
    <mask id="reflmask" maskUnits="userSpaceOnUse" x="-20" y="${WL}" width="${W + 40}" height="${H - WL}"><rect x="-20" y="${WL}" width="${W + 40}" height="${H - WL}" fill="url(#reflfade)"/></mask>
  </defs>
  <rect x="-20" y="0" width="${W + 40}" height="${WL}" fill="url(#sky)"/>
  <ellipse cx="${SUN_X}" cy="${p.glowY}" rx="230" ry="80" fill="url(#glow)"/>
  <g id="land">
    <path d="${R3}" fill="url(#g3)"/><path d="${R2}" fill="url(#g2)"/><path d="${R1}" fill="url(#g1)"/>
    <rect x="-20" y="${WL - MIST_H}" width="${W + 40}" height="${MIST_H}" fill="url(#vmist)"/>
    <circle cx="${SUN_X}" cy="${SUN_Y}" r="${f1(p.discR * p.halo)}" fill="url(#sun)"/>
    <path d="${TREES.far}" fill="${p.far}"/>
    <rect x="-20" y="${WL - 14}" width="${W + 40}" height="14" fill="url(#haze)"/>
    <path d="${TREES.near}" fill="${p.tree}"/>
  </g>
  <circle cx="${SUN_X}" cy="${SUN_Y}" r="${p.discR}" fill="${p.disc}"/>
  <rect x="-20" y="${WL}" width="${W + 40}" height="${H - WL}" fill="url(#lake)"/>
  <g mask="url(#reflmask)" opacity="${p.refl}"><use href="#land" transform="${MIRROR}"/></g>
  <g fill="url(#lake)">${RIPPLES}</g>
  <g fill="url(#drefl)">${discReflection(p.discR)}</g>
  ${p.liftO ? `<ellipse cx="${SUN_X - 30}" cy="${WL + 24}" rx="230" ry="64" fill="url(#lift)"/>` : ''}
  <g fill="${p.edge}" opacity="${p.swell}">${SWELLS}</g>
  <rect x="-20" y="${WL}" width="${W + 40}" height="0.7" fill="${p.edge}" opacity="${p.edgeO}"/>
  <ellipse cx="${SUN_X}" cy="${WL + 120}" rx="52" ry="118" fill="url(#path)" opacity="${p.pathO}"/>
  <path d="${p.feather ? '' : TREES.banks}${TREES.rocks}" transform="translate(0 0.7)" fill="${p.edge}" opacity="${p.edgeO}"/>
  <path d="${TREES.banks}" fill="${p.feather ? 'url(#bank)' : p.tree}"/><path d="${TREES.rocks}" fill="${p.rock}"/>
</svg>`;

/**
 * The breath of mist on the water, cut to its band of the drawing (y 190–220), so the page can drift it as a
 * small layer (see .l-shore__mist).
 */
const MIST_BAND = [190, 30];
const shoreMist = (p) =>
  head(`0 ${MIST_BAND[0]} ${W} ${MIST_BAND[1]}`, 'none') +
  `<defs><radialGradient id="mist">${stop(0, p.mist, p.mistO)}${stop(1, p.mist, 0)}</radialGradient></defs>
  <ellipse cx="330" cy="${WL + 9}" rx="210" ry="4" fill="url(#mist)"/><ellipse cx="590" cy="${WL + 11}" rx="150" ry="3.5" fill="url(#mist)"/>
</svg>`;

/** One kneeling paddler, hunched toward the bow (west): hips at the gunwale, shoulders rolled forward over a
 *  rounded back, the head forward of them. */
function paddler(x) {
  const p = (dx, y) => `${f1(x + dx)} ${y}`;
  return {
    torso:
      `M${p(-1.2, -0.9)}C${p(-1.4, -2.2)} ${p(-2, -3.4)} ${p(-2.1, -4.2)}C${p(-2.1, -4.9)} ${p(-1.3, -5.2)} ${p(-0.5, -5.15)}` +
      `C${p(0.5, -5.1)} ${p(1.3, -4.6)} ${p(1.3, -3.8)}C${p(1.3, -2.8)} ${p(1.1, -1.8)} ${p(1.3, -0.9)}Z`,
    head: [f1(x - 1.5), -5.95],
  };
}

/** A paddle from its grip to the tip of its blade, with the blade as a slim leaf along the shaft. */
function paddle(gx, gy, tx, ty) {
  const len = Math.hypot(tx - gx, ty - gy);
  const ux = (tx - gx) / len;
  const uy = (ty - gy) / len;
  // The blade: the last 3.4 units, widest a third of the way up from the tip.
  const bx = tx - ux * 3.4;
  const by = ty - uy * 3.4;
  const mx = tx - ux * 1.3;
  const my = ty - uy * 1.3;
  const nx = -uy * 0.85;
  const ny = ux * 0.85;
  return {
    shaft: `M${f1(gx)} ${f1(gy)}L${f1(bx)} ${f1(by)}`,
    blade: `M${f1(bx)} ${f1(by)}Q${f1(mx + nx)} ${f1(my + ny)} ${f1(tx)} ${f1(ty)}Q${f1(mx - nx)} ${f1(my - ny)} ${f1(bx)} ${f1(by)}Z`,
  };
}

/**
 * A canoe with two paddlers heading west across the open water: a tapered hull with an upturned bow and
 * stern, two hunched figures, paddles with their blades mid-stroke (bow reaching forward at the catch; stern
 * steering, its blade in the water behind), a short wake that fades behind it, and a faint reflection broken
 * by the ripples. Drawn on a -15 -8.5 52 × 14 frame; the viewBox runs on below it for the reflection's ripples.
 */
const canoe = (p) => {
  const bow = paddler(-6);
  const stern = paddler(5.6);
  const bowPaddle = paddle(-9.2, -5.6, -12.2, 1.4);
  const sternPaddle = paddle(3.1, -4.4, 14.8, 1.9);
  return (
    head('-15 -8.5 52 16') +
    `<defs>
      <linearGradient id="wake" x1="13" y1="0" x2="${p.wakeEnd}" y2="0" gradientUnits="userSpaceOnUse">${stop(0, p.glint, p.wake)}${stop(1, p.glint, 0)}</linearGradient>
      <filter id="ripple" x="-10%" y="-40%" width="120%" height="180%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.85" numOctaves="1" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="0.35 0.15"/>
      </filter>
      <g id="boat" fill="${p.tree}">
        <path d="M-13.4 -2.9C-12.2 -1.5 -10.2 -1.05 -7 -1L7 -1C10.2 -1.05 12.2 -1.4 13.4 -2.7C12.6 -0.2 8 1.1 0 1.1C-8 1.1 -12.6 -0.2 -13.4 -2.9Z"/>
        <path d="${bow.torso + stern.torso + bowPaddle.blade + sternPaddle.blade}"/>
        <circle cx="${bow.head[0]}" cy="${bow.head[1]}" r="0.92"/>
        <circle cx="${stern.head[0]}" cy="${stern.head[1]}" r="0.88"/>
        <g fill="none" stroke="${p.tree}" stroke-linecap="round">
          <path d="${bowPaddle.shaft + sternPaddle.shaft}" stroke-width="0.42"/>
          <path d="M-7.9 -4.8L-9.1 -5.5M-8 -4L-10.5 -2.6M4.3 -4.6L3.3 -4.4M6.3 -4.3L7.6 -2.5" stroke-width="0.62"/>
        </g>
      </g>
    </defs>
    <g opacity="0.2" filter="url(#ripple)"><use href="#boat" transform="matrix(1 0 0 -0.6 0 0.9)"/></g>
    <path fill="none" stroke-width="0.45" stroke-linecap="round" d="M13.6 0.1Q21 -0.2 34 -2M13.6 1Q21 1.7 36 4.4" stroke="url(#wake)"/>
    <use href="#boat"/>
  </svg>`
  );
};

/**
 * The near bank, at the viewer's feet: a hump of Shield granite coming in from the corner with a stand of
 * reeds and two cattails, in silhouette, its sunward edge catching the light. The page pins it to the bottom
 * corner of the bay, in front of the canoe, so the lake has a near, a middle and a far. Drawn on a
 * 150 × 78 frame whose bottom edge is the bank's waterline, with FORE_UNDER units of water under it. The bank
 * meets the water as the far islands do: no drawn line, its foot bowed a little toward the viewer, and under
 * it the granite and the reeds mirrored in the lake, shortened, broken by ripples and fading with depth, so
 * the drawing ends in water (never in an edge) well before its frame does. The page stands the waterline
 * above the task tiles and lets the last of the reflection run out behind them (see `.l-fore`).
 */
const FORE_UNDER = 44;
const fore = (p) => {
  const r = rng(23);
  const FH = 78;
  const blades = [];
  // Each blade: a slim leaf from its foot to its tip, bowed by its lean, widest near the foot.
  for (let i = 0; i < 26; i++) {
    const x = 10 + i * 3.5 + (r() - 0.5) * 4;
    const tall = 16 + 44 * Math.sin(((i + 0.5) / 26) * Math.PI) ** 0.8 * (0.5 + 0.5 * r());
    const lean = (r() - 0.32) * tall * 0.5;
    const foot = FH - 12 - 10 * Math.sin(Math.min(1, x / 96) * Math.PI) ** 0.7;
    const w = 0.8 + r() * 0.7;
    const tx = x + lean;
    const ty = foot - tall;
    const mx = x + lean * 0.22;
    const my = foot - tall * 0.56;
    blades.push(`M${f1(x - w)} ${f1(foot + 6)}Q${f1(mx - w)} ${f1(my)} ${f1(tx)} ${f1(ty)}Q${f1(mx + w)} ${f1(my)} ${f1(x + w)} ${f1(foot + 6)}Z`);
  }
  const tails = [[34, 61, 3], [52, 54, -2]].map(([x, tall, lean]) => {
    const top = FH - 20 - tall;
    return `<path d="M${x} ${FH - 16}L${x + lean} ${top}" stroke-width="0.9"/><path d="M${f1(x + lean * 0.985)} ${top + 4}L${f1(x + lean * 0.86)} ${top + 13}" stroke-width="3.1"/>`;
  });
  const FB = FH + FORE_UNDER;
  // The granite's foot is not ruled: it sags a few units toward the near corner, as a bank does seen from above.
  const rock = `M-4 ${FH + 4}L-4 ${FH - 20}C10 ${FH - 27} 34 ${FH - 29} 56 ${FH - 23}C78 ${FH - 17} 93 ${FH - 9} 108 ${FH - 0.4}C88 ${FH + 1.6} 40 ${FH + 3.4} -4 ${FH + 4}Z`;
  const pebble = `M112 ${FH - 0.2}C114 ${FH - 5.4} 126 ${FH - 6} 131 ${FH - 0.2}C126 ${FH + 0.9} 117 ${FH + 0.9} 112 ${FH - 0.2}Z`;
  // A few dark ripples lying across the reflection, shorter and fainter with depth: the water's own surface.
  const ripples = [[-4, 46, 5.5, 0.2], [18, 92, 10.5, 0.15], [-4, 58, 16, 0.1]]
    .map(([x1, x2, dy, o]) => `<path d="M${x1} ${f1(FH + dy)}L${x2} ${f1(FH + dy)}" stroke-opacity="${o}"/>`)
    .join('');
  return (
    head(`0 0 150 ${FB}`, 'xMinYMax meet') +
    `<defs>
      <linearGradient id="deep" x1="0" y1="${FH}" x2="0" y2="${FB - 4}" gradientUnits="userSpaceOnUse">${stop(0, '#fff', 0.5)}${stop(0.3, '#fff', 0.26)}${stop(0.7, '#fff', 0.08)}${stop(1, '#fff', 0)}</linearGradient>
      <mask id="fade" maskUnits="userSpaceOnUse" x="-6" y="${FH - 2}" width="162" height="${FORE_UNDER + 2}"><rect x="-6" y="${FH - 2}" width="162" height="${FORE_UNDER + 2}" fill="url(#deep)"/></mask>
      <filter id="ripple" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="1" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="0.5 0.25"/>
      </filter>
      <path id="bank" d="${rock}${pebble}"/>
      <g id="stand" fill="${p.tree}"><path d="${blades.join('')}"/><g fill="none" stroke="${p.tree}" stroke-linecap="round">${tails.join('')}</g><use href="#bank"/></g>
    </defs>
    <g mask="url(#fade)"><g filter="url(#ripple)"><use href="#stand" transform="matrix(1 0 0 -0.56 0 ${f1(FH * 1.56 + 2)})"/></g></g>
    <g fill="none" stroke="${p.tree}" stroke-width="0.7" stroke-linecap="round">${ripples}</g>
    <use href="#stand"/>
    <path d="M40 ${FH - 26.4}C62 ${FH - 23} 87 ${FH - 13} 103.5 ${FH - 1.8}M115 ${FH - 3.4}C119 ${FH - 5} 125 ${FH - 4.8} 128.6 ${FH - 1.6}" fill="none" stroke="${p.rim}" stroke-opacity="${p.rimO}" stroke-width="0.8" stroke-linecap="round"/>
  </svg>`
  );
};

// The glitter is the same in both themes (its colour and strength are page CSS: --sr-glint, --sr-glint-o).
writeFileSync(new URL('../src/components/landing/shore-glints.json', import.meta.url), JSON.stringify(glints()) + '\n');
for (const [theme, p] of Object.entries(SHORE)) {
  write(`shore-${theme}.svg`, shore(p));
  write(`shore-mist-${theme}.svg`, shoreMist(p));
  write(`shore-canoe-${theme}.svg`, canoe(p));
  write(`shore-fore-${theme}.svg`, fore(p));
}

/* ---------------------------------------------------------------------------------------------------------
 * 4. Prairie: the closing panel's place, a different part of the country from the hero's lake. A low sun on
 *    an open horizon, a grain elevator and a line of poles along a gravel road, a thin band of canola,
 *    furrows running to the sun, and a skein of geese, at dusk (light) or after it (dark).
 * ------------------------------------------------------------------------------------------------------- */

const PW = 1600;
const PH = 360;
/** The horizon. */
const HZ = 214;
/** Where the road and furrows meet (just left of the sun, so the sun stays clear). */
const VP = { x: 930, y: HZ };
const SUN = { x: 1010, r: 34 };

function belt() {
  // Shelterbelts: low clumps of trees on the far horizon, with open gaps between farms.
  const dens = noise1(41, 90, PW + 60);
  const tex = noise1(43, 9, PW + 60);
  let d = `M-20 ${HZ + 1}`;
  for (let x = -20; x <= PW + 20; x += 4) {
    const on = dens(x) > 0.52 ? (dens(x) - 0.52) / 0.48 : 0;
    d += `L${x} ${f1(HZ - on * (4 + 6 * tex(x)))}`;
  }
  return `${d}L${PW + 20} ${HZ + 1}Z`;
}

function furrows() {
  // Rows of stubble converging on the vanishing point, spaced evenly along the bottom edge.
  const parts = [];
  for (let x = -1400; x <= PW + 1400; x += 120) parts.push(`M${VP.x} ${VP.y}L${x} ${PH + 2}`);
  return parts.join('');
}

function poles() {
  // Telephone poles along the road, receding in perspective toward the vanishing point.
  const out = [];
  const wires = [];
  const start = { x: 660, y: PH + 30 };
  const end = { x: VP.x + 14, y: VP.y + 1 };
  let prev = null;
  for (let i = 0; i < 9; i++) {
    const t = 1 - 0.62 ** (i + 1) * 1.05;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const h = 150 * (1 - t) + 6;
    const cw = h * 0.16;
    out.push(`M${f1(x)} ${f1(y)}V${f1(y - h)}M${f1(x - cw)} ${f1(y - h * 0.9)}H${f1(x + cw)}`);
    if (prev) {
      const sag = Math.max(1, (prev.h + h) * 0.07);
      for (const k of [-1, 1]) {
        const ax = prev.x + k * prev.h * 0.14;
        const ay = prev.y - prev.h * 0.9;
        const bx = x + k * h * 0.14;
        const by = y - h * 0.9;
        wires.push(`M${f1(ax)} ${f1(ay)}Q${f1((ax + bx) / 2)} ${f1((ay + by) / 2 + sag)} ${f1(bx)} ${f1(by)}`);
      }
    }
    prev = { x, y, h };
  }
  return { poles: out.join(''), wires: wires.join('') };
}

function geese() {
  // A loose V of geese, heading south-west.
  const r = rng(5);
  const lead = { x: 1190, y: 118 };
  const birds = [];
  for (let i = 0; i < 9; i++) {
    const arm = i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? 1 : -1);
    const k = Math.abs(arm);
    const x = lead.x + k * 13 + (r() - 0.5) * 3;
    const y = lead.y + arm * 6.5 + k * 3.2 + (r() - 0.5) * 2;
    const s = 3 + r() * 0.8;
    birds.push(`M${f1(x - s)} ${f1(y - s * 0.45)}Q${f1(x - s * 0.4)} ${f1(y - s * 0.2)} ${f1(x)} ${f1(y)}Q${f1(x + s * 0.4)} ${f1(y - s * 0.25)} ${f1(x + s)} ${f1(y - s * 0.5)}`);
  }
  return birds.join('');
}

/** A classic wooden prairie elevator: the tall house, its cupola, the lower annex and the driveway shed. */
function elevator(x, s) {
  const b = HZ + 2;
  const p = (px, py) => `${f1(x + px * s)} ${f1(b - py * s)}`;
  return [
    // main house with its pitched top
    `M${p(-13, 0)}L${p(-13, 52)}L${p(-8, 58)}L${p(8, 58)}L${p(13, 52)}L${p(13, 0)}Z`,
    // cupola
    `M${p(-5, 57)}L${p(-5, 68)}L${p(0, 72)}L${p(5, 68)}L${p(5, 57)}Z`,
    // annex
    `M${p(13, 0)}L${p(13, 34)}L${p(19, 38)}L${p(27, 38)}L${p(27, 0)}Z`,
    // driveway shed
    `M${p(-25, 0)}L${p(-25, 12)}L${p(-13, 17)}L${p(-13, 0)}Z`,
  ].join('');
}

const PRAIRIE = {
  light: {
    halo: ['#ffd6b0', 0.8], sun: '#fff3e2', field: ['#f4dcc6', '#eac7a8', '#ddb08f'], canola: ['#f0cf66', 0.5],
    furrow: ['#8a5641', 0.07], road: ['#f8e8da', '#f1d8c3'], far: '#cfb0b6', far2: '#bf9fa9', sil: '#4f3746', geese: '#5b4452',
  },
  dark: {
    halo: ['#ff8e6a', 0.36], sun: '#ffb58c', field: ['#4b2d3a', '#301d2b', '#1e131f'], canola: ['#9a6440', 0.42],
    furrow: ['#ffcdb8', 0.035], road: ['#5c3a49', '#2f1e2c'], far: '#3d2839', far2: '#35222f', sil: '#130b15', geese: '#120b14',
  },
};

const BELT = belt();
const FURROWS = furrows();
const POLES = poles();
const GEESE = geese();

const prairie = (p) =>
  head(`0 0 ${PW} ${PH}`, 'xMidYMax slice') +
  `<defs>
    <radialGradient id="halo">${stop(0, ...p.halo)}${stop(1, p.halo[0], 0)}</radialGradient>
    <linearGradient id="field" x1="0" y1="${HZ}" x2="0" y2="${PH}" gradientUnits="userSpaceOnUse">${stop(0, p.field[0])}${stop(0.4, p.field[1])}${stop(1, p.field[2])}</linearGradient>
    <linearGradient id="road" x1="0" y1="${HZ}" x2="0" y2="${PH}" gradientUnits="userSpaceOnUse">${stop(0, p.road[0])}${stop(1, p.road[1])}</linearGradient>
    <clipPath id="sky"><rect x="-20" y="0" width="${PW + 40}" height="${HZ + 0.5}"/></clipPath>
    <clipPath id="near"><rect x="-20" y="${HZ + 34}" width="${PW + 40}" height="${PH}"/></clipPath>
  </defs>
  <ellipse cx="${SUN.x}" cy="${HZ}" rx="560" ry="200" fill="url(#halo)"/>
  <circle cx="${SUN.x}" cy="${HZ + 8}" r="${SUN.r}" fill="${p.sun}" clip-path="url(#sky)"/>
  <path d="${GEESE}" fill="none" stroke="${p.geese}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>
  <rect x="-20" y="${HZ}" width="${PW + 40}" height="${PH - HZ}" fill="url(#field)"/>
  <rect x="-20" y="${HZ + 3}" width="${PW + 40}" height="7" fill="${p.canola[0]}" opacity="${p.canola[1]}"/>
  <path d="${FURROWS}" fill="none" stroke="${p.furrow[0]}" stroke-opacity="${p.furrow[1]}" stroke-width="1.4" clip-path="url(#near)"/>
  <path d="M${VP.x - 3} ${VP.y}L${VP.x + 3} ${VP.y}L330 ${PH + 2}L150 ${PH + 2}Z" fill="url(#road)"/>
  <rect x="-20" y="${HZ}" width="${PW + 40}" height="1.2" fill="${p.sun}" opacity="0.55"/>
  <path d="${BELT}" fill="${p.far}"/>
  <path d="${elevator(560, 1.3)}" fill="${p.sil}"/>
  <path d="${elevator(1392, 0.46)}" fill="${p.far2}"/>
  <path d="${POLES.wires}" fill="none" stroke="${p.sil}" stroke-width="0.7" opacity="0.5"/>
  <path d="${POLES.poles}" fill="none" stroke="${p.sil}" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

for (const [theme, p] of Object.entries(PRAIRIE)) write(`prairie-${theme}.svg`, prairie(p));

console.log(`art written to public/art/ca (ribbon tops: ${RIBBONS.map((id) => `${id} y=${tops[id]}`).join(', ')})`);
