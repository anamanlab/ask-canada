// Unit checks for the place lookup (postal-code areas, ambiguous town names) and the "tomorrow / weekend" rows:
// node --test src/countries/ca/widgets/weather/geocode.test.mjs
// The hits are NRCan Geolocator responses recorded 2026-10-01 (https://geolocator.api.geo.ca/?q=T2P …), trimmed.
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { forecastCityFor, optionsFor, pickFsa, pickNamed } = await import('./geocode.ts');
const { nearestCity } = await import('./nearest.ts');
const { outlookDays, precipIn } = await import('./outlook.ts');

const hit = (key, name, province, category, lat, lon) => ({ key, name, province, category, lat, lon });
const FSA = {
  T2P: [hit('locate', 'T2P', null, 'PostalCode', 51.0525665, -114.0778735), hit('fsa', 'T2P', 'Alberta', 'Postal Code', 51.057668, -113.681179), hit('geonames', 'Calgary', 'Alberta', 'City', 51.0458333, -114.0574999)],
  K1A: [hit('locate', 'K1A', null, 'PostalCode', 45.423641, -75.700844), hit('fsa', 'K1A', 'Ontario', 'Postal Code', 45.443442, -75.619291), hit('geonames', 'Île de Hull', 'Quebec', 'Island', 45.4333333, -75.7180556)],
  M5V: [hit('nominatim', 'M5V Condominiums, 373, King Street West', 'Ontario', 'Building', 43.6456336, -79.3929874), hit('locate', 'M5V', null, 'PostalCode', 43.642109, -79.397896), hit('fsa', 'M5V', 'Ontario', 'Postal Code', 43.638388, -79.40428)],
  V6B: [hit('locate', 'V6B', null, 'PostalCode', 49.276421, -123.114464), hit('fsa', 'V6B', 'British Columbia / Colombie-Britannique', 'Postal Code', 49.281758, -123.113445)],
};
const SPRINGFIELD = [
  hit('nominatim', 'Rural Municipality of Springfield, Manitoba, Canada', 'Manitoba', 'Boundary', 49.9295504, -96.6928355),
  hit('geonames', 'Springfield', 'Ontario', 'Community', 42.8266667, -80.9333334),
  hit('geonames', 'Springfield', 'Nova Scotia', 'Community', 44.63555, -64.872965),
  hit('geonames', 'Springfield Seamount', 'Undersea Feature', 'Seamount', 48.06816667, -130.1976667),
  hit('geonames', 'Springfield', 'New Brunswick', 'Dispersed Rural Community', 45.678163, -65.812544),
  hit('geonames', 'Springfield', 'Prince Edward Island', 'Locality', 46.389645, -63.522885),
  hit('geonames', 'Springfield', 'Ontario', 'Dispersed Rural Community', 42.8711111, -81.6655555),
  hit('geonames', 'Springfield', 'Manitoba', 'Locality', 49.933333, -96.933333),
  hit('geonames', 'Springfield', 'Prince Edward Island', 'Settlement', 46.683333, -64.366667),
  hit('geonames', 'Springfield', 'Manitoba', 'Rural Municipality', 49.916667, -96.75),
];

const cityFor = (fsa, hits = FSA[fsa]) => {
  const pick = pickFsa(hits, fsa);
  assert.equal(pick.kind, 'point');
  return forecastCityFor(pick, 'en');
};

test('a postal code resolves to its own city', () => {
  assert.equal(cityFor('T2P').place.name, 'Calgary');
  assert.match(cityFor('K1A').place.name, /^Ottawa/);
  assert.equal(cityFor('M5V').place.name, 'Toronto');
  assert.equal(cityFor('V6B').place.name, 'Vancouver');
  assert.ok(cityFor('T2P').km < 5, 'downtown Calgary, not the polygon centroid 28 km east');
});

test('the address centre is preferred; the polygon centroid is only the fallback', () => {
  const pick = pickFsa(FSA.T2P, 'T2P');
  assert.equal(pick.lon, -114.0778735);
  assert.deepEqual(pick.provinces, ['ab']);
  const fallback = pickFsa(FSA.T2P.filter((h) => h.key !== 'locate'), 'T2P');
  assert.equal(fallback.kind === 'point' && fallback.lon, -113.681179);
  assert.equal(pickFsa(FSA.T2P, 'T2X').kind, 'none');
});

test('the forecast city is chosen inside the postal code’s province', () => {
  // The K1A polygon centroid is nearer to Gatineau's forecast point than to Ottawa's; K is Ontario.
  assert.match(cityFor('K1A', FSA.K1A.filter((h) => h.key !== 'locate')).place.name, /^Ottawa/);
  assert.equal(nearestCity(45.443442, -75.619291, 'en').place.name, 'Gatineau');
  assert.equal(nearestCity(45.443442, -75.619291, 'en', ['qc']).place.name, 'Gatineau');
});

