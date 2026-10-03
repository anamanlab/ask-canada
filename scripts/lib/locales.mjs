// The locale codes the platform knows about, read from the single source (`src/lib/i18n/config.ts`) so
// scripts never carry a second list that can drift. The type-only file is parsed for its `LOCALES` array.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../src/lib/i18n/config.ts', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('export const LOCALES'));
export const LOCALES = [...block.matchAll(/\{\s*code:\s*'([^']+)'/g)].map((m) => m[1]);
