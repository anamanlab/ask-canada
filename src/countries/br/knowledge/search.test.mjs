#!/usr/bin/env node
// Regression test for common CPF-registration queries returning unrelated curated pages.
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { resolve } from 'node:path';

process.env.COUNTRY = 'br';
register(resolve('scripts/lib/ts-hooks.mjs'), { parentURL: import.meta.url });

const { searchLocalSources } = await import('./search.ts');
const results = await searchLocalSources('Como tirar CPF?', 'pt', 3);

assert.equal(
  results[0]?.url,
  'https://www.gov.br/pt-br/servicos/inscrever-no-cpf',
  `Expected the official CPF-registration page first, got ${JSON.stringify(results.map((r) => r.url))}`,
);

console.log('✓ CPF registration queries lead with the official service page');
