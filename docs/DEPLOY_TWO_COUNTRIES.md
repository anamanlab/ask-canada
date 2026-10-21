# Deploying both countries from one repository

There is one codebase and two deployments. `COUNTRY` is a build-time variable that resolves every
`@country/*` import through `src/countries/active.ts`, so the whole app — components, tools, widgets,
messages, guidance, map, brand — comes from the pack `COUNTRY` names. Nothing in `src/components`,
`src/lib` or `src/app` contains Brazilian logic; that is the property that makes a second deployment cheap.

| | Ask Canada | Ask Brasil |
| --- | --- | --- |
| Build variable | `COUNTRY=ca` | `COUNTRY=br` |
| Default locale | en | pt |
| Official locales | en, fr | pt, en |
| Domain | your canada domain | your brazil domain |
| Typecheck | `pnpm typecheck` | `pnpm typecheck:br` |
| Scenario suite | `pnpm check:scenarios --country ca` | `pnpm check:scenarios --country br` |
| i18n check | `pnpm check:i18n --country ca` | `pnpm check:i18n --country br` |
| Pack tests | — | `pnpm test:br:holidays`, `pnpm test:br:servicos` |

Both deploy from the same commit. Canada is unaffected by anything in `src/countries/br/`, and the Brazil
build carries no Canadian content — `check-i18n` and `check:scenarios` run per country in CI precisely so a
leak in either direction fails the build.

## Per-deployment settings

`COUNTRY` is the only variable that must differ. Everything else can be shared or set independently, and
three of these are worth setting per deployment rather than copying:

| Variable | Why it is per deployment |
| --- | --- |
| `COUNTRY` | Selects the pack. Required. |
| `RATE_LIMIT_PER_MINUTE` / `RATE_LIMIT_BURST` / `RATE_LIMIT_SALT` | Traffic profiles differ; a public Brazilian audience and a Canada-only audience are not the same load. A distinct salt keeps one deployment's limit buckets from being forgeable via the other's history. |
| `AI_DAILY_BUDGET_USD` | A circuit breaker per day per budget owner. Set it on the deployment that pays the bill. |
| `AI_PROVIDER` / `AI_MODEL` | Defaults differ by deployment: Brazil runs on Cloudflare Workers AI (`workers-ai`, `@cf/zai-org/glm-4.7-flash`, no model key, billed on the account's 10,000 neurons/day), Canada on Gemini (`google`, `gemini-3.8-flash`). |
| `ANTHROPIC_API_KEY` / `AZURE_*` / `GEMINI_API_KEY` | Keep credentials separate so a compromised Canada deployment does not spend the Brazil budget. |
| `BASE_URL` | Used for absolute URLs and metadata; must match the deployment's own domain. |
| `AI_MODEL`, `AI_EFFORT`, `AI_WEB_SEARCH_MAX_USES` | Optional. `AI_WEB_SEARCH_MAX_USES` is worth thinking about separately: Brazil's web search is restricted to the Brazilian allowlist, so a larger allowance buys less than it does for Canada. |
| `SCRIPTED_AI` | Leave unset in production. It is a demo and kill switch, documented in `.env.example`. |

Set `SCRIPTED_AI=1` on a preview deployment to get deterministic answers with no model call at all — that is
how the scenarios, the Lab pages and the screenshots are produced.

## One live dependency, declared

Brazil's pack relies on public upstreams with different refresh patterns. The service catalogue is generated at build time; other public data is requested at runtime. Availability, caching, and rate limits are source-specific:

| Source | Used by | Failure behaviour |
| --- | --- | --- |
| `servicos.gov.br` / SERPRO | `node scripts/fetch-servicos.mjs` — a **build-time** step, not runtime | The generated index is committed, so the running app never calls it. |
| `api.bcb.gov.br` (SGS) | `economiaSeries`, runtime | Cached 5 minutes. A timeout or a throttled response reports "unavailable" and the answer says so; no figure is estimated. |
| `servicodados.ibge.gov.br` | `ibgePlace`, runtime | Localities are cached in the running process; verify codes and dates against the official response. |\n| `dadosabertos.camara.leg.br` | Legislative lookup tools, runtime | Official Câmara data; show dates and unavailable/unknown fields instead of inferring positions or vote totals. |

The catalogue uses a public SERPRO export instead of querying a credential-restricted full-catalogue endpoint on every request. Current generated detail records can carry service steps, audience and estimated time **when the export provides them**. Do not presume any field is complete for all services; unknown legal references or steps must not be invented. Refresh using `pnpm servicos:br`, inspect the diff and run `pnpm test:br:servicos` before publishing new snapshots. See `docs/PLAN_BR.md` for implementation history and remaining limitations.\n\n## Independent Brazil deployment identity\n\nFor a public Brazil deployment, set `NEXT_PUBLIC_BR_SITE_URL` to the HTTPS origin that **you control** before building (e.g. `https://brasil.example.org`). The Brazil pack otherwise falls back to the project's GitHub URL for its metadata, which is suitable for previews but **not** for launch SEO. Never use a government-owned hostname or affiliation claims without authorization. Verify the generated sitemap, robots and canonical URLs after deploy. The sitemap now derives language alternates from the active country pack (CA: en/fr, BR: pt/en).