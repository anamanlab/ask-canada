#!/usr/bin/env node
// Structural check for the generated service index. Network-free, so it can run in CI.
//
//   node src/countries/br/knowledge/servicos.test.mjs
//
// It does not verify that the index is *current* (that needs the live catalogue — run
// `node scripts/fetch-servicos.mjs --check` for that). What it does verify is everything that silently rots:
// the module still parses, every row has the fields search.ts relies on, every slug resolves to a real
// official URL on an allowlisted domain, no two rows share a slug, and the accounts levels are the ones the
// Portal publishes.
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
process.env.COUNTRY ||= 'br';
register(join(root, 'scripts', 'lib', 'ts-hooks.mjs'), { parentURL: import.meta.url });
const { SERVICES, AGENCIES, serviceUrl, accountLevel } = await import(join(here, 'servicos.index.ts'));

let problems = 0;
const check = (ok, msg) => {
  if (!ok) problems++;
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
};

check(SERVICES.length >= 500, `the index carries ${SERVICES.length} services`);
// 106 agencies are represented by the emitted slice. The candidate pool is much larger (~240); a drop below
// this number means the per-agency budget collapsed, not that the source shrank.
check(AGENCIES.length >= 50, `${AGENCIES.length} agencies are represented`);
check(new Set(SERVICES.map((s) => s.slug)).size === SERVICES.length, 'every slug is unique');

const ALLOWED_HOSTS = ['www.gov.br', 'servicos.gov.br'];
const badHost = SERVICES.filter((s) => !ALLOWED_HOSTS.includes(new URL(serviceUrl(s)).hostname));
check(badHost.length === 0, `every service resolves to an allowlisted domain (${badHost.length} do not)`);

const badSlug = SERVICES.filter((s) => !s.slug || /\s/.test(s.slug));
check(badSlug.length === 0, 'no slug is empty or contains whitespace');

const noAgency = SERVICES.filter((s) => !s.agency);
check(noAgency.length === 0, 'every service names the agency that publishes it');

const noKeywords = SERVICES.filter((s) => !s.keywords.trim());
check(noKeywords.length === 0, 'every service carries at least one catalogue keyword');

// Only the six documented flag letters, no repeats — and no separators: the flags are one packed string.
const badFlags = SERVICES.filter((s) => /[^dglbpo]/i.test(s.flags) || new Set(s.flags).size !== s.flags.length);
check(badFlags.length === 0, 'flags use only d/g/l/b/p/o and never repeat');

const LEVELS = ['', 'Básico', 'Prata', 'Ouro'];
const badLevel = SERVICES.filter((s) => !LEVELS.includes(accountLevel(s)));
check(badLevel.length === 0, 'every account level is one the Portal publishes');

// A level of Prata or Ouro implies a login; a level with no login flag is a contradiction.
const contradictions = SERVICES.filter((s) => accountLevel(s) && !s.flags.includes('l'));
check(contradictions.length === 0, 'no service demands a verified account without the login flag');

const covered = new Set(SERVICES.map((s) => s.ministry).filter(Boolean));
check(covered.size >= 8, `${covered.size} of the pack's ministries are linked from the index (${SERVICES.filter((s) => s.ministry).length} services name one)`);

console.log(problems ? `\n${problems} problem(s)` : `\n✓ the service index is structurally sound (${SERVICES.length} services, ${AGENCIES.length} agencies)`);
process.exit(problems ? 1 : 0);