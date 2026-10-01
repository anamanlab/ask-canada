# Deploy

Ask Canada is a stateless Next.js app. Nothing Vercel-specific is required.

## Configuration (all hosts)
- Model: `AI_PROVIDER` = `anthropic` | `gateway` | `azure` | `bedrock`, plus `AI_MODEL` and provider
  credentials (see `src/lib/ai/model.ts`). `SCRIPTED_AI=1` runs without a model (kill switch).
- Abuse and cost controls: see [Abuse and cost controls](#abuse-and-cost-controls). All of them are optional
  and none needs Vercel; every variable is listed in `.env.example`.
- Country: `COUNTRY=ca` at build time.
- Search: `searchOfficialSources` uses the pack's offline index of curated official pages; set
  `SEARCH_FALLBACK=duckduckgo` to add a site-restricted public web search when nothing matches.

## Vercel
Import the repository, set the variables above (or use AI Gateway with OIDC), deploy. `output: 'standalone'`
is ignored by Vercel.

### Basemap tiles on Vercel

`/tiles/<layer>/<z>/<x>/<y>` proxies the pack's basemap (Canada: NRCan) so browsers never call the tile host.
Two cache layers sit in front of NRCan: the Vercel CDN (per region; each deployment starts cold) and the
Next.js fetch cache, which on Vercel is the Data Cache (per region, persists across deployments, LRU-evicted).
Only HTTP 200 tiles are ever cached; upstream errors return `502 no-store`. Out-of-coverage tiles are refused
with a cacheable 404 before any upstream call. Watch hit rates under Observability → Runtime Cache.

### Owner checklist on Vercel (dashboard, once)

These need the project owner; nothing in the code does them for you. Paths are from the project page.

1. **AI Gateway budget (the hard stop for model spend).** Team → **AI Gateway** → **Budgets** → **Projects**
   tab → **Add budget** → project `canada-ai`, a limit in dollars, refresh period **Daily**, and tick
   **Email … when usage reaches** 50%, 75% and 100% → Save. Or
   `vercel ai-gateway budgets set project canada-ai --limit 50 --refresh-period daily`. It resets at 00:00
   UTC, like the in-app breaker. When it is reached the gateway answers 402 and the chat route falls back to
   scripted answers by itself. It covers requests authenticated with the project's OIDC token (the default
   here); if you use `AI_GATEWAY_API_KEY` instead, set the budget on that key (**AI Gateway** → **API Keys**
   → **···** → **Edit key**). Bring-your-own-key spend is not covered: with `ANTHROPIC_API_KEY`, set the
   limit in the Anthropic Console instead.
2. **`AI_DAILY_BUDGET_USD`.** **Settings** → **Environment Variables** → add it for Production (a little
   under the gateway budget, so the app degrades before the gateway refuses) → redeploy.
3. **Firewall rate limit on the chat endpoint.** **Firewall** → **Configure** → **+ New Rule**. Name
   `chat rate limit`; **If** `Request Path` `Equals` `/api/chat` **and** `Method` `Equals` `POST`; **Then**
   `Rate Limit`, `Fixed Window`, time window `600` s (the maximum on Hobby and Pro), request limit `20`,
   key `IP`, action **Default (429)** → **Save Rule** → **Review Changes** → **Publish**. To watch it first,
   publish it with the action **Log**. This is not expressible in `vercel.json` (its `routes[].mitigate`
   only knows `challenge` and `deny`). Raise the limit if people behind one office or campus address
   report 429s. Hobby allows one rate-limit rule per project; Pro allows 40 (usage-billed).
4. **Optional, Pro: a second counter the function can ask.** Same place, **+ New Rule**, first **If**
   condition `@vercel/firewall`, **Rate limit ID** `chat`, `Fixed Window` `60` s, limit `10`, key `IP` →
   Save, Publish. Then set `RATE_LIMIT_FIREWALL_ID=chat` and redeploy. Skip it on Hobby (rule 3 uses the
   one rule you have).
5. **BotID.** Basic checks are free on every plan and need no toggle: deploy, then confirm (below). For the
   stronger model (Pro/Enterprise, $1 per 1,000 checks): **Firewall** → **Rules** → enable **Vercel BotID
   Deep Analysis**. Watch verdicts under **Firewall** → traffic filter **BotID**.
6. **Bot Protection managed ruleset** (all plans). **Firewall** → **Rules** → **Bot Management** section →
   **Bot Protection** → **Log** first, **Challenge** once the log looks right → **Review Changes** →
   **Publish**. Same section, **AI Bots Ruleset** → **Deny** if you do not want AI crawlers on the site.
7. **Spend alerts for the rest of the bill** (functions, bandwidth): Team **Settings** → **Billing** →
   **Spend Management** (Pro).

**Confirm after deploying** (a preview deployment is fine): open the site in a normal browser, ask a
question, and look at the `POST /api/chat` response headers. `x-ac-engine: model` means BotID passed you as
a person. `x-ac-engine: scripted` for a real person means BotID is flagging people: set `BOTID_MODE=log`,
redeploy, and read the function logs before enforcing again. `curl -X POST …/api/chat` should come back
`x-ac-engine: scripted`.

