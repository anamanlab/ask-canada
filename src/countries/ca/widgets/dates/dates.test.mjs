// Unit checks for the holiday rules: node --test src/countries/ca/widgets/dates/dates.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
// The holiday rules don't need the country pack (brand, catalogs): a stub keeps this test to the widget's own files.
const PACK = 'data:text/javascript,' + encodeURIComponent('export const pack = { sources: { allowlist: ["canada.ca", "gc.ca", "canada-holidays.ca"] }, brand: {} };');
register('data:text/javascript,' + encodeURIComponent(`export const resolve = (s, c, next) => (s === '@/countries/active' ? { url: ${JSON.stringify(PACK)}, shortCircuit: true } : next(s, c));`));
const { HOLIDAYS_FALLBACK, STAT_COUNTS } = await import('./fallback.ts');
const { askedView, holidaysFor } = await import('./select.ts');
const { holidayProblems } = await import('./verify.ts');
const { frFirst, inSentence } = await import('./names.ts');
const { buildHolidays, findHoliday } = await import('./build.ts');

const names = (list) => list.map((h) => h.name.en);

test('every province has the number of statutory holidays on its official list, in 2026 and 2027', () => {
  assert.deepEqual(STAT_COUNTS, { AB: 9, BC: 11, MB: 9, NB: 8, NL: 6, NS: 6, NT: 11, NU: 10, ON: 9, PE: 8, QC: 8, SK: 10, YT: 11 });
  for (const year of [2026, 2027]) assert.deepEqual(holidayProblems(HOLIDAYS_FALLBACK, year), []);
});

test('no two holidays in one province and year share a name, in English or French', () => {
  for (const year of [2026, 2027]) {
    for (const p of Object.keys(STAT_COUNTS)) {
      const { stat, government } = holidaysFor(HOLIDAYS_FALLBACK, p, year);
      for (const lang of ['en', 'fr']) {
        const all = [...stat, ...government].map((h) => h.name[lang]);
        assert.equal(new Set(all).size, all.length, `${p} ${year} ${lang}: ${all.join(' | ')}`);
      }
    }
  }
});

