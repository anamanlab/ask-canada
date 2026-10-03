# Ask Brazil — `src/countries/br`

Fork of **Ask Canada** (`anamanlab/ask-canada`, MIT). A Portuguese-first "Ask Brasil" front door to the
Brazilian federal government, built as a country pack on the existing seam. **Core is untouched apart from the
Brazil-compat patch in §2**, which grew during the build from 6 files to 18 — see §2.10.

Research compiled 2026-10-02. Any figure in this document is a *research lead*, not a shipped fact — every
number must be re-verified on the official page before it ships (§9 rule).

---

## 0. Status: MVP complete, Phase 5 (Câmara) shipped — 13 of 13 criteria met; all seven reconciliation gaps closed; first Phase-2 source live

### Phase 5 landed: the Chamber of Deputies

The brief's first "Later PR". Two tools over the Câmara's Dados Abertos API (open, keyless):
`camaraDeputado` (name/party/state/office/contacts) and `camaraProposicao` (text, status,
latest movements, last vote with its placar). Five widgets now: `holidays`, `economia`,
`ibge`, `servico`, `camara`.

Three things worth recording. First, the API distinguishes lists from records: searches
return `{dados: [...]}` while `/deputados/{id}` returns `{dados: {...}}`, and one reader
for both reported every deputy as missing while the search named them correctly — now
`getList` and `getOne`. Second, nominal votes live under `/votacoes/{id}/votos`, not on
the votação, and a symbolic vote has none at all: the card shows the description without
numbers rather than inventing a placar. Third, neutrality is structural: the answer
template has slots for facts and no slot for assessment, and deputy photos are omitted
(they would hand visitor IPs to a third party and need a Brazil-specific CSP hole).

Senado is reachable, LexML is WAF-blocked from here, DataJud and Transparência need keys.
TSE is bulk ingestion. Câmara was first because it is open and answers the brief's own
legislative questions.

`COUNTRY=br pnpm dev` runs a working Portuguese-first product: a landing page, a chat that answers in pt and
en, and one widget (the next days the federal administration is closed) that teaches the
feriado-nacional / ponto-facultativo distinction.

| | |
| --- | --- |
| Pack | `src/countries/br/` — brand, pack, map, 14 ministries of guidance, 244 catalog keys, 24 scenarios, five widgets (`holidays`, `economia`, `ibge`, `servico`, `camara`), a 1,600-service official index plus per-service detail, 27 artwork files |
| Verified | `pnpm typecheck` · `pnpm typecheck:br` · `pnpm lint` · `check:i18n` (ca **and** br) · `check:scenarios --country br` (**412/412**) · `check:guards` · `test:br:holidays` · `test:br:servicos` · `test:br:contract` · chat end-to-end in pt and en, 0 console errors, 0 px horizontal overflow at 390 px |
| Canada | Unchanged behaviour. Its 13 pre-existing `check:scenarios` failures are the same 13 as before this work (see §11). |
| CI | `.github/workflows/ci.yml` now has one leg per pack (`ca`, `br`), and the `br` leg fails if the generated files are stale. |

Run it:

```bash
COUNTRY=br pnpm dev
pnpm generate:br        # re-render the four generated file groups
pnpm test:br:holidays   # the holiday data against the published Portarias
```

### Reconciliation against `docs/brazil_plans.md`

The implementation brief in `docs/brazil_plans.md` is the authoritative scope. Status of its own build
sequence and its testable requirements, mapped against what is actually in the tree:

| Brief | Status | Notes |
| --- | --- | --- |
| §1 preserve Canada | done | `check:i18n --country ca`, `check:scenarios --country ca`, `typecheck` all pass. Canada keeps its own pack; nothing Brazil-specific lives in core. |
| §3 six-level authority hierarchy | partial | The order is real (tool → generated service record → curated page → guidance), but nothing *enforces* it. See gap **G2**. |
| §2 Brazil as a real country pack | done | `src/countries/br` behind `@country/*`; `COUNTRY=ca` and `COUNTRY=br` build from one tree. |
| §4 official-domain allowlist | done | Enforced in the system prompt and again in `servicos.test.mjs`. The brief's list is a subset of ours; every extra domain was 200-checked. |
| §6 IBGE | done | 5,571 municipalities, canonical codes, region/state hierarchy, accent-insensitive. The state is derived from the code because the endpoint's shape varies between requests. |
| §7 Banco Central | done | Six series, each verified live; shape-checked and cadence-guarded; stale figures labelled. |
| §5 GOV.BR services | done | 1,600 records plus a per-service detail file (`servicos.detalhes.ts`, same dump and date): stages in the catalogue's own words, audience, time estimate, contact, digital link. `servicoDetalhe` resolves slug, name or question to the record. Legislation is deliberately omitted — the dump carries only internal SERPRO ids with no titles, and inventing links would be worse than the card pointing at the official page. |
| §5 "never fabricate a service ID" | done | The index is generated from SERPRO's own export; ids are `servicos.gov.br` slugs. |
| §8 / PR5 source router | done | `routeSources()` returns the tool that owns the answer and `groundingForTurn()` puts it in the prompt as an instruction. Conservative on purpose: `ibgePlace` is not routed for questions it cannot answer. |
| §8 no embeddings for routing | done | Keyword rules only. |
| §9 structured-before-RAG | done | All four worked examples route correctly, including "Quais municípios existem em Pernambuco?" → IBGE, answered with a count and an alphabetical sample. |
| §11 no private-record APIs | done | CPF/CadÚnico/CNIS never queried; every personal-status question hands off to Meu INSS or CadÚnico. |
| §12 privacy / no account needed | done | Prompt forbids collecting CPF, NIS, RG, CNS, bank details, passwords, gov.br codes. |
| §13 `BrazilToolSource` contract | done | `tools/source.ts` defines the contract; both live tools emit it. Core `ToolSource` gained generic `authority`/`fetchedAt`/`datasetId`/`fromCache` fields, and the footer renders "Ao vivo · cache de HH:MM" for a cached live value instead of the bare "Ao vivo". A 5-minute cache hit and a fresh fetch no longer wear the same badge. |
| §14 failure behaviour | mostly done | Every adapter has a timeout, retries, and refuses to invent a number. Missing only the live-vs-cached distinction (§13) and the upstream handoff link on some failures. |
| §15 cache by volatility | done | IBGE: per-process (long). Services: a generated snapshot, refreshed by script. BCB: 5 min. Nothing personal is cached. |
| §16 widget A government service | partial | `holidays` is a complete widget; GOV.BR services are an answer-plus-citation path with no card. |
| §16 widget B location | done | `ibge` widget. |
| §16 widget C economy | done | `economia` widget. |
| §20 search behaviour | done | Retrieval is fallback and discovery, never the primary path when a tool exists. Nothing broadens to non-official sources: the allowlist is enforced in the prompt and again in the index test. |
| §17 categories | done | Eight categories in the menu. |
| §18 independent brand | done | "Ask Brasil". The prompt states outright that it is not the Governo Federal. |
| §19 system prompt principles | done | All seven are stated explicitly, including the tool-over-memory rule, the never-invent list, and the four-way separation between general information, official requirements, live data and individualised advice. |
| §21 no vector DB first | done | Keyword search over a generated index, no embeddings anywhere. |
| §22 Canada regression | done | All Canada checks pass. |
| §22 Brazil checks | done | `typecheck:br`, `lint`, `check-i18n --country br`, `check:scenarios --country br` (369/369). |
| §22 contract tests per adapter | done | `tools/contract.test.mjs` (34 assertions, network-free via a stubbed fetch) covers the live/cached/failed/stale paths, the §13 source shape, and the routing of the brief's questions. The five §22 questions are pinned in `paraphrases.json`. |
| §22 five named test questions | **not done** | None of the brief's five appear in scenarios. Gap **G6**. |
| §25 MVP completion | 13 of 13 | Canada intact; `COUNTRY=br` builds independently; PT-BR UI; own allowlist; GOV.BR service questions answered from official service records **with stages, audience, time and links**; IBGE normalises location; Banco Central answers live economic questions; answers cite real sources; upstream failure does not hallucinate; no private APIs; authentication hands off; no Canadian facts in Brazil; no Brazil logic in core. No open gaps. |
| §24 two deployments | done | `COUNTRY` build var, separate CI legs, and a per-deployment matrix in `docs/DEPLOY_TWO_COUNTRIES.md` covering domains, budgets, rate limits, credentials and the three live dependencies with their failure behaviour. |
| §10 phase-2 sources | not started | Câmara, Senado/LexML, DataJud, Transparência, TSE. Deliberately out of MVP. |

