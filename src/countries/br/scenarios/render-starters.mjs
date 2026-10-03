#!/usr/bin/env node
// Renders `scenarios/starters.ts` from `starters.data.json`.
//
//   node src/countries/br/scenarios/render-starters.mjs
//
// Each entry becomes one Scenario: a `#` verdict line, a body, an optional note, and a numbered citation to
// the official page named by `url`. The prose is the part a native speaker reviews, so it lives in the JSON;
// this file only assembles it and refuses to emit anything it cannot verify.
import { readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
register(join(here, '..', '..', '..', '..', 'scripts', 'lib', 'ts-hooks.mjs'), { parentURL: import.meta.url });

const DATA = JSON.parse(readFileSync(new URL('./starters.data.json', import.meta.url), 'utf8'));

/**
 * The cited pages and their titles, imported from the one place that owns both: `scenarios/titles.ts`, where
 * `withTitles()` rewrites every citation at load time. A second copy of the URL list here is a list that
 * drifts, and a URL with no title renders as a bare slug in the source card.
 */
const { U: URLS, TITLES } = await import('./titles.ts');

const CHECKED = '2026-10-02';

/**
 * Repair `[[a-z][a-z]]` — what accent-folding leaves behind when a letter was already inside a character
 * class. Applied to every pattern at render time so the source data can be written either way and a bad
 * pattern can never reach `new RegExp`.
 */
function collapseNestedClasses(src) {
  let out = src;
  for (let prev = null; out !== prev; ) {
    prev = out;
    out = out.replace(/\[\[([^\[\]]+)\]\[[^\[\]]+\]\]/g, '[$1]');
  }
  return out;
}

/**
 * Prose markers of the failure mode this file keeps hitting: a Portuguese sentence with a machine token
 * welded into it. Each entry is a string this renderer has actually caught. Add to it when it happens again.
 */
const GARBLE = ['Financing', 'estamos', 'técnicos,Ua', 'Collector', 'GmbH', 'Supplier', 'AboutUs'];

const problems = [];
const fail = (m) => {
  problems.push(m);
  console.log('✗ ' + m);
};

const entries = Object.entries(DATA).filter(([k]) => !k.startsWith('_'));

for (const [id, spec] of entries) {
  if (!/^[a-z]+(-[a-z]+)+$/.test(id)) fail(`${id}: id is not kebab-case`);
  if (!(spec.url in URLS)) fail(`${id}: url "${spec.url}" is not one of the keys in titles.ts`);
  else {
    for (const lang of ['pt', 'en']) {
      // `withTitles()` only rewrites citations it has a title for, so a URL without one ships as a bare slug.
      if (!(URLS[spec.url] in TITLES[lang])) fail(`${id}: url "${spec.url}" has no ${lang} page title in titles.ts`);
    }
  }
  if (!Array.isArray(spec.match) || spec.match.length !== 2) fail(`${id}: match needs exactly two patterns (pt, en)`);
  // `extra` widens a starter to the follow-ups a person would naturally ask next, so the chips the product
  // offers always resolve. Each entry is checked like a `match` pattern.
  if (spec.extra !== undefined && (!Array.isArray(spec.extra) || spec.extra.length !== 2)) {
    fail(`${id}.extra: needs exactly two patterns (pt, en)`);
  }
  // `exclude` stops a starter from stealing a neighbouring topic the router would otherwise route here.
  if (spec.exclude !== undefined && (!Array.isArray(spec.exclude) || spec.exclude.length !== 2)) {
    fail(`${id}.exclude: needs exactly two patterns (pt, en)`);
  }
  // Every pattern the scenario will compile, with the field it came from so a failure names it.
  const patterns = [
    ...(spec.match ?? []).map((p) => ['match', p]),
    ...(spec.extra ?? []).map((p) => ['extra', p]),
    ...(spec.exclude ?? []).map((p) => ['exclude', p]),
  ];
  for (const [field, pattern] of patterns) {
    if (/\[\[/.test(pattern)) fail(`${id}.${field}: pattern has a nested character class -> ${pattern}`);
    try {
      new RegExp(pattern, 'i');
    } catch (e) {
      fail(`${id}.${field}: invalid regex -> ${e.message}`);
    }
  }
  for (const field of ['verdict', 'body']) {
    for (const lang of ['pt', 'en']) {
      const s = spec[field]?.[lang];
      if (typeof s !== 'string' || !s.trim()) {
        fail(`${id}.${field}.${lang}: empty`);
        continue;
      }
      for (const marker of GARBLE) if (s.includes(marker)) fail(`${id}.${field}.${lang}: garbled prose "${marker}"`);
    }
  }
  if (spec.note) {
    for (const lang of ['pt', 'en']) {
      if (typeof spec.note[lang] !== 'string' || !spec.note[lang]?.trim()) {
        fail(`${id}.note.${lang}: empty`);
        continue;
      }
      for (const marker of GARBLE) if (spec.note[lang].includes(marker)) fail(`${id}.note.${lang}: garbled prose "${marker}"`);
    }
  }
  const fu = spec.followUps;
  if (!fu || !Array.isArray(fu.pt) || !Array.isArray(fu.en)) fail(`${id}.followUps: needs pt and en arrays`);
  else {
    // check:scenarios requires at least two follow-ups per language.
    for (const lang of ['pt', 'en']) if (fu[lang].length < 2) fail(`${id}.followUps.${lang}: needs 2+`);
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s); nothing written`);
  process.exit(1);
}

/** `# verdict\n\nbody\n\ncitation`, with the note as a final short paragraph. */
function assemble(spec, lang) {
  const cite = `[1](${URLS[spec.url]})`;
  const parts = [`# ${spec.verdict[lang]}`, spec.body[lang]];
  if (spec.note) parts.push(spec.note[lang]);
  parts.push(cite);
  return parts.join('\n\n');
}

const body = `/**
 * Starter scenarios (foundation-owned): a sourced answer for every question the landing page and Menu
 * promote (the hero chips, the rotating examples, the service rows) and their natural rephrasings.
 *
 * They sit at priority 1 so a widget's own scenario (priority >= 6) always wins once it exists.
 * \`pnpm check:scenarios --country br\` proves every promoted question resolves here, never the fallback.
 *
 * GENERATED by \`node src/countries/br/scenarios/render-starters.mjs\` from \`starters.data.json\`.
 * Edit the JSON, never this file.
 *
 * The shape of every answer is the same on purpose: what the rule is, where the official page is, and —
 * where it matters — what this service will not do (take a CPF, promise an amount, file a request).
 * Nothing is asserted that has not been read on the linked page.
 */
import type { Scenario } from '@/lib/scripted/types';

const CHECKED = '${CHECKED}';

const STARTERS = ${JSON.stringify(
  entries.map(([id, spec]) => ({
    id,
    match: [...spec.match, ...(spec.extra ?? [])].map(collapseNestedClasses),
    reply: { pt: assemble(spec, 'pt'), en: assemble(spec, 'en') },
    followUps: spec.followUps,
    exclude: (spec.exclude ?? []).map(collapseNestedClasses),
  })),
  null,
  2,
)};

const scenarios: Scenario[] = STARTERS.map((s) => ({
  id: s.id,
  priority: 1,
  // Patterns are authored accent-folded (see render-starters.mjs), so a question typed without accents
  // still routes. All of them are matched case-insensitively.
  match: s.match.map((pattern) => new RegExp(pattern, 'i')),
  exclude: s.exclude.map((pattern) => new RegExp(pattern, 'i')),
  reply: s.reply,
  checked: CHECKED,
  followUps: s.followUps,
}));

export default scenarios;
`;

writeFileSync(new URL('./starters.ts', import.meta.url), body);
console.log(`✓ starters.ts (${entries.length} starters, pt + en)`);

// Every service starter promoted by the catalog must be reachable: check-scenarios does the real check.
console.log(`\n✓ ${entries.length} starters rendered; run \`pnpm check:scenarios -- --country br\` to prove coverage`);