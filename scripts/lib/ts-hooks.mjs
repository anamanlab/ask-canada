// Node module hooks for running pack/core TypeScript from scripts without a bundler:
// resolves the tsconfig aliases (@/…, @country/…), extensionless .ts imports and stubs `server-only`.
// Types are stripped by Node's built-in TypeScript support (Node >= 22.18).
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));
const country = process.env.COUNTRY || 'ca';
const ALIASES = {
  '@country/pack': `src/countries/${country}/pack.ts`,
  '@country/pack-server': `src/countries/${country}/pack.server.ts`,
  '@country/map': `src/countries/${country}/map.ts`,
  '@country/tools': `src/countries/${country}/tools/index.ts`,
  '@country/scenarios': `src/countries/${country}/scenarios/index.ts`,
};
const tryFile = (p) => [p, `${p}.ts`, `${p}.tsx`, `${p}.js`, `${p}.mjs`, join(p, 'index.ts')].find((f) => existsSync(f) && !f.endsWith('/'));

export async function resolve(specifier, context, next) {
  if (specifier === 'server-only' || specifier === 'client-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  let target;
  if (ALIASES[specifier]) target = join(root, ALIASES[specifier]);
  else if (specifier.startsWith('@/')) target = join(root, 'src', specifier.slice(2));
  else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    target = fileURLToPath(new URL(specifier, context.parentURL));
  }
  if (target) {
    const file = tryFile(target);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true, format: file.endsWith('.json') ? 'json' : undefined };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.json')) return next(url, { ...context, importAttributes: { type: 'json' } });
  if (url.endsWith('.ts')) return next(url, { ...context, format: 'module-typescript' });
  return next(url, context);
}