#### Gap status

**Closed after the reconciliation:**

- **G1 — route to sources, not only guidance.** `routeSources()` in `knowledge/router.ts` returns the tool that
  owns the answer, and `groundingForTurn()` injects it as an imperative block above the ministry guidance:
  *"Call the tool before you answer. Its figure is the official one and it carries its own date; yours is a
  recollection."* Routes for `economiaSeries` (Selic, IPCA, IGPM, dollar, FX) and `ibgePlace` (IBGE code).
  It is deliberately conservative — `ibgePlace` resolves one place, so it is not routed for "which
  municipalities exist in a state", which is the subject of G4. One bug worth remembering: the first version
  tested the raw question, so `código IBGE` never matched its own accent-free pattern. The ministry rules
  folded diacritics first; these now do too.
- **G5 — the prompt's explicit principles.** Added: use the tool rather than memory; never invent a
  requirement, fee, deadline, threshold, legal rule or current economic value; and the four-way separation
  between general information, official requirements, live data and individualised advice.
- **G7 — deployment configuration.** `docs/DEPLOY_TWO_COUNTRIES.md`: the `ca`/`br` matrix, which variables
  must differ and why, and the three live upstream dependencies with their failure behaviour. Cross-linked
  from `docs/DEPLOY.md` and `.env.example`.

**Closed in the final pass:**

- **G2 — one source contract.** Closed. `tools/source.ts` plus `fmt.time`, generic core fields, and a
  footer that distinguishes cached from fresh.
- **G4 — a state should be able to list its municipalities.** Closed. `ibgePlace` detects a state
  question and answers with the count plus an alphabetical sample that says it is alphabetical. Three
  accent bugs were fixed along the way (the router, `queryFor`, and the state tail-match all tested the
  raw question).
- **G6 — contract tests for the adapters, plus the brief's five questions.** Closed. 34-assertion
  contract test with stubbed network; two misroutes it caught are fixed (`retirement-meuinss` claiming
  generic service questions, and no scenario answering the catalogue question — new `service-catalog`).
- **G3 — `getGovBrService(id)` with stages and legislation.** Closed. The dump turned out to carry `etapas`, `solicitantes`, `tempoTotalEstimado`, `contato` and `linkServicoDigital` for all 1,600 kept services — so no new network calls, just a second generated file plus the `servicoDetalhe` tool and `servico` widget. Resolution is ranked top-5 (shared words for, unasked-for qualifiers against) with a noun fallback and an overlap guard, because bare-noun search misranks and nonsense must stay not-found. Legislation stays omitted for the reason above.

### Phase 4 landed: live data (IBGE and Banco Central)

The two live sources the pack still owed. Both are read through tools, never through prose.

**`ibgePlace`** turns a place name into the code the federal state runs on. It fetches all 5,571
municipalities once per server process and matches accent-insensitively, so "Sao Paulo" finds São Paulo.

The one decision worth recording: **the state is not read from the municipality list.** That endpoint's
response shape varies between requests — one call returned the full hierarchy with the state nested under
`mesorregiao`, the next returned only `{id, nome, microrregiao, regiao-imediata}`, state gone. A tool that
reads it there is wrong at random. Instead the state comes from the code itself, which is what the code
means: IBGE municipality codes begin with the state's code, verified across all 5,571 records. The 27 states
come from `/estados`, which is small and consistently complete. So the one field the tool cannot do without
is the field that cannot change shape.

Names go out in Portuguese in both locales. IBGE publishes no English place names, and transliterating them
would put invented spellings on a card whose whole point is being right.

**`economiaSeries`** reads macro indicators from the Banco Central's SGS. The catalogue is six series —
Selic and its year-to-date, IPCA over 12 months and accumulated, IGPM, and the dollar PTAX — and **each was
added only after its endpoint was seen returning current data**. That qualifier is the work. SGS keeps serving
series it no longer updates and answers a request for "the last N" with a well-formed array of decade-old
values: series 63 returns 2012, series 2265 returns 2014, both with a 200. A retired series also answers with
an HTML error page and a 200. So responses are checked for shape, and every series carries its publication
cadence — a series silent for longer than its cadence is reported **stale**, with the gap in days, instead of
being shown as today's figure.

