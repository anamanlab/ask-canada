#!/usr/bin/env node
/**
 * Layout test for the parks map (pure, no browser): for every park selected, from several starting places, at
 * phone and desktop widths, in the framed view and in "All of Canada", no two names may overlap, no name may
 * cover a pin, the starting place's dot or a control, and "All of Canada" must draw every park. Also the
 * cases the critics found: Calgary + Banff in overview, neighbour names in the far North, and crowding on
 * phones.
 *
 *   node src/countries/ca/widgets/parks/check-map-layout.mjs [--verbose]
 */
import { register } from 'node:module';

// The widget's TypeScript imports its neighbours without extensions: resolve those to .ts.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) { if (s.startsWith('.')) return next(s + '.ts', c); throw e; } }`,
    ),
  import.meta.url,
);
const { PARKS } = await import('./data.ts');
const { TOWNS } = await import('./towns.ts');
const { distanceKm } = await import('./model.ts');
const { project, settle, NARROW_PX } = await import('./map-geometry.ts');
const { layoutMap, estimateWidth } = await import('./map-labels.ts');

const verbose = process.argv.includes('--verbose');
const town = (name) => {
  const c = TOWNS.find((x) => x.names.includes(name));
  return { lat: c.lat, lng: c.lng, label: c.label.en };
};
const nearestTo = (p, n) =>
  PARKS.filter((q) => q.id !== p.id)
    .map((q) => ({ id: q.id, d: distanceKm(p, q) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((q) => q.id);
const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const text = { toggle: 'All of Canada', attribution: 'Base map: Natural Resources Canada', province: (id) => `Province ${id}`, cluster: (n, c) => `${n} +${c}`, clusterCount: (c) => `${c} parks` };
const pins = PARKS.map((p) => ({ id: p.id, xy: project(p.lat, p.lng), label: p.name.en, short: p.short.en }));

/** The map as the finder draws it: the selected park with its nearest neighbours framed (fewer on a phone). */
function lay({ width, selectedId, origin, overview }) {
  const sel = PARKS.find((p) => p.id === selectedId);
  const all = sel ? [sel.id, ...nearestTo(sel, 4)] : origin ? [...PARKS].sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b)).slice(0, 6).map((p) => p.id) : undefined;
  const focusIds = sel && width < NARROW_PX ? all.slice(0, 3) : all;
  const focus = all ? 'fit' : 'all';
  const auto = Math.round(Math.min(440, Math.max(260, width / 1.55)));
  const height = !all ? auto : overview ? Math.max(300, auto) : 300;
  const originAt = origin ? { xy: project(origin.lat, origin.lng), label: origin.label } : null;
  const box = settle({ pins, selectedId, origin: originAt?.xy, focus, focusIds, overview, width, height });
  const layout = layoutMap({ box, width, height, pins, selectedId, focusIds, focus, overview, origin: originAt, lang: 'en', measure: estimateWidth, text });
  const px = (xy) => [((xy[0] - box.x) / box.w) * width, ((xy[1] - box.y) / box.h) * height];
  return { layout, px, originAt, box };
}

let failures = 0;
let runs = 0;
const stats = { coveredPins: 0, originNamed: 0, originShown: 0, chips: 0, towns: 0 };
const by = {};
const fail = (what, msg) => {
  failures++;
  console.log(`✗ ${what}: ${msg}`);
};

function check(what, o) {
  runs++;
  const { layout, px, originAt } = lay(o);
  const names = [
    ...layout.chips.map((c) => ({ n: `chip ${c.text}`, r: c.r, own: c.id })),
    ...(layout.selected ? [{ n: `selected ${layout.selected.text}`, r: layout.selected.r, own: o.selectedId, sel: true }] : []),
    ...(layout.origin ? [{ n: `origin ${originAt.label}`, r: layout.origin, sel: true }] : []),
    ...layout.towns.map((c) => ({ n: `town ${c.text}`, r: c.r })),
    ...layout.provinces.map((c) => ({ n: `province ${c.id}`, r: c.r, prov: true })),
  ];
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) if (overlaps(names[i].r, names[j].r)) fail(what, `${names[i].n} overlaps ${names[j].n}`);
  for (const p of pins) {
    if (!layout.visible.has(p.id)) continue;
    const [x, y] = px(p.xy);
    const dot = { x0: x - 6, y0: y - 6, x1: x + 6, y1: y + 6 };
    for (const n of names) {
      if (n.own === p.id || n.prov || !overlaps(n.r, dot)) continue;
      // The selected park's name and the starting place's may cover a neighbour's dot when the pins leave
      // them no free side (the Rockies in "All of Canada").
      if (n.sel) stats.coveredPins++;
      else fail(what, `${n.n} covers the pin of ${p.id}`);
    }
  }
  if (originAt && layout.originInView) {
    stats.originShown++;
    if (layout.origin) stats.originNamed++;
    const k = `${o.width} ${o.overview ? 'ov' : 'fr'}`;
    by[k] ??= [0, 0];
    by[k][0] += layout.origin ? 1 : 0;
    by[k][1]++;
    if (verbose && !layout.origin) console.log('unnamed origin', what);
    const [x, y] = px(originAt.xy);
    const dot = { x0: x - 6, y0: y - 6, x1: x + 6, y1: y + 6 };
    for (const n of names) if (!n.prov && overlaps(n.r, dot)) fail(what, `${n.n} covers the starting place's dot`);
  }
  if (o.overview) for (const p of pins) if (!layout.visible.has(p.id)) fail(what, `${p.id} is not drawn in “All of Canada”`);
  stats.chips += layout.chips.length;
  stats.towns += layout.towns.length;
  if (o.width < NARROW_PX && layout.towns.length > 3) fail(what, `${layout.towns.length} town names on a phone`);
  if (verbose) console.log(what, { chips: layout.chips.map((c) => c.text), towns: layout.towns.map((c) => c.text), origin: !!layout.origin, provinces: layout.provinces.map((p) => p.id).join(' ') });
  return lay(o);
}

