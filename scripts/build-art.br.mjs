#!/usr/bin/env node
// Builds the Brazil pack's landing artwork as standalone, cacheable SVG files in `public/art/br/`.
//
//   node scripts/build-art.br.mjs
//
// Every palette is baked in (no CSS variables), so each file works as a CSS background or an <img>, and none
// of it rides in the HTML or the React payload. The page swaps light and dark variants in CSS, and phones
// get the tighter `#m` crop defined inside each landscape file.
//
// The shape of the art is deliberately NOT Canada's. There is no aurora in Brazil, so where the Canada pack
// draws ribbons of light, this one draws ribbons of drifting cloud over a wide horizon: a low ridge line, a
// lagoon, and the long warm sky of a Brazilian afternoon turning to night. The mechanics are the same (the
// same drift animation, the same three ribbon transform origins) so the core CSS works untouched.
//
// Files, all 1600 × 600 with a `<view id="m">` phone crop on the landscapes:
//   land-hero-light.svg / land-hero-dark.svg   the hero
//   land-dusk-light.svg / land-dusk-dark.svg   the dusk section
//   land-night.svg                              the night section (one file for both themes)
//   sky-day.svg        + sky-day-1|2|3.svg      the drifting cloud ribbons (light)
//   sky-dusk.svg       + sky-dusk-1|2|3.svg     the dusk ribbons
//   sky-night.svg      + sky-night-1|2|3.svg    the night ribbons (also `auroraDark`)

