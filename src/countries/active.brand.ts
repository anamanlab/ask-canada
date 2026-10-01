/**
 * The active pack's identity on its own (`brand/index.ts`, the same object as `pack.brand`), for code on
 * every page's first load: reading it off `pack` would bundle the whole pack (services, icons) with it.
 * Core reads it through `@/lib/brand`.
 */
export { brand } from '@country/brand';