That is the whole design of this widget: a rate quoted without its date is how someone signs for a loan at the
wrong number. When the Central Bank is unreachable the card says the figure is missing and that this does not
mean it changed — and there is a fixture for it, because that state is the one most worth seeing in review.

Measured against the spec's own MVP list, the two items Phase 1 and 3 left open are now closed: IBGE
normalises location, the Banco Central answers a curated set of live economic questions. Responses are cached
for five minutes, which is far shorter than the daily cadence of every series and removes the duplicate fetch
a scripted turn would otherwise make.

### Phase 3 landed: the service catalogue

`scripts/fetch-servicos.mjs` ingests the Portal de Serviços' own export of every federal service and emits
`src/countries/br/knowledge/servicos.index.ts`, which `knowledge/search.ts` ranks alongside the hand-verified
pages.

| | |
| --- | --- |
| Source | `https://api-servicos.estaleiro.serpro.gov.br/servicos-json` — 5,730 services, 240 agencies, 41 MB, no key, regenerated daily. |
| Kept | **1,600** services across **106** agencies, 344 KB. A bounded slice, and deliberately so. |
| Excluded | 990 services from universities, hospital subsidiaries and museums — real publications, not federal services a citizen asks this product about. |
| Budget | per-agency, from an explicit table for the bodies that dominate first questions (Receita 150, INSS 90, Saúde 80…) and share-proportional elsewhere, floor 12. |
| Linked | 808 of the 1,600 name a ministry the pack has hand-written guidance for. |

Ranking is **IDF-weighted** keyword overlap, which is what makes it usable rather than merely present.
Three things it had to get right, each found by testing against real questions:

- **Rare words carry the evidence.** `solicitar` appears in 19.7% of the index and `obter` in 16.3% — the
  verbs the catalogue puts in front of almost every service name. Words above 6% are dropped before the query
  is weighed; everything that means something sits at or below 4%.
- **A word the index has never seen is not evidence of absence.** "hoje" appears in no entry, so counting it
  in the denominator sank every otherwise-exact question. Out-of-vocabulary words are dropped instead.
- **One word cannot carry a multi-word question.** A result needs to match at least two of the query's known
  terms, which is what stops "consultar X" from returning whatever mentions "consultar".

Measured on 20 real Portuguese questions: **17 return the correct official service page first**, and the
three that do not are correct behaviour — "segunda via do CNH" is a DETRAN service with no federal page, and
"taxa Selic" only misses because "taxa" is not one of that page's keywords (it is the first hit for "Selic"
and for "juros do banco central").

`node src/countries/br/knowledge/servicos.test.mjs` checks the generated index without the network, so CI
catches a hand-edit: unique slugs, allowlisted hosts, no contradictory login flags, known account levels.
`node scripts/fetch-servicos.mjs --check` compares against the live catalogue when currency matters.

### 2.10 The core patch, as built

§2 below is the plan. What actually landed is listed here so nobody has to diff:

| File | Change |
| --- | --- |
| `lib/i18n/config.ts` | `pt` → `ui: true, reviewed: true` |
| `lib/i18n/catalog.ts` | register the `pt` core catalog; export `officialLocales` |
| `lib/i18n/messages/pt.json` | **new** — core UI strings in pt-BR |
| `lib/dates/business-days.ts` | `Holiday['name']` locale-keyed |
| `lib/country/types.ts` | `LocalizedText`; `Advisory` locale-keyed; `showcase.taxDeadline?` optional; `showcase.demo?`; `brand.greeting?`; `brand.ask?`; `brand.accent?`; `pack.chips?`; `pack.landing?` |
| `components/landing/copy.ts` | the landing override moved from core to `pack.landing` |
| `components/landing/sections/{Hero,Closing,FlagDemo,ToolsShowcase,HowItWorks,SourcesSection}.tsx` | greeting, flag words, chips, eyebrow, demo figures, source domains and the handoff label all read the pack |
| `components/chat/ToolPart.tsx` | a widget's covered locales default to `pack.locales.official`, not `['en','fr']` |
| `components/site/{SiteHeader,LangSwitchLink,Footer,MenuSheet}.tsx` | the EN⇄FR toggle is the pack's other official language |
| `lib/brand.ts` | `otherOfficial()` and `endonym()` |
| `lib/ai/{official-sources,core-tools}.ts` | the user-agent and the two tool descriptions derive from the pack |
| `lib/scripted/{types,engine,aliases}.ts` | `Bilingual` generalised; `ScenarioCtx` gains `locale`; the language is the pack's |
| `app/api/chat/route.ts` | `forceLang` accepts any official locale |
| `app/opengraph-image.tsx` | greeting, tagline and accent from the pack |
| `app/layout.tsx` | emits `brand.accent` as the `--maple*` variables |
| `scripts/{check-i18n,check-scenarios}.mjs` | the parity pair comes from the pack |
| `scripts/lib/ts-hooks.mjs` | **bug fix**: resolved a bare specifier to a *directory* (`existsSync` matched dirs), so `check:scenarios` could not run at all; `.tsx` is stubbed by named export |
| `src/countries/ca/**` (7 files) | mechanical: the widened `Bilingual`/`Holiday` types, and Canada's landing override moved into `src/countries/ca/landing/` with identical strings |
| `tsconfig.br.json`, `package.json`, `.github/workflows/ci.yml` | **new** / extended |

Three of these were not in the plan and were found by screenshotting the running app: the landing override
was Canada's copy living in core; the hero greeting and the EN⇄FR toggle were hardcoded; and the widget
rendered in English inside a Portuguese conversation. They are all the same class of bug as the ones §2
predicted — a country fact baked into core — and none of them is Brazil-specific.

---

## 1. What we already have for free

The repo was designed for exactly this. `COUNTRY=<id>` swaps the pack at build time via
`next.config.ts:10-21`; core reads the pack only through `src/countries/active*.ts`. `docs/NEW_COUNTRY.md`
is the walkthrough and `src/countries/example/` is a working 1-widget template.

What `br` gets for free, with **zero** new code:

