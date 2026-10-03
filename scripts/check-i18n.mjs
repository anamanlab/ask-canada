#!/usr/bin/env node
// Official Languages parity check.
//  1. Every literal key passed to t('…') in core/pack code exists in the core + pack EN and <second> catalogs.
//  2. Every widget catalog has the same keys in en.json and <second>.json, and every literal key used in the
//     widget's files exists in its catalog.
// <second> is the pack's second reviewed language: whatever catalog sits beside en.json in the pack
// (`fr` for Canada, `pt` for Brazil).
// Dynamic keys (template strings) are skipped. Exit code 1 on any problem.
//   node scripts/check-i18n.mjs [--country ca]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { LOCALES } from './lib/locales.mjs';

const root = new URL('..', import.meta.url).pathname;
const country = process.argv.includes('--country') ? process.argv[process.argv.indexOf('--country') + 1] : 'ca';
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
/** Only a file named after a real locale is a catalog; a pack may keep source data beside its catalogs. */
const isCatalog = (name) => LOCALES.includes(name.replace(/\.json$/, ''));
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs)$/.test(f)) out.push(p);
  }
  return out;
};
const keysIn = (file) => {
  const src = readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
    .join('\n');
  return [...src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'/g)].map((m) => m[1]);
};

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log('✗ ' + msg);
};

// The pack's second reviewed language, read from the one declaration of it: `pack.locales.official` in
// pack.ts (`fr` for Canada, `pt` for Brazil). Parsed as text rather than imported, so this stays a plain
// JSON check with no TypeScript loader, and so a pack that ships extra interface languages (ar, pa, zh-Hans…)
// is not mistaken for its official pair.
const packSrc = readFileSync(join(root, `src/countries/${country}/pack.ts`), 'utf8');
const official = [...(packSrc.match(/official:\s*\[([^\]]*)\]/) ?? ['', ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const second = official.find((l) => l !== 'en') ?? fail(`could not read pack.locales.official from ${country}/pack.ts`) ?? 'fr';

// 1. Core + pack catalogs
const catalogs = {};
for (const l of ['en', second]) {
  catalogs[l] = { ...read(`src/lib/i18n/messages/${l}.json`), ...read(`src/countries/${country}/messages/${l}.json`) };
}
for (const k of Object.keys(catalogs.en)) if (!(k in catalogs[second])) fail(`missing ${second.toUpperCase()} key: ${k}`);
for (const k of Object.keys(catalogs[second])) if (!(k in catalogs.en)) fail(`missing EN key: ${k}`);

const widgetDir = join(root, `src/countries/${country}/widgets`);
const coreFiles = walk(join(root, 'src')).filter(
  (f) => !/\/countries\/[^/]+\/widgets\//.test(f) && !(/\/countries\//.test(f) && !f.includes(`/countries/${country}/`)),
);
for (const f of coreFiles) {
  for (const k of keysIn(f)) if (!(k in catalogs.en)) fail(`${relative(root, f)}: unknown key "${k}"`);
}

// 2. Widget catalogs
for (const id of readdirSync(widgetDir)) {
  const dir = join(widgetDir, id);
  if (!statSync(dir).isDirectory()) continue;
  const mdir = join(dir, 'messages');
  if (!existsSync(join(mdir, 'en.json'))) continue;
  const en = JSON.parse(readFileSync(join(mdir, 'en.json'), 'utf8'));
  const other = JSON.parse(readFileSync(join(mdir, `${second}.json`), 'utf8'));
  for (const k of Object.keys(en)) if (!(k in other)) fail(`widgets/${id}: missing ${second.toUpperCase()} key ${k}`);
  for (const k of Object.keys(other)) if (!(k in en)) fail(`widgets/${id}: missing EN key ${k}`);
  for (const f of walk(dir)) {
    for (const k of keysIn(f)) if (!(k in en) && !(k in catalogs.en)) fail(`${relative(root, f)}: unknown key "${k}"`);
  }
}

// 3. Other interface languages (core + pack): no stray keys, and the same {placeholders} as English.
//    Missing keys are allowed (they fall back to English); policy pages stay in the official languages.
const placeholders = (s) => new Set([...s.matchAll(/\{([A-Za-z_][\w]*)(?=[,}])/g)].map((m) => m[1]));
const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
for (const dir of ['src/lib/i18n/messages', `src/countries/${country}/messages`]) {
  const en = read(`${dir}/en.json`);
  for (const f of readdirSync(join(root, dir))) {
    if (!f.endsWith('.json') || !isCatalog(f)) continue;
    const l = f.replace(/\.json$/, '');
    if (l === 'en' || l === second) continue;
    const cat = read(`${dir}/${f}`);
    for (const [k, v] of Object.entries(cat)) {
      if (!(k in en)) fail(`${dir}/${f}: unknown key ${k}`);
      else if (!same(placeholders(v), placeholders(en[k]))) fail(`${dir}/${f}: placeholders differ from English in ${k}`);
    }
  }
}

console.log(
  problems
    ? `\n${problems} problem(s)`
    : `✓ EN/${second.toUpperCase()} catalogs are in parity, other languages match English placeholders, and every literal key exists`,
);
process.exit(problems ? 1 : 0);
