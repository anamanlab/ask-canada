# Ask Canada — product & engineering spec (shared contract for all agents)

> **UPDATED REQUIREMENTS — these take precedence over anything else in this file or in any agent prompt.**
> 1. **Open source, any country can run it.** Country-agnostic core + a swappable *country pack*. Canada is the
>    first pack (`src/countries/ca/`). Nothing Canada-specific may live in core code. See "Platform
>    architecture" below — its paths REPLACE the older per-widget paths listed under "Architecture & file
>    ownership" (if a prompt says `src/lib/tools/<id>.ts` or `src/components/widgets/<id>/`, use the
>    country-pack equivalents instead). License: MIT (`LICENSE`), plus `CONTRIBUTING.md`, `docs/NEW_COUNTRY.md`.
> 2. **Multilingual beyond EN/FR.** EN + FR are official and must be at full, human-quality parity everywhere.
>    The UI also ships in Canada's most common other home languages, and the AI answers in whatever language the
>    user picks or writes in. Several are right-to-left — RTL must be flawless. See "Languages" below.

## Grounding knowledge & official-source retrieval
- `vendor/cds-ai-answers/` = the Canadian Digital Service's own AI Answers guidance (MIT): expert-curated,
  per-department canada.ca answer rules with verified EN/FR URLs (`scenarios/context-<dept>/`), plus citation,
  safety and PII prompt guidance. Keep verbatim (license + attribution). The Canada pack adapts it in
  `src/countries/ca/knowledge/`: a lightweight department router (keywords/embeddings-free heuristics + the
  model) selects 1–2 relevant department contexts to inject into the system prompt per turn.
- **Widget builders MUST read the matching department file(s)** before writing data/copy (e.g. passports →
  `context-ircc`, taxes/benefits → `context-cra-arc` + `context-edsc-esdc`, weather → `context-eccc`).
- Core tools (country-agnostic, allowlist from the pack): `fetchOfficialPage(url)` — server fetch of an
  allowlisted official page, extract main content + title + last-modified, cache; `searchOfficialSources(q)` —
  best available search (Anthropic web search restricted to the allowlist when using the Anthropic provider,
  otherwise a site-search fallback), returning title/url/snippet. Answers cite what was actually fetched.
- Answer style follows AI Answers learnings: brief, one primary citation to the page that completes the task,
  never invent wait times/amounts, ask a clarifying question when the service is ambiguous, PII redaction on
  input (never echo SIN/card numbers).

## GC open-source & AI governance (adoption readiness)
- Repo hygiene per canada-ca/open-source-logiciel-libre + canada-ca/template-gabarit: bilingual README
  (EN + FR sections), LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, NOTICE (third-party credits
  incl. vendored AI Answers).
- `docs/SYSTEM_CARD.md` (+ FR) modelled on AI Answers' system card; `docs/AIA.md` — pre-filled Algorithmic
  Impact Assessment answers (Directive on Automated Decision-Making) showing it gives information only and
  makes no administrative decisions; `docs/ACCESSIBILITY.md` conformance notes.

- Deployable on GC infrastructure, not just Vercel: provider-agnostic model config in `src/lib/ai/model.ts`
  (`AI_PROVIDER=anthropic|google|gateway|azure|bedrock|workers-ai` via the matching `@ai-sdk/*` providers,
  lazy-imported), a
  production `Dockerfile` (Next standalone output) + `docs/DEPLOY.md` covering Vercel, AWS (ECS/Lambda) and
  Azure, and rate-limit storage behind an interface (memory / Redis) so no Vercel-only service is required.

## Platform architecture (open source, multi-country)
- **Core** (country-agnostic, reusable): `src/app/**`, `src/components/chat/**`, `src/components/ui/**`,
  `src/lib/ai/**` (runtime, provider selection, rate limiting, prompt *assembly*), `src/lib/scripted/engine.ts`,
  `src/lib/i18n/**` (runtime, formatters, RTL, core UI catalogs `src/lib/i18n/messages/<locale>.json`), lab.
- **Country pack** `src/countries/<cc>/` (Canada = `ca`), selected at build time by env `COUNTRY` (default `ca`)
  via a single `src/countries/active.ts` (plus a Turbopack/webpack alias if needed):
  - `pack.ts` — typed `CountryPack` (type defined in core `src/lib/country/types.ts`): id, names, brand
    (name, mark component, colors/theme tokens override, disclaimer, `mode: 'independent' | 'official'`),
    `locales` (supported + default + which are official), currency, time zones, emergency numbers, official
    source domain allowlist, handoff base URLs, menu taxonomy (service areas + starter prompts),
    system-prompt addendum (country knowledge + tool usage guidance), OG/hero imagery.
  - `messages/<locale>.json` — country-level strings (hero copy, menu, footer).
  - `tools/<id>.ts`, `widgets/<id>/{index.tsx, fixtures.ts, messages/<locale>.json, ...}`,
    `scenarios/<id>.ts` — per-widget, owned by that widget's agent (same contracts as described below).
  - Registries `tools/index.ts`, `widgets/registry.ts`, `scenarios/index.ts` inside the pack — pre-stubbed.