import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/art/br/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 1600;
const H = 600;
/** The phone crop, matching the Canada pack's: the middle of the horizon at 2:1. */
const MOBILE = '<view id="m" viewBox="100 250 800 290" preserveAspectRatio="xMidYMax slice"/>';
const HEAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">`;
const MOBILE_HEAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${MOBILE}`;

const write = (name, svg) => {
  writeFileSync(new URL(name, OUT), svg.replace(/\n\s*/g, ''));
  console.log(`  ${name}`);
};

/* ---------------------------------------------------------------------------------------------------
 * Deterministic drawing helpers, so every build writes byte-identical files.
 * ----------------------------------------------------------------------------------------------- */

/** mulberry32: a small seeded PRNG in [0, 1). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1-D value noise on a lattice of spacing `cell`, valid for x in [0, span]. */
function noise1(seed, cell, span) {
  const r = rng(seed);
  const n = Math.ceil(span / cell) + 2;
  const lattice = Array.from({ length: n }, () => r());
  const at = (x) => {
    const i = Math.floor(x / cell);
    const f = x / cell - i;
    const s = f * f * (3 - 2 * f);
    return lattice[i] * (1 - s) + lattice[i + 1] * s;
  };
  return (x) => at(Math.max(0, Math.min(span, x)));
}

/** A ridge silhouette across the full width: fBm over 1-D noise, closed to the bottom edge. */
function ridge(seed, { base, amp, cell, step = 8, floor = H }) {
  const a = noise1(seed, cell, W);
  const b = noise1(seed + 977, cell / 2.4, W);
  let d = `M0 ${floor}`;
  for (let x = 0; x <= W; x += step) {
    const y = base - a(x) * amp - b(x) * amp * 0.34;
    d += `L${x} ${y.toFixed(1)}`;
  }
  return `${d}L${W} ${floor}Z`;
}

/* ---------------------------------------------------------------------------------------------------
 * Palettes. Warm paper and deep ink, with Brazil's green as the only saturated accent.
 * ----------------------------------------------------------------------------------------------- */

const PALETTE = {
  day: {
    skyTop: '#DCEAF2',
    skyMid: '#EFF2EC',
    skyLow: '#F6EFE2',
    glow: '#FBF3E2',
    ridgeFar: '#8FA39B',
    ridgeMid: '#4F6E60',
    ridgeNear: '#2C4738',
    water: '#C3D6D8',
    waterDeep: '#8FB0B6',
    haze: '#F6EFE2',
    cloud: '#FFFFFF',
  },
  dusk: {
    skyTop: '#4A4C74',
    skyMid: '#B36A5C',
    skyLow: '#E8A664',
    glow: '#FBD9A0',
    ridgeFar: '#6B5670',
    ridgeMid: '#43374F',
    ridgeNear: '#241F2E',
    water: '#8E6C74',
    waterDeep: '#4E4054',
    haze: '#E8A664',
    cloud: '#F7CFA4',
  },
  night: {
    skyTop: '#080E1C',
    skyMid: '#122036',
    skyLow: '#1E3550',
    glow: '#27415F',
    ridgeFar: '#16283C',
    ridgeMid: '#0D1B2A',
    ridgeNear: '#060C16',
    water: '#0F2133',
    waterDeep: '#08131F',
    haze: '#16283C',
    cloud: '#4E7099',
  },
};

const sky = (p) => `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.skyTop}"/><stop offset=".55" style="stop-color:${p.skyMid}"/><stop offset="1" style="stop-color:${p.skyLow}"/>
</linearGradient>
<radialGradient id="glow" cx=".5" cy=".92" r=".7">
<stop offset="0" style="stop-color:${p.glow}"/><stop offset="1" style="stop-color:${p.glow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.haze}"/><stop offset="1" style="stop-color:${p.haze}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.water}"/><stop offset="1" style="stop-color:${p.waterDeep}"/>
</linearGradient>
</defs>`;

/** The shared landscape drawing. `waterline` is where the lagoon starts. */
function land(p, waterline) {
  const far = ridge(11, { base: waterline - 96, amp: 74, cell: 330 });
  const mid = ridge(29, { base: waterline - 44, amp: 48, cell: 210 });
  const near = ridge(53, { base: waterline - 8, amp: 22, cell: 120 });
  return `${HEAD}${sky(p)}
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<ellipse cx="${W / 2}" cy="${H}" rx="${W * 0.62}" ry="${H * 0.55}" fill="url(#glow)"/>
<path d="${far}" fill="${p.ridgeFar}" opacity=".72"/>
<path d="${mid}" fill="${p.ridgeMid}"/>
<rect y="${waterline}" width="${W}" height="${H - waterline}" fill="url(#water)"/>
<path d="${near}" fill="${p.ridgeNear}"/>
<rect y="${waterline - 90}" width="${W}" height="90" fill="url(#haze)" opacity=".55"/>
</svg>`;
}

const landMobile = (p, waterline) => land(p, waterline).replace(HEAD, MOBILE_HEAD);

console.log('building public/art/br/');

// The hero: a low horizon with a wide lagoon. The phone crop keeps the horizon and the water.
write('land-hero-light.svg', landMobile(PALETTE.day, 404));
write('land-hero-dark.svg', landMobile(PALETTE.night, 404));
write('land-dusk-light.svg', landMobile(PALETTE.dusk, 418));
write('land-dusk-dark.svg', landMobile(PALETTE.night, 418));
write('land-night.svg', landMobile(PALETTE.night, 430));

/* ---------------------------------------------------------------------------------------------------
 * Cloud ribbons.
 *
 * The Canada pack drifts three blurred ribbons of light; this drifts three soft bands of cloud. Each
 * ribbon file is a 1680 × 600 drawing whose transform origin matches what landing.css expects
 * (y = 3, 40 and 237 of 600), and each is 40 units wider than the frame on both sides so a ribbon drifting
 * in is really there. Pure geometry: no animation inside the file, so the compositor does the moving.
 * ----------------------------------------------------------------------------------------------- */

/** One soft cloud band: a wide, low-frequency path filled with a vertical fade. */
function ribbon(seed, y, thickness, opacity) {
  const a = noise1(seed, 420, W + 80);
  const b = noise1(seed + 313, 190, W + 80);
  let top = `M-40 ${y.toFixed(0)}`;
  let bottom = '';
  for (let x = -40; x <= W + 40; x += 10) {
    const wobble = a(x) * thickness * 0.55 + b(x) * thickness * 0.22;
    top += `L${x} ${(y - wobble).toFixed(1)}`;
  }
  for (let x = W + 40; x >= -40; x -= 10) {
    const wobble = a(x) * thickness * 0.55 + b(x) * thickness * 0.22;
    bottom += `L${x} ${(y + thickness + wobble * 0.4).toFixed(1)}`;
  }
  return { d: `${top}${bottom}Z`, opacity };
}

function skyFile(p, originY, thickness, opacity, id) {
  const { d } = ribbon(id, originY, thickness, opacity);
  return `${HEAD}<defs>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.cloud}" stop-opacity="0"/>
