#!/usr/bin/env node
// Screenshot helper for builders & critics.
// Usage:
//   node scripts/shot.mjs --url /lab/passport --out .shots/passport --sizes desktop,mobile --schemes light,dark
//   node scripts/shot.mjs --url "/?q=How do I renew my passport" --out .shots/chat --wait 9000 --full
//   node scripts/shot.mjs --url / --out .shots/x --actions '[{"click":"text=Français"},{"type":["textarea","Bonjour"]},{"press":"Enter"},{"wait":4000}]'
// Writes <out>-<size>-<scheme>.png and prints console errors + page errors.
import { chromium, webkit } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Watchdog: concurrent writes can leave trailing bytes in the dev server's JSON manifests, and then every
// route returns HTTP 500. Check them first so a broken server isn't mistaken for a broken page.
{
  const dir = join(new URL('..', import.meta.url).pathname, '.next/dev');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      try {
        JSON.parse(readFileSync(join(dir, f), 'utf8'));
      } catch (e) {
        console.log(`⚠ .next/dev/${f} is not valid JSON (${e.message.split('\n')[0]}). The dev server will return 500s.`);
        console.log('  Check .next/dev/logs/next-development.log; don\'t edit next.config or route files while others are.');
      }
    }
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] === undefined ? 'true' : arr[i + 1]]);
    return acc;
  }, [])
);
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const url = /^(https?|file):/.test(args.url || '') ? args.url : BASE + (args.url || '/');
const out = args.out || '.shots/shot';
const sizes = (args.sizes || 'desktop,mobile').split(',');
const schemes = (args.schemes || 'light').split(',');
const wait = +(args.wait || 1500);
const full = args.full === 'true';
const actions = args.actions ? JSON.parse(args.actions) : [];
const engine = args.engine === 'webkit' ? webkit : chromium;
const SIZE = {
  desktop: { width: 1440, height: 900, isMobile: false, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  small: { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
mkdirSync(dirname(out), { recursive: true });
const browser = await engine.launch();
for (const size of sizes) {
  for (const scheme of schemes) {
    const s = SIZE[size] || SIZE.desktop;
    const ctx = await browser.newContext({
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: s.deviceScaleFactor,
      isMobile: engine === webkit ? undefined : s.isMobile,
      hasTouch: s.hasTouch,
      colorScheme: scheme,
      reducedMotion: args.motion === 'reduce' ? 'reduce' : 'no-preference',
      locale: args.locale || 'en-CA',
    });
    const page = await ctx.newPage();
    const errors = [];
    // Console errors about a resource that failed to load, by URL: checked against the page before reporting.
    const failed = new Map();
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const line = 'console: ' + m.text().slice(0, 300);
      if (m.text().startsWith('Failed to load resource') && m.location().url) failed.set(m.location().url, line);
      else errors.push(line);
    });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 300)));
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      errors.push('nav: ' + e.message.split('\n')[0]);
    }
    for (const a of actions) {
      try {
        if (a.click) await page.locator(a.click).first().click({ timeout: 8000 });
        if (a.type) await page.locator(a.type[0]).first().fill(a.type[1]);
        if (a.press) await page.keyboard.press(a.press);
        if (a.hover) await page.locator(a.hover).first().hover();
        if (a.scroll) await page.mouse.wheel(0, a.scroll);
        if (a.wait) await page.waitForTimeout(a.wait);
        if (a.shot) await page.screenshot({ path: `${out}-${size}-${scheme}-${a.shot}.png`, fullPage: full });
      } catch (e) {
        errors.push('action ' + JSON.stringify(a) + ': ' + e.message.split('\n')[0]);
      }
    }
    await page.waitForTimeout(wait);
    const file = `${out}-${size}-${scheme}.png`;
    await page.screenshot({ path: file, fullPage: full });
    // Compare against the configured width, not innerWidth: with isMobile emulation the layout
    // viewport grows to fit overflowing content, so innerWidth === scrollWidth and hides the bug.
    const { overflow, culprit } = await page.evaluate((W) => {
      const overflow = document.documentElement.scrollWidth - W;
      let culprit = '';
      if (overflow > 0) {
        // An element inside a clipping ancestor can't widen the page (the ancestor itself is checked).
        const clips = (el) => {
          for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
            const cs = getComputedStyle(p);
            if (/(hidden|clip|auto|scroll)/.test(cs.overflowX) || cs.position === 'fixed') return true;
          }
          return false;
        };
        const sx = window.scrollX;
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right + sx <= W + 1 || el.closest('svg') !== el && el.closest('svg') || getComputedStyle(el).position === 'fixed' || clips(el)) continue;
          const cls = typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
          culprit = `${el.tagName.toLowerCase()}${cls} right=${Math.round(r.right + sx)} "${(el.textContent || '').trim().slice(0, 40)}"`;
          break;
        }
      }
      return { overflow, culprit };
    }, s.width);
    // `next dev` (Turbopack) preloads one chunk of a next/dynamic group under a name it never emits. A missing
    // chunk that the page only ever preloads (no <script> asks for it) is that artefact, not a page error.
    const preloadOnly = await page.evaluate(
      (urls) =>
        urls.filter(
          (u) => [...document.querySelectorAll('link[rel="preload"][as="script"]')].some((l) => l.href === u) && ![...document.scripts].some((sc) => sc.src === u),
        ),
      [...failed.keys()].filter((u) => u.includes('/_next/static/chunks/')),
    );
    for (const [u, line] of failed) if (!preloadOnly.includes(u)) errors.push(`${line} (${u})`);
    console.log(`${file}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px — widest: ${culprit}` : ''}`);
    errors.forEach((e) => console.log('  ' + e));
    await ctx.close();
  }
}
await browser.close();