| Already built | Used as-is |
| --- | --- |
| App shell, chat runtime, AI SDK v7 wiring, provider selection | yes |
| `src/components/ui/**` — `WidgetShell`, `Segmented`, `Field`, `Map`, `Stat`, `Checklist`, `CalendarGrid`, `Sheet`, skeletons | yes, all widgets |
| i18n runtime, `Intl` formatters, `useToday`/`useNow`, RTL plumbing | yes |
| `@/lib/device-store` (on-device plans, no server PII) | yes |
| `/lab/<id>` fixture harness, `scripts/shot.mjs`, `check-i18n`, `check-scenarios` | yes (scripts need a 6-line locale parameterization, §2.6) |
| CSP nonce, rate limits, abuse guards, BotID | yes |
| `CountryPack` type contract (`src/lib/country/types.ts`) | yes — it is country-neutral |

`src/lib/ai/system-prompt.ts` is generic except for three Canada examples in prose (see §7). The country
addendum is `pack.systemPrompt`, appended last, so it wins.

---

## 2. The Brazil-compat core patch

> As planned; **as built it is 18 files — see §2.10 for the real list.**

Nothing else in core changes. Each item is additive or a type widening; `COUNTRY=ca` behaves identically.

### 2.1 `src/lib/i18n/config.ts` — promote `pt`
```diff
- { code: 'pt', endonym: 'Português', english: 'Portuguese', dir: 'ltr', script: 'latin', intl: 'pt', ui: false, answerNote: 'Respostas em português · por enquanto, menus em inglês' },
+ { code: 'pt', endonym: 'Português', english: 'Portuguese', dir: 'ltr', script: 'latin', intl: 'pt', ui: true, reviewed: true },
```
Without this the interface stays English for everyone (§ `provider.tsx` `translated` gate).

### 2.2 `src/lib/i18n/catalog.ts` — register the core PT catalog
```diff
  const core: Partial<Record<Locale, Loader>> & { en: Loader } = {
    en: () => import('./messages/en.json'),
+   pt: () => import('./messages/pt.json'),
```
### 2.3 `src/lib/i18n/messages/pt.json` — **new file**, core UI strings in pt-BR
Every key in `src/lib/i18n/messages/en.json` (~90 keys: composer, chat, menu, lang picker, widgets shell,
policy-page chrome). Must have identical keys and identical `{placeholders}`; `check-i18n` §3 enforces it.
Notably `lang.note` currently says *"English and French are Canada's official languages"* — rewrite for
pt. Override again in the pack's `messages/pt.json` if you want to mention English as secondary.

### 2.4 `src/lib/dates/business-days.ts` — holiday names keyed by locale
```diff
-export type Holiday = { date: string; name: { en: string; fr: string } };
+import type { Locale } from '@/lib/i18n/config';
+export type Holiday = { date: string; name: { en: string } & Partial<Record<Locale, string>> };
```
Consequences, 3 one-token edits: `src/components/landing/copy.ts:15` (`const L: 'en'|'fr'`) → widen `L` to
`Locale` resolved from `pack.locales.official`; `FlagDemo.tsx:96` and `ToolsShowcase.tsx:142` →
`h.name[L] ?? h.name.en`.

### 2.5 `src/lib/ai/*` — two Canada strings and one UA
- `official-sources.ts:20,125` — `AskCanadaBot/1.0` → derive from `pack.brand.name`
  (`${pack.brand.name.replace(/\s+/g,'')}Bot/1.0`). gov.br's WAF is stricter than canada.ca's; sending a
  `AskCanadaBot` UA to `*.gov.br` is a bad look and may get us blocked.
- `official-sources.ts:149` + `core-tools.ts:35` — the words "canada.ca" in a tool description. Template
  them with `${pack.officialHomeLabel}`. These strings reach the model, so a leftover "canada.ca" is a
  real grounding bug, not just cosmetic.

### 2.6 `scripts/check-i18n.mjs`, `scripts/check-scenarios.mjs` — parameterize the parity pair
Both hardcode `['en','fr']`. Read the pair from the pack's `locales.official` instead:
`const pair = (await import('@country/pack')).pack.locales.official;`. ~6 lines total. `fr-typography.mjs`
walks `fr.json`/`en.json` and no-ops harmlessly for `pt`.

### 2.7 Scripted mode (`src/lib/scripted/`) — ~10 lines
The engine is hardcoded EN/FR and `SCRIPTED_AI=1` is the dev path *and* the graceful fallback when the model
is down, so a broken scripted mode is a visible product bug, not cosmetics. Trace:
`engine.ts:225` → `asked='pt'` ⇒ `lang='en'` ⇒ the English `reply.en` is streamed after a bridge note, and
`engine.ts:258` → `followUps = localized ? undefined : followUps[lang]` ⇒ **no pt follow-ups at all**.

Fix:
- `types.ts` — `export type Bilingual<T> = { en: T; fr: T }` → `{ en: T } & Partial<Record<string, T>>`.
  Then `br` scenarios read `reply: { en, pt }` / `followUps: { en, pt }` and TypeScript accepts them.
- `engine.ts` — `type Lang = 'en' | 'fr'` → the pack's official locales; resolve `lang` from
  `pack.locales.official` instead of the `=== 'fr'` chain; add a `pt` wordlist to `detectLang` (line 59-66,
  accent-insensitive: `\b(meu|minha|como|onde|quanto|qual|preciso|tenho|não|sim|obrigado|você|por favor)\b`)
  and a `pt` entry to `BRIDGE` (line 21).

### 2.8 Optional but recommended: accent colour
`--maple: #d52b1e` is a **core design token** (`globals.css:35`). The pack contract has no accent override —
only `brand.flagColor` and `brand.themeColor`. A Brazil pack with a Canadian red accent undercuts the whole
product. Cheapest fix: add `brand.accent?: { base: string; ink: string; wash: string }` to `CountryPack` and
emit the three CSS vars in `layout.tsx` from `pack.brand.accent` (≈10 lines). Do this in P1 if you agree;
otherwise Brazil ships looking like Canada.

### 2.9 Deliberately deferred (works around, no core change)
| Leak | Workaround |
| --- | --- |
| `layout.tsx:31` OG locale `en_CA`/`fr_CA` | cosmetic; one line |
| `next.config.ts:75` `/:lang(en|fr)` alias redirect | `?lang=pt` is canonical; alias is nice-to-have |
| `tsconfig.json` `@country/*` → `ca` | new `tsconfig.br.json` (§3) |
| `system-prompt.ts` prose ("English/French form", `$163.50`, `canada.ca/…`, "SIN") | overridden by `pack.systemPrompt` (§4.2) |
| `globals.css` `--maple` | see §2.8 |

---

## 3. Repo / fork setup

