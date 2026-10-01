// Pure checks for the health widget's travel, drug and dental answers:
// node --test src/countries/ca/widgets/health/health.travel.test.mjs (recalls: ./health.test.mjs)
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const travelParse = await import('./travel-parse.ts');
const { findPlace, placeCandidate, parseThn, noticesFor } = travelParse;
const { money, recallQueryOf, drugQueryOf, drugIntentOf } = await import('./scenario-queries.ts');
const { tripDateOf, travelInputOf, todayIn } = await import('./scenario-travel.ts');
const { cleanDrugQuery } = await import('./drugs.ts');
const { default: scenarios } = await import('../../scenarios/health.ts');
const { dentalVars } = await import('./scenario-vars.ts');
const { travelWords } = await import('./scenario-travel-vars.ts');

test('the two Congos and the two Koreas are never confused', () => {
  const place = (q) => findPlace(q)?.en ?? null;
  assert.equal(place('vaccines for the Republic of the Congo'), 'Republic of Congo (Brazzaville)');
  assert.equal(place('Congo-Brazzaville'), 'Republic of Congo (Brazzaville)');
  assert.equal(place('Democratic Republic of the Congo'), 'Democratic Republic of Congo (Kinshasa)');
  assert.equal(place('Democratic Republic of Congo'), 'Democratic Republic of Congo (Kinshasa)');
  assert.equal(findPlace('voyage en République démocratique du Congo')?.fr, 'République démocratique du Congo (Kinshasa)');
  assert.equal(findPlace('voyage en République du Congo')?.fr, 'République du Congo (Brazzaville)');
  assert.equal(place('travel to North Korea'), 'North Korea');
  assert.equal(findPlace('Corée du Nord')?.fr, 'Corée du Nord');
  assert.equal(place('trip to Seoul'), 'South Korea');
  assert.equal(place('going to the Congo'), null);
  assert.equal(place('shots for Korea'), null);
});

test('destinations come from travel.gc.ca’s own list, not from the places today’s notices name', () => {
  assert.deepEqual(findPlace('Is it safe to travel to Mexico?'), { en: 'Mexico', fr: 'Mexique' });
  assert.deepEqual(findPlace('Est-ce sécuritaire de voyager au Mexique?'), { en: 'Mexico', fr: 'Mexique' });
  assert.deepEqual(findPlace('What vaccines do I need for Cuba? I leave'), { en: 'Cuba', fr: 'Cuba' });
  assert.equal(findPlace('Quels vaccins pour la Côte d’Ivoire?')?.en, "Côte d'Ivoire (Ivory Coast)");
  assert.equal(findPlace('the Ivory Coast')?.fr, "Côte d'Ivoire");
  assert.equal(findPlace('The Gambia')?.en, 'Gambia, The');
  assert.equal(findPlace('Papua New Guinea')?.en, 'Papua New Guinea');
  assert.equal(findPlace('Guinea')?.en, 'Guinea');
  assert.equal(findPlace('Nigeria')?.en, 'Nigeria');
  assert.equal(findPlace('Dominican Republic')?.en, 'Dominican Republic');
  assert.equal(findPlace('a week in Hawaii')?.en, 'United States');
  assert.equal(findPlace('Israel')?.en, 'Israel and Palestine');
  assert.equal(findPlace('Bali in March')?.fr, 'Indonésie');
  assert.equal(findPlace('Narnia'), null);
  assert.equal(findPlace('Are there any travel health notices right now?'), null);
  assert.equal(findPlace('Y a-t-il des conseils de santé aux voyageurs en ce moment?'), null);
  assert.equal(findPlace('Do I need shots before I travel in December?'), null);
});

const saved = (lang) => readFileSync(new URL(`./testdata/thn-${lang}-2026-10-01.html`, import.meta.url), 'utf8');

