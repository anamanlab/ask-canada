// Node module hooks for running pack/core TypeScript from scripts without a bundler:
// resolves the tsconfig aliases (@/…, @country/…), extensionless .ts imports and stubs `server-only`.
// Types are stripped by Node's built-in TypeScript support (Node >= 22.18).
import { readFileSync, statSync } from 'node:fs';
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
// `statSync().isFile()`, not `existsSync()`: a bare specifier like `@/lib/scripted/engine` also matches the
// directory of the same name, and handing Node a directory to read fails with EISDIR.
const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};
const tryFile = (p) => [p, `${p}.ts`, `${p}.tsx`, `${p}.js`, `${p}.mjs`, join(p, 'index.ts')].find(isFile);

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
  // `.tsx` holds JSX, which Node's type stripper can't compile. A checker never renders a component — it
  // only needs the module graph to resolve — so hand back the file's named exports as undefined. This is
  // what lets `check-scenarios` walk a pack whose `pack.server.ts` imports a React component
  // (`showcase.passportIcon`).
  if (url.endsWith('.tsx')) {
    const names = new Set();
    for (const m of readFileSync(fileURLToPath(url), 'utf8').matchAll(
      /export\s+(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g,
    )) {
      names.add(m[1]);
    }
    const src = `const stub = undefined;\nexport default stub;\n${[...names].map((n) => `export const ${n} = stub;`).join('\n')}\n`;
    return { source: src, shortCircuit: true, format: 'module' };
  }
  return next(url, context);
}
