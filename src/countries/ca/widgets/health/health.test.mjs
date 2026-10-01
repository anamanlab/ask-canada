// Pure checks for the health widget's recalls: node --test src/countries/ca/widgets/health/health.test.mjs
// (Travel, drug and dental checks: ./health.travel.test.mjs.)
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { issueLines, allergenNotices } = await import('./recalls.ts');
const { splitTitle, mergeRepeats } = await import('./recall-titles.ts');
const { broaderQueries, detailPicks, searchUrlFor } = await import('./recalls-parse.ts');
const { fetchRecalls } = await import('./live-recalls.ts');
const SNAP = JSON.parse(readFileSync(new URL('./snapshot.json', import.meta.url), 'utf8'));

test('issue types are grouped, never re-parsed from a joined string (the lab fixture “Recalls · allergen sesame”)', () => {
  const salem = SNAP.sesame.items.find((i) => /Salem Foods brand jarred products/.test(i.title));
  assert.ok(Array.isArray(salem.details.issue), 'issue is a list');
  assert.equal(salem.details.issue.length, 4);
  assert.deepEqual(issueLines(salem.details.issue, ' · '), ['Allergen · Wheat, Gluten, Mustard, Sesame seeds']);
  for (const key of ['recent', 'recentFr', 'peanut', 'sesame', 'carSeat']) {
    for (const it of SNAP[key].items) {
      for (const line of issueLines(it.details?.issue, ' · ')) assert.doesNotMatch(line, /, (Food|Aliments) ·| - /, `${key}: ${line}`);
    }
  }
});

test('issue lines: other shapes', () => {
  assert.deepEqual(issueLines(['Aliments - Allergène - Lait', 'Aliments - Allergène - Œuf'], ' · '), ['Allergène · Lait, Œuf']);
  assert.deepEqual(issueLines(['Food - Allergen - Milk', 'Food - Microbial contamination - Salmonella'], ' · '), ['Allergen · Milk', 'Microbial contamination · Salmonella']);
  assert.deepEqual(issueLines(['Consumer products - Fall hazard'], ' · '), ['Fall hazard']);
  assert.deepEqual(issueLines(['Food - Extraneous Material'], ' · '), ['Extraneous Material']);
  assert.deepEqual(issueLines(['The product may overheat - stop using it.'], ' · '), ['The product may overheat - stop using it.']);
  assert.deepEqual(issueLines(undefined, ' · '), []);
});

test('allergen notices still read the issue list', () => {
  const hits = allergenNotices(SNAP.sesame.items, 'sesame');
  assert.ok(hits.length > 0 && hits.length < SNAP.sesame.items.length);
  assert.ok(hits.every((i) => !/undeclared (peanut|shrimp)$/.test(i.title)));
});

test('titles split into product and hazard (EN + FR), or stay whole', () => {
  assert.deepEqual(splitTitle('Certain Summerhill Market brand raspberries and raspberry-containing products recalled due to norovirus'), {
    product: 'Summerhill Market raspberries and raspberry-containing products',
    hazard: 'Norovirus',
  });
  assert.deepEqual(splitTitle('Smarter Snacks brand Vegan Protein Puff Chili & Lime Flavored contains undeclared milk'), {
    product: 'Smarter Snacks Vegan Protein Puff Chili & Lime Flavored',
    hazard: 'Undeclared milk',
  });
  assert.deepEqual(splitTitle('Rappel de « Dried Lemongrass » de marque Richters en raison de la présence de cailloux'), {
    product: 'Dried Lemongrass de marque Richters',
    hazard: 'Présence de cailloux',
  });
  assert.deepEqual(splitTitle("Lunettes intelligentes INMO AIR3 rappelées en raison d'un risque de brûlure"), { product: 'Lunettes intelligentes INMO AIR3', hazard: 'Risque de brûlure' });
  assert.deepEqual(splitTitle('Présence non déclarée de lait dans « Vegan Protein Puff Chili & Lime Flavored » de marque Smarter Snacks'), {
    product: 'Vegan Protein Puff Chili & Lime Flavored de marque Smarter Snacks',
    hazard: 'Présence non déclarée de lait',
  });
  assert.deepEqual(splitTitle('OmniaSecure™ MRI SureScan™'), { product: 'OmniaSecure™ MRI SureScan™' });
});

test('a warning and its recall for the same product share one row', () => {
  for (const key of ['recent', 'recentFr']) {
    const rows = mergeRepeats(SNAP[key].items);
    const snack = rows.filter((r) => /Smarter Snacks/.test(r.title));
    assert.equal(snack.length, 1, key);
    assert.equal(snack[0].earlier?.length, 1, key);
    assert.equal(rows.length, SNAP[key].items.length - 1, key);
  }
});

/** A results page of recalls-rappels.canada.ca, as parseSearchPage reads it. */
const resultsPage = (rows) =>
  `<p>Displaying 1 - ${rows.length} of ${rows.length} items.</p>` +
  rows
    .map(
      ([slug, title, date]) =>
        `<div class="search-result views-row"><img src="/icon-health-products.svg"><a href="/en/alert-recall/${slug}">${title}</a><span class="label label-danger">Recall</span><span class="ar-type">Health product recall | ${date}</span></div>`,
    )
    .join('');
const NO_RESULTS = '<p>No results found.</p>';

