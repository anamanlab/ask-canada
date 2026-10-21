# Contributing / Contribuindo

Thanks for helping make official services easier to understand. **This is an independent project, not a government service.** See [Brazil guide](docs/BRASIL.md), [Brazil source policy](docs/SOURCE_POLICY_BR.md), [maintainer evidence](docs/MAINTAINERSHIP.md), and [security reporting](SECURITY.md).

## All country packs

1. **Facts and provenance first.** Every fee, deadline, eligibility threshold, contact or official process needs a specific primary-source URL, effective date (if available) and date checked. Link the source instead of guessing.
2. **Reviewed language catalogs.** Canada requires EN/FR; Brazil requires PT/EN. Keep all user-facing strings in the corresponding country pack's catalogs, and run the correct i18n check.
3. **Accessible by design.** Use semantic HTML, keyboard navigation, focus visibility, sufficient contrast, screen-reader descriptions, responsive layout and reduced motion. Treat WCAG 2.2 AA as a target, not proof of certification.
4. **Privacy.** Do not submit real SIN, CPF, RG, NIS, health records, passport identifiers, bank details, secrets or authentication codes in issues, PR descriptions, fixtures or logs. Redact screenshots and repros.
5. **Country isolation.** Features belong in `src/countries/<id>/`. A shared-core change needs evidence it does not regress the other country.
6. **Upstream authorship.** This fork retains MIT attribution to the original Ask Canada and its contributors. Do not claim upstream repository usage or code as independent adoption.

## Brazil-specific / Brasil

Relate mudanças em serviços federais com a **URL oficial**, a data de consulta e o âmbito da regra (federal/estadual/municipal). Diferencie dados ao vivo, cache e catálogo estático. Falhas de consulta devem informar indisponibilidade, não inventar valores. Não use sites que aparentem ser `gov.br` se não pertencerem ao governo.

Verifique acessibilidade com base no [eMAG](https://emag.governoeletronico.gov.br/) e nas WCAG; evite expor dados pessoais (LGPD). Confira a política detalhada em [docs/SOURCE_POLICY_BR.md](docs/SOURCE_POLICY_BR.md).

```bash
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

For Canada, run `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm check:scenarios`. For shared code, verify **both** country legs in CI. For UI changes, attach desktop/mobile and light/dark screenshots, plus a keyboard testing note. Mark any unrun checks honestly.

Before opening a PR, use the [pull request checklist](.github/PULL_REQUEST_TEMPLATE.md). **GitHub Issues is currently disabled in this repository.** After a maintainer enables it under repository Settings → Features → Issues, the dedicated Brazilian source-error template will be available. Until then, use pull requests for verified corrections and never post personal cases in public.
