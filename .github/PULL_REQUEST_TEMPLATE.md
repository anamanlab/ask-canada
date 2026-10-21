## Summary

What changed, why it is needed, and which country pack is affected? Link any related issue.

## Scope and origin

- [ ] Country: Canada (`ca`), Brazil (`br`), shared core, or documentation (explain below)
- [ ] Changes are authored here or properly attributed to their original license/source
- [ ] No credentials, authentic personal identifiers, private records or sensitive screenshots are included
- [ ] Independent services are **not** described as official government services

## Source-backed public information (if applicable)

- Official primary source URL(s):
- Date the source was published/updated (if available):
- Date checked:
- Snapshot vs live/cached data:
- Behavior when stale, missing or unavailable:
- Regression test or reproduction steps:

For government/legislative/electoral information: keep records factual, dated and nonpartisan; do not add endorsements or unsupported predictions.

## Checks performed

Mark only checks that you actually ran, and add links to CI/build logs where applicable:

- [ ] `pnpm lint`
- [ ] Canada: `pnpm typecheck && pnpm check:i18n && pnpm check:scenarios`
- [ ] Brazil: `pnpm typecheck:br && pnpm check:i18n:br && pnpm check:scenarios:br`
- [ ] Brazil: `pnpm test:br:holidays && pnpm test:br:servicos && pnpm test:br:contract`
- [ ] Checked PT/EN or EN/FR desktop/mobile views and keyboard/screen reader where UI changed
- [ ] Verified official handoffs, privacy text, source links and date/staleness notices where relevant
- [ ] Not run (explain):

## Screenshots / manual verification

Before/after screenshots or concise manual testing notes, with synthetic example data only.

## Risks and deployment considerations

Does the change affect source freshness, privacy, security, cost, localization, external services, canonical URLs or shared core behavior?

See [Brazil contributor guide](../CONTRIBUTING.md) and [Brazil maintainer checklist](../docs/MAINTAINING_BR.md).
