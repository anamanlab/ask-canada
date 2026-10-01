// Unit checks for the border-wait answer text and local emergency numbers:
// node --test src/countries/ca/widgets/travel/waits.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { byWait, crossingList, summarizeWaits } = await import('./waits.ts');
const { emergencyText, stampText, updatedText } = await import('./select.ts');
const { longDate } = await import('./scenario/text.ts');

const at = (name, minutes) => ({ id: name, name, travellers: { minutes }, commercial: { minutes: null }, updated: '' });

test('crossing lists use the conjunction once', () => {
  const two = [at('Ambassador Bridge', 10), at('Gordie Howe International Bridge', 10)];
  const three = [...two, at('Detroit-Windsor Tunnel', 10)];
  const four = [...three, at('Blue Water Bridge', 10)];
  const five = [...four, at('Peace Bridge', 10)];
  assert.equal(crossingList(two.slice(0, 1), 'en'), 'Ambassador Bridge');
  assert.equal(crossingList(two, 'en'), 'Ambassador Bridge and Gordie Howe International Bridge');
  assert.equal(crossingList(three, 'en'), 'Ambassador Bridge, Gordie Howe International Bridge and Detroit-Windsor Tunnel');
  assert.equal(crossingList(three, 'fr'), 'Ambassador Bridge, Gordie Howe International Bridge et Detroit-Windsor Tunnel');
  assert.equal(crossingList(four, 'en'), 'Ambassador Bridge, Gordie Howe International Bridge and 2 more crossings');
  assert.equal(crossingList(four, 'fr'), 'Ambassador Bridge, Gordie Howe International Bridge et 2 autres postes');
  assert.equal(crossingList(five, 'fr'), 'Ambassador Bridge, Gordie Howe International Bridge et 3 autres postes');
  for (const list of [three, four, five]) {
    for (const lang of ['en', 'fr']) {
      const and = lang === 'fr' ? ' et ' : ' and ';
      assert.equal(crossingList(list, lang).split(and).length, 2, `one "${and.trim()}" for ${list.length} (${lang})`);
    }
  }
});

test('three crossings tied for the next-longest wait', () => {
  const sum = summarizeWaits([at('Pacific Highway', 25), at('Ambassador Bridge', 10), at('Gordie Howe International Bridge', 10), at('Peace Bridge', 10), at('Lacolle', 0)]);
  assert.equal(sum.max, 25);
  assert.equal(sum.next?.minutes, 10);
  assert.equal(sum.next?.crossings.length, 3);
  assert.equal(crossingList(sum.next.crossings, 'fr'), 'Ambassador Bridge, Gordie Howe International Bridge et Peace Bridge');
});

test('estimates older than two hours are never the current longest wait', () => {
  // CBSA's CSV at 01:39 EDT on 2026-10-01: Aldergrove still carried 20 minutes from 13:56 PDT the day before.
  const row = (name, minutes, updated) => ({ ...at(name, minutes), updated });
  const rows = [row('Aldergrove', 20, '2026-09-30 13:56 PDT'), row('Fort Frances Bridge', 0, '2026-09-30 05:15 CDT'), row('Peace Bridge', 0, '2026-10-01 01:20 EDT'), row('Douglas', 5, '2026-09-30 22:30 PDT')];
  const now = Date.parse('2026-10-01T01:39:00-04:00');
  const sum = summarizeWaits(rows, 'travellers', now);
  assert.equal(sum.max, 5);
  assert.deepEqual(sum.top.map((c) => c.name), ['Douglas']);
  assert.equal(sum.clear, 1);
  assert.equal(sum.total, 2);
  assert.equal(sum.stale, 2);
  // Current rows first (longest wait on top), then the stale ones.
  assert.deepEqual([...rows].sort(byWait('travellers', now)).map((c) => c.name), ['Douglas', 'Peace Bridge', 'Aldergrove', 'Fort Frances Bridge']);
  // Without a clock nothing is treated as stale (answers saved before `asOf` existed).
  assert.equal(summarizeWaits(rows).max, 20);
  // Every row stale: no current longest wait at all.
  assert.equal(summarizeWaits(rows.slice(0, 2), 'travellers', now).max, null);
});

