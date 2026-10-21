# Maintaining the Brazil country pack

This document describes how contributors can maintain `src/countries/br/` in the public [Ask Canada fork](https://github.com/anamanlab/ask-canada) without presenting an independent project as a government service. It is a practical maintenance and release checklist, **not** evidence of external adoption or official endorsement.

## Provenance and responsibility

- The base Ask Canada project and its original MIT copyright notice credit **Ryan Campbell and contributors**. Preserve `LICENSE`, `NOTICE`, and upstream references.
- The Brazil country pack was implemented and maintained in this fork by the `anamanlab` account. Review the actual merged work in [PR #1](https://github.com/anamanlab/ask-canada/pull/1), [PR #2](https://github.com/anamanlab/ask-canada/pull/2), and [PR #3](https://github.com/anamanlab/ask-canada/pull/3).
- These PRs establish a contribution history within the fork, **not** maintenance of the original author's project or evidence of third-party downloads, users, stars, or community contributors.
- The project is independently operated. Avoid official symbols, misleading `.gov.br` origins and claims of endorsement. A visitor must be directed to the official service for authentication, filing or payment.

## Change review

Every Brazil-facing factual change should have a short, auditable trail:

1. Identify the exact UI question or tool output. Reproduce using **synthetic** inputs only.
2. Cite an appropriate primary source, its publication/last-updated date if available, and the date it was accessed. Keep raw source URL and normalized display URL distinguishable.
3. State whether a value is live, cached, or generated at build time. Preserve source timestamps, stale indicators and uncertainty; never invent figures when an upstream endpoint is unreachable.
4. Prefer structured official data over generated explanatory text. Government requirements, estimated processing times and fees can change; avoid hardcoding them without review.
5. Add/adjust a deterministic regression test (including error, timeout and stale-data paths where relevant).
6. Explain why the change belongs inside the Brazil pack and what, if anything, touches shared code. Run both country checks if shared code changes.
7. For legislative and electoral information, preserve factual neutrality: identify the data source, its date and limitations; do not publish partisan endorsements, subjective ratings or electoral forecasts.
8. Screen all test fixtures, screenshots, issue descriptions and logs for real CPF/NIS/RG, credentials, personal claims and private documents.

The project is **not** a replacement for government portals or personalized legal, financial or medical advice. Link to the responsible official service.

## Verification commands

From a checkout with Node.js 22+ and pnpm 10:

```sh
pnpm install --frozen-lockfile
COUNTRY=br pnpm dev
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

Also inspect [CI](../.github/workflows/ci.yml), and run the Canada checks if core code changes. The presence of these scripts does not mean the checks passed on a particular commit.

For changes to public information or interaction, verify with keyboard-only navigation, screen reader, mobile viewport, Portuguese/English copy, visible focus and zoom. Use the Brazilian government's [eMAG accessibility model](https://emag.governoeletronico.gov.br/) alongside WCAG as review references. Do not claim certification without an actual audit. Consult the [ANPD's guidance and checklists](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes) when evaluating privacy and information security. This checklist is not legal compliance certification.

## Deployment and release gates

The project should **not** be presented as publicly launched until all applicable gates are checked:

- [ ] A **controlled, non-government** HTTPS domain is verified. Configure `NEXT_PUBLIC_BR_SITE_URL` **before build**; it must be the real public site origin without a trailing slash.
- [ ] `COUNTRY=br` is configured at build time. The chosen hosting platform supports the model provider and runtime adapters.
- [ ] `/robots.txt`, `/sitemap.xml`, canonical metadata and `pt-BR` / `en-BR` language alternates point to the actual deployed domain. Unconfigured Brazil builds intentionally disable indexing.
- [ ] The independent-project disclosure and official portal handoff are easy to find on mobile and desktop.
- [ ] Enable GitHub Issues for public feedback (currently disabled, checked 2026-10-21), and confirm the Brazil issue template can actually be submitted; until then, accept factual improvements via PRs.
- [ ] Confirm a **private**, working security-reporting route (GitHub private vulnerability reporting or a monitored security email); a public repository link is not a private disclosure channel. Review privacy/AI-provider disclosure. Do not advertise a live demo without testing it.
- [ ] Primary sources for showcased services are accessible and current or explicitly marked as snapshots; model fallback does not fabricate official data.
- [ ] Rate limits, budgets, credential handling, access logs and provider retention are reviewed for the chosen host. Avoid placing credentials in a public repo.
- [ ] CI passes; smoke-test a real production build for both the Brazil and Canada variants if shared components changed.
- [ ] Accessibility and sensitive-input protections are checked manually, not inferred from lint or unit tests.

## Public impact evidence — record facts, never inflate them

Record evidence for grant applications and maintainership audits only when it exists:

| Evidence | What is verifiable today | What is not established |
| --- | --- | --- |
| Work done | [Brazil implementation PR #1](https://github.com/anamanlab/ask-canada/pull/1) and later [#2](https://github.com/anamanlab/ask-canada/pull/2), [#3](https://github.com/anamanlab/ask-canada/pull/3) | Upstream merge or stewardship |
| Open-source status | Public repository, MIT `LICENSE` and preserved `NOTICE` | External adoption simply because code is public |
| Test discipline | `package.json` scripts and two-country GitHub Actions workflow | Current green builds until checked |
| Public usefulness | Reusable Brazilian public-service interface and official-data adapters | Verified visitors, external installations, downloads or endorsements |

If maintainers later collect public feedback or usage evidence, link to the original GitHub issue, merged external PR, privacy-respecting public metrics or a documented opt-in testimonial with dates. Do not publish unverified statistics or people’s private experiences.

For submission to OpenAI or any other grant, fill private account fields only in the **official application**, not in GitHub issues or source code. No award or plan tier is guaranteed.
