// Unit checks for the physical presence math: node --test src/countries/ca/widgets/citizenship/presence.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { calcPresence, isISO } = await import('./presence.ts');
const { choiceOrder } = await import('./quiz.ts');
const { BANK, drawQuestions } = await import('./quiz-bank.ts');

const TODAY = '2026-09-30';
const cases = [
  { prDate: '2024-10-21', tempStart: '2023-01-09', trips: [{ left: '2024-12-20', returned: '2025-01-06' }, { left: '2025-07-02', returned: '2025-07-16' }] },
  { prDate: '2025-01-15', tempStart: '2019-09-01' },
  { prDate: '2026-06-01' },
  { prDate: '2022-05-10', trips: [{ left: '2023-08-01', returned: '2023-08-22' }] },
  { prDate: '2024-02-29', tempStart: '2023-11-30', trips: [{ left: '2024-03-01', returned: '2024-03-01' }] },
];

test('the parts shown always add up: PR days + half days = total, total + still needed = 1,095', () => {
  for (const c of cases) {
    const r = calcPresence(c, TODAY);
    assert.ok(r);
    assert.equal(r.pr.present + r.temp.credit, r.total);
    if (r.shortfall > 0) assert.equal(r.total + r.shortfall, r.required);
    else assert.equal(r.total - r.surplus, r.required);
    assert.equal(r.total * 2, Math.round(r.total * 2), 'totals are whole or half days');
  }
});

test('leaving and coming back the same or next day is 0 days away', () => {
  const r = calcPresence({ prDate: '2023-01-01', trips: [{ left: '2025-05-01', returned: '2025-05-02' }] }, TODAY);
  assert.equal(r.trips[0].daysAway, 0);
});

test('time before PR is capped at 365 days', () => {
  const r = calcPresence({ prDate: '2025-01-15', tempStart: '2019-09-01' }, TODAY);
  assert.equal(r.temp.credit, 365);
  assert.ok(r.temp.capped);
});

test('practice test choices are shuffled: the answer is not stuck in one spot', () => {
  const spots = [0, 0, 0, 0];
  for (let seed = 1; seed <= 500; seed++) for (const q of BANK) spots[choiceOrder(q, seed).indexOf(q.answer)]++;
  const total = spots.reduce((a, b) => a + b, 0);
  for (const n of spots) assert.ok(n / total < 0.32, `answer position share ${n / total}`);
  for (const q of BANK) assert.deepEqual([...choiceOrder(q, 42)].sort(), q.choices.en.map((_, i) => i));
});

test('a full mock test drawn after a topic quiz covers every topic, so it carries no topic badge', () => {
  const history = drawQuestions(10, 'history', 3);
  assert.ok(history.every((q) => q.topic === 'history'));
  const full = drawQuestions(20, 'all', 4, history.map((q) => q.id));
  assert.equal(full.length, 20);
  assert.ok(new Set(full.map((q) => q.topic)).size >= 4, 'mixed topics');
  assert.ok(full.every((q) => !history.some((h) => h.id === q.id)), 'none of the questions just answered');
});

test('impossible dates are rejected, not rolled over to the next month', () => {
  for (const ok of ['2024-02-29', '2023-12-31', '2026-01-01']) assert.equal(isISO(ok), true, ok);
  for (const bad of ['2023-02-31', '2023-02-29', '2024-13-01', '2024-00-10', '2024-04-31', '2024-4-3', '', null]) assert.equal(isISO(bad), false, String(bad));
  assert.equal(calcPresence({ prDate: '2023-02-31' }, TODAY), null);
});
