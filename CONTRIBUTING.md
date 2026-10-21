# Contributing

Thanks for helping make government services easier to use.

1. **Facts first.** Every fee, date, threshold and phone number must come from the current official page.
   Record the URL and its "Date modified" next to the data. If you can't verify it, link the page instead.
2. **Translate each country pack accurately.** Canada maintains human-quality English/French catalogs
   (`pnpm check:i18n`); Brazil maintains Portuguese-first and English catalogs (`pnpm check:i18n:br`).
   The Brazilian pack is independent of the Canadian federal official-languages requirements.
3. **Accessible by default.** WCAG 2.1 AA: labels, keyboard, focus, contrast, live regions, reduced motion.
4. **Private by design.** Never collect SIN, passport, banking or health card numbers. Save only on device.
5. **Stay in your lane.** Widgets live in their pack folder (see `docs/WIDGET_GUIDE.md`); core stays
   country-agnostic (see `docs/NEW_COUNTRY.md`).

Before opening a pull request, run the relevant country checks and attach redacted screenshots
(desktop + mobile, light + dark; EN + FR for Canada, PT-BR + EN for Brazil) when the UI changes.
For Canada: `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm check:scenarios`.
For Brazil: `pnpm typecheck:br && pnpm lint && pnpm check:i18n:br && pnpm check:scenarios:br && pnpm test:br:holidays && pnpm test:br:servicos && pnpm test:br:contract`.

## Brazil / Brasil

Contribuições em português são bem-vindas. Antes de alterar requisitos, prazos, valores ou benefícios, consulte a fonte oficial e documente **URL, data de consulta e vigência**, quando disponível. Evite dados pessoais em issues, PRs, exemplos e logs. Quando houver falha na fonte, sinalize a indisponibilidade e direcione para o serviço oficial — nunca invente respostas.

Leia o [guia público do Ask Brasil](docs/BRASIL.md), o [manual de manutenção](docs/BR_MAINTENANCE.md) e o [registro de contribuições](docs/OSS_EVIDENCE.md). Alterações específicas do Brasil devem permanecer em `src/countries/br/` sempre que possível; mudanças compartilhadas precisam preservar o comportamento do Canadá. Consulte o [modelo de pull request](.github/PULL_REQUEST_TEMPLATE.md).
