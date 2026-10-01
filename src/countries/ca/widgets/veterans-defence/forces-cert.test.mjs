// The pinned forces.ca intermediate certificate: node --test src/countries/ca/widgets/veterans-defence/forces-cert.test.mjs
// Fails 60 days before it expires, so the live careers feed never falls back to the saved list unnoticed.
import { X509Certificate } from 'node:crypto';
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { FORCES_CA_INTERMEDIATE, FORCES_CA_INTERMEDIATE_EXPIRES } = await import('./forces-cert.ts');

const DAY = 24 * 60 * 60 * 1000;
const cert = new X509Certificate(FORCES_CA_INTERMEDIATE);

test('the stated expiry is the certificate\'s own notAfter', () => {
  assert.equal(new Date(cert.validTo).toISOString(), new Date(FORCES_CA_INTERMEDIATE_EXPIRES).toISOString());
});

test('it is an issuing CA, not a leaf', () => {
  assert.equal(cert.ca, true);
  assert.match(cert.subject, /Entrust OV TLS Issuing RSA CA 2/);
});

test('it has more than 60 days left (replace it from the AIA URL in forces-cert.ts)', () => {
  const left = Math.floor((Date.parse(FORCES_CA_INTERMEDIATE_EXPIRES) - Date.now()) / DAY);
  assert.ok(left > 60, `the pinned forces.ca intermediate expires in ${left} days`);
});