```bash
git clone <your-fork> ask-brazil
cd ask-brazil
git checkout -b brazil-pack
pnpm install
COUNTRY=br pnpm dev            # after the pack exists
```

- **Typecheck for `br`**: `tsconfig.json` paths point at `ca`, so `pnpm typecheck` won't see `br`. Add
  `tsconfig.br.json` (`extends: ./tsconfig.json`, the ten `@country/*` paths repointed to `br`) and a script
  `"typecheck:br": "tsc --noEmit -p tsconfig.br.json"`. New file, core untouched.
- **CI**: add a matrix leg `COUNTRY: [ca, br]` to `.github/workflows/ci.yml` with
  `pnpm check:i18n --country br` / `pnpm check:scenarios -- --country br`.
- **Deploy**: a separate Vercel project (or Docker image) with `COUNTRY=br`. `Dockerfile` needs no change —
  `output: 'standalone'` + env var. `docs/DEPLOY.md` already covers AWS/Azure.
- `ca` is never deleted or edited. The two forks can diverge in `br/` forever.

---

## 4. Pack inventory — every file to create

```
src/countries/br/
├── pack.ts                 # ClientPack: id 'br', region 'BR', currency 'BRL', timeZone 'America/Sao_Paulo',
│                           #   locales {supported, official:['pt','en'], default:'pt'}
├── pack.server.ts          # import 'server-only'; {...pack, systemPrompt, messages, showcase}
├── brand/index.ts          # name 'Ask Brasil'? (decide, §8), markColor, themeColor, mode 'independent'
├── brand/Mark.tsx          # green+yellow mark; export MARK_PATH like ca/brand/Mark.tsx
├── brand/geometry.ts       # (optional) SVG path constants
├── map.ts                  # MapTiles (§6)
├── data/
│   ├── holidays.ts         # feriados nacionais (§5.1)
│   ├── servicos.index.ts   # trimmed servicos.gov.br catalog (§5.2)
│   └── ministries.ts       # ministry → guidance file map (§4.2)
├── knowledge/
│   ├── index.ts            # MINISTRIES registry + loadGuidance(), mirroring ca/knowledge/index.ts
│   ├── router.ts           # pt-BR keyword RULES[] → groundingForTurn()
│   ├── search.ts           # searchLocalSources(): keyword score over servicos.index.ts
│   ├── pages.ts            # curated verified URL index (title, url, keywords, orgao)
│   └── guidance/*.md|ts    # one hand-written answer guide per ministry (§4.2)
├── messages/{pt,en}.json   # ~266 keys, same as ca (hero, services.*, footer, doc.*, chip.*)
├── tools/
│   ├── index.ts            # byWidget map + packTools.officialGuidance + re-exports
│   ├── holidays.ts
│   └── <widget>.ts         # one per widget
├── widgets/
│   ├── registry.ts         # widgets: WidgetEntry[]
│   ├── fixtures.ts         # fixtures + catalogs maps
│   ├── holidays/{index.tsx, fixtures.ts, messages/{pt,en,index.ts}}
│   └── <widget>/…          # per WIDGET_GUIDE.md
└── scenarios/
    ├── index.ts            # withTitles([...per-widget, ...starters, ...general]) + id 'fallback'
    ├── general.ts, starters.ts, titles.ts
    ├── paraphrases.json
    └── <widget>.ts
public/art/br/               # §8 — hero/night/dusk land + aurora equivalents
```

Contract details: `docs/NEW_COUNTRY.md` §2 (pack fields), `docs/WIDGET_GUIDE.md` §1–7 (widget file ownership,
naming rule, fixtures, scenarios). `scenarios/index.ts` is **not** pre-stubbed in `br` — we own it.

---

## 5. Data strategy

### 5.1 Static, verified facts
`data/holidays.ts` — national holidays from **Lei 662/1949**, **Lei 10.607/2002** (Carnaval, Corpus Christi,
Dia do Servidor Público), **Lei 12.759/2012** (21 de Abril). Verify current-year observed dates; Carnival and
Easter move. `Holiday[]` in `pt` + `en`.

`pack.server.ts → showcase`: `factsChecked` date, `holidays`, `holidaysUrl`
(`https://www.gov.br/feriadosnacionais/`), `taxDeadline` → **IRPF 2026** filing date + **Simples Nacional DAS**
5th-of-month. `advisory()` is optional; Brazil's outbound-travel advisories live at
`https://www.gov.br/mre/pt-br/consulado-alerta` (MRE) — implement or drop.

### 5.2 The corpus: `servicos.gov.br` ⭐ the single highest-value asset

