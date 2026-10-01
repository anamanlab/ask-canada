#!/usr/bin/env node
// French typography for UI catalogs (Translation Bureau, Guide du rédacteur):
//   « and » take a no-break space inside (U+00A0): « Bonjour »
//   a colon takes a no-break space before it: « Note : »
//   ? ! ; take no space before them (Canadian usage): « Comment? »
// `node scripts/fr-typography.mjs` checks every fr.json (and French quoted in en.json); `--fix` rewrites them.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fix = process.argv.includes('--fix');
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^(fr|en)\.json$/.test(f)) out.push(p);
  }
  return out;
};

export function frType(s) {
  return s
    .replace(/«[   ]*/g, '« ')
    .replace(/[   ]*»/g, ' »')
    .replace(/[  ]+:(?=\s|$| »)/g, ' :')
    .replace(/[   ]+([?!;])/g, '$1');
}
// Display headings (large serif, few words per line) must not break a hyphenated compound at the line end
// ("avez-/vous"): landing and section titles use U+2011, the non-breaking hyphen (Newsreader has the glyph).
const DISPLAY_KEY = /^(hero|tools|how|privacy|sources|dir|closing)\.(\d\.)?(title|titleEm|t)$/;
const displayHyphen = (s) => s.replace(/(\p{L})-(?=\p{L})/gu, '$1\u2011');
const problems = (s, key = '', display = false) => {
  const out = [];
  if (display && DISPLAY_KEY.test(key) && /\p{L}-\p{L}/u.test(s)) out.push('hyphen that can break in a display heading (use U+2011)');
  if (/«(?! )/.test(s)) out.push('« without a no-break space after it');
  if (/(?<! )»/.test(s)) out.push('» without a no-break space before it');
  if (/ :(\s|$)/.test(s)) out.push('normal space before a colon');
  if (/[   ][?!;]/.test(s)) out.push('space before ? ! or ;');
  return out;
};

let count = 0;
for (const file of walk(join(root, 'src'))) {
  const fr = file.endsWith('fr.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  let changed = false;
  for (const [k, v] of Object.entries(data)) {
    if (typeof v !== 'string') continue;
    // In en.json, only French quoted in guillemets (e.g. a French placeholder shown on the English page).
    if (!fr && !v.includes('«')) continue;
    const display = fr && /countries\/[^/]+\/messages\/fr\.json$/.test(file);
    const found = problems(v, k, display);
    if (!found.length) continue;
    if (fix) {
      data[k] = display && DISPLAY_KEY.test(k) ? displayHyphen(frType(v)) : frType(v);
      changed = true;
    } else {
      count++;
      console.log(`✗ ${relative(root, file)} ${k}: ${found.join(', ')}  →  ${JSON.stringify(v).slice(0, 90)}`);
    }
  }
  if (changed) writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
if (!fix) {
  console.log(count ? `\n${count} French typography problem(s). Run: node scripts/fr-typography.mjs --fix` : '✓ French typography: « » no-break spaces, colons and ? ! ; are consistent');
  process.exit(count ? 1 : 0);
}
