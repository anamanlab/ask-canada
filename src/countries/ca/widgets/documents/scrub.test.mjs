// Unit checks for the redactor and the explainer's `redacted` flag: node --test src/countries/ca/widgets/documents/scrub.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { scrub } = await import('./scrub.ts');
const { explainDocument } = await import('./explain.ts');
const { findForms } = await import('./forms.ts');
const { searchForms, hitSources } = await import('./forms-search.ts');

const TODAY = '2026-09-30';

test('form numbers, year ranges and dates are kept', () => {
  for (const s of [
    'Fill out Form INS5210 within 30 days.',
    'Form ISP3550, IMM5476, NAS2120, CIT0002, ISP-1000 and T4A-OAS',
    'Your CCB for the 2026-2027 benefit year.',
    'July 2026-June 2027',
    'Benefit year 2026-27, issued 2026-07-10.',
    'Vous devez 412,37 $ au plus tard le 30 avril 2026.',
  ]) {
    assert.deepEqual(scrub(s), { text: s, hit: false }, s);
  }
});

test('reference, client, account, access-code and phone numbers are hidden', () => {
  for (const [s, gone] of [
    ['Client number 88127734 expires soon', '88127734'],
    ['Reference RZ2026-00412 on your letter', 'RZ2026-00412'],
    ['Call 1-800-959-8281 today', '1-800-959-8281'],
    ['Access code A1B2C3D4', 'A1B2C3D4'],
    ['Application W304512987', 'W304512987'],
    ['File 2026-1234567', '2026-1234567'],
    ['Case IMM54761234', 'IMM54761234'],
  ]) {
    const r = scrub(s);
    assert.equal(r.hit, true, s);
    assert.ok(!r.text.includes(gone), s);
  }
});

test('an EI decision naming Form INS5210 and a CCB notice for 2026-2027 are not flagged as redacted', () => {
  const ei = explainDocument(
    { docType: 'esdc-ei-decision', issuer: 'esdc', formCode: 'INS5210', issuedOn: '2026-09-21', summary: 'If you disagree, fill out Form INS5210 within 30 days.', actions: ['Send Form INS5210 by mail'] },
    TODAY,
  );
  assert.equal(ei.redacted, false);
  assert.equal(ei.extracted.formCode, 'INS5210');
  assert.match(ei.extracted.summary, /Form INS5210/);
  const ccb = explainDocument({ docType: 'cra-ccb-notice', issuer: 'cra', summary: 'Your CCB for the 2026-2027 benefit year (July 2026-June 2027).' }, TODAY);
  assert.equal(ccb.redacted, false);
  assert.match(ccb.extracted.summary, /2026-2027.*July 2026-June 2027/);
});

test('checking whether a message is real always leads with "Recognize a scam"', () => {
  for (const issuer of ['cra', 'unknown']) {
    assert.equal(explainDocument({ focus: 'verify', issuer }, TODAY).links[0].key, 'recognizeScam', issuer);
  }
});

test('a search on the device cites its own results, and the tool carries the pages to fall back on', () => {
  const tool = findForms('T2201', 'en');
  assert.equal(tool.results[0].online?.key, 'dtcApply');
  assert.match(tool.sources[0].title, /^T2201/);
  const pension = hitSources(searchForms('pension', 'en').results);
  assert.ok(pension.length > 0 && pension.every((s) => !/T2201/.test(s.title)));
  for (const k of ['craForms', 'scForms', 'irccForms']) assert.ok(tool.pages.some((p) => p.url === tool.more.find((x) => x.key === k).href), k);
  assert.equal(tool.pages.length, tool.altPages.length);
});
