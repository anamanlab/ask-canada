# Ask Canada

*[Français](#ask-canada-en-français)*

**Every federal service, in plain language.** Ask a question in English or French (or 20 other
languages) and get a clear answer with the official source, plus planners, calculators, checklists and
live data rendered right inside the conversation. When it's time to sign in, apply or pay, Ask Canada
hands you off to the official page.

Ask Canada is an independent, open-source service built on official Government of Canada sources, and
it is built to Government of Canada web standards so the Government could adopt it as-is. The core is
country-agnostic: Canada is the first **country pack**.

- Live: https://canada.ryancampbell.com
- Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4,
  AI SDK v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/gateway`), `streamdown`, `motion`, `zod`.

## Run it

```bash
pnpm install
cp .env.example .env.local        # optional: model keys (see below)
pnpm dev                          # http://localhost:3000
```

Useful URLs: `/` (landing), `/?q=How do I renew my passport?` (asks right away), `/lab` (every widget in
every state), `/lab/passport?theme=dark&lang=fr`, `?dir=rtl` (mirroring test).

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm check:i18n` (EN/FR parity), screenshots with
`node scripts/shot.mjs --url / --out .shots/home --sizes desktop,mobile --schemes light,dark --full`.

## Environment

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `anthropic` \| `gateway` \| `azure` \| `bedrock` (default: `anthropic` when `ANTHROPIC_API_KEY` is set, else `gateway`). |
| `ANTHROPIC_API_KEY` | Anthropic directly (`claude-sonnet-5-5`); also enables Anthropic web search restricted to official domains. |
| *(none)* | Vercel AI Gateway (`anthropic/claude-sonnet-5.5`) via OIDC (`vercel env pull`). |
| `AI_MODEL` | Model id / Azure deployment / Bedrock model id. |
| `AZURE_RESOURCE_NAME`, `AZURE_API_KEY`, `AZURE_BASE_URL` | Azure OpenAI / AI Foundry. |
| `AWS_REGION` (+ AWS credentials) | Amazon Bedrock. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared store for the rate limit and the daily spend counter (or `KV_REST_API_*`). |
| `SEARCH_FALLBACK=duckduckgo` | Add a site-restricted public web search when the offline index of official pages has no match. |
| `SCRIPTED_AI=1` | No model: deterministic scripted answers with real tool calls (dev, screenshots, demos). |
| `SCRIPTED_SPEED` | Multiplier for scripted streaming speed (default 1). |
| `COUNTRY` | Country pack to build (`ca` default, `example`). |
| `AI_MAX_STEPS`, `AI_MAX_OUTPUT_TOKENS`, `AI_MAX_INPUT_CHARS`, `AI_MAX_HISTORY`, `AI_MAX_CONTEXT_CHARS`, `AI_WEB_SEARCH_MAX_USES`, `AI_MAX_ANSWER_MS`, `AI_SOFT_ANSWER_MS`, `AI_TOOL_TIMEOUT_MS` | Per-request caps. |
| `RATE_LIMIT_BURST`, `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_SALT` | Per-IP token bucket. |
| `RATE_LIMIT_FIREWALL_ID` | Vercel only: shared rate limit through a `@vercel/firewall` rule. |
| `AI_DAILY_BUDGET_USD` | Daily spend circuit breaker: scripted answers once today's estimated model spend reaches it. |
| `AI_PRICE_INPUT`, `AI_PRICE_OUTPUT`, `AI_PRICE_CACHE_READ`, `AI_PRICE_CACHE_WRITE` | Prices for a model not listed in `src/lib/ai/pricing.ts`. |
| `BOTID_MODE`, `BOTID_ALLOW_VERIFIED` | Vercel only: BotID on `/api/chat` (`scripted` default, `deny`, `log`, `off`). |

If the model call fails before producing anything (no credits, outage), the chat route answers with the
scripted engine instead, so people still get a sourced answer.

## Architecture

```
src/
  app/                      routes: / (landing ⇄ chat), /api/chat, /lab, /lab/[id], /about and the other policy pages, icons, OG, manifest
  proxy.ts                  per-request CSP nonce + ?lang / ?theme / ?dir overrides
  components/
    ui/                     design-system primitives (WidgetShell, Segmented, Stat, Map, Sheet, …)
    chat/                   AskApp (useChat + transport), ChatView, Composer, Markdown, ToolPart, sources
    landing/                the landing page (server components + small client islands), Scene art
    site/                   header, menu, language picker, footer, clear-device
    lab/                    fixture viewer
  lib/
    ai/                     model selection, system prompt assembly, core tools, limits, rate limit
    scripted/               scripted engine + scenario types
    i18n/                   locale registry (22 languages), catalogs, ICU-lite formatter, provider, server helpers
    widgets/types.ts        the widget contract
    country/types.ts        the CountryPack contract
    device-store.ts         on-device storage (plans, checklists, chats) + "Clear this device"
  countries/
    active*.ts              the only seam between core and a pack (aliased by COUNTRY)
    ca/                     Canada: pack.ts, messages, tools, widgets, scenarios, data, knowledge
    example/                Republic of Example: the smallest complete pack (template)
vendor/cds-ai-answers/      Canadian Digital Service AI Answers guidance (MIT), used as grounding
```

**How an answer happens.** The composer calls `useChat().sendMessage`. `DefaultChatTransport` posts the
(trimmed) history and the active locale to `/api/chat`. The route rate-limits, screens out bots, validates and caps input,
then either streams `streamText` with every tool (pack tools + core `suggestFollowUps`) and the assembled
system prompt, or runs the scripted engine. Tool parts arrive as `tool-<name>` message parts; `ToolPart`
finds the owning widget by tool-name prefix, lazy-loads it, and renders it inside an error boundary.
Sources are collected from numbered citations in the text and from each tool output's `sources[]`.

**Privacy.** No accounts, no tracking, no server-side storage of conversations. Chats, plans and checklists
live in `localStorage` under `ac:` keys; "Clear this device" removes them. The rate limiter keeps only a
salted hash of the IP, in memory, for ten minutes. On Vercel, the chat request also carries an invisible bot
check (Vercel BotID): the browser runs a challenge script from this site's own origin and Vercel classifies
the request; it is not used to identify or follow people, and builds made anywhere else do not include it
(`BOTID_MODE=off` removes it on Vercel too).

**Security.** Strict CSP with a per-request nonce (`src/proxy.ts`), HSTS, `X-Frame-Options: DENY`,
`nosniff`, a narrow `Permissions-Policy`, input caps (length, history, attachment type/size/count),
`maxOutputTokens` and a step limit on the model loop.

## Add a widget

Read [docs/WIDGET_GUIDE.md](docs/WIDGET_GUIDE.md). In short: implement `tools/<id>.ts`,
`widgets/<id>/index.tsx` (+ fixtures and EN/FR messages) and `scenarios/<id>.ts` in the pack; tool names
start with the widget prefix; facts are verified on the official page and every output carries `sources`.
The registries are pre-wired, so nothing else changes.

## Add a country

Read [docs/NEW_COUNTRY.md](docs/NEW_COUNTRY.md). Copy `src/countries/example`, fill in `pack.ts`
(brand, locales, emergency numbers, source allowlist, services, art, prompt addendum), translate the pack
messages, and build with `COUNTRY=<id>`.

## Abuse and cost controls

`POST /api/chat` is the only route that costs money per request, and it is protected in layers
([docs/DEPLOY.md](docs/DEPLOY.md#abuse-and-cost-controls) has the details and the Vercel dashboard steps):

- **Bots** never reach the model. On Vercel, BotID (an invisible check, no CAPTCHA) classifies each chat
  request; a bot gets the scripted engine. Off Vercel and in dev the check does not exist.
- **Rate limit** per IP: an in-memory token bucket, plus an optional shared counter (Vercel Firewall or any
  Upstash-compatible Redis) for multi-instance hosts. Keys are salted IP hashes; raw IPs are never stored
  or logged. Edge/WAF rate rules (Vercel Firewall, Front Door, AWS WAF) are the outer layer.
- **Per-request caps** on body size, question length, history, total context, attachments, steps, output
  tokens, web searches and wall-clock time. A client that disconnects aborts the model call.
- **Daily spend breaker** (`AI_DAILY_BUDGET_USD`): once the day's estimated spend is reached, answers come
  from the scripted engine until 00:00 UTC. It is a soft, estimated cap; set a hard budget at the provider too.

Every control degrades to a scripted answer or a 429, never to a broken page. `pnpm check:guards` tests
the logic offline.

## Grounding and official sources

- `vendor/cds-ai-answers` — the Canadian Digital Service's AI Answers guidance (MIT, verbatim). The Canada
  pack routes each question to 1–2 departments (`src/countries/ca/knowledge/router.ts`) and injects their
  guidance into the system prompt; `officialGuidance` loads any other department on demand.
- Core tools `fetchOfficialPage` (allowlisted official pages only, main text + "date modified") and
  `searchOfficialSources` (offline index of curated official pages; Anthropic's native web search when available). Pages
  the model reads become numbered sources.
- PII (SIN, card and passport numbers) is removed in the composer and again on the server.

## Governance

[System card](docs/SYSTEM_CARD.md) ([FR](docs/SYSTEM_CARD_FR.md)) · [Algorithmic Impact Assessment](docs/AIA.md) ·
[Accessibility](docs/ACCESSIBILITY.md) · [Deploy (Vercel, AWS, Azure)](docs/DEPLOY.md) · [Security](SECURITY.md) ·
[Code of conduct](CODE_OF_CONDUCT.md) · [Notice](NOTICE) · `Dockerfile` (standalone output).

## Adoption notes for the Government of Canada

- **Brand.** All identity lives in `src/countries/ca/pack.ts`. Set `brand.mode: 'official'`, provide
  `OfficialSignature` (the FIP signature) and point `brand.url`/`domain` at canada.ca. Independent mode
  never uses the Canada wordmark, FIP signature, departmental logos or the Coat of Arms.
- **Official languages.** Every string is in EN/FR catalogs (`src/lib/i18n/messages`, pack and widget
  `messages/`); `pnpm check:i18n` fails on any gap. Answers follow the page language and cite French pages
  for French answers.
- **Accessibility.** Built to WCAG 2.1 AA / EN 301 549: semantic landmarks, skip links, visible focus,
  44px targets, live regions, reduced motion, text alternatives for visual widgets, RTL-safe logical CSS.
- **Privacy.** No PII persisted server-side; nothing leaves the device except the question being answered.
  Pair with a Privacy Impact Assessment; the model provider must be contracted for zero retention.
- **Content.** Facts are verified against canada.ca with dates and URLs recorded next to the data; the
  Canadian Digital Service's AI Answers guidance (vendored, MIT) grounds departmental answers.
- **Operations.** Stateless Next.js app: deploy on any Node host or Vercel; set model credentials, the rate
  limit store, and `SCRIPTED_AI=1` as a kill switch that keeps the service answering without a model.

## Credits and license

MIT — see [LICENSE](LICENSE). Vendored guidance in `vendor/cds-ai-answers` is © its authors under MIT.
Newsreader and Geist fonts are under the SIL Open Font License. Map tiles © OpenStreetMap contributors
© CARTO. Not affiliated with the Government of Canada.

---

# Ask Canada (en français)

**Tous les services fédéraux, en langage clair.** Posez votre question en français ou en anglais (ou dans
20 autres langues) et obtenez une réponse claire avec la source officielle, ainsi que des planificateurs,
calculateurs, listes de vérification et données en direct directement dans la conversation. Pour ouvrir une
session, présenter une demande ou payer, Ask Canada vous dirige vers la page officielle.

Ask Canada est un service indépendant à code source ouvert, fondé sur des sources officielles du
gouvernement du Canada et conçu selon les normes Web du gouvernement (langues officielles, accessibilité
WCAG 2.1 AA, protection de la vie privée dès la conception, sécurité) afin que le gouvernement puisse
l’adopter tel quel. Le noyau est indépendant du pays : le Canada est le premier **ensemble de pays**.

## Démarrer
```bash
pnpm install
pnpm dev        # http://localhost:3000
```
Vérifications : `pnpm typecheck`, `pnpm lint`, `pnpm check:i18n` (parité français-anglais).

## Documentation
- Ajouter un widget : [docs/WIDGET_GUIDE.md](docs/WIDGET_GUIDE.md)
- Ajouter un pays : [docs/NEW_COUNTRY.md](docs/NEW_COUNTRY.md)
- Fiche système : [docs/SYSTEM_CARD_FR.md](docs/SYSTEM_CARD_FR.md) · Évaluation de l’incidence algorithmique :
  [docs/AIA.md](docs/AIA.md) · Accessibilité : [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) ·
  Déploiement : [docs/DEPLOY.md](docs/DEPLOY.md) · Sécurité : [SECURITY.md](SECURITY.md)

## Vie privée
Aucun compte, aucun pistage, aucune conservation des conversations sur le serveur. Les NAS, numéros de carte
et de passeport sont retirés avant l’envoi. Les plans et listes restent sur votre appareil et « Effacer cet
appareil » les supprime.

## Licence
MIT — voir [LICENSE](LICENSE). Les consignes de Réponses IA du Service numérique canadien (`vendor/`) sont
sous licence MIT. Ce service n’est pas affilié au gouvernement du Canada.