`https://api-servicos.estaleiro.serpro.gov.br/servicos-json` — **fully open, no auth, no key**:
**41 MB, 5,730 federal services, 240 agencies.** Per-service `GET /api/v1/servicos/{id}` is also open
(the bulk `/servicos-auth` list needs a token; this dump doesn't).

Fields that map straight onto what an assistant is asked: `nome`, `descricao`, `palavrasChave`, `etapas`,
`legislacoes`, `orgao`, `condicoesAcessibilidade`, `tratamentoPrioritario`, `servicoDigital`,
`linkServicoDigital`, `porcentagemDigital`, `tempoTotalEstimado`, `gratuito`, and — the best UX signal in the
whole dataset — **`temLoginGovBR`** and **`temNivelMinimoContaGovBR`** (`B` básico / `P` prata / `O` ouro).
That answers "do I need to verify my identity for this?" before the user clicks anything.

⚠️ Types are inconsistent: `servicoDigital` is a boolean, `gratuito` is `"true"` (string), `temLoginGovBR` is
`"S"`. Validate with zod at the boundary.

**Plan**: `scripts/fetch-servicos.mjs` downloads the dump, keeps the ~1,200 services whose `orgao` is in a
curated federal-ministry list and that have ≥1 keyword, and writes a compact
`src/countries/br/data/servicos.index.ts` (~1–2 MB, keyword → record map). `knowledge/search.ts` scores
`nome + palavrasChave + descricao` with a pt-BR-normalized tokenizer (strip diacritics, lowercase, strip
suffixes) and returns `[{url, title, snippet, source}]` to `searchLocalSources` — the exact contract
`src/lib/ai/official-sources.ts` already consumes. This gives the model verified-grounded retrieval for ~70%
of questions with **zero auth complexity**.

Refresh: a cron/scheduled job; never fetch 41 MB from a request handler.

### 5.3 Live APIs, by widget
Everything verified open unless marked 🔑 (key) — **all verified from a non-Brazilian IP; several hosts
geo-block or WAF datacenter IPs, so re-verify from a Brazilian network before shipping a fallback error path.**

| Area | Endpoint | Auth |
| --- | --- | --- |
| Municipalities / UF / districts | `servicodados.ibge.gov.br/api/v1/localidades/*` | open |
| Boundaries (GeoJSON/TopoJSON) | `servicodados.ibge.gov.br/api/v3/malhas/{nivel}/{codigo}?formato=application/vnd.geo+json` | open |
| Census / population / indicators | `apisidra.ibge.gov.br/values/t/{tabela}/n{n}/…` — drop the first `V=="Valor"` header row | open |
| Table metadata discovery | `servicodados.ibge.gov.br/api/v3/agregados?pesquisa=…` | open |
| Selic / IPCA / CDI | `api.bcb.gov.br/dados/serie/bcdata.sgs.{432,63,11}/dados/ultimos/N?formato=json` — **chunk queries to ≤10 years** | open |
| USD/BRL | `olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)` — dates are **MM-DD-YYYY** | open |
| Federal public spending | `pncp.gov.br/api/consulta/v1/contratacoes/publicacao` — `tamanhoPagina` **min 10** | open |
| Chamber of Deputies | `dadosabertos.camara.leg.br/api/v2/{deputados,proposicoes,…}` | open |
| Senate bills | `legis.senado.leg.br/dadosabertos/materia/pesquisa/lista` | open |
| Elections | `dadosabertos.tse.jus.br` | open (LGPD + Lei 9.504 advertising restrictions) |
| Transparency (Bolsa Família, BPC, despesas) | `api.portaldatransparencia.gov.br/api-de-dados/` — **400 req/min** (700 overnight), 180/min on 6 restricted endpoints | 🔑 |
| CadÚnico monthly counts by municipality | `dados.gov.br` CSV, and `aplicacoes.cidadania.gov.br/vis/data3/` | open |
| CEP lookup | `brasilapi.com.br/api/cep/v1/{cep}` (returns IBGE codes) — **there is no official open Correios API**; Correios is legally outside Decreto 8.777/2016 | open (community) |
| CNPJ | Receita bulk `arquivos.receitafederal.gov.br` (monthly, CC-BY, ~6 GB/zip, **geo-blocked from datacenters**); `brasilapi.com.br/api/cnpj/v1/{cnpj}` for one-off | mixed |
| Weather | INMET API currently degraded (only `/estacoes/M` responds, and it 500s) → `brasilapi.com.br/api/cptec/v1/clima/previsao/{cidade}` (needs **CPTEC** city codes, not IBGE) | open (community) |
| Formal jobs | **no CAGED API** — monthly CSVs from `dados.gov.br` (`conjuntos-dados/empregos-formais`), load into our own store | open CSV |
| Health establishments | CNES via `opendatasus.saude.gov.br/dataset/cnes` | open |
| Electricity | `dadosabertos.aneel.gov.br` CKAN metadata (72 datasets) | open |
| Portal da Transparência bulk | `portaldatransparencia.gov.br/download-de-dados` (zipped CSVs, **no key**) | open |
| dados.gov.br catalog API | `dados.gov.br/dados/api/publico/` — needs `chave-api-dados-abertos`; the old CKAN `/api/3/action/*` is retired (401) | 🔑 |
| CPF-keyed ConectaGov (INSS, BPC, CNIS) | OAuth2 + `x-cpf-usuario` | 🔑 — **do not build** |

### 5.4 Hard prohibitions for `br` (LGPD is stricter than Canada's privacy posture)
- **Never** call a CPF-keyed endpoint (INSS/CNIS, BPC status, CadÚnico full record, debt, antecedents).
  Consent, logging, and a legal basis would be required. The core prompt already says "never ask for a SIN" —
  §4.2 rewrites that as **CPF, CNPJ, PIS/PASEP, NIS, cartãoSUS, banking**.
- No person-level CadÚnico or Bolsa Família lookups. Aggregates by municipality only (that data is CC-BY
  and public).
- No DataJud redistribution (CNJ Res. 331/2020 prohibits derivative commercial databases).
- Vaccination/CNES: facility- and aggregate-level only; health data is *dado pessoal sensível* (LGPD art. 5 II).

---

## 6. Map (`br/map.ts`) — settled: Esri, `proxy: false`

IBGE publishes boundaries but **no raster XYZ tiles**, so the `ca/map.ts` analogue (NRCan CBMT) doesn't exist.
Candidates to evaluate in P1:

| Option | Key | Terms | Verdict |
| --- | --- | --- | --- |
| `tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png` (+ dark) | none | no limits stated | **preferred starting point** |
| ArcGIS `server.arcgisonline.com/…/Canvas/World_Street_Map/…/tile/{z}/{y}/{x}` | none | attribution required, non-commercial | solid fallback |
| Esri *National Transportation Atlas* / Brazil imagery servers | varies | varies | check |
| CARTO basemaps | none | **must not proxy** (`proxy: false`, see `example/map.ts`) | last resort |

Then: `proxy: true` (keep visitor IPs with us, CSP stays `img-src 'self'`), `bounds` set to Brazil +
margin — roughly `[-74, -34, -34, 6]` — and `attribution` in `pt` + `en`. Brazil spans z3–z13 well;
test maxZoom against the chosen provider's real coverage before shipping.

---

## 7. Grounding: system prompt + ministry guidance

`br/knowledge/` mirrors `ca/knowledge/` but the guidance is **hand-written pt-BR/EN** — the Canadian
Digital Service's `vendor/cds-ai-answers/` corpus is Canada-specific and cannot be reused.

- `MINISTRIES`: INSS, Receita Federal, IJDS, MEC/Ministry of Education, MCTI, MS, CGU/CGU, MDH/MDS,
  MRE, MA (Agriculture), MMBidA, MTur, ANEEL, ANS, BACEN/BCB, ANTT, DNIT, MPR, TST/CNJ, PF, ABIN,
  ConectaGov/Serpro. One file each: correct pages to cite (pt + en), common myths, what never to say.
- `router.ts`: `RULES: [ministry, RegExp][]` over pt-BR **and** en keywords (accent-insensitive:
  `passaporte|passport`, `CNPJ`, `Bolsa Família|Bolsa Familia`, `SUS|plano de saúde`, `INSS|aposentadoria`).
  Ship 1–2 ministries per turn, exactly like `ca/knowledge/router.ts:56`.
- `search.ts`: see §5.2.
- `pack.server.ts → systemPrompt`: mirror `ca/pack.server.ts:14-42` —
  identity ("você é Ask Brasil, serviço independente, **não** é o Governo Federal"), the allowlist,
  **the Login Único handoff list** (`gov.br/acesso`, `meu.inss.gov.br`, `cadunico.dataprev.gov.br`,
  `conecte.saude.gov.br`, `contas.tse.jus.br`), **Brazilian conventions** (BRL `R$ 1.234,56` · dates
  `2 de outubro de 2026` · Brazilian spelling `ações`/`ônibus`/`time`), the CPF/CNPJ prohibition, and safety:
  `192` SAMU · `190` Polícia Federal · `193` Bombeiros · `191` PRF · **`CVV 188`** (or 0800 133 3333) for mental
  health crisis · `180` Disque 100 Direitos Humanos. **Verify every number on the official page before
  shipping** — `pack.emergency.number` / `.crisis` / `.crisisTel` are rendered in the footer and injected into
  the model prompt by `system-prompt.ts`, so a wrong number is a real safety bug.

---

## 8. Brand & art

- **Name**: `Ask Brasil` (or `Pergunte ao Brasil`). The hero greeting is pack copy (`hero.*` in
  `messages/pt.json`) — but `LandingTitle` renders the greeting from `hero.*`, so no core change needed.
  Confirm: is a pt product name with an English-language `en.json` catalog consistent?
- **Mark**: `brand/Mark.tsx` + `markSvg(color)`. **Do not** use the national coat of arms, the
  Ordem do Rio Branco star, or the "Brasil — Governo Federal" lockup (same legal reasoning as SPEC §
  "Non-negotiable framing"). A green/yellow abstract mark is fine; `flagColor: '#009c3b'`.
- **Independent mode** + one honest footer line: *"Serviço independente. As respostas vêm de fontes oficiais
  do Governo Federal — confirme sempre na página oficial indicada."* (`brand.mode: 'independent'`).
- **Accent colour**: see §2.7. Without it the whole product reads as Canadian.
- **Art**: `art: { hero, night, dusk }`, each `{ land: {light, dark}, aurora, auroraDark? }`, SVG with a
  `<view id="m">` mobile crop. `scripts/build-art.mjs` is Canada's generator (deterministic seeded
  landscapes + aurora ribbons) — write `scripts/build-art.br.mjs`. No aurora in Brazil; the equivalent
  register is **Atlantic coastline at dusk, Pantanal horizon, Rio's granite hills, cerrado**. Reuse the
  same techniques (seeded noise, layered silhouettes, CSS-drifted ribbons for the chat glow and OG image).
  Budget ~1 MB like `public/art/ca`.