<stop offset=".34" style="stop-color:${p.cloud}" stop-opacity=".9"/>
<stop offset=".62" style="stop-color:${p.cloud}" stop-opacity=".7"/>
<stop offset="1" style="stop-color:${p.cloud}" stop-opacity="0"/>
</linearGradient>
</defs>
<path d="${d}" fill="url(#fade)" opacity="${opacity}"/>
</svg>`;
}

/** Star field for the night sky. */
function stars() {
  const r = rng(7);
  let out = '';
  for (let i = 0; i < 90; i++) {
    const x = (r() * W).toFixed(0);
    const y = (r() * H * 0.62).toFixed(0);
    const rad = (0.7 + r() * 1.5).toFixed(1);
    out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#DCEAF2" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

/** Three ribbon files per sky: the y values match landing.css's per-ribbon transform origins. */
const SKIES = {
  day: { palette: PALETTE.day, stars: false },
  dusk: { palette: PALETTE.dusk, stars: false },
  night: { palette: PALETTE.night, stars: true },
};

for (const [name, spec] of Object.entries(SKIES)) {
  const p = spec.palette;
  // ribbon n maps to CSS transform origin y = 3 (n=2), 40 (n=1), 237 (n=3)
  write(`sky-${name}-1.svg`, skyFile(p, 40, 118, 0.5, 3));
  write(`sky-${name}-2.svg`, skyFile(p, 3, 92, 0.42, 17));
  write(`sky-${name}-3.svg`, skyFile(p, 237, 150, 0.34, 41));
  // The combined file, for social cards and the OG image.
  const one = skyFile(p, 120, 190, 0.44, 5);
  const two = skyFile(p, 3, 92, 0.42, 17);
  const three = skyFile(p, 237, 150, 0.34, 41);
  // Keep only the drawn paths: everything from the first <path up to (not including) the closing tag.
  const strip = (svg) => {
    const body = svg.slice(svg.indexOf('<path'));
    return body.slice(0, body.lastIndexOf('</svg>'));
  };
  write(
    `sky-${name}.svg`,
    `${HEAD}<defs>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.cloud}" stop-opacity="0"/>
