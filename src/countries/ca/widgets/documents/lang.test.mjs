// Every French chip and question this widget sends must read as French to the scripted engine, so a French
// conversation on the English interface stays French: node --test src/countries/ca/widgets/documents/lang.test.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { detectLang, pickScenario } = await import('../../../../lib/scripted/engine.ts');
const { default: scenarios } = await import('../../scenarios/documents.ts');
const { searchForms } = await import('./forms-search.ts');
const fr = JSON.parse(readFileSync(new URL('./messages/fr.json', import.meta.url), 'utf8'));

const chips = [...new Set(scenarios.flatMap((s) => s.followUps?.fr ?? []))];
/** What the card itself sends as the person: every `*.ask` string, the picker's once per document title. */
const titles = Object.keys(fr).filter((k) => /^doc\.[^.]+\.title$/.test(k)).map((k) => fr[k]);
const asks = Object.entries(fr)
  .filter(([k]) => k.endsWith('.ask'))
  .flatMap(([k, v]) => (v.includes('{title}') ? titles.map((title) => [k, v.replace('{title}', title)]) : [[k, v]]));

test('there is something to check', () => {
  assert.ok(chips.length >= 15, `${chips.length} chips`);
  assert.ok(titles.length >= 10 && asks.length >= titles.length + 2);
});

test('each French follow-up chip is detected as French on the English interface', () => {
  for (const c of chips) assert.equal(detectLang(c, 'en'), 'fr', c);
});

test('each French question the card sends is detected as French on the English interface', () => {
  for (const [k, text] of asks) assert.equal(detectLang(text, 'en'), 'fr', `${k}: ${text}`);
});

test('English chips stay English', () => {
  for (const c of new Set(scenarios.flatMap((s) => s.followUps?.en ?? []))) assert.equal(detectLang(c, 'en'), 'en', c);
});

test('the widget’s own French chips and questions land on one of its scenarios', () => {
  const own = [...chips.filter((c) => !/remboursement d.impôt|signaler une arnaque/.test(c)), ...asks.filter(([k]) => k.startsWith('identify.')).map(([, v]) => v)];
  for (const text of own) assert.match(pickScenario([...scenarios], text, false)?.id ?? 'none', /^documents/, text);
});

test('the picker’s French question opens the document that was tapped', () => {
  for (const id of Object.keys(fr).flatMap((k) => k.match(/^doc\.([^.]+)\.title$/)?.[1] ?? [])) {
    const text = fr['identify.ask'].replace('{title}', fr[`doc.${id}.title`]);
    const s = pickScenario([...scenarios], text, false);
    assert.equal(s.toolCalls[0].input({ text, lang: 'fr' }).docType, id, text);
  }
});

test('a French "where do I find form X" chip searches for the form, not for its question words', () => {
  const run = (text) => {
    const s = pickScenario([...scenarios], text, false);
    return searchForms(s.toolCalls[0].input({ text, lang: 'fr' }).query, 'fr');
  };
  for (const code of ['T2201', 'T400A', 'RC213', 'INS5210', 'IMM 5476', 'ISP3550', 'ISP1000']) {
    assert.equal(run(`Où trouver le formulaire ${code}?`).results[0]?.code, code, code);
  }
  assert.equal(run('Où trouver un formulaire du gouvernement?').popular, true);
});
