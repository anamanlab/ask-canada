/**
 * The single seam between core and the active country pack: the client-safe pack (brand, locales,
 * services, art, sources), importable from client and server code alike.
 * `@country/*` is aliased to `src/countries/$COUNTRY/*` in next.config.ts (default `ca`).
 * Server-only fields (system prompt, live data, catalogs) and registries: `./active.server.ts`.
 * Client widget registry: `./active.widgets.ts`. Lab fixtures: `./active.fixtures.ts`.
 * The mark alone, without the rest of the pack: `./active.mark.ts`. The identity alone: `./active.brand.ts`.
 */
import pack from '@country/pack';

export { pack };