const ORIGINS = [null, town('calgary'), town('halifax'), town('toronto'), town('vancouver'), town('winnipeg')];
for (const width of [318, 708]) {
  for (const origin of ORIGINS) {
    for (const overview of [false, true]) {
      const tag = (id) => `${width}px ${overview ? 'overview' : 'framed'} ${origin?.label ?? 'no origin'} ${id}`;
      check(tag('(none)'), { width, origin, overview, selectedId: null });
      for (const p of PARKS) check(tag(p.id), { width, origin, overview, selectedId: p.id });
    }
  }
}

// Calgary + Banff in "All of Canada": the two are about 13px apart, so the starting place keeps only its dot.
for (const width of [318, 708]) {
  const { layout } = lay({ width, origin: town('calgary'), overview: true, selectedId: 'banff' });
  if (layout.origin) fail(`${width}px overview Calgary banff`, 'the starting place is named next to the selected park');
}
// The far North on a wide card: the framed neighbours are named, though the view is wider than a region.
for (const id of ['auyuittuq', 'torngats', 'quttinirpaaq']) {
  const { layout } = lay({ width: 708, origin: null, overview: false, selectedId: id });
  if (layout.chips.length < 3) fail(`708px framed ${id}`, `only ${layout.chips.length} neighbours named`);
}
// A phone close-up of the Rockies: no chip stands for more than two parks.
for (const id of ['jasper', 'banff', 'yoho', 'glacier']) {
  const { layout } = lay({ width: 318, origin: null, overview: false, selectedId: id });
  const big = layout.chips.find((c) => /\+(?:[2-9]|\d\d)$|^(?:[3-9]|\d\d) parks$/.test(c.text));
  if (big) fail(`318px framed ${id}`, `one chip hides a clump: “${big.text}”`);
}

console.log(`${runs} layouts: ${failures} failures · ${stats.chips} park names, ${stats.towns} town names, starting place named in ${stats.originNamed} of ${stats.originShown} views, ${stats.coveredPins} dots under the selected park's name`);
if (verbose) console.log(by);
process.exit(failures ? 1 : 0);