test('a sub-location never beats its town when both are about as close', () => {
  assert.equal(nearestCity(43.642109, -79.397896, 'en').place.name, 'Toronto');
  assert.equal(nearestCity(51.0525665, -114.0778735, 'en').place.name, 'Calgary');
});

test('a town name found in several provinces is ambiguous', () => {
  const pick = pickNamed(SPRINGFIELD, 'springfield');
  assert.equal(pick.kind, 'many');
  assert.deepEqual(pick.points.map((p) => p.province), ['on', 'ns', 'nb', 'pe', 'mb']);
  const options = optionsFor(pick, 'en');
  assert.deepEqual(options.map((o) => `${o.name}, ${o.province}`), ['Springfield, on', 'Springfield, ns', 'Springfield, nb', 'Springfield, pe', 'Springfield, mb']);
  assert.ok(options.every((o) => o.near && o.id.startsWith('geo-')));
});

test('a province hint settles it', () => {
  const pick = pickNamed(SPRINGFIELD, 'springfield', 'ns');
  assert.equal(pick.kind, 'point');
  assert.deepEqual(pick.provinces, ['ns']);
  assert.equal(pick.lat, 44.63555);
  assert.equal(pickNamed(SPRINGFIELD, 'springfield', 'bc').kind, 'none');
  assert.equal(pickNamed(SPRINGFIELD, 'shelbyville').kind, 'none');
});

const period = (name, sky, pop, night = false) => ({ name, night, temp: 10, summary: name, text: '', sky, pop });
const day = (label, sky, pop, nightSky = 'clear') => ({ key: label, label, day: period(label, sky, pop), night: period(`${label} night`, nightSky, undefined, true), high: 15, low: 5, pop, sky });
const WEEK = [day('Today', 'showers', 30, 'showers'), day('Friday', 'showers'), day('Saturday', 'clear'), day('Sunday', 'clear'), day('Monday', 'partly-cloudy'), day('Tuesday', 'flurries', 60), day('Wednesday', 'cloudy')];

test('tomorrow and the weekend are found by weekday in the place’s own zone', () => {
  const thursday = '2026-10-01T17:00:00Z'; // Thursday 1 October 2026, 1 p.m. in Toronto
  assert.deepEqual(outlookDays(WEEK, 'tomorrow', thursday, 'America/Toronto', 'en').map((d) => d.label), ['Friday']);
  assert.deepEqual(outlookDays(WEEK, 'weekend', thursday, 'America/Toronto', 'en').map((d) => d.label), ['Saturday', 'Sunday']);
  // 02:00 UTC on Friday is still Thursday evening in Vancouver.
  assert.deepEqual(outlookDays(WEEK, 'tomorrow', '2026-10-02T02:00:00Z', 'America/Vancouver', 'en').map((d) => d.label), ['Friday']);
  const saturday = [day('Today', 'clear'), day('Sunday', 'rain'), day('Monday', 'clear'), day('Saturday', 'clear')];
  assert.deepEqual(outlookDays(saturday, 'weekend', '2026-10-03T17:00:00Z', 'America/Toronto', 'en').map((d) => d.label), ['Today', 'Sunday']);
  assert.deepEqual(outlookDays(saturday, 'weekend', '2026-10-04T17:00:00Z', 'America/Toronto', 'en').map((d) => d.label), ['Today']);
  const fr = [day('Aujourd’hui', 'clear'), day('Vendredi', 'clear'), day('Samedi', 'clear'), day('Dimanche', 'clear')];
  assert.deepEqual(outlookDays(fr, 'weekend', thursday, 'America/Toronto', 'fr').map((d) => d.label), ['Samedi', 'Dimanche']);
  assert.deepEqual(outlookDays(WEEK.slice(0, 1), 'tomorrow', thursday, 'America/Toronto', 'en'), []);
});

test('rain and snow in a day: the chance given, or expected when there is no percentage', () => {
  assert.deepEqual(precipIn([WEEK[0]], 'rain')?.chance, null); // tonight's showers carry no percentage
  assert.equal(precipIn([WEEK[1]], 'rain')?.chance, null);
  assert.equal(precipIn([WEEK[2], WEEK[3]], 'rain'), null);
  assert.equal(precipIn([WEEK[5]], 'snow')?.chance, 60);
  assert.equal(precipIn([WEEK[5]], 'rain'), null);
});
