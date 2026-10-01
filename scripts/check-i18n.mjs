#!/usr/bin/env node
// Official Languages parity check.
//  1. Every literal key passed to t('…') in core/pack code exists in the core + pack EN and FR catalogs.
//  2. Every widget catalog has the same keys in en.json and fr.json, and every literal key used in the
//     widget's files exists in its catalog.
// Dynamic keys (template strings) are skipped. Exit code 1 on any problem.
//   node scripts/check-i18n.mjs [--country ca]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const country = process.argv.includes('--country') ? process.argv[process.argv.indexOf('--country') + 1] : 'ca';
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
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

// 1. Core + pack catalogs
const catalogs = {};
for (const l of ['en', 'fr']) {
  catalogs[l] = { ...read(`src/lib/i18n/messages/${l}.json`), ...read(`src/countries/${country}/messages/${l}.json`) };
}
for (const k of Object.keys(catalogs.en)) if (!(k in catalogs.fr)) fail(`missing FR key: ${k}`);
for (const k of Object.keys(catalogs.fr)) if (!(k in catalogs.en)) fail(`missing EN key: ${k}`);

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
  const fr = JSON.parse(readFileSync(join(mdir, 'fr.json'), 'utf8'));
  for (const k of Object.keys(en)) if (!(k in fr)) fail(`widgets/${id}: missing FR key ${k}`);
  for (const k of Object.keys(fr)) if (!(k in en)) fail(`widgets/${id}: missing EN key ${k}`);
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
    const l = f.replace(/\.json$/, '');
    if (l === 'en' || l === 'fr' || !f.endsWith('.json')) continue;
    const cat = read(`${dir}/${f}`);
    for (const [k, v] of Object.entries(cat)) {
      if (!(k in en)) fail(`${dir}/${f}: unknown key ${k}`);
      else if (!same(placeholders(v), placeholders(en[k]))) fail(`${dir}/${f}: placeholders differ from English in ${k}`);
    }
  }
}

console.log(problems ? `\n${problems} problem(s)` : '✓ EN/FR catalogs are in parity, other languages match English placeholders, and every literal key exists');
process.exit(problems ? 1 : 0);
