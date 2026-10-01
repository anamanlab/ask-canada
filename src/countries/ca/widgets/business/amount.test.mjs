// Unit checks for reading amounts, currencies, origins and duty rates out of a question: node --test src/countries/ca/widgets/business/amount.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { amountIn, currencyIn, dutyRateIn, originIn, withoutRates } = await import('./parse.ts');

test('money written with $, k or a thousands separator', () => {
  assert.equal(amountIn('I made $45,000 last year'), 45000);
  assert.equal(amountIn('45 000 $ de ventes'), 45000);
  assert.equal(amountIn('about 45k in Ontario'), 45000);
  assert.equal(amountIn('$2000 of goods'), 2000);
  assert.equal(amountIn('I sell 45000 a year'), 45000);
});

test('a 1900–2100 figure next to money words is money, not a year', () => {
  assert.equal(amountIn('How much duty will I pay importing 2000 US dollars of goods from the US at 6.5%?'), 2000);
  assert.equal(amountIn('I want to export 2000 worth of goods to Germany'), 2000);
  assert.equal(amountIn('I had 2000 in sales this quarter'), 2000);
  assert.equal(amountIn('2000 dollars of stock'), 2000);
  assert.equal(amountIn('an invoice of 1950 euros'), 1950);
  assert.equal(amountIn('j’ai 2000 $ de ventes'), 2000);
});

test('a bare year is skipped', () => {
  assert.equal(amountIn('I started my business in 2025'), undefined);
  assert.equal(amountIn('depuis 2019, je vends en ligne'), undefined);
  assert.equal(amountIn('In 2025 I sold $12,000'), 12000);
  assert.equal(amountIn('Do I need to register for GST?'), undefined);
});

test('nothing is assumed when the person gives no amount, currency or origin', () => {
  const q = 'How do I import goods into Canada?';
  assert.equal(amountIn(withoutRates(q)), undefined);
  assert.equal(currencyIn(q), undefined);
  assert.equal(originIn(q), undefined);
  assert.equal(dutyRateIn(q), undefined);
});

test('currency and duty rate, only when stated', () => {
  assert.equal(currencyIn('importing 2000 US dollars of goods'), 'USD');
  assert.equal(currencyIn('importing goods from the U.S.'), 'USD');
  assert.equal(currencyIn('une facture de 1950 euros'), 'EUR');
  assert.equal(currencyIn('$2000 of goods'), 'CAD');
  assert.equal(dutyRateIn('at 6.5%'), 6.5);
  assert.equal(dutyRateIn('à 6,5 pour cent'), 6.5);
  assert.equal(amountIn(withoutRates('2000 US dollars of goods at 18%')), 2000);
});

test('origin comes from place words, never from the invoice currency', () => {
  const fr = 'Combien de droits de douane vais-je payer pour importer des marchandises de 2 500 $ US de Chine à 6,5 %?';
  assert.equal(originIn(fr), 'china');
  assert.equal(currencyIn(fr), 'USD');
  assert.equal(amountIn(withoutRates(fr)), 2500);
  const en = 'How much duty on $2,500 USD from China at 6.5%?';
  assert.equal(originIn(en), 'china');
  assert.equal(currencyIn(en), 'USD');
  assert.equal(amountIn(withoutRates(en)), 2500);
  // A U.S.-dollar invoice with no place named says nothing about where the goods are made.
  assert.equal(originIn('importing 2000 US dollars of goods'), undefined);
  assert.equal(originIn('2000 American dollars of goods'), undefined);
  assert.equal(originIn('une facture de 3 000 dollars américains'), undefined);
  assert.equal(originIn('2000 American dollars of goods from Mexico'), 'mexico');
  // The U.S. named, and nowhere else.
  assert.equal(originIn('importing goods from the U.S.'), 'us');
  assert.equal(originIn('importing goods from the US'), 'us');
  assert.equal(originIn('importer des marchandises des États-Unis'), 'us');
  assert.equal(originIn('goods made in China shipped from the United States'), 'china');
  assert.equal(originIn('importer 1950 euros de produits d’Allemagne'), 'europe');
  assert.equal(originIn('importing from South Korea'), 'korea');
  assert.equal(originIn('importing tea from India'), 'india');
  assert.equal(originIn('I sell to Indiana'), undefined);
});
