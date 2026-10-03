#!/usr/bin/env node
// Renders a widget's `messages/pt.json` + `messages/en.json` from `catalog.data.json`.
//
//   node src/countries/br/widgets/<id>/messages/render.mjs
//
// Same contract as the pack-level renderer: one source, both languages, placeholders must match.
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./catalog.data.json', import.meta.url), 'utf8'));

const problems = [];
const fail = (m) => {
  problems.push(m);
  console.log('✗ ' + m);
};

const placeholders = (s) => new Set([...s.matchAll(/\{([A-Za-z_][\w]*)(?=[,}])/g)].map((m) => m[1]));
const samePlaceholders = (a, b) => {
  const pa = placeholders(a);
  const pb = placeholders(b);
  return pa.size === pb.size && [...pa].every((x) => pb.has(x));
};

const flat = [];
for (const [key, value] of Object.entries(raw)) {
  if (key.startsWith('_')) continue;
  if (!value || typeof value !== 'object' || !('pt' in value) || !('en' in value)) {
    fail(`${key}: needs both "pt" and "en"`);
    continue;
  }
  flat.push({ key, pt: value.pt, en: value.en });
}

for (const entry of flat) {
  for (const lang of ['pt', 'en']) {
    const s = entry[lang];
    if (typeof s !== 'string' || !s.trim()) {
      fail(`${entry.key}.${lang}: empty`);
      continue;
    }
    if (/[`]/.test(s)) fail(`${entry.key}.${lang}: backtick`);
    if (/[一-鿿Ѐ-ӿ぀-ヿ]/.test(s)) fail(`${entry.key}.${lang}: unexpected script`);
    if (/ {2}/.test(s)) fail(`${entry.key}.${lang}: double space`);
  }
  if (!samePlaceholders(entry.pt, entry.en)) {
    fail(`${entry.key}: placeholders differ (pt ${[...placeholders(entry.pt)]} vs en ${[...placeholders(entry.en)]})`);
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s); nothing written`);
  process.exit(1);
}

for (const lang of ['pt', 'en']) {
  const body = JSON.stringify(Object.fromEntries(flat.map((e) => [e.key, e[lang]])), null, 2);
  writeFileSync(new URL(`./${lang}.json`, import.meta.url), body + '\n');
  console.log(`✓ messages/${lang}.json (${flat.length} keys)`);
}
console.log(`\n✓ ${flat.length} widget keys rendered in pt and en`);