test('times read the same on every card, without a leading zero', () => {
  const sp = (s) => s.replace(/\u00a0/g, ' ');
  assert.equal(sp(stampText('2026-09-30 07:47 ADT', 'en')), '7:47 a.m. ADT');
  assert.equal(sp(stampText('2026-09-30 07:47 ADT', 'fr')), '7 h 47 HAA');
  assert.equal(sp(stampText('2026-09-30 00:05 EDT', 'fr')), '0 h 05 HAE');
  assert.equal(sp(stampText('2026-09-30 12:30 PDT', 'en')), '12:30 p.m. PDT');
  assert.equal(sp(updatedText('2026-09-29T04:14:00-04:00', 'fr')), '29 sept., 4 h 14 HAE');
  assert.match(sp(updatedText('2026-09-29T14:42:00-04:00', 'en')), /^Sep\.? 29, 2:42 p\.m\. EDT$/);
});

test('French writes the first of the month as « 1er », and only the first', () => {
  const sp = (s) => s.replace(/[\u00a0\u202f]/g, ' ');
  assert.equal(sp(updatedText('2026-10-01T09:05:00-04:00', 'fr')), '1er oct., 9 h 05 HAE');
  assert.equal(sp(stampText('2026-10-01 07:47 EDT', 'fr', { date: true })), '1er oct., 7 h 47 HAE');
  assert.equal(sp(longDate('2026-10-01T09:05:00-04:00', 'fr')), '1er octobre');
  // Late evening on Sep 30 in UTC-4 is already Oct 1 in UTC: the day follows Ottawa time.
  assert.equal(sp(longDate('2026-10-01T02:00:00Z', 'fr')), '30 septembre');
  assert.equal(sp(longDate('2026-10-11T12:00:00-04:00', 'fr')), '11 octobre');
  assert.equal(sp(updatedText('2026-10-10T09:05:00-04:00', 'fr')), '10 oct., 9 h 05 HAE');
  assert.equal(sp(updatedText('2026-10-21T09:05:00-04:00', 'fr')), '21 oct., 9 h 05 HAE');
  assert.equal(sp(longDate('2026-10-01T09:05:00-04:00', 'en')), 'October 1');
  assert.match(sp(updatedText('2026-10-01T09:05:00-04:00', 'en')), /^Oct\.? 1, 9:05 a\.m\. EDT$/);
});

test('local emergency numbers name each service when there is no single number', () => {
  // Thailand (travel.gc.ca, 2026-09-30): police 191, medical assistance 1669, firefighters 199.
  const th = { numbers: [{ label: 'Police', number: '191' }, { label: 'Tourist police', number: '1155' }, { label: 'Medical assistance', number: '1669' }, { label: 'Firefighters', number: '199' }] };
  assert.equal(emergencyText(th), '191 (police), 1669 (medical assistance), 199 (firefighters)');
  // Japan: 110 police, 119 for both medical assistance and firefighters.
  const jp = { numbers: [{ label: 'Police', number: '110' }, { label: 'Medical assistance', number: '119' }, { label: 'Firefighters', number: '119' }] };
  assert.equal(emergencyText(jp), '110 (police), 119 (medical assistance, firefighters)');
  // French labels group and rank the same way.
  const thFr = { numbers: [{ label: 'Police', number: '191' }, { label: 'Police touristique', number: '1155' }, { label: 'Assistance médicale', number: '1669' }, { label: 'Pompiers', number: '199' }] };
  assert.equal(emergencyText(thFr), '191 (police), 1669 (assistance médicale), 199 (pompiers)');
  assert.equal(emergencyText({ primary: '911', numbers: [] }), '911');
  assert.equal(emergencyText({ numbers: [] }), undefined);
});
