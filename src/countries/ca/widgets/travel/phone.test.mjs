// Unit checks for tap-to-call numbers: node --test src/countries/ca/widgets/travel/phone.test.mjs
// Inputs are real values from the data.international.gc.ca feeds (2026-09-30).
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { telHref, phoneParts, displayPhone } = await import('./phone.ts');

const cases = [
  // Mexico: already international; toll-free dialled inside Mexico as printed.
  ['MX', '+52 55-5724-7900', 'tel:+525557247900'],
  ['MX', '664-684-0461', null], // national Tijuana number, no country code: shown as text
  // Haiti: North American exit code 011 must become +, or it fails from abroad.
  ['HT', '011 (509) 2812-9000', 'tel:+50928129000'],
  // Japan: country code without +, and a national number with trunk 0.
  ['JP', '81 (3) 5412-6200', 'tel:+81354126200'],
  ['JP', '81(82) 875-7530', 'tel:+81828757530'],
  ['JP', '06-6949-1605', 'tel:+81669491605'],
  // Thailand: +66 with (0) or a bare 0 trunk prefix.
  ['TH', '+66 (0) 2646 4300', 'tel:+6626464300'],
  ['TH', '+66 0 5385 0147', 'tel:+6653850147'],
  ['TH', '+66 76 317 700', 'tel:+6676317700'],
  // Others seen in the feed.
  ['IL', '(0)3-636-3300', 'tel:+97236363300'],
  ['IL', '+972(0)2-297-8430', 'tel:+97222978430'],
  ['CU', '(53-24) 430-320', 'tel:+5324430320'],
  ['FR', '+33 (0)1 44 43 29 02', 'tel:+33144432902'],
  ['IT', '+39 06-85444-1', 'tel:+390685444' + '1'],
  ['AW', '(57-601) 657-9800', 'tel:+576016579800'],
  ['AD', '(34) 91 382 8400', 'tel:+34913828400'],
  ['AF', '92 (51) 208-6000', 'tel:+92512086000'],
  ['DZ', '213 (0) 770-083-000', 'tel:+213770083000'],
  ['DO', '(809) 262-3100', 'tel:+18092623100'],
  ['GY', '1-592-227-2081', 'tel:+5922272081'],
  ['BB', '1-246-629-3550', 'tel:+12466293550'],
  ['BH', '(+973) 1753 6270', 'tel:+97317536270'],
  ['RU', '+7 (+8 within Russia / en Russie) (495) 925-6000', 'tel:+74959256000'],
  ['ZM', '260977133344', 'tel:+260977133344'],
  ['UA', '613-996-8885 (Centre de surveillance et d’intervention d’urgence / Emergency Watch Response Centre)', 'tel:+16139968885'],
  ['AM', '41 854 506', null],
  ['PE', '319-3200', null],
  ['MD', '(4) 021-307-5000', null],
];

test('office numbers become E.164 tel: links, or text when unsure', () => {
  for (const [iso, raw, want] of cases) assert.equal(telHref(raw, { iso }), want, `${iso} ${raw}`);
});

test('toll-free and emergency numbers dial as printed inside the country', () => {
  assert.equal(telHref('001-800-514-0129', { iso: 'MX', local: true }), 'tel:0018005140129');
  assert.equal(telHref('001-800-156-220-0142', { iso: 'TH', local: true }), 'tel:0018001562200142');
  assert.equal(telHref('911', { iso: 'MX' }), 'tel:911');
  assert.equal(telHref('101;', { iso: 'UA', local: true }), 'tel:101');
});

test('alternatives dial separately and the text is kept as printed', () => {
  const raw = '+52 81-2088-3200/3201';
  const p = phoneParts(raw, { iso: 'MX' });
  assert.equal(p.map((x) => x.text).join(''), raw);
  assert.deepEqual(p.filter((x) => x.href).map((x) => x.href), ['tel:+528120883200']);
  const kz = phoneParts('+7 (7172) 47 55 77 / 78 / 79 / 80', { iso: 'KZ' });
  assert.deepEqual(kz.filter((x) => x.href).map((x) => x.href), ['tel:+77172475577']);
  const th = phoneParts('+66 0 5385 0147 / +66 0 5324 2292', { iso: 'TH' });
  assert.deepEqual(th.filter((x) => x.href).map((x) => x.href), ['tel:+6653850147', 'tel:+6653242292']);
  const ru = phoneParts('+7 (+8 within Russia / en Russie) (495) 925-6000', { iso: 'RU' });
  assert.equal(ru.filter((x) => x.href).length, 1);
});

test('dialable numbers are shown in international form, keeping the printed groups', () => {
  const show = (iso, raw) => displayPhone(raw, telHref(raw, { iso }));
  assert.equal(show('JP', '81 (3) 5412-6200'), '+81 3 5412 6200');
  assert.equal(show('HT', '011 (509) 2812-9000'), '+509 2812 9000');
  assert.equal(show('JP', '06-6949-1605'), '+81 6 6949 1605');
  assert.equal(show('TH', '+66 (0) 2646 4300'), '+66 2646 4300');
  assert.equal(show('AW', '(57-601) 657-9800'), '+57 601 657 9800');
  assert.equal(show('BB', '1-246-629-3550'), '+1 246 629 3550');
  assert.equal(show('DO', '(809) 262-3100'), '+1 809 262 3100');
  assert.equal(show('IT', '+39 06-85444-1'), '+39 06 85444 1');
  assert.equal(show('FR', '+33 (0)1 44 43 29 02'), '+33 1 44 43 29 02');
  assert.equal(show('RU', '+7 (+8 within Russia / en Russie) (495) 925-6000'), '+7 495 925 6000');
  assert.equal(show('PE', '319-3200'), null);
  const mx = phoneParts('+52 81-2088-3200/3201', { iso: 'MX' });
  assert.equal(mx.map((x) => x.display ?? x.text).join(''), '+52 81 2088 3200/3201');
  assert.equal(phoneParts('001-800-514-0129', { iso: 'MX', local: true })[0].display, undefined);
});