test('the notice table parses as travel.gc.ca serves it today (plain rows, 4 cells), EN + FR', () => {
  const en = parseThn(saved('en'), 'en');
  const fr = parseThn(saved('fr'), 'fr');
  for (const page of [en, fr]) {
    assert.equal(page.notices.length, 9);
    assert.equal(page.rows, 9);
    assert.equal(page.modified, '2026-01-21');
    assert.ok(page.notices.every((n) => n.level >= 1 && n.level <= 4 && /^\d{4}-\d{2}-\d{2}$/.test(n.updated) && /^https:\/\/(travel|voyage)\.gc\.ca\//.test(n.url)));
    assert.equal(page.notices.filter((n) => n.global).length, 1);
    // Every place a notice names is a destination in the list: a notice can always be matched to its country.
    for (const n of page.notices) if (!n.global) for (const l of n.locations) assert.ok(findPlace(l), l);
  }
  assert.deepEqual(en.notices[1], {
    id: '540',
    level: 2,
    title: 'Chikungunya: Advice for travellers',
    locations: ['Costa Rica', 'Cuba', 'French Guiana', 'Mauritius', 'Nicaragua', 'Suriname'],
    global: false,
    updated: '2026-10-01',
    url: 'https://travel.gc.ca/travelling/health-safety/travel-health-notices/540',
  });
  assert.equal(fr.notices.at(-1).title, "Rougeole: Conseils à l'intention des voyageurs");
  assert.deepEqual(fr.notices.at(-1).locations, ['Tous les pays']);
  const cuba = noticesFor(findPlace('Cuba'), en.notices).map((n) => n.id);
  assert.deepEqual(cuba, ['540', '517', '504']);
  // A listed destination no notice names gets the notices for every destination, in either language.
  assert.deepEqual(noticesFor(findPlace('Mexico'), en.notices).map((n) => n.global), [true]);
  assert.deepEqual(noticesFor(findPlace('Mexique'), fr.notices).map((n) => n.global), [true]);
  assert.equal(noticesFor(findPlace('Kinshasa'), fr.notices)[0].level, 3);
});

test('the notice table still parses in its earlier markup (rows marked font-small, a fifth cell)', () => {
  const old = `<table id="reportlist"><thead><tr><th>Level</th><th>Notice</th><th>Location</th><th>Updated</th><th></th></tr></thead><tbody>
    <tr class='font-small'><td><img src="/images/icons/level2.svg" alt=""> Level 2</td><td><a href="/travelling/health-safety/travel-health-notices/540">Chikungunya: Advice for travellers</a></td><td>Cuba, Gambia, The, Mauritius</td><td>2026-09-22</td><td></td></tr>
    <tr class='font-small'><td>Level 1</td><td><a href="/travelling/health-safety/travel-health-notices/504">Measles: Advice for travellers</a></td><td>All Countries</td><td>2025-11-13</td><td>Afghanistan, Albania, Mexico</td></tr>
  </tbody></table>`;
  const page = parseThn(old, 'en');
  assert.equal(page.notices.length, 2);
  assert.deepEqual(page.notices[0].locations, ['Cuba', 'Gambia, The', 'Mauritius']);
  assert.equal(page.notices[0].url, 'https://travel.gc.ca/travelling/health-safety/travel-health-notices/540');
  assert.equal(page.notices[1].level, 1);
  assert.equal(page.notices[1].global, true);
  assert.equal(page.modified, null);
});

test('a page with no readable notice says so (rows counted), instead of passing for an empty list', () => {
  assert.deepEqual(parseThn('<html><body><p>Maintenance</p></body></html>', 'en'), { notices: [], rows: 0, modified: null });
  const changed = parseThn('<table id="reportlist"><tr><td>1</td><td>Measles</td><td>All Countries</td></tr></table>', 'en');
  assert.equal(changed.notices.length, 0);
  assert.equal(changed.rows, 1);
});

test('scenario question reading', () => {
  assert.equal(money('We make $76,500'), 76500);
  assert.equal(money('revenu de 62 000 $'), 62000);
  assert.equal(money('about 85k'), 85000);
  assert.equal(money('Am I eligible for the dental care plan?'), undefined);
  assert.equal(recallQueryOf('Has Advil been recalled?'), 'Advil');
  assert.equal(recallQueryOf('Are there any recent recalls?'), null);
  assert.equal(drugQueryOf('Look up DIN 02241769'), '02241769');
});

test('the dental answer uses the income the person gave', () => {
  const en = dentalVars({ text: 'Am I eligible for the dental care plan? We make $76,500', lang: 'en' });
  assert.match(en.head, /\$76,500/);
  assert.match(en.head, /40% co-payment/);
  assert.match(en.mine, /pay 60% of its set fees and you’d pay 40%, if you meet the other 3 requirements/);
  const fr = dentalVars({ text: 'Suis-je admissible au régime de soins dentaires? Nous gagnons 76 500 $', lang: 'fr' });
  assert.match(fr.head, /76 500 \$/);
  assert.match(fr.mine, /40 %/);
  assert.equal(dentalVars({ text: 'Am I eligible for the dental care plan?', lang: 'en' }).mine, '');
  assert.match(dentalVars({ text: 'dental plan, we make $95,000', lang: 'en' }).head, /over the plan’s \*\$90,000 income limit\*/);
  assert.match(dentalVars({ text: 'I have no dental insurance and make $62,000, dental plan?', lang: 'en' }).mine, /no co-payment, if you meet the other 2 requirements/);
});

test('a drug question gives the brand, never a stray word (EN + FR phrasings of the match list)', () => {
  const cases = {
    'Is Advil approved in Canada?': 'Advil',
    'Is Tylenol Extra Strength available in Canada?': 'Tylenol Extra Strength',
    'is ozempic still sold in canada': 'ozempic',
    'What are the active ingredients in Tylenol?': 'Tylenol',
    'Do I need a prescription for Ozempic?': 'Ozempic',
    'Does Ozempic need a prescription?': 'Ozempic',
    'Is Ozempic prescription only?': 'Ozempic',
    'Est-ce que Advil est approuvé au Canada ?': 'Advil',
    'Est-ce que Advil est autorisé au Canada?': 'Advil',
    'Est-ce que Advil est vendu au Canada?': 'Advil',
    'Est-ce que Advil est en vente au Canada?': 'Advil',
    'Est-ce que Advil est offert au Canada?': 'Advil',
    'Est-ce que Advil est disponible au Canada?': 'Advil',
    'Est-ce qu’Ozempic est homologué au Canada?': 'Ozempic',
    "L'Ozempic est-il autorisé au Canada?": 'Ozempic',
    'L’Ozempic est-il approuvé au Canada?': 'Ozempic',
    'Le Tylenol est-il vendu au Canada?': 'Tylenol',
    'Advil est-il en vente au Canada?': 'Advil',
    'Tylenol est-il encore disponible au Canada?': 'Tylenol',
    'La Ventolin est-elle offerte au Canada?': 'Ventolin',
    'Les comprimés Advil sont-ils autorisés au Canada?': 'Advil',
    'Quels sont les ingrédients actifs du Tylenol?': 'Tylenol',
    "Quels sont les ingrédients d'Advil?": 'Advil',
    'Ingrédients de l’Aspirin': 'Aspirin',
    'Que contient le Tylenol?': 'Tylenol',
    'Ozempic nécessite-t-il une ordonnance?': 'Ozempic',
    'Wegovy exige-t-il une ordonnance?': 'Wegovy',
    'Est-ce que le Wegovy nécessite une ordonnance?': 'Wegovy',
    'Faut-il une ordonnance pour Ozempic?': 'Ozempic',
    'Chercher le DIN 02241769': '02241769',
    // No drug named: nothing to search (the answer asks for the name).
    'How do I use the Drug Product Database?': '',
    'La base de données sur les produits pharmaceutiques': '',
    'Is it legal in Canada?': '',
    'Est-ce autorisé au Canada?': '',
  };
  for (const [q, want] of Object.entries(cases)) {
    assert.equal(drugQueryOf(q), want, q);
    assert.doesNotMatch(drugQueryOf(q), /^canada$/i, q);
  }
  assert.equal(cleanDrugQuery("L'Ozempic"), 'Ozempic');
  assert.equal(cleanDrugQuery('le Tylenol'), 'Tylenol');
  assert.equal(cleanDrugQuery('d’Advil®'), 'Advil');
  assert.equal(cleanDrugQuery('DIN 02241769'), '02241769');
});

test('a drug question is answered for what it asks', () => {
  assert.equal(drugIntentOf('What are the active ingredients in Tylenol?'), 'ingredients');
  assert.equal(drugIntentOf('Que contient le Tylenol?'), 'ingredients');
  assert.equal(drugIntentOf('Do I need a prescription for Ozempic?'), 'prescription');
  assert.equal(drugIntentOf('Ozempic nécessite-t-il une ordonnance?'), 'prescription');
  assert.equal(drugIntentOf('Look up DIN 02241769'), 'din');
  assert.equal(drugIntentOf('Is Advil approved in Canada?'), 'approved');
});

test('drug answers route to the brand asked about, and their follow-ups name it', () => {
  const pick = (q) => scenarios.filter((sc) => sc.match.some((re) => re.test(q)) && !sc.exclude?.some((re) => re.test(q))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  for (const [q, id, lang, chip] of [
    ['Do I need a prescription for Ozempic?', 'health-drug-ozempic', 'en', 'Has Ozempic been recalled?'],
    ['What are the active ingredients in Tylenol?', 'health-drug-tylenol', 'en', 'Has Tylenol been recalled?'],
    ["L'Ozempic est-il autorisé au Canada?", 'health-drug-ozempic', 'fr', 'Y a-t-il un rappel pour Ozempic?'],
    ['Est-ce que Advil est approuvé au Canada ?', 'health-drug-advil', 'fr', 'Y a-t-il un rappel pour Advil?'],
    ['Faut-il une ordonnance pour Ozempic?', 'health-drug-ozempic', 'fr', 'Y a-t-il un rappel pour Ozempic?'],
  ]) {
    const sc = pick(q);
    assert.equal(sc?.id, id, q);
    assert.ok(sc.followUps[lang].includes(chip), q);
  }
  for (const q of ['Look up DIN 02241769', 'Is Zzzquil approved in Canada?']) {
    const sc = pick(q);
    assert.equal(sc?.id, 'health-drug', q);
    assert.ok(![...sc.followUps.en, ...sc.followUps.fr].some((f) => /Advil|DIN/.test(f)), q);
  }
  assert.match(pick('Has Advil been recalled?').id, /^health-recalls-drug-advil$/);
});

test('a travel question gives its departure date (EN + FR), resolved to the next occurrence', () => {
  const today = '2026-10-01';
  const date = (q) => tripDateOf(q, today)?.date ?? null;
  assert.equal(date('What vaccines do I need for Cuba? I leave December 20'), '2026-12-20');
  assert.equal(date('vaccines for Mexico, leaving Dec 20'), '2026-12-20');
  assert.equal(date('leaving Dec. 20th, 2027'), '2027-12-20');
  assert.equal(date('I fly on the 20th of December'), '2026-12-20');
  assert.equal(date('Quels vaccins me faut-il pour aller à Cuba le 20 décembre?'), '2026-12-20');
  assert.equal(date('Je pars le 15 janvier'), '2027-01-15');
  assert.equal(date('départ le 1er mars 2027'), '2027-03-01');
  assert.equal(date('trip on 2026-11-03'), '2026-11-03');
  assert.equal(date('Vaccines for Brazil on Sep 30'), '2027-09-30');
  assert.equal(date('leaving today, October 1'), '2026-10-01');
  assert.equal(date('February 30'), null);
  assert.equal(date('Do I need malaria pills for Kenya in March?'), null);
  assert.equal(date('What vaccines do I need for Cuba?'), null);
  // "Today" is the person's day: 03:00 UTC on Oct 2 is still Oct 1 in Vancouver.
  const now = new Date('2026-10-02T03:00:00Z');
  assert.equal(todayIn('America/Vancouver', now), '2026-10-01');
  assert.equal(todayIn('Not/AZone', now), '2026-10-01');
  assert.deepEqual(travelInputOf({ text: 'What vaccines do I need for Cuba? I leave December 20', lang: 'en', timeZone: 'America/Vancouver' }, now), {
    destination: 'What vaccines do I need for Cuba? I leave',
    travelDate: '2026-12-20',
    lang: 'en',
  });
});

test('a question that names no place asks for every notice, not for a destination called by the question', () => {
  assert.equal(placeCandidate('Are there any travel health notices right now?'), null);
  assert.equal(placeCandidate('Y a-t-il des conseils de santé aux voyageurs en ce moment?'), null);
  assert.equal(placeCandidate('Do I need shots before I travel in December?'), null);
  assert.equal(placeCandidate('Is it safe to travel to Narnia?'), 'Narnia');
  assert.equal(placeCandidate('Quels vaccins pour aller à Narnia?'), 'Narnia');
  assert.equal(placeCandidate('Narnia'), 'Narnia');
  assert.equal(placeCandidate('vaccines for the Republic of Narnia'), 'Republic of Narnia');
});

test('no answer offers the question it just answered', () => {
  const pick = (q) => scenarios.filter((sc) => sc.match.some((re) => re.test(q)) && !sc.exclude?.some((re) => re.test(q))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  for (const sc of scenarios) {
    for (const lang of ['en', 'fr']) {
      for (const q of sc.followUps?.[lang] ?? []) {
        const next = pick(q);
        if (next) assert.ok(!next.followUps?.[lang]?.includes(q), `${next.id} offers “${q}” again`);
      }
    }
  }
  assert.equal(pick('Any health notices for Mexico?').id, 'health-travel-mexico');
  assert.equal(pick('Y a-t-il des conseils de santé pour le Mexique?').id, 'health-travel-mexico');
  assert.equal(pick('Are there any travel health notices right now?').id, 'health-travel-now');
  assert.equal(pick('What vaccines do I need for Cuba?').id, 'health-travel');
});

test('a travel answer leads with what was asked: notices for a place, the booking date, or the 6-week rule', () => {
  const notice = (id, level, locations) => ({ id, level, title: 'Chikungunya: Advice for travellers', locations, global: locations[0] === 'All Countries', updated: '2026-10-01', url: `https://travel.gc.ca/travelling/health-safety/travel-health-notices/${id}` });
  const base = { lang: 'en', live: true, fetchedAt: '2026-10-01T15:00:00.000Z', query: 'Cuba', destination: 'Cuba', unknownDestination: false, totalNotices: 9, travelDate: null, clinicBy: null, urls: {}, sources: [] };
  const cuba = { ...base, notices: [notice('540', 2, ['Cuba']), notice('541', 1, ['Cuba']), notice('504', 1, ['All Countries'])], specific: 2, highestLevel: 2 };
  const en = travelWords({ text: 'Any health notices for Cuba?', lang: 'en' }, null, cuba, '2026-10-01');
  assert.equal(en.head, 'Yes: *3 travel health notices* apply to Cuba, the highest at level 2 of 4.');
  // The paragraph about notices comes first and is cited [1]; the clinic advice follows, with the 6-week rule.
  assert.match(en.body, /^The Public Health Agency of Canada posts travel health notices[^\n]*\[1\]\(https:\/\/travel\.gc\.ca\/travelling\/health-safety\/travel-health-notices\)\n\nSee a travel health clinic or your health care provider about 6 weeks before you go: they can check[^\n]*for Cuba\.[^\n]*\[2\]\(/);
  const fr = travelWords({ text: 'Y a-t-il des conseils de santé pour Cuba?', lang: 'fr' }, null, { ...cuba, lang: 'fr' }, '2026-10-01');
  assert.equal(fr.head, 'Oui\u00a0: *3 conseils de santé aux voyageurs* sont en vigueur à Cuba, le plus élevé au niveau 2 sur 4.');
  assert.match(fr.body, /^L’Agence de la santé publique du Canada publie des conseils[^\n]*\[1\]\([^\n]*\n\nConsultez une clinique santé-voyage ou votre professionnel de la santé environ 6 semaines avant le départ/);

  // Only the notice for every destination applies: the heading says so instead of "Yes".
  const mexico = { ...base, query: 'Mexico', destination: 'Mexico', notices: [notice('504', 1, ['All Countries'])], specific: 0, highestLevel: 1 };
  assert.equal(travelWords({ text: 'Any health notices for Mexico?', lang: 'en' }, null, mexico, '2026-10-01').head, 'No notice names Mexico right now; *1 travel health notice* applies to every destination, at level 1 of 4.');
  const none = { ...base, notices: [], specific: 0, highestLevel: 0 };
  assert.equal(travelWords({ text: 'Any health notices for Cuba?', lang: 'en' }, null, none, '2026-10-01').head, 'No: *no travel health notices* apply to Cuba right now.');

  // A vaccine question keeps the clinic advice first, cited [1].
  const vaccines = travelWords({ text: 'What vaccines do I need for Cuba?', lang: 'en' }, null, cuba, '2026-10-01');
  assert.equal(vaccines.head, 'See a travel health clinic *about 6 weeks* before you go.');
  assert.match(vaccines.body, /^A travel health clinic or your health care provider can check[^\n]*\[1\]\([^\n]*\n\nThe Public Health Agency of Canada also posts[^\n]*\[2\]\(/);
  const dated = travelWords({ text: 'What vaccines do I need for Cuba? I leave December 20', lang: 'en' }, '2026-12-20', { ...cuba, travelDate: '2026-12-20', clinicBy: '2026-11-08' }, '2026-10-01');
  assert.equal(dated.head, 'See a travel health clinic by *November 8*, about 6 weeks before you leave.');

  // No destination: the count in effect answers a question about notices, never a question about vaccines.
  const all = { ...base, query: null, destination: null, notices: cuba.notices, specific: undefined, highestLevel: 3 };
  assert.equal(travelWords({ text: 'Are there any travel health notices right now?', lang: 'en' }, null, all, '2026-10-01').head, '*9 travel health notices* are in effect right now, the highest at level 3 of 4.');
  assert.equal(travelWords({ text: 'Y a-t-il des conseils de santé aux voyageurs en ce moment?', lang: 'fr' }, null, { ...all, lang: 'fr' }, '2026-10-01').head, '*9 conseils de santé aux voyageurs* sont en vigueur en ce moment, le plus élevé au niveau 3 sur 4.');
  assert.equal(travelWords({ text: 'Do I need shots before I travel?', lang: 'en' }, null, all, '2026-10-01').head, 'See a travel health clinic *about 6 weeks* before you go.');
  // Offline: no claim about notices, the rule stands.
  assert.equal(travelWords({ text: 'Any health notices for Cuba?', lang: 'en' }, null, { ...cuba, live: false, offline: 'unreachable', notices: [] }, '2026-10-01').head, 'See a travel health clinic *about 6 weeks* before you go.');
});

test('“Date modified” is the date printed on the page, not the dcterms.modified meta of the site template', () => {
  const { dateModifiedOf } = travelParse;
  const html = '<meta name="dcterms.modified" title="W3CDTF" content="2026-09-22" /> … <dl id="wb-dtmd"><dt>Date modified: </dt><dd><time property="dateModified">2026-01-21</time></dd></dl>';
  assert.equal(dateModifiedOf(html), '2026-01-21');
  assert.equal(dateModifiedOf('<meta name="dcterms.modified" content="2026-09-22" />'), null);
});
