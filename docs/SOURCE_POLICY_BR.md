# Brazil source quality and public-interest safety

This policy applies to `src/countries/br`. It describes **review requirements**, not a claim of legal or accessibility compliance. Use [Ask Brasil's Portuguese guide](BRASIL.md) for local setup.

## 1. Authority and provenance

For a factual claim about a Brazilian government service, record:

- Exact primary-source URL (prefer a specific `gov.br`, `ibge.gov.br`, `bcb.gov.br`, `camara.leg.br`, `senado.leg.br` or other competent official source).
- Official publication/update date if available; date **our team last checked** it; effective date where relevant.
- Scope: federal versus state/municipal, language, geography, audience and eligibility conditions.
- Whether it comes from a live response, a cached response or a **snapshot**; do not conflate those.
- Failure behaviour when a source is inaccessible, incomplete or stale.

Priority: current authoritative law or service page and structured official APIs > dated verified local snapshot > general guidance. When conflicting, investigate and link both relevant official sources; do not silently pick whichever is more convenient. Never invent missing requirements, fees, deadlines or individualized eligibility.

The committed service index includes **1,600 selected records, not the full catalogue**, generated on **2026-10-03**. See `src/countries/br/knowledge/servicos.index.ts`. Do not imply it is continuously synchronized; only update through the generator and review the diff for missing/removed services.

## 2. Testable content changes

A change to a Brazilian fee, public holiday, legal requirement, benefit threshold, government office, contact or emergency number should include: official URL, date checked (ISO 8601), relevant service/geography, the altered code/catalog entry, and a regression test or documented reason it cannot be automated. Check whether translated strings, screenshots, scenarios and source metadata need changes.

Do not equate `pnpm check:scenarios:br` passing with factual accuracy. Keep deterministic tests network-free where possible; verify live dependencies separately and report that they are not guaranteed.

On API errors, timeouts or outdated data: surface unavailability or the snapshot date and provide the official destination. Do not infer a current number from earlier responses.

## 3. Brazilian users, privacy and trust

- Present Ask Brasil as **independent**; do not use a `gov.br`-looking service domain, identity or email for an independent deployment.
- Never solicit CPF, RG, NIS, PIS/PASEP, bank numbers, passwords, one-time codes or medical documents in issues, examples, logs or chat.
- CPF and RG are ordinarily **personal data**; health information is **sensitive personal data** under LGPD art. 5. CNPJ data may also involve personal data when linked to identifiable natural persons. Redact all of them defensively, regardless of legal category.
- Review browser storage, server access logs, model-provider retention, cross-border processing and privacy notices before production. Do not claim "LGPD compliant" without assessment.
- Administrative actions, login, payment, and individual case status belong on the relevant official portal. This project must not impersonate a government transaction interface.
- Descriptions of public officials, legislative proposals and government data should remain factual, dated, attributed and free of electoral endorsements or recommendations.

## 4. Accessibility and localization

Use semantic HTML, keyboard interaction, meaningful labels and focus, perceivable error states, responsive reflow, reduced motion and plain PT-BR. Review the [Brazilian eMAG guidance](https://emag.governoeletronico.gov.br/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/) when implementing UI changes. Manual testing with screen readers remains necessary; automation alone is not proof of conformity.

Use `pt-BR` for locale tags and dates in user-facing metadata where appropriate; UI translations live in the pack's message catalogs. Brazilian currency uses `R$` and Brazilian formatting (`1.234,56`).

## 5. Trusted references

- Official digital service patterns: https://www.gov.br/governodigital/pt-br/padroes-digitais
- Brazilian eMAG model: https://emag.governoeletronico.gov.br/
- ANPD privacy and security materials: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes
- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Accessibility standard: https://www.w3.org/TR/WCAG22/

If a document is unavailable, do not assert that it was reviewed. Create an issue requesting official-source verification.
