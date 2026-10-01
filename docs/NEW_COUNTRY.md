# Add a country

Ask Canada's core (app shell, chat, UI kit, AI runtime, i18n, lab) knows nothing about Canada. Everything
country-specific lives in a **country pack** under `src/countries/<id>/`, selected at build time:

```bash
COUNTRY=example pnpm dev      # or set COUNTRY in your host's environment
```

`next.config.ts` aliases `@country/pack|pack-server|mark|brand|map|tools|scenarios|widgets|fixtures` to the chosen
folder, and core reads the pack only through these seams:

| Seam | What it exposes | Where it runs |
| --- | --- | --- |
| `src/countries/active.ts` | `pack`: the client-safe pack (`pack.ts`) | client + server |
| `src/countries/active.server.ts` | `packServer` (`pack.server.ts`), tools, scenarios, prompt addendum | server only |
| `src/countries/active.mark.ts` | `Mark` on its own (`brand/Mark.tsx`), for the error pages that ship with every route | client + server |
| `src/countries/active.brand.ts` | `brand` on its own (`brand/index.ts`, the same object as `pack.brand`), read through `@/lib/brand` by the site header on every page | client + server |
| `src/countries/active.map.ts` | basemap tiles (also read by the CSP in `src/proxy.ts`) | anywhere |
| `src/countries/active.widgets.ts` | widget renderers (lazy) | client |
| `src/countries/active.fixtures.ts` | lab fixtures and widget catalogs (lazy), without the renderers | anywhere |

TypeScript path mappings point at `ca`; other packs are type-checked against the same contract
(`src/lib/country/types.ts`, split into client and server halves in `src/countries/types.ts`).

## 1. Start from the template

```bash
cp -R src/countries/example src/countries/nz
```

`src/countries/example` ("Republic of Example") is the smallest complete pack: one widget (`holidays`),
one tool (`holidaysNext`), scenarios, EN/FR messages.

## 2. Fill in `pack.ts` and `pack.server.ts` (type: `src/lib/country/types.ts`)

The pack comes in two files, because `pack.ts` is bundled for the browser (the header, menu and widgets read
it) and must never carry server-only content:

- `pack.ts` exports `pack: ClientPack`: everything below except `systemPrompt`, `messages` and `showcase`.
- `pack.server.ts` starts with `import 'server-only'` and exports `packServer: CountryPack`, usually
  `{ ...pack, systemPrompt, messages, showcase }`. Anything secret, internal or
  server-side (prompts, keys, internal URLs, live data fetches) goes here only.

| Field | File | What it is |
| --- | --- | --- |
| `id`, `region`, `currency`, `timeZone` | `pack.ts` | Used for Intl formatting (`fr` + `CA` → `fr-CA`) and "today". |
| `locales` | `pack.ts` | `supported`, `official` (full human-reviewed UI required), `default`. Codes from `src/lib/i18n/config.ts`. |
| `brand` | `brand/index.ts` (exported as `brand`, where `@country/brand` finds it; `pack.ts` imports it) | `name`, `domain`, `url`, `Mark` (component, exported as `Mark` from `brand/Mark.tsx`, where `@country/mark` finds it), `markSvg(color)` (icons, social card), `flagColor`, `themeColor`, `mode: 'independent' \| 'official'`, optional `OfficialSignature`, `contact`, `repository`. |
| `emergency` | `pack.ts` | Emergency and crisis numbers shown in the footer, menu and safety answers. |
| `sources` | `pack.ts` | `allowlist` of official hostname suffixes (citations elsewhere are flagged) and the landing `showcase` domains. |
| `officialHome` | `pack.ts` | The official front door per language. |
| `services` | `pack.ts` | Service areas for the Menu and landing directory (`featured`), each with a Lucide icon. |
| `art` | `pack.ts` | Scene artwork (`hero`, `night`, `dusk`): landscape SVGs with a `<view id="m">` phone crop + aurora SVGs. `scripts/build-art.mjs` shows how Canada's are generated. |
| `silentTools` | `pack.ts` | Tools that ground the model but render nothing. |
| `widgetIds` | `pack.ts` | Widget ids in Menu/Lab order. |
| `systemPrompt` | `pack.server.ts` | Country knowledge and conventions appended to the core prompt (English). |
| `messages` | `pack.server.ts` | Loaders for pack UI strings per locale (`en` required). |
| `showcase` | `pack.server.ts` | `factsChecked` date, public holidays, tax deadline, the live `advisory()` and the optional `passportIcon` for the landing page. |

### Basemap: `map.ts` (type `MapTiles`)

Plain data (no React) used by the core `Map` (via `src/lib/map/tiles.ts`). By default (`proxy: true`)
tiles are served from our own `/tiles` route with CDN + data caching, so browsers never call the tile host and
the CSP stays `img-src 'self'`; set `bounds` so the route refuses tiles outside your country. Set
`proxy: false` only if the provider forbids proxying; then `hosts` is added to the CSP `img-src`. Give the base
layer URL template (`{z}/{x}/{y}`, optional `{s}` + `subdomains`), optional per-locale `labels` overlays,
the real `minZoom`/`maxZoom` the service has tiles for, `attribution` per locale, and either `base.dark`
tiles or a `filter.dark` CSS filter. Prefer your national mapping agency's open tiles: Canada uses Natural
Resources Canada's CBMT (`src/countries/ca/map.ts`); the example pack uses CARTO/OpenStreetMap.

## 3. Messages

Copy `src/countries/ca/messages/en.json` for the full list of keys the landing page, menu, footer and
policy pages use (`hero.*`, `services.<id>.*`, `privacy.*`, `doc.*`, `footer.*` …) and write every
official language. Run `node scripts/check-i18n.mjs --country <id>`.

## 4. Widgets, tools, scenarios

Follow [WIDGET_GUIDE.md](WIDGET_GUIDE.md). Register each widget in the pack's `tools/index.ts`,
`widgets/registry.ts`, `widgets/fixtures.ts` and `scenarios/index.ts`, and give the pack a `fallback`
scenario (id `fallback`) so scripted mode always answers.

## 5. Check it

```bash
COUNTRY=<id> pnpm dev
node scripts/shot.mjs --url / --out .shots/<id>/home --sizes desktop,mobile --schemes light,dark --full
node scripts/shot.mjs --url /lab --out .shots/<id>/lab
```

Nothing in `src/app`, `src/components` or `src/lib` should need to change. If it does, the seam is
missing something — add it to `CountryPack` rather than importing your pack from core.
