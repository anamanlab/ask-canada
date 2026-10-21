# Open-source maintenance evidence — Ask Brasil

**Evidence snapshot:** 2026-10-21. This is a factual record to support transparent maintenance and contributor onboarding, **not** an assertion of acceptance into any funding or maintainer program.

## Project identity and roles

- Repository: [anamanlab/ask-canada](https://github.com/anamanlab/ask-canada), publicly accessible, MIT licensed.
- Original Ask Canada project and codebase: Ryan Campbell and contributors, as credited in [LICENSE](../LICENSE).
- Brazil country pack: maintained in this fork by `anamanlab`, built on the upstream country-pack architecture.
- Project scope: independent, source-linked public-service discovery and contextual explanations. No affiliation, approval or endorsement by the Government of Canada or Brazil is claimed.
- Maintainer status: the account has write access to this fork. This does **not** imply core-maintainer status in the upstream Ask Canada project.

## Verifiable Brazil-specific work

| Record | Evidence | Scope recorded at merge |
| --- | --- | --- |
| [Brazil v1 PR #1](https://github.com/anamanlab/ask-canada/pull/1) | Merged 2026-10-03 | Brazil pack; PT-BR content; official-source service index; BCB, IBGE and Câmara integrations; contract and scenario checks; 200 changed files |
| [Brazil v2 PR #2](https://github.com/anamanlab/ask-canada/pull/2) | Merged 2026-10-03 | Corrections to Brazil scenarios, official-source routing, language/catalogue and data-handling behavior |
| [Brazil fixes PR #3](https://github.com/anamanlab/ask-canada/pull/3) | Merged 2026-10-04 | Holiday, election-information and CPF/CNPJ answer corrections |
| [CI configuration](../.github/workflows/ci.yml) | Current repository configuration | Separate Canada and Brazil checks including type safety, language parity, scenarios, structured adapters and generated artifacts |
| [Maintainer guide](BR_MAINTENANCE.md) | Documentation | Required source provenance, disclosure practice, tests, privacy and release checklist |

Numbers in PR descriptions refer to implemented code and tests at those dates, **not** currently verified production usage or third-party adoption. A service-index count is not a download count or active-user count.

## Evidence not yet established

- Number of independent users of a Brazil deployment, if any
- Unique monthly deployments, downloads or downstream maintainers
- Number of independent external contributors/reviewers
- Public availability, reliability and uptime of a separate Brazil deployment
- Ongoing independent release cadence or an audited security posture
- Upstream recognition of the fork as an official component of the original Ask Canada project

If those metrics become verifiable, record date, source, definition and collection method before citing them. Never use parent-project stars or adoption as though they belong to this fork.

## Maintenance commitments

Source-supported changes should be reviewable and reproducible. Use the [Brazil guide](BRASIL.md), [maintenance runbook](BR_MAINTENANCE.md), [contribution guide](../CONTRIBUTING.md) and [security policy](../SECURITY.md). Report gaps or source failures openly; preserve original credits and license notices.

## Program applications

Application claims must reflect this repository's actual contribution history. Applicants must accurately choose their real role in the **named repository**, disclose the upstream origins where relevant and avoid portraying a newly documented maintainer policy as historic evidence of sustained community adoption. Approval is decided by program reviewers; no award is guaranteed.