<stop offset=".34" style="stop-color:${p.cloud}" stop-opacity=".9"/>
<stop offset=".62" style="stop-color:${p.cloud}" stop-opacity=".7"/>
<stop offset="1" style="stop-color:${p.cloud}" stop-opacity="0"/>
</linearGradient>
</defs>
${spec.stars ? stars() : ''}
${strip(two)}${strip(one)}${strip(three)}
</svg>`,
  );
}

/* ---------------------------------------------------------------------------------------------------
 * Phone-hero artwork.
 *
 * The core CSS knows five themed pairs by name and asks the pack for them (`pack.phoneArt`): the water
 * (`shore`), its mist, the boat, the near bank, and the closing panel's plain. Canada's are a lake, a canoe
 * and a prairie; these are a wide river estuary at golden hour, a small boat, and the cerrado horizon —
 * the same five roles, drawn for Brazil.
 * ----------------------------------------------------------------------------------------------- */

const SHORE_W = 840;
const SHORE_H = 560;
/** The water's line in the phone hero's crop. */
const SHORE_WATER = 300;

const shore = (p) => `${HEAD.replace(`0 0 ${W} ${H}`, `0 0 ${SHORE_W} ${SHORE_H}`)}<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.skyTop}"/><stop offset=".62" style="stop-color:${p.skyLow}"/><stop offset="1" style="stop-color:${p.glow}"/>
</linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.water}"/><stop offset="1" style="stop-color:${p.waterDeep}"/>
</linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.glow}"/><stop offset="1" style="stop-color:${p.glow}" stop-opacity="0"/>
</linearGradient>
</defs>
<rect width="${SHORE_W}" height="${SHORE_H}" fill="url(#sky)"/>
<ellipse cx="${SHORE_W * 0.62}" cy="${SHORE_WATER}" rx="${SHORE_W * 0.3}" ry="120" fill="url(#sun)"/>
<path d="${ridge(71, { base: SHORE_WATER - 6, amp: 16, cell: 150, step: 6, floor: SHORE_WATER })}" fill="${p.ridgeNear}"/>
<rect y="${SHORE_WATER}" width="${SHORE_W}" height="${SHORE_H - SHORE_WATER}" fill="url(#water)"/>
<g opacity=".3" fill="${p.glow}">
<rect x="${SHORE_W * 0.5}" y="${SHORE_WATER + 26}" width="90" height="4" rx="2"/>
<rect x="${SHORE_W * 0.46}" y="${SHORE_WATER + 70}" width="140" height="5" rx="2.5"/>
<rect x="${SHORE_W * 0.52}" y="${SHORE_WATER + 128}" width="120" height="4" rx="2"/>
<rect x="${SHORE_W * 0.44}" y="${SHORE_WATER + 196}" width="180" height="6" rx="3"/>
</g>
</svg>`;

/** A small boat, far off: a hull and one mast, the silhouette Canada's canoe also has. */
const boat = (p) => `${HEAD.replace(`0 0 ${W} ${H}`, `0 0 ${SHORE_W} ${SHORE_H}`)}<g fill="${p.ridgeNear}">
<path d="M356 372h58l-11 9h-36z"/>
<rect x="382" y="330" width="3" height="42" rx="1.5"/>
<path d="M385 334l20 14-20 4z" opacity=".85"/>
</g></svg>`;

/** The breath of mist on the water: three soft bands, animated in CSS. */
const mist = (p) => `${HEAD.replace(`0 0 ${W} ${H}`, `0 0 ${SHORE_W} ${SHORE_H}`)}<defs>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.haze}" stop-opacity="0"/>
<stop offset=".5" style="stop-color:${p.haze}" stop-opacity=".55"/>
<stop offset="1" style="stop-color:${p.haze}" stop-opacity="0"/>
</linearGradient>
</defs>
<g fill="url(#m)">
<rect x="120" y="330" width="620" height="54" rx="27"/>
<rect x="60" y="410" width="740" height="66" rx="33"/>
<rect x="170" y="500" width="560" height="50" rx="25"/>
</g></svg>`;

/** The near bank at the viewer's feet: a low dark edge with a few reed strokes. */
const fore = (p) => `${HEAD.replace(`0 0 ${W} ${H}`, `0 0 ${SHORE_W} ${SHORE_H}`)}<g fill="${p.ridgeNear}">
<path d="M0 470q120-26 250-8t210 22 380-6v82H0z"/>
<g opacity=".8" stroke="${p.ridgeNear}" stroke-width="3" stroke-linecap="round">
<path d="M84 470V404"/><path d="M104 470V392"/><path d="M124 470V410"/><path d="M700 470V400"/><path d="M722 470V388"/>
</g>
</g></svg>`;

/** The closing panel: the wide cerrado horizon at dusk. */
const prairie = (p) => `${HEAD}<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" style="stop-color:${p.skyTop}"/><stop offset=".62" style="stop-color:${p.skyMid}"/><stop offset="1" style="stop-color:${p.skyLow}"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<path d="${ridge(97, { base: H * 0.62, amp: 26, cell: 420, floor: H })}" fill="${p.ridgeMid}" opacity=".9"/>
<path d="${ridge(131, { base: H * 0.78, amp: 14, cell: 260, floor: H })}" fill="${p.ridgeNear}"/>
</svg>`;

console.log('phone hero:');
write('shore-light.svg', shore(PALETTE.day));
write('shore-dark.svg', shore(PALETTE.night));
write('shore-canoe-light.svg', boat(PALETTE.day));
write('shore-canoe-dark.svg', boat(PALETTE.night));
write('shore-mist-light.svg', mist(PALETTE.day));
write('shore-mist-dark.svg', mist(PALETTE.night));
write('shore-fore-light.svg', fore(PALETTE.day));
write('shore-fore-dark.svg', fore(PALETTE.night));
write('prairie-light.svg', prairie(PALETTE.dusk));
write('prairie-dark.svg', prairie(PALETTE.night));

console.log('\n✓ public/art/br/ built');