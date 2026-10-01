/**
 * Pure benefit calculations (isomorphic). The tools run them on the server; the widgets re-run them on
 * the client as people move sliders, so answers update instantly. Every constant lives in ./rates.ts, and
 * ./data.ts documents the official page it came from. These are estimates: the CRA and Service Canada decide
 * actual amounts.
 */
export * from './calculations/types';
export * from './calculations/family';
export * from './calculations/seniors';
export * from './calculations/find';
