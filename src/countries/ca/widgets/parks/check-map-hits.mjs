#!/usr/bin/env node
/**
 * Map hit test for the park finder (needs the dev server with scripted answers): at phone, tablet and desktop
 * widths, in the whole-country view where the dots are closest together, a click on the centre of every park's
 * dot must select that park and no other. Also checks that the "All of Canada" button doesn't select the park
 * under it, and that the pins are one tab stop walked with the arrow keys. (Label collisions are tested
 * without a browser in check-map-layout.mjs.)
 *
 *   node src/countries/ca/widgets/parks/check-map-hits.mjs [--base http://localhost:3000]
 */
import { chromium } from 'playwright';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3000';
const WIDTHS = [390, 760, 1440];
const browser = await chromium.launch();
let failures = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  // The scripted answer to "national parks": the finder with every park on the map, in the chat column.
  await page.goto(`${base}/?q=${encodeURIComponent('national parks')}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const map = page.locator('[role="group"][aria-label^="Map of 48 "]').first();
  await map.waitFor({ timeout: 90000 });
  await page.waitForTimeout(1500); // the answer finishes streaming; the column stops moving
  await map.scrollIntoViewIfNeeded();
  const pins = map.locator('button[aria-pressed]:not(:has(svg))');
  const labels = await pins.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
  // Keyboard: one pin in the tab order; the arrow keys move the focus (and the tab stop) to another pin.
  const stops = await pins.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).map((el) => el.getAttribute('aria-label')));
  if (stops.length !== 1) {
    failures++;
    console.log(`✗ ${width}px: ${stops.length} pins are tab stops (expected 1)`);
  } else {
    await map.locator('button[tabindex="0"]:not(:has(svg))').focus();
    const seen = new Set(stops);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
      seen.add(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')));
    }
    const after = await pins.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length);
    const selectedByArrows = await map.locator('button[aria-pressed="true"]:not(:has(svg))').count();
    if (seen.size !== 4 || after !== 1 || selectedByArrows) {
      failures++;
      console.log(`✗ ${width}px: arrow keys reached ${seen.size - 1} of 3 pins, ${after} tab stops, ${selectedByArrows} selected without Enter`);
    } else console.log(`${width}px: the pins are one tab stop; arrow keys move between them`);
  }
  // Selecting a park frames it; "All of Canada" brings the country back and stays on for the rest of the run.
  const centre = async (label) => {
    // Centred in the window, clear of the page header and the ask bar.
    await map.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const box = await map.locator(`button[aria-label="${label.replace(/"/g, '\\"')}"]`).boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const first = await centre(labels[0]);
  await page.mouse.click(first.x, first.y);
  const toggle = map.locator('button:has(svg)');
  await toggle.click();
  const afterToggle = await map.locator('button[aria-pressed="true"]:not(:has(svg))').getAttribute('aria-label');
  if (afterToggle !== labels[0]) {
    failures++;
    console.log(`✗ ${width}px: the view toggle changed the selection to ${afterToggle}`);
  }
  let wrong = 0;
  for (const label of labels) {
    const { x, y } = await centre(label);
    await page.mouse.click(x, y);
    const got = await map.locator('button[aria-pressed="true"]:not(:has(svg))').getAttribute('aria-label');
    if (got !== label) {
      wrong++;
      console.log(`✗ ${width}px: clicked ${label}, selected ${got}`);
    }
  }
  failures += wrong;
  console.log(`${width}px: ${labels.length - wrong} of ${labels.length} pins select their own park`);
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