test('“Advil Caplets” finds nothing as a phrase: the search falls back to the brand, and says so', async () => {
  assert.equal(new URL(searchUrlFor('en', 'Advil Caplets')).searchParams.get('search_api_fulltext'), '"Advil Caplets"');
  assert.equal(new URL(searchUrlFor('en', 'Advil Caplets', 'all', undefined, true)).searchParams.get('search_api_fulltext'), 'Advil Caplets');
  assert.deepEqual(broaderQueries('Advil Caplets'), [
    { query: 'Advil', any: false, brandLike: true },
    { query: 'Advil Caplets', any: true, brandLike: false },
  ]);
  assert.deepEqual(broaderQueries('Advil'), []);
  assert.deepEqual(broaderQueries('baby formula').map((b) => b.query), ['baby formula']);

  const advil = resultsPage([
    ['advil-1', 'Advil Cold and Sinus: missing child-resistant cap', '2025-03-04'],
    ['advil-2', 'Advil Pediatric Drops recalled due to a dosing error', '2024-11-19'],
    ['advil-3', 'Advil Liqui-Gels: packaging error', '2023-06-01'],
  ]);
  const asked = [];
  const load = async (url) => {
    const q = new URL(url).searchParams.get('search_api_fulltext');
    if (q == null) return '<html></html>'; // a notice page with no summary
    asked.push(q);
    return q === 'Advil' ? advil : q === 'Advil Caplets' ? resultsPage([['other-1', 'Brand X caplets recalled', '2026-01-02'], ...[1, 2, 3].map((n) => [`advil-${n}`, `Advil ${n}`, '2025-01-01'])]) : NO_RESULTS;
  };
  const out = await fetchRecalls({ query: 'Advil Caplets', lang: 'en' }, new Date('2026-10-01T12:00:00Z'), load);
  assert.equal(asked[0], '"Advil Caplets"');
  assert.equal(out.live, true);
  assert.equal(out.query, 'Advil');
  assert.deepEqual(out.broadened, { from: 'Advil Caplets' });
  assert.equal(out.items.length, 3);
  assert.equal(out.total, 3);
  assert.equal(new URL(out.searchUrl).searchParams.get('search_api_fulltext'), 'Advil');

  // An exact phrase that has notices is never widened.
  const exact = await fetchRecalls({ query: 'car seat', lang: 'en' }, new Date('2026-10-01T12:00:00Z'), async (url) =>
    new URL(url).searchParams.get('search_api_fulltext') === '"car seat"' ? resultsPage([['seat-1', 'Child car seat recalled', '2026-09-01']]) : '<html></html>',
  );
  assert.equal(exact.query, 'car seat');
  assert.equal(exact.broadened, undefined);

  // No brand word (a lowercase common word with too many matches is skipped): any of the words, with the official search unquoted.
  const any = await fetchRecalls({ query: 'dragon gummies', lang: 'en' }, new Date('2026-10-01T12:00:00Z'), async (url) => {
    const q = new URL(url).searchParams.get('search_api_fulltext');
    if (q === 'dragon') return resultsPage([['d-1', 'Dragon toy recalled', '2026-01-01']]).replace('of 1 items', 'of 300 items');
    return q === 'dragon gummies' ? resultsPage([['g-1', 'Gummies recalled due to undeclared milk', '2026-02-01']]) : q == null ? '<html></html>' : NO_RESULTS;
  });
  assert.deepEqual(any.broadened, { from: 'dragon gummies', any: true });
  assert.equal(new URL(any.searchUrl).searchParams.get('search_api_fulltext'), 'dragon gummies');

  // Nothing anywhere: an empty, live result (never a claim that the product is safe).
  const none = await fetchRecalls({ query: 'Zzz Qqq', lang: 'en' }, new Date('2026-10-01T12:00:00Z'), async () => NO_RESULTS);
  assert.equal(none.live, true);
  assert.equal(none.items.length, 0);
  assert.equal(none.query, 'Zzz Qqq');
});

test('no scripted answer calls an empty search a good sign', () => {
  const src = readFileSync(new URL('./scenario-vars.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /good sign|bon signe/i);
});

test('every category leads with notices that carry a summary, within the fetch budget', () => {
  for (const key of ['recent', 'recentFr']) {
    const items = SNAP[key].items;
    const picks = detailPicks(items, null);
    assert.ok(picks.size <= 12, `${key}: ${picks.size} fetches`);
    const rows = mergeRepeats(items);
    for (const cat of ['food', 'health', 'consumer', 'vehicles']) {
      const lead = rows.filter((r) => r.category === cat).slice(0, 2);
      assert.ok(lead.length > 0, `${key}: ${cat}`);
      for (const r of lead) {
        assert.ok(picks.has(r.url), `${key}: ${cat} lead is fetched`);
        assert.ok(r.details, `${key}: the lab fixture carries the summary of ${r.title}`);
      }
    }
    for (const r of rows.slice(0, 6)) assert.ok(picks.has(r.url), `${key}: a row shown on arrival`);
  }
  // A search keeps the allergen chip's first notices too.
  const sesame = SNAP.sesame.items;
  const picks = detailPicks(sesame, 'sesame');
  for (const r of allergenNotices(mergeRepeats(sesame), 'sesame').slice(0, 2)) assert.ok(picks.has(r.url));
});
