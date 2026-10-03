#!/usr/bin/env node
// Scripted-answer coverage check (CI). Fails when a question the product itself suggests would get the
// generic fallback instead of a real answer:
//   1. every scenario's follow-up chips, in the pack's two reviewed languages;
//   2. every question the landing page and Menu promote (hero chips, rotating examples, service rows,
//      the flag demo), from the pack's EN and FR catalogs;
//   3. known rephrasings reach their scenario, and guard questions never reach a wrong one;
//   4. every scenario offers 2+ follow-ups in both reviewed languages.
//   node scripts/check-scenarios.mjs [--country ca] [--verbose]
import { register } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

process.env.COUNTRY ||= process.argv.includes('--country') ? process.argv[process.argv.indexOf('--country') + 1] : 'ca';
register('./lib/ts-hooks.mjs', import.meta.url);

const verbose = process.argv.includes('--verbose');
const country = process.env.COUNTRY;
// The pack's second reviewed language, from the one declaration of it: `pack.locales.official` in pack.ts.
const packSrc = readFileSync(new URL(`../src/countries/${country}/pack.ts`, import.meta.url), 'utf8');
const official = [...(packSrc.match(/official:\s*\[([^\]]*)\]/) ?? ['', ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const SECOND = official.find((l) => l !== 'en') ?? 'fr';
const langs = ['en', SECOND];
const { scenarios } = await import('@country/scenarios');
const { pickScenario } = await import('@/lib/scripted/engine');

const promoted = [];
for (const lang of langs) {
  const cat = JSON.parse(readFileSync(new URL(`../src/countries/${country}/messages/${lang}.json`, import.meta.url), 'utf8'));
  for (const [k, v] of Object.entries(cat)) {
    if (/^chip\.[^.]+\.q$|^services\.[^.]+\.starter$|^flag\.demo\.q$/.test(k)) promoted.push({ lang, from: k, q: v });
    // "Try “…”" / « Essayez « … » » examples: test the quoted question.
    if (/^(hero\.example\.\d+|closing\.placeholder(\.short)?)$/.test(k)) {
      const m = v.match(/[“«]\s*([^”»]+?)\s*[”»]\s*[»]?\s*$/);
      if (m) promoted.push({ lang, from: k, q: m[1] });
    }
  }
}

let problems = 0;
let checked = 0;
const check = (q, where) => {
  checked++;
  const s = pickScenario(scenarios, q, false);
  if (!s || s.id === 'fallback') {
    problems++;
    console.log(`✗ ${where}: “${q}” → fallback`);
  } else if (verbose) console.log(`✓ ${where}: “${q}” → ${s.id}`);
};

for (const s of scenarios) {
  for (const lang of langs) for (const q of s.followUps?.[lang] ?? []) check(q, `${s.id} followUps.${lang}`);
}
for (const p of promoted) check(p.q, `${p.lang}.json ${p.from}`);

// 3. Known rephrasings must reach their intended scenario (regression tests for real dead ends).
const paraFile = new URL(`../src/countries/${country}/scenarios/paraphrases.json`, import.meta.url);
if (existsSync(paraFile)) {
  const para = JSON.parse(readFileSync(paraFile, 'utf8'));
  for (const [id, qs] of Object.entries(para)) {
    if (id.startsWith('$')) continue;
    for (const q of qs) {
      checked++;
      const s = pickScenario(scenarios, q, false);
      if (s?.id !== id) {
        problems++;
        console.log(`✗ paraphrase for ${id}: “${q}” → ${s?.id ?? 'nothing'}`);
      } else if (verbose) console.log(`✓ paraphrase: “${q}” → ${id}`);
    }
  }
}

// 4. Guards: questions that must never reach a given scenario (a confident answer that would be wrong).
if (existsSync(paraFile)) {
  const never = JSON.parse(readFileSync(paraFile, 'utf8')).$never ?? {};
  for (const [id, qs] of Object.entries(never)) {
    if (id.startsWith('$')) continue;
    for (const q of qs) {
      checked++;
      const s = pickScenario(scenarios, q, false);
      if (!s || s.id === id || s.id === 'fallback') {
        problems++;
        console.log(`✗ guard for ${id}: “${q}” → ${s?.id ?? 'nothing'}`);
      } else if (verbose) console.log(`✓ guard: “${q}” → ${s.id} (not ${id})`);
    }
  }
}

// 5. Every scripted answer offers at least two “Ask next” chips, in English and French.
for (const s of scenarios) {
  for (const lang of langs) {
    checked++;
    if ((s.followUps?.[lang]?.length ?? 0) < 2) {
      problems++;
      console.log(`✗ ${s.id}: only ${s.followUps?.[lang]?.length ?? 0} follow-up(s) in ${lang} (need 2+)`);
    }
  }
}

console.log(problems ? `\n${problems} of ${checked} suggested questions failed (fallback, wrong route or missing follow-ups).` : `✓ All ${checked} suggested questions resolve to a real answer.`);
process.exit(problems ? 1 : 0);
