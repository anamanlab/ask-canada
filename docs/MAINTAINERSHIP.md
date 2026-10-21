# Maintainership and verifiable contribution record

This document is intended for contributors, reviewers and grant evaluators. It is **not a claim of acceptance into any funding program**. Claims can be checked against public commits, pull requests, files and CI. The repository itself is an adaptation of work originally published by [Ryan Campbell](https://github.com/ryancampbell/ask-canada); the original MIT copyright and third-party notices remain in [LICENSE](../LICENSE) and [NOTICE](../NOTICE).

## Brazil country-pack work in this fork

| Evidence | Verifiable work |
| --- | --- |
| [PR #1](https://github.com/anamanlab/ask-canada/pull/1) (merged 2026-10-03) | Portuguese-first Brazil pack; service index; integration with public data for Banco Central, IBGE and Câmara; country-specific widgets; tests and documentation. The PR records 200 changed files and 17,763 additions. These **diff totals** are not a count of independently authored lines. |
| [PR #2](https://github.com/anamanlab/ask-canada/pull/2) (merged 2026-10-03) | Brazil-specific factual, search and UI corrections; regression tests. |
| [PR #3](https://github.com/anamanlab/ask-canada/pull/3) (merged 2026-10-04) | Corrections to Brazil holiday, public-office and identity document questions. |
| [Brazil pack](../src/countries/br/), [CI](../.github/workflows/ci.yml) | Separated `ca` and `br` verification, localized interface and data-source adapters. |

Repository owner and contributor: [anamanlab](https://github.com/anamanlab). External contributor counts, deployments, monthly usage, dependency downloads, adoption by government agencies, and grant eligibility are **not established here**. Do not substitute the original project's stars, users, or activity for this fork's metrics.

## How another maintainer can reproduce the work

Follow [docs/BRASIL.md](BRASIL.md). The two independent CI legs are in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). A local scripted demo validates user flows without claiming generative-model accuracy. The service dataset is a bounded dated snapshot, not an up-to-date full national service registry.

## Ongoing maintenance responsibilities

1. Triage factual-error reports with official source links and date of verification; do not request personal documents.
2. Review dependencies and security reports privately under [SECURITY.md](../SECURITY.md).
3. Validate both countries, i18n parity and Brazil contract tests in pull requests.
4. Document source refreshes, breaking changes and supported deployments without inventing release cadence or support guarantees.
5. Keep contribution review and authorship attribution transparent, including upstream work.

## Evidence still needed for program applications

- Independent users or organizations who can confirm actual usage, if any.
- Real issue triage, review and release work **after** October 2026, rather than only earlier development.
- Measured adoption metrics, clearly dated and specific to this fork, if available.
- Evidence that public APIs and source-currency safeguards were verified in a real deployment.

Do not manufacture downloads, endorsements, collaborators, testimonials or stars. This project may be submitted to [Codex for Open Source](https://openai.com/form/codex-for-oss/), but approval is solely OpenAI's decision.
