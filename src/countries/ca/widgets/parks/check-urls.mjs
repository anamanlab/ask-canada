#!/usr/bin/env node
/**
 * Checks every official URL the parks widget can link or cite, in English and French: each park's home, fees,
 * camping and bulletins page (urls.ts `parkUrls`) and every shared page (`URLS`). Fails on anything that is
 * not a direct HTTP 200: a 404 is a dead link, and a redirect means the address lands somewhere else (usually
 * the park's activities index instead of its camping page). reservation.pc.gc.ca is skipped: it answers
 * scripts with 403 (bot protection) whatever the address.
 *
 *   node src/countries/ca/widgets/parks/check-urls.mjs
 */
const { PARKS, hasReservations } = await import('./data.ts');
const { URLS, parkUrls } = await import('./urls.ts');

const targets = new Map();
const add = (what, url) => url && !url.includes('reservation.pc.gc.ca') && !targets.has(url.split('#')[0]) && targets.set(url.split('#')[0], what);
for (const lang of ['en', 'fr']) {
  for (const p of PARKS) {
    const u = parkUrls(p, lang);
    add(`${p.id} home`, u.home);
    add(`${p.id} fees`, u.fees);
    add(`${p.id} bulletins`, u.bulletins);
    if (hasReservations(p)) add(`${p.id} camping`, u.camping);
  }
  for (const [key, pair] of Object.entries(URLS)) add(key, pair[lang]);
}

async function check(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'ask-canada-link-check' } });
      await res.body?.cancel();
      return res.status === 200 ? null : `${res.status}${res.headers.get('location') ? ` → ${res.headers.get('location')}` : ''}`;
    } catch (e) {
      if (attempt === 2) return `error: ${e.message}`;
    }
  }
}

const list = [...targets];
const failures = [];
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < list.length) {
      const [url, what] = list[next++];
      const problem = await check(url);
      if (problem) failures.push(`${what}: ${url}  ${problem}`);
    }
  }),
);
console.log(`${list.length} URLs checked, ${failures.length} failed`);
failures.sort().forEach((f) => console.log('  ✗ ' + f));
process.exit(failures.length ? 1 : 0);
