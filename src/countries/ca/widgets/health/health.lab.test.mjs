// Layout check for the health widget, against the running lab (it needs a browser, so it is opt-in):
//   LAB_URL=http://localhost:3000 node --test src/countries/ca/widgets/health/health.lab.test.mjs
// Each loading state must be as tall as the result it stands for, so nothing jumps when the output arrives. The
// skeletons are built from the results' own boxes and line counts; this catches the day a copy change, a longer
// French string or an extra row makes one of them drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.LAB_URL;
/**
 * [loading fixture, the result it stands for, the result with French data when the lab has one], by the start
 * of their names in ./fixtures.ts. A French page is compared with French data, as a French conversation gets.
 */
const PAIRS = [
  ['Recalls · running', 'Recalls · latest (live, hero)', 'Recalls · French data (rappels récents)'],
  ['Recalls · allergen search running', 'Recalls · allergen search “peanut”'],
  ['Dental · running', 'Dental · nothing known yet'],
  ['Dental · summary, running', 'Dental · summary (follow-up'],
  ['Drugs · running', 'Drugs · “Advil”'],
  ['Drugs · DIN running', 'Drugs · DIN 02471469'],
  ['Travel · running', 'Travel · Cuba (no departure date yet)', 'Travel · Cuba (French data)'],
];
const VIEWS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
/** A skeleton may differ from its result by this much (px): under one line of text per section. */
const TOLERANCE = 16;

/** The height of every fixture's card, by fixture name, once each has mounted (the lab mounts them as they near the viewport). */
async function heights(browser, view, lang) {
  const page = await browser.newPage({ viewport: VIEWS[view] });
  await page.goto(`${BASE}/lab/health?lang=${lang}`, { waitUntil: 'networkidle' });
  const read = () =>
    page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll('main section[aria-label]')].filter((s) => s.parentElement?.tagName === 'MAIN').map((s) => [s.getAttribute('aria-label'), s.querySelector('section, [role="alert"]')?.getBoundingClientRect().height ?? 0])),
    );
  for (let y = 0, max = 1; y < max; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
    max = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  await page.waitForTimeout(500);
  const out = await read();
  await page.close();
  return out;
}

test('each loading state is as tall as its result (desktop and phone, EN and FR)', { skip: BASE ? false : 'set LAB_URL to the running dev server' }, async () => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const off = [];
  try {
    for (const view of Object.keys(VIEWS)) {
      for (const lang of ['en', 'fr']) {
        const h = await heights(browser, view, lang);
        const find = (prefix) => Object.entries(h).find(([name]) => name.startsWith(prefix));
        for (const [loading, en, fr] of PAIRS) {
          const result = lang === 'fr' && fr ? fr : en;
          const a = find(loading);
          const b = find(result);
          assert.ok(a?.[1] && b?.[1], `${view} ${lang}: fixtures “${loading}” and “${result}” are mounted`);
          const diff = Math.round(a[1] - b[1]);
          console.log(`${view} ${lang}  ${String(diff).padStart(5)}px  ${loading}  (${Math.round(a[1])} vs ${Math.round(b[1])})`);
          if (Math.abs(diff) > TOLERANCE) off.push(`${view} ${lang}: “${loading}” is ${diff}px off its result`);
        }
      }
    }
  } finally {
    await browser.close();
  }
  assert.deepEqual(off, []);
});