test('Newfoundland and Labrador: six paid public holidays; the government’s own days are not statutory', () => {
  const { stat, government, federalOnly } = holidaysFor(HOLIDAYS_FALLBACK, 'NL', 2026);
  assert.deepEqual(names(stat), ['New Year’s Day', 'Good Friday', 'Memorial Day (Canada Day)', 'Labour Day', 'Remembrance Day', 'Christmas Day']);
  // Treasury Board Secretariat, "2026 Paid Holidays" (gov.nl.ca/exec/tbs/2026-paid-holidays-2, read 2026-10-01): 14
  // named paid holidays, in this order with these dates. Six are the statutory ones above; the other eight are the
  // provincial government's own.
  const TBS_2026 = [
    ['New Year’s Day', '2026-01-01'],
    ['Saint Patrick’s Day', '2026-03-16'],
    ['Good Friday', '2026-04-03'],
    ['Saint George’s Day', '2026-04-20'],
    ['Victoria Day', '2026-05-18'],
    ['June Holiday', '2026-06-22'],
    ['Memorial Day (Canada Day)', '2026-07-01'],
    ['Orangemen’s Day', '2026-07-13'],
    ['Labour Day', '2026-09-07'],
    ['National Day for Truth and Reconciliation', '2026-09-30'],
    ['Thanksgiving', '2026-10-12'],
    ['Remembrance Day', '2026-11-11'],
    ['Christmas Day', '2026-12-25'],
    ['Boxing Day', '2026-12-28'],
  ];
  const paid = [...stat, ...government].map((h) => [h.name.en, h.observed ?? h.substitute ?? h.date]).sort((a, b) => a[1].localeCompare(b[1]));
  assert.deepEqual(paid, TBS_2026);
  assert.deepEqual(names(government), ['Saint Patrick’s Day', 'Saint George’s Day', 'Victoria Day', 'June Holiday', 'Orangemen’s Day', 'National Day for Truth and Reconciliation', 'Thanksgiving', 'Boxing Day']);
  // The three the feed never listed for N.L. are still federal holidays not observed there, and stay statutory elsewhere.
  for (const n of ['Victoria Day', 'National Day for Truth and Reconciliation', 'Thanksgiving']) assert.ok(names(federalOnly).includes(n), n);
  assert.ok(names(holidaysFor(HOLIDAYS_FALLBACK, 'ON', 2026).stat).includes('Thanksgiving'));
  assert.deepEqual(holidaysFor(HOLIDAYS_FALLBACK, 'ON', 2026).government, []);
  assert.equal(names(holidaysFor(HOLIDAYS_FALLBACK, 'NL', 2027).government).length, 8);
  assert.ok(!HOLIDAYS_FALLBACK.some((h) => h.name.en === 'Regatta Day'));
  assert.ok(!names(federalOnly).includes('Canada Day'), 'Canada Day is not listed again beside Memorial Day (July 1)');
  assert.equal(stat.find((h) => h.date === '2026-07-01').name.fr, 'Memorial Day (fête du Canada)');
  // July 1 is Canada Day in N.L. too: the row reads "Also federal", and the federal list still has one July 1 holiday.
  const memorial = stat.find((h) => h.date === '2026-07-01');
  assert.deepEqual([memorial.clcDay, memorial.clc, memorial.federal], [true, false, false]);
  assert.deepEqual(names(holidaysFor(HOLIDAYS_FALLBACK, null, 2026).stat.filter((h) => h.date === '2026-07-01')), ['Canada Day']);
  assert.equal(HOLIDAYS_FALLBACK.filter((h) => h.clcDay).length, 2, 'only Memorial Day (2026 and 2027)');
  // Ontario still has Boxing Day; Yukon keeps its own Discovery Day.
  assert.ok(names(holidaysFor(HOLIDAYS_FALLBACK, 'ON', 2026).stat).includes('Boxing Day'));
  assert.equal(holidaysFor(HOLIDAYS_FALLBACK, 'YT', 2026).stat.find((h) => h.name.en === 'Discovery Day').name.fr, 'Jour de la Découverte');
});

test('asking about one holiday: N.L. government days and federal public-service days are never a plain yes', () => {
  const pat = buildHolidays({ province: 'NL', holiday: 'St. Patrick’s Day' }, '2026-09-30').asked;
  assert.equal(pat.statutory, false);
  assert.deepEqual(pat.government, ['NL']);
  // Thanksgiving in N.L.: not statutory, but a federal holiday and one of the provincial government's own days.
  const tg = buildHolidays({ province: 'NL', holiday: 'Thanksgiving' }, '2026-09-30').asked;
  assert.deepEqual([tg.statutory, tg.clc, tg.government], [false, true, ['NL']]);
  assert.equal(findHoliday(HOLIDAYS_FALLBACK, 'Canada Day', '2026-01-01', 'NL').name.en, 'Memorial Day (Canada Day)');
  const easter = buildHolidays({ holiday: 'Easter Monday' }, '2026-09-30').asked;
  assert.deepEqual([easter.clc, easter.federal, easter.statutory], [false, true, false]);
});

test('N.L. government days: no day off is stated for a year without a published schedule', () => {
  // Treasury Board Secretariat's 2026 schedule is published: the asked answer carries its day (Monday, March 16, 2026).
  const pat26 = buildHolidays({ province: 'NL', holiday: 'St. Patrick’s Day' }, '2026-03-10').asked;
  assert.deepEqual([pat26.date, pat26.observed, pat26.unscheduled], ['2026-03-17', '2026-03-16', undefined]);
  // Boxing Day 2026 is a Saturday: the schedule's Monday, not a "substitute" under rules that don't apply (not statutory there).
  const box26 = buildHolidays({ province: 'NL', holiday: 'Boxing Day' }, '2026-10-01').asked;
  assert.deepEqual([box26.date, box26.observed, box26.substitute], ['2026-12-26', '2026-12-28', undefined]);
  // No 2027 schedule (gov.nl.ca/exec/tbs/2026-paid-holidays-2 lists 2026 only): the feed's observed day never shows.
  for (const [name, date] of [
    ['St. Patrick’s Day', '2027-03-17'],
    ['St. George’s Day', '2027-04-23'],
    ['June Holiday', '2027-06-24'],
    ['Orangemen’s Day', '2027-07-12'],
  ]) {
    const a = buildHolidays({ province: 'NL', holiday: name }, '2026-10-01').asked;
    assert.deepEqual([a.date, a.observed, a.substitute, a.unscheduled], [date, undefined, undefined, true], name);
  }
  // The June Holiday has no calendar date of its own: unscheduled, the answer gives none.
  assert.equal(buildHolidays({ province: 'NL', holiday: 'June Holiday' }, '2026-10-01').asked.floating, true);
  assert.equal(buildHolidays({ province: 'NL', holiday: 'St. Patrick’s Day' }, '2026-10-01').asked.floating, undefined);
  for (const h of HOLIDAYS_FALLBACK.filter((x) => x.government?.includes('NL') && x.date.startsWith('2027'))) {
    const v = askedView(h, 'NL');
    assert.deepEqual([v.observed, v.substitute, v.unscheduled], [undefined, undefined, true], h.name.en);
  }
  // Statutory days and other provinces are untouched: Ontario's Boxing Day keeps its substitute, the federal view its rule.
  const on = buildHolidays({ province: 'ON', holiday: 'Boxing Day' }, '2026-10-01').asked;
  assert.deepEqual([on.substitute, on.unscheduled], ['2026-12-28', undefined]);
  assert.equal(buildHolidays({ holiday: 'Boxing Day' }, '2026-10-01').asked.clcWeekend, true);
  assert.equal(askedView(HOLIDAYS_FALLBACK.find((h) => h.date === '2027-12-25'), 'NL').unscheduled, undefined);
});

test('French: provincial names are the official ones and day 1 reads « 1er »', () => {
  const fr = (en, p) => holidaysFor(HOLIDAYS_FALLBACK, p, 2026).stat.find((h) => h.name.en === en).name.fr;
  assert.equal(fr('Nunavut Day', 'NU'), 'Fête du Nunavut');
  assert.equal(fr('British Columbia Day', 'BC'), 'Fête de la Colombie-Britannique');
  assert.equal(fr('New Brunswick Day', 'NB'), 'Fête du Nouveau-Brunswick');
  assert.equal(fr('Saskatchewan Day', 'SK'), 'Fête de la Saskatchewan');
  // Quebec's June 24: the CNESST's English name, with the feed's in brackets (still found by "Saint-Jean-Baptiste").
  assert.equal(fr('National Holiday (Saint-Jean-Baptiste Day)', 'QC'), 'Fête nationale du Québec');
  assert.equal(findHoliday(HOLIDAYS_FALLBACK, 'Saint-Jean-Baptiste', '2026-01-01', 'QC')?.date, '2026-06-24');
  assert.equal(fr('Family Day', 'ON'), 'Jour de la Famille');
  assert.equal(inSentence('Memorial Day (fête du Canada)', 'fr'), 'le Memorial Day (fête du Canada)');
  assert.equal(inSentence('Fête nationale du Québec', 'fr'), 'la fête nationale du Québec');
  assert.equal(inSentence('National Day for Truth and Reconciliation', 'en'), 'the National Day for Truth and Reconciliation');
  assert.equal(inSentence('National Holiday (Saint-Jean-Baptiste Day)', 'en'), 'the National Holiday (Saint-Jean-Baptiste Day)');
  assert.equal(inSentence('National Indigenous Peoples Day', 'en'), 'National Indigenous Peoples Day');
  assert.equal(inSentence('Thanksgiving', 'en'), 'Thanksgiving');
  assert.equal(frFirst('jeudi 1 janvier', 'fr'), 'jeudi 1er janvier');
  assert.equal(frFirst('1 juill.', 'fr-CA'), '1er juill.');
  assert.equal(frFirst('lundi 21 décembre', 'fr'), 'lundi 21 décembre');
  assert.equal(frFirst('mercredi 11 novembre 2026', 'fr'), 'mercredi 11 novembre 2026');
  assert.equal(frFirst('Thursday, January 1', 'en'), 'Thursday, January 1');
});