**During an attack:** `SCRIPTED_AI=1` + redeploy turns the model off entirely; **Firewall** → **Bot
Management** → **Attack Mode** → **Enable** challenges every visitor (free, the site's own chat requests keep working); `BOTID_MODE=deny` turns bot answers into 403s.

## Abuse and cost controls

`POST /api/chat` is the only route that costs money per request. It is protected in layers; each one works
on its own, and every one that is Vercel-specific turns itself off elsewhere.

| Layer | Vercel | Self-hosted (Docker) | `next dev` |
| --- | --- | --- | --- |
| Edge rate limit (WAF rule, [owner checklist](#owner-checklist-on-vercel-dashboard-once) 3) | 429 before the function runs | your own WAF / load balancer rule | n/a |
| Bot check (BotID, `src/lib/ai/bot-check.ts`) | bots get scripted answers (`BOTID_MODE`) | off: not built in, not called | off |
| In-app rate limit (`src/lib/ai/rate-limit.ts`) | memory per instance, + Firewall or Redis if configured | memory per replica, + Redis if configured | off unless `RATE_LIMIT_DEV=1` |
| Per-request caps (`src/lib/ai/limits.ts`) | on | on | on |
| Daily spend breaker (`src/lib/ai/budget.ts`) | Runtime Cache counter (or Redis) | memory per replica (or Redis) | same, if `AI_DAILY_BUDGET_USD` is set |
| Provider budget (AI Gateway / Anthropic Console) | on, once set | on, once set | on |

**Bot check.** Vercel BotID is an invisible challenge: the page solves it in the background and attaches
the result to the chat request; the route asks Vercel for a verdict. A bot never reaches the model. By
default it gets the scripted engine instead of an error, so a person wrongly flagged (or whose browser
could not load the challenge) still gets a sourced answer. Verified bots (search crawlers, monitors, AI
crawlers) are treated as bots; `BOTID_ALLOW_VERIFIED` lists the ones treated as people (default: the
user-driven agents `chatgpt-operator` and `google-agent`). If BotID itself is unreachable the request is let
through and the other layers apply. The challenge is served from the site's own origin and loaded by an
already-trusted script, so the CSP is unchanged.

**Rate limit.** The in-memory token bucket (`RATE_LIMIT_BURST`, `RATE_LIMIT_PER_MINUTE`) always runs first.
On serverless it is per instance, so add a counter that all instances share:
- the WAF rule above (counted at the edge, per Vercel region; nothing to run);
- `RATE_LIMIT_FIREWALL_ID`: the same Firewall counters asked from inside the function, for a tighter
  per-minute limit (one extra request to the Firewall per chat request; per region; fails open);
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`): one global counter, on any host.

The Runtime Cache is not used for rate limiting: it has no atomic increment, so a burst of parallel
requests would all read the same count.

**Per-request caps.** Body size, characters per question (`AI_MAX_INPUT_CHARS`), messages of history
(`AI_MAX_HISTORY`), total conversation characters sent to the model (`AI_MAX_CONTEXT_CHARS`; the oldest
messages are dropped), attachments only on the latest question, steps (`AI_MAX_STEPS`), output tokens per
step (`AI_MAX_OUTPUT_TOKENS`), web searches per step (`AI_WEB_SEARCH_MAX_USES`), and wall-clock time
(`AI_MAX_ANSWER_MS`). When the client disconnects or presses Stop, the model call is aborted. A malformed
value falls back to the default; it never disables a cap.

**How an answer is bounded** (`src/lib/ai/answer-loop.ts`). One answer is a short tool loop. It ends when
the model calls `suggestFollowUps` (always its last act), after `AI_MAX_STEPS` model calls, or when the turn
has produced twice the per-step output cap; if it ended before the answer was written, one closing call
writes it, so a turn costs at most `AI_MAX_STEPS` + 1 model calls.
- `AI_MAX_OUTPUT_TOKENS` (default 3000) is the per-step cap for Latin-script and CJK answers. Scripts that
  cost several tokens per word (Punjabi, Hindi, Arabic, Tamil, Cyrillic, syllabics…) get twice that for an
  answer of the same length. The model is told to keep answers under about 250 words. An answer that still
  hits the cap is not passed off as complete: it ends on its last full sentence with "Answer cut short" and
  a **Continue** button, which asks for the rest as a follow-up.
- Time: `AI_TOOL_TIMEOUT_MS` (default 12 000) is the budget for one tool call, all of its upstream requests
  together; a tool that overruns fails and the answer is written without it. After `AI_SOFT_ANSWER_MS`
  (default 26 000) the loop starts no further lookups and writes the answer with what it has.
  `AI_MAX_ANSWER_MS` (default 55 000, under the route's 60 s limit) is the hard stop; an answer it cuts is
  also marked "cut short". Keep soft + one model call + one tool call below the hard stop.
- `AI_EFFORT` = `low` | `medium` (default) | `high`: how much Claude 5.5 models think before writing (they
  cannot turn thinking off). `high` adds seconds before the first word.

**Daily spend breaker.** With `AI_DAILY_BUDGET_USD` set, each model call's cost is estimated from the
token usage it reports (prices in `src/lib/ai/pricing.ts`; the gateway's own reported cost is used when
present) and added to a counter for the UTC day. At the limit the route answers from the scripted engine
until 00:00 UTC. How exact the counter is depends on where it lives:
- Redis configured: one atomic counter for all instances and regions. Exact to the estimate.
- Vercel, no Redis: Vercel Runtime Cache, shared by the instances of one function region. It has no atomic
  increment, so simultaneous writes from different instances can lose an amount (the count reads low), an
  entry can be evicted early, and each function region counts separately (N regions can spend N budgets).
- Elsewhere, no Redis: per process (N replicas can spend N budgets).

It is always a soft cap: answers already streaming finish, an instance re-reads the shared total at most
every 5 seconds, and a step aborted mid-way is not counted. Treat it as the early, graceful cut-off and the
provider budget as the hard one.

Check the pure logic offline with `pnpm check:guards`.

## Containers (AWS, Azure, GC cloud)
```bash
docker build -t ask-canada --build-arg COUNTRY=ca .
docker run -p 3000:3000 -e AI_PROVIDER=bedrock -e AI_MODEL=<bedrock-model-id> -e AWS_REGION=ca-central-1 ask-canada
```
- **AWS:** ECS Fargate (or App Runner) behind an ALB in `ca-central-1`; model via Amazon Bedrock with an IAM
  task role (no keys in env); Redis via ElastiCache with an Upstash-compatible REST proxy, or keep the
  in-memory limiter per task plus ALB/WAF rate rules. Lambda works via the standalone server with the AWS
  Lambda Web Adapter.
- **Azure:** Azure Container Apps or App Service (Linux, container) in Canada Central; model via Azure
  OpenAI/AI Foundry (`AI_PROVIDER=azure`, `AZURE_RESOURCE_NAME`, `AZURE_API_KEY`, `AI_MODEL=<deployment>`),
  Front Door/WAF for rate limiting at the edge.
- Put a CDN in front for `/_next/static`, `/art` and `/tiles` (long cache headers are set). `/tiles` sends
  `CDN-Cache-Control` (30 days, stale-while-revalidate) which CloudFront and Azure Front Door honour.
- Persist `.next/cache` on a volume if you can: the basemap tile fetch cache lives there (30 days), so a
  restart doesn't send every tile back to the national mapping service.

## Health and operations
- Health check: `GET /robots.txt`.
- Logs contain no personal data: no question, no answer, no tool input, no address. The chat route logs
  model fallback warnings and one line per answer (below).

### Logs: one line per answer
Every `POST /api/chat` that streams an answer writes one JSON line to stdout (`src/lib/ai/turn-log.ts`);
`AI_TURN_LOG=0` turns it off.

```json
{"evt":"chat.turn","engine":"model","why":"ok","lang":"en","steps":2,"tools":["benefitsEstimator","officialHandoff","suggestFollowUps"],"truncated":false,"tokens":{"in":139215,"out":856,"cacheRead":120455,"cacheWrite":10084},"costUsd":0.07521,"totalMs":10176,"model":"anthropic/claude-sonnet-5.5","ttftMs":2899,"finish":"tool-calls","stop":"follow-ups"}
```

| Field | Meaning |
| --- | --- |
| `engine`, `why` | `model` or `scripted`, and why: `ok` (the model answered), `scripted_env` (`SCRIPTED_AI`), `bot` (BotID), `budget` (daily budget used up), `model_unavailable` (no credentials, bad `AI_MODEL`), `model_error` (the model failed before producing anything). |
| `model`, `lang` | Model id; language of the answer (a locale code). |
| `steps`, `tools` | Model calls in the turn (0 for scripted) and the tools called, in order (`fetchOfficialPage×2` when repeated). Names only, never inputs. |
| `finish`, `stop` | The last model call's finish reason (`stop`, `tool-calls`, `length`, `error`) and what ended the loop: `follow-ups`, `natural` (the model stopped by itself), `steps`, `tokens`, `deadline`, `timeout`, `aborted` (the person left or pressed Stop), `error`. |
| `finisher` | `true` when the closing call had to write the answer. Frequent values mean the prompt needs attention. |
| `truncated` | The answer hit the output cap or the time limit (the person saw "Answer cut short"). |
| `tokens` | Summed over the turn's model calls: `in` (total input), `out`, `cacheRead`, `cacheWrite`. A healthy turn reads almost all of its input from the cache: `cacheRead` near `in`, a small `cacheWrite`. |
| `costUsd` | Estimated cost of the turn (the gateway's own figure when it reports one, else `pricing.ts`). |
| `ttftMs`, `totalMs` | Milliseconds from the request to the first text sent, and to the end of the answer. |

Useful alerts: `why` other than `ok` on a model deployment, `truncated: true`, `stop: "timeout"` or
`"deadline"`, `finisher: true`, `ttftMs` above 6000, and `cacheRead` far below `in` (the prompt cache is
missing: something in front of a breakpoint changes per request).
- Scale horizontally; there is no session state.