- Core UI never imports from `src/countries/ca` directly — only through `src/countries/active.ts`.
- A second tiny example pack `src/countries/example/` (generic "Republic of Example", 1 widget) proves the
  seam works and doubles as the template in `docs/NEW_COUNTRY.md`.

## Languages
- Locales (BCP-47): `en`, `fr` (official, hand-quality, parity required); plus top non-official home languages
  in Canada (2021 Census): `zh-Hans` (Mandarin/Simplified), `zh-Hant` (Cantonese/Traditional), `pa` (Punjabi,
  Gurmukhi), `es`, `ar` (RTL), `tl` (Tagalog/Filipino), `ur` (RTL), `fa` (RTL), `hi`, `pt`, `it`, `vi`, `ko`,
  `ta`, `uk`, `ru`, `gu`, `de`. Indigenous languages `iu` (Inuktitut, syllabics) and `cr` (Plains Cree) are
  offered for AI answers; their UI falls back to English with an honest note until reviewed by native speakers.
- All UI text lives in JSON catalogs (core, country pack, and each widget's `messages/`). Keys + ICU-style
  `{placeholders}` and plural forms. English is the source; French authored by the builder; other locales are
  produced in a dedicated localization phase — builders only write `en.json` + `fr.json`, runtime falls back to
  `en` for missing keys. Never hard-code user-visible strings in TSX.
- Language picker: elegant, searchable, shows each language in its own name/script (endonym), remembers choice,
  sets `<html lang dir>`. Fonts must cover Gurmukhi, Arabic/Persian/Urdu (Nastaliq preferred for Urdu if
  feasible), Devanagari, Tamil, Gujarati, CJK, Hangul, Cyrillic, Canadian syllabics (Noto families via next/font,
  loaded only for the active script).
- **RTL**: use logical CSS only (`ms-/me-/ps-/pe-/start-/end-`, `text-start`), mirror directional icons/arrows,
  test every screen with `?lang=ar`. Numbers/dates/currency via `Intl` with the active locale.
- The AI replies in the active UI language (or the language the user writes in), keeping official program
  names in their official English/French form with a translation in parentheses where helpful.

## What we're building
A real, production-grade, AI-first front door to every Government of Canada service — a complete functional
replacement for browsing canada.ca. The user asks in plain language (EN or FR, typed, spoken, or by attaching a
document) and gets a clear, sourced answer plus **interactive widgets rendered inside the conversation**
(calculators, eligibility checkers, wizards, maps, live data, trackers, checklists, contact cards).

Launch target: public at **canada.ryancampbell.com**. America.gov showed how good a single front door to government can be; Canada should have one too.
Quality bar: side-by-side with the best government services anywhere and a current
**Apple** product page/app, a blind judge must pick ours. Canadians should be *proud and excited* to use it.

## Non-negotiable framing (legal + trust)
- It is a real, working service — never call it a "concept", "demo", "mockup", "prototype" in UI copy.
- It is **independent**, not the Government of Canada. Do NOT use the Canada wordmark, the Federal Identity
  Program signature (flag + "Government of Canada"), department logos, or the Coat of Arms. The maple leaf,
  red/white, and national imagery are fine. Footer carries one honest line: "Independent service. Answers
  come from official Government of Canada sources — always confirm on the linked official page."
- Never collect credentials, SIN, banking, or passport numbers. "Sign in" / "Apply" / "Pay" actions hand off to
  the official page (canada.ca / CRA My Account / IRCC portal / etc.) with a clear "Continue on canada.ca ↗".
  Checklists, plans, reminders and trackers the user builds live on-device (localStorage) only.
- Every factual claim traces to an official source URL (canada.ca, *.gc.ca, *.canada.ca). Widgets show a
  compact "Source" footer with the domain + last-verified date.
- canada.ca text may be reused non-commercially; we paraphrase into plain language and link the source.

## Adoptable by the Government of Canada (build to GC production standards)
The goal is that the Government could take this over on canada.ca as-is. Therefore:
- All brand identity is centralized in the country pack `src/countries/ca/pack.ts` (`brand.mode: 'independent' | 'official'`, name,
  mark component, footer disclaimer, domain, contact). Official mode swaps in the FIP signature slot + canada.ca
  links; no brand strings hard-coded anywhere else.
- Standards: WCAG 2.1 AA / EN 301 549 (GC Standard on Web Accessibility), full EN/FR parity (Official Languages
  Act — every string, every widget, every scripted scenario), Canada.ca content style (plain language), GC
  privacy expectations (no tracking cookies, no PII persisted server-side, conversations not stored server-side),
  strict security headers/CSP, performant (LCP < 2s on 4G, JS kept lean), clean well-typed code a GC dev team
  can maintain, README with architecture + how to add a service/widget.

## Brand
- Name: **Ask Canada** (the product). Hero greeting: "Hello, Canada." / "Bonjour, Canada." (serif display).
- Bilingual EN/FR is first-class, plus many more languages — see "Languages". Header has a quick EN⇄FR toggle
  AND the full language picker.
- Look: Apple-grade restraint, calm and unmistakably Canadian. Warm paper whites, ink navy/near-black,
  a precise maple red accent used sparingly (send button, focus, key highlights), subtle northern imagery
  (aurora/landscape gradients, not clip art). Generous whitespace, large optical typography, soft layered
  shadows, 20–28px radii, hairline borders, glass only where it earns it. Dark mode is equally beautiful.
- Motion: spring-based, purposeful (message entrance, widget reveal, number tweening, skeleton shimmer),
  respects `prefers-reduced-motion`.
- Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`). Use tokens, never ad-hoc hex values in widgets.

## Stack (read the bundled docs — these versions differ from your training data)
- Next.js 16 App Router (`node_modules/next/dist/docs/`), React 19, TypeScript strict, Tailwind v4.
- **AI SDK v7** (`ai`, `@ai-sdk/react`, `@ai-sdk/gateway`, `@ai-sdk/anthropic`) — read `node_modules/ai/docs/`
  (esp. 04-ai-sdk-ui generative UI / tool parts, 03-ai-sdk-core tools) before writing AI code.
- `motion` (motion/react), `lucide-react` icons (or custom SVG), `streamdown` for streamed markdown, `zod` v4.
- Package manager: **pnpm**. Do not add heavyweight deps without need; no UI kits (no shadcn/MUI) — bespoke.

## Model / runtime
- `src/lib/ai/model.ts` picks the model: `ANTHROPIC_API_KEY` → `@ai-sdk/anthropic('claude-sonnet-5-5')`;
  otherwise Vercel AI Gateway `'anthropic/claude-sonnet-5.5'` (OIDC via `vercel env pull`); env `AI_MODEL` overrides.
- **Scripted mode**: if `SCRIPTED_AI=1`, or the model call fails (e.g. gateway 403 no credits), the chat route
  falls back to the scripted engine in `src/lib/scripted/` which streams realistic text + real tool calls for
  known intents. Tools still `execute` for real (live data where available). No "demo" labels in UI.
  Critics and builders rely on scripted mode for deterministic screenshots.
- Chat route `src/app/api/chat/route.ts`: `streamText` with the full tool registry, system prompt in
  `src/lib/ai/system-prompt.ts` (plain language, grade-8 reading level, cite sources, prefer a widget whenever
  one fits, ask one clarifying question at most, answer in user's language, safety escalation to 911 / 9-8-8).
- Abuse protection for going viral: per-IP rate limit, max message length, max steps, maxOutputTokens.

## Rendering model (decided: every page renders per request)
- **Every page is dynamic** (`ƒ` in the build output), on purpose. `src/proxy.ts` issues a fresh script nonce per
  request for a strict `script-src 'nonce-…' 'strict-dynamic'` policy (no `unsafe-inline`, the GC-grade CSP), and
  the root layout reads that nonce plus the language and theme (cookies, `?lang=`, `?theme=`). A nonce cannot
  be baked into prerendered HTML, so HTML responses are `private, no-store` and are not CDN-cached. Static
  assets, `/art/**`, fonts, icons, OG images, the manifest, robots and the sitemap stay static and cacheable.
- Because of that, pages do not export `generateStaticParams` or `dynamicParams` (they would prerender nothing,
  and `dynamicParams = false` is ignored in production for a route with no prerendered paths).
- Unknown URLs get the 404 rendered on the server only when no route matches; a `notFound()` thrown by a
  dynamic page reaches the browser as an empty shell. So the policy pages are static routes (`src/app/about`,
  `privacy`, `accessibility`, `terms`, sharing `src/app/_doc/DocPage.tsx`), and `src/proxy.ts` sends
  `/lab/<unknown id>` to an unmatched path. `notFound()` in `src/app/lab/[id]/page.tsx` only covers client navigations.
- Keep the per-request render cheap: only the namespaces client components need go in the `I18nProvider`
  payload, slow data sits behind `<Suspense>`, and the chat runtime is lazy-loaded.
- The language lives in the query (`?lang=fr`, hreflang-listed); `/fr` and `/fr/<page>` are 307 aliases to it
  (`next.config.ts`).
- Rejected for now: a path-based `[lang]` segment with hash-based CSP (`experimental.sri`) and a client-only
  theme. It would make the policy pages, the 404 and the landing shell CDN-cacheable, but relies on an
  experimental flag and a weaker inline-script story. Revisit if server cost or TTFB at peak traffic demands it.

## Architecture & file ownership (parallel agents: edit ONLY files you own)
- Shell/foundation (owner: foundation agent): `src/app/**` (except `lab/[id]` content), `src/components/chat/**`,
  `src/components/ui/**`, `src/lib/ai/**`, `src/lib/scripted/engine.ts`, `src/lib/i18n/**`, globals.css.
- Each widget `<id>` (owner: that widget's agent):
  - `src/lib/tools/<id>.ts` — exports `tools` object: `{ toolName: tool({ description, inputSchema, execute }) }`.
    Tool names are camelCase and prefixed sensibly (e.g. `passportPlanner`, `passportFees`).
  - `src/components/widgets/<id>/**` — `index.tsx` default-exports `renderers: Record<toolName, Component>`;
    each Component receives `{ part, locale }` where `part` is the AI SDK tool UI part
    (`state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'`, `input`, `output`).
    Must render beautiful loading skeletons for non-output states and a graceful error state.
  - `src/components/widgets/<id>/fixtures.ts` — default-exports an array of `{ name, toolName, part }` fixtures
    covering every state and edge case; rendered by the lab.
  - `src/lib/scripted/scenarios/<id>.ts` — default-exports scenarios: `{ match: RegExp[] (EN+FR), reply: {en, fr}
    (markdown with sources), toolCalls: [{ toolName, input }], followUps: {en: string[], fr: string[]} }`.
- Registries (pre-stubbed by foundation; widget agents never edit them): `src/lib/tools/index.ts`,
  `src/components/widgets/registry.ts`, `src/lib/scripted/scenarios/index.ts`.
- Widgets may call `useChatActions()` (from `@/components/chat/actions`) to `send(text)` a follow-up message,
  or `addToolOutput` for client-side tools, and `useLocale()` for en/fr.
- Shared widget primitives in `src/components/ui/` (Card, WidgetShell with header/icon/source footer, Button,
  Chip, Segmented, Field, Stat/NumberTicker, Skeleton, Badge, Stepper, Map). Use them for consistency; if you
  need a new primitive, build it inside your widget folder.

## Lab & test routes
- `/lab` — index of every widget. `/lab/<id>` renders all fixtures for that widget inside a real message column
  (same width/spacing as chat). Query `?theme=dark`, `?lang=fr`, `?lang=ar` (RTL), `?lang=zh-Hans`.
- `/?q=<text>` auto-submits a question (works in scripted mode) — used for end-to-end screenshots.
- Screenshot tool: `node scripts/shot.mjs --url /lab/<id> --out .shots/<id>/r1 --sizes desktop,mobile --schemes light,dark [--full] [--wait ms] [--actions JSON]`
  then view the PNGs with the Read tool. Dev server is ALREADY running at http://localhost:3000 — never start
  another, never kill it, never run `next build` (it clobbers `.next`). Type-check with `pnpm exec tsc --noEmit`.
  Don't edit `next.config.*` or route files at the same moment as another agent. If every route returns 500,
  read `.next/dev/logs/next-development.log` first (`shot.mjs` warns when a `.next/dev/*.json` manifest is corrupt).

## Facts
Ground every number, fee, date, threshold and phone number in the current official page (today is 2026-09-29).
Use WebFetch on canada.ca pages; record the URL in the data file. If you can't verify a figure, don't show it —
link to the official page instead. Live public APIs are encouraged (fetch server-side in tool `execute`, cache
with `next: { revalidate }`, always have a graceful fallback):
- Weather & alerts: https://api.weather.gc.ca (MSC GeoMet OGC API, e.g. `/collections/citypageweather-realtime/items`)
- Travel advisories: https://data.international.gc.ca/travel-voyage/index-alpha-eng.json (+ per-country JSON)
- Recalls: https://recalls-rappels.canada.ca/en/search (open data API: healthycanadians.gc.ca/recall-alert-rappel-avis/api/recent/en)
- Holidays: https://canada-holidays.ca/api/v1/holidays
- Exchange rates: https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/json?recent=1

## Quality bar checklist (critics enforce)
Pixel polish at 390px mobile and 1440px desktop, light + dark, EN + FR (French strings ~20% longer — no
overflow/truncation), flawless RTL (`ar`), CJK line breaking, no horizontal scroll, 44px touch targets, visible focus rings, WCAG AA contrast, semantic
HTML + aria, keyboard operable, no console errors, loading/empty/error states designed, numbers formatted
per locale (`fr-CA`: `1 234,56 $`), realistic real content (no lorem, no "John Doe"), zero layout shift on
stream-in, smooth 60fps motion.
