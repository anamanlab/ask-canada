# Brazil pack — maintainer runbook

This runbook documents repeatable stewardship of the Brazil country pack. It is a procedure for maintainers, **not** a claim of public adoption, regulatory certification, security audit, or current production accuracy.

## Ownership and upstream attribution

- Parent project: **Ask Canada** by Ryan Campbell and contributors; retain the existing MIT license, copyright notices and other third-party notices.
- Country-pack maintenance in this fork: `anamanlab`; see merged [Brazil v1 PR #1](https://github.com/anamanlab/ask-canada/pull/1), [Brazil v2 PR #2](https://github.com/anamanlab/ask-canada/pull/2) and [corrections PR #3](https://github.com/anamanlab/ask-canada/pull/3).
- A repository fork is not evidence of being a primary maintainer of the upstream project. Describe maintenance of the **Brazil adaptation** only.
- Avoid implying a government partnership or availability of confidential government APIs.

## Routine checks

| Trigger | Action | Evidence to retain |
| --- | --- | --- |
| Each Brazil code/content PR | Run Brazil commands below; check Canada CI leg; manual PT-BR mobile / keyboard review if UI changed | PR checks, short test notes |
| Any fee, benefit, threshold, eligibility or application-process change | Verify relevant primary GOV.BR/agency publication and its effective date; update snapshot/guidance/tests; link source in PR | URL, observed date, effective date if applicable, changed paths |
| Data source/schema change | Validate upstream payload shape, authoritative URLs, source contract, timeout/cache/stale/failure paths | Contract tests and redacted sample |
| Release or production change | Check both country builds, routes, privacy/security settings, provenance dates and official handoff URLs | Release notes and version/commit |
| Security or privacy report | Handle privately under `SECURITY.md`; assess exposure and follow responsible disclosure | Private report / follow-up (no PII in public logs) |

Before opening a Brazil PR:

```bash
pnpm install --frozen-lockfile
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

For generated Brazil content **when an upstream source actually changes**:

```bash
pnpm generate:br
pnpm servicos:br:check
```

The service import check may require network access and a healthy upstream. Report the outcome and provenance; do not call it a live accuracy guarantee. CI has separate Canada/Brazil legs; see `.github/workflows/ci.yml`.

## Source provenance record (copy into PR)

| Field | Record |
| --- | --- |
| What changed | Specific service, rule, dataset, or UI |
| Official source URL | Direct link to agency or API endpoint |
| Checked at (UTC) | Date/time of review |
| Effective/published date | If present; otherwise “not specified” |
| Source/API version | If documented |
| Cache/snapshot timestamp | If applicable |
| Result if source unavailable | Clear uncertainty and official handoff |
| Tests | Exact commands and outcomes |

Keep facts and citations close to where they are consumed. A passing test does not establish that a public service's underlying rules are still current.

## Contribution and review boundaries

- Brazil-specific logic belongs under `src/countries/br/`; shared infrastructure may change only when necessary for a country-agnostic contract.
- PT-BR is the default language for this pack; verify its English catalog as well. Don't replace the Canada pack's English/French requirements.
- Reject mock citations, invented service IDs, hardcoded stale prices and undisclosed sample data presented as live.
- Never ask for CPF, passwords, GOV.BR 2FA codes, bank details or confidential documents in public issues or demonstration prompts.
- For legislative information, display official records without endorsement, ideological ranking or voting guidance.
- Review license compatibility and attribution when copying materials from government websites or external OSS projects; an available webpage is not automatically relicensable code.
- Add issues for known coverage gaps and unverified deployment/usage claims instead of silently describing them as complete.

## Public benefit and adoption evidence

Keep externally verifiable evidence separate from aspiration: merged PRs, test/release history, public demos, independent contributors, downstream reuse, actual usage/download telemetry collected lawfully, and issue resolution. Do not fabricate users, stars, installs, reviews, partnerships, or usage metrics.

See [OSS_EVIDENCE.md](OSS_EVIDENCE.md) for dated project evidence and remaining unknowns. This project is independently developed from the original base; public adoption of the Brazil adaptation has **not** been independently established by this document.
