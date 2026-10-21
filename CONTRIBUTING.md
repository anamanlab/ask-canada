# Contributing

Thanks for helping make government services easier to use.

1. **Facts first.** Every fee, date, threshold and phone number must come from the current official page.
   Record the URL and its "Date modified" next to the data. If you can't verify it, link the page instead.
2. **Pack-localized interfaces.** The Canada product supports English and French; the Brazil product
   supports Portuguese and English. Every user-visible string belongs in the relevant pack catalogs,
   with human-reviewed translations and a passing pack-specific i18n check. This product convention
   does not alter each country's legal official-language status.
3. **Accessible by default.** WCAG 2.1 AA: labels, keyboard, focus, contrast, live regions, reduced motion.
4. **Private by design.** Never collect SIN, passport, banking or health card numbers. Save only on device.
5. **Stay in your lane.** Widgets live in their pack folder (see `docs/WIDGET_GUIDE.md`); core stays
   country-agnostic (see `docs/NEW_COUNTRY.md`).

Before opening a pull request: `pnpm typecheck && pnpm lint && pnpm check:i18n`, and attach screenshots
(desktop + mobile, light + dark, EN + FR) from `node scripts/shot.mjs`.


## Contributing to the Brazil pack (`COUNTRY=br`)

The Brazil implementation lives in `src/countries/br/`; keep shared logic country-agnostic. See [Brazil's public guide](docs/BRASIL.md), [implementation notes](docs/PLAN_BR.md) and [country-pack architecture](docs/NEW_COUNTRY.md).

- **Cite primary evidence.** For public services, deadlines, amounts, eligibility and legal rules, include an official URL, its published/updated date if available, and the date you checked it. Label outdated or unavailable data rather than extrapolating. Keep sources and status visible in the UI.
- **Use plain Brazilian Portuguese.** Avoid unexplained acronyms, bureaucratic phrasing and assumed knowledge; make the next action and official handoff clear. Keep the English product translation coherent. Accessibility targets follow [eMAG](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital) and the [Padrão Digital de Governo](https://www.gov.br/ds); do not claim certification from tests alone.
- **Stay politically neutral.** When displaying government, legislative or electoral records, separate source facts and dates from analysis. Do not add endorsements, electoral predictions or subjective ranking of political actors.
- **Protect people.** Never request, log, add to fixtures, or paste real CPF, NIS, RG, passwords, gov.br codes or private health information. Use synthetic test values. Security reports go through [SECURITY.md](SECURITY.md), not public Issues.
- **Make it reproducible.** Explain what changed and why; add regression tests for factual corrections and for stale/unavailable upstream services. Never replace an official-source error with a hardcoded unsourced answer.

Before opening a Brazil PR, run (with the correct country selected for the build):

```bash
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

Attach relevant PT/EN desktop/mobile screenshots for UI changes. A [Brazil source-correction Issue](.github/ISSUE_TEMPLATE/br-source-report.yml) is appropriate for reporting factual errors; never publish personal case details. Existing Canada contributions continue to follow the Canada checks above.