- **OG image / icons**: `src/app/opengraph-image.tsx` and `icon.tsx` already read `pack.brand.markSvg(
  pack.brand.flagColor)`. No core change.

---

## 9. Widget roadmap

Rule for every widget (WIDGET_GUIDE §2): tool names **must** start with the camelCase widget id
(`benefitsFinder`, `holidaysNext`, `civicBills`). Each needs `tools/<id>.ts`,
`widgets/<id>/{index.tsx,fixtures.ts,messages/{pt,en}.json}`, `scenarios/<id>.ts`, and registration in
`tools/index.ts`, `widgets/registry.ts`, `widgets/fixtures.ts`, `scenarios/index.ts`.
**v1 ships EN+PT at parity; pt is authored by a human, en is the reviewed fallback.**

### Phase 3 — the money widgets (highest demand, best open data)
| id | pt name | Live data | notes |
| --- | --- | --- | --- |
| `holidays` | Feriados nacionais | static §5.1 | built from `example/` — the proving ground |
| `benefits` | Bolsa Família, BPC, CadÚnico | CadÚnico aggregate CSV + VIS DATA 3 + PT bulk CSV | **aggregates only**; values change per policy, hard-code `factsChecked` |
| `taxes` | IRPF e Simples Nacional | Receita IRPF tables (static, annual) + DAS due date | big calculator opportunity (dedução por dependente, simplifying discount) |
| `money` | Selic, IPCA, câmbio | BCB SGS + PTAX (§5.3) | SGS is 10y-window-capped |
| `business` | Abrir e regularizar empresa | CNPJ lookup, Simples/MEI, **CNPJ alfanumérico from 2026**, PNCP | `verify-cnj.cnpj` — a real Brazil-only widget |
| `civic` | Congresso e eleições | Câmara API v2, Senado, TSE (all open) | Canada has `FindMp`; Brazil gets `civicDeputy` + `civicBill` |

### Phase 4 — breadth
| id | pt name | Live data | notes |
| --- | --- | --- | --- |
| `jobs` | Emprego formal | CAGED monthly CSV ingested to our store (**no API**) | needs a build step; budget extra time |
| `health` | Saúde e SUS | CNES establishments, ANS coverage | facility/aggregate only |
| `offices` | Onde resolver | IBGE Localidades + agency unit lists (CRAS/SUAS, UBS, cartórios, INEP) | map-backed, like `offices` in `ca` |
| `documents` | Documentos e certidões | DICP (`gov.br/pt-br/servicos/dir`), CTPS Digital, certidões | strong "where do I look" value |
| `life-events` | Casamento, nascimento, óbito | Registro Civil | maps to `flags`/`primary` event planner |
| `citizenship` | Cidadania brasileira | Lei 9.093/1997, naturalização requirements | verify current law |
| `passport` | Passaporte comum | PF fee schedule, PassportOnline (VFS) | **gov.br login required**; model must never ask for CPF |
| `immigration` | Vistos e residência | Vistos.gov.br, PIB (Plano Brasil Soberano 2025) — verify | inbound framing is unusual; keep it factual |
| `dates` | Prazos e vencimentos | INSS 2026 calendar, DAS, IRPF | `ics.ts` export like `ca` |
| `weather` | Tempo e alertas | INMET degraded → BrasilAPI CPTEC mirror + INMET alerts | needs a graceful offline fallback |
| `travel` | Viagem | MRE alerts/boletins, ANAC, passport validity rules | outbound advisories → `Advisory` type needs `pt`+`en` (§2.4) |
| `transport` | Trânsito e transportes | ANTT, DNIT, SENATRAN, Lei 14.071 | |
| `parks` | Áreas protegidas | ICMBio/CNUC | low data, lower priority |
| `contact` | Contatos | gov.br SAC lines, Disque 100 | includes `VERIFIED.md` discipline from `ca/widgets/contact` |

### Explicitly dropped
- **`veterans-defence`** — no Brazilian equivalent. Either omit, or repurpose the slot as `security`
  (Polícia Federal, Disque 100 Direitos Humanos,语调 care) **only if** there's a real dataset.
- `benefits` person-level, `immigration` CPF lookups — out of scope on purpose (§5.4).

---

## 10. Verification per phase

```bash
# 0. baseline — ca must be untouched
git diff --stat main...HEAD -- src/app src/components src/lib   # only §2's files
COUNTRY=ca pnpm typecheck && COUNTRY=ca pnpm lint && pnpm check:i18n

# 1. types + packs
pnpm exec tsc --noEmit -p tsconfig.br.json
pnpm lint
pnpm check:i18n -- --country br      # pt/en parity, placeholders
pnpm check:scenarios -- --country br # every promoted question resolves

# 2. run it
COUNTRY=br pnpm dev
COUNTRY=br node scripts/shot.mjs --url / --out .shots/br/home --sizes desktop,mobile --schemes light,dark --full
COUNTRY=br node scripts/shot.mjs --url /lab --out .shots/br/lab
COUNTRY=br node scripts/shot.mjs --url "/lab/benefits?lang=pt" --out .shots/br/pt --full

# 3. per widget (WIDGET_GUIDE §9)
node scripts/shot.mjs --url /lab/<id> --out .shots/br/<id> --sizes desktop,mobile --schemes light,dark --full
node scripts/shot.mjs --url "/?q=<pergunta em português>" --out .shots/br/chat --wait 9000 --full
```

Quality bar is the Canada one (SPEC §"Quality bar checklist"): 390 px + 1440 px, light + dark, pt + en,
**pt strings run ~30% longer than en** (Portuguese is verbose — no truncation, no horizontal scroll), no
console errors, no layout shift on stream-in, `BRL` formatted as `R$ 1.234,56` and `1.234,56` in en,
`Intl` via `pack.currency` + `pack.region`.

**Never** start/kill the dev server or run `next build` — `shot.mjs` warns when the dev manifest is corrupt.

---

## 11. What building it taught us (kept for the next phases)

- **The `servicos.gov.br` corpus is Phase 3's whole ballgame** and it is verified open with no key:
  `https://api-servicos.estaleiro.serpro.gov.br/servicos-json` — 41 MB, 5,730 services, 240 agencies, HTTP 200.
  `knowledge/pages.ts` is the hand-verified stand-in until `scripts/fetch-servicos.mjs` lands.
- **Two facts worth not re-learning.** (1) Brazil's national holidays are ten, and **Carnaval and Corpus
  Christi are not among them** — they are `ponto facultativo`; only Sexta-feira Santa is national. (2) The
  pontos facultativos are not law: they are published each December in a Portaria from the Ministry of Public
  Management, so they are stored per year and never computed or extrapolated.
- **The basemap question is settled**: OpenFreeMap's raster endpoints 404/403; Esri's `World_Street_Map` works
  z0–z19 and `Canvas/World_Dark_Gray_Base` for dark. Shipped with `proxy: false` (browser calls Esri directly)
  because proxying an unlicensed tile service is not an assumption worth making. Re-evaluate when IBGE or
  another national provider ships open raster tiles.
- **Several gov.br ministry pages resolve fine** (`/inss/pt-br`, `/receitafederal/pt-br`, `/saude/pt-br`,
  `/mds/pt-br`, `/mec/pt-br`, `/mre/pt-br`, `/transportes/pt-br`, `/mme/pt-br`, `/mma/pt-br`, `/mj/pt-br`,
  `/casacivil/pt-br`, `/mds`, and `https://www.gov.br/pt-br/servicos` → 200), which is why the guidance files
  cite institutional home pages rather than deep links. `planalto.gov.br` 404s most paths from a datacenter IP,
  so law text is cited by number, not by URL, except Lei 14.759/2023.
- **Generation is the only way to keep pt and en honest.** Every pt/en string in this pack is rendered from one
  `*.data.json` by a `render.mjs` that refuses to write on a placeholder mismatch, a doubled space, a stray
  script or a garbled token, and CI fails when the generated files drift. It caught four real corruptions
  during the build.
- **The scripted router does not fold diacritics**, so every Portuguese pattern is written accent-folded
  (`cad[uú]nico`) — generated mechanically, since hand-folding is how you get `[[cç][cç]]`.
- **Canada's `check:scenarios` has 13 pre-existing failures** (stale ids in `src/countries/ca/scenarios/
  paraphrases.json`: four route to a more specific scenario that now exists, and `passport-office` no longer
  exists at all). They predate this work — the checker could not run until `ts-hooks.mjs` was fixed — and were
  deliberately left alone as another country's content.

## 11b. Risks

| Risk | Mitigation |
| --- | --- |
| `geo-blocked from datacenters` (Receita CNPJ, `cadunico.dataprev.gov.br`, `servicos.inss.gov.br`, gov.br itself 403s datacenter IPs) | test fetches from a Brazilian network; always ship a static-fact fallback + official link |
| INMET API degraded | BrasilAPI CPTEC mirror; degrade to a link, never a fabricated forecast |
| Two people may disagree about "verified" for Brazilian figures (values change per *policy*, not per page revision) | `data.ts` records `verifiedOn` + source URL per fact; no figure without a URL |
| `services.gov.br` type inconsistencies (`servicoDigital` bool vs `gratuito` "true" vs `temLoginGovBR` "S") | zod-validate at the ingestion boundary, in `scripts/fetch-servicos.mjs` |
| `check-scenarios` treats promoted questions as a hard gate | every `chip.*.q` and `services.*.starter` in `br/messages/pt.json` needs a scenario; write scenarios **from** the catalog, not after |
| LGPD | §5.4 prohibitions, enforced in the pack's `systemPrompt` and in code review |

---

## 12. Non-goals for v1

No person-level lookups (CPF/NIS/CNIS). No scraping behind logins. No payment or application submission. No
state/municipal (UF) packs — `gov.br` federal only, even though `*.sp.gov.br` etc. must be in the allowlist
because services redirect there. No `es` UI catalog (Spanish answers come free via `matchIntl` +
`detectAnswerLocale`; a reviewed `es` catalog is a later localization phase).