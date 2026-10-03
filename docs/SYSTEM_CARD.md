# Ask Canada system card

*Version 0.1 · 2026-09-29 · [Français](SYSTEM_CARD_FR.md)* — modelled on the Canadian Digital Service's
[AI Answers system card](../vendor/cds-ai-answers/SYSTEM_CARD.md).

## Summary
Ask Canada is an independent, open-source, AI-first front door to Government of Canada services. People ask
in plain language (typed, spoken, or by attaching a letter) and get a short answer with the official source,
plus interactive tools (planners, calculators, checklists, live data) inside the conversation. It gives
**information only**: it never makes or influences an administrative decision, never signs anyone in,
submits applications or takes payments. Those steps are handed off to official sites.

## Purpose and scope
- **Users:** anyone looking for federal services, in English, French or 20 other languages.
- **Content:** official Government of Canada pages (canada.ca, *.gc.ca, *.canada.ca) and public data
  (weather alerts, travel advisories, recalls, statutory holidays).
- **Out of scope:** legal, financial or medical advice; personal case status; anything requiring identity.

## Architecture
| Component | Detail |
| --- | --- |
| UI | Next.js 16 / React 19, streamed answers (AI SDK v7 UI message stream), widgets rendered from tool calls |
| Model | Provider-agnostic (`AI_PROVIDER`: Anthropic, Google Gemini, Vercel AI Gateway, Azure, Bedrock, Cloudflare Workers AI); default Claude Sonnet |
| Tools | Pack widget tools (e.g. `passportPlanner`), `officialGuidance` (CDS department guidance), `fetchOfficialPage`, `searchOfficialSources`, `suggestFollowUps` |
| Grounding | System prompt + routed department guidance from CDS AI Answers + fetched official pages |
| Fallback | Deterministic scripted engine (same tools) when no model is configured or the model fails |
| Storage | None server-side. Chats, plans and checklists in the browser only (`ac:` keys) |

**Flow:** question → PII redaction (client and server) → rate limit and input caps → system prompt with
country knowledge, safety guidance and routed department guidance → model with tools (step limit 6,
output cap) → streamed answer with numbered citations → widgets → sources list with "checked" dates.

## Risks and mitigations
**Accuracy.** Answers must cite official pages; widgets use facts verified on canada.ca with the URL and
"date modified" recorded next to the data; the model is instructed to fetch and cite pages rather than rely
on memory, never to invent amounts, wait times or phone numbers, and to keep caveats in the body. Citations
outside the official allowlist are flagged "Not an official source" in the UI.

**Privacy.** No accounts, cookies for tracking, analytics profiles or server-side conversation storage. SIN,
card and passport numbers are removed before a question is sent and again on the server. The rate limiter
keeps only a salted hash of the IP, briefly. The model provider must be contracted for zero data retention.

**Manipulation and safety.** CDS AI Answers neutrality, bias and manipulation-resistance guidance is part of
the system prompt; crisis language routes to 911 / 9-8-8; the model is told it is not the government and
cannot act on anyone's behalf.

**Accessibility and language.** WCAG 2.1 AA target; full EN/FR parity enforced by `pnpm check:i18n`; answers
follow the user's language and cite French pages in French.

**Reliability.** Scripted fallback keeps sourced answers available during model outages; widgets fail
gracefully to the official page; rate limits and caps protect cost and availability.

## Evaluation
- Scripted scenarios double as regression tests for widgets and tone (EN + FR).
- Lab fixtures (`/lab`) cover every widget state in light/dark, EN/FR, desktop/mobile and RTL.
- Recommended before official adoption: expert evaluation of answers against CDS AI Answers' evaluation
  method, per department, with results feeding the department guidance.

## Known limitations
- Menus in languages other than English and French fall back to English until reviewed.
- Search without Anthropic web search uses an offline index of curated official pages; a public web-search fallback is opt-in (`SEARCH_FALLBACK=duckduckgo`).
- Live data depends on upstream open-data APIs; widgets show the official page when they are down.

## Contact and incidents
Report errors or harmful answers through the repository's issue tracker (or the contact configured in
`pack.brand.contact`). Security issues: see [SECURITY.md](../SECURITY.md).
