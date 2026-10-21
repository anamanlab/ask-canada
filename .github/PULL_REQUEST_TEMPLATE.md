## Summary

Describe the problem, user impact, and the country pack(s) affected (CA / BR / shared).

## Source / provenance (required for factual changes)

- Official source URL(s):
- Date verified (UTC):
- Effective date or dataset version (if available):
- What happens when a source is unavailable or stale:

Use **N/A** for code-only changes. Do not put user information or secrets in this PR.

## Verification

Check only what you actually ran; CI results are separate.

- [ ] `pnpm lint`
- [ ] Canada: `pnpm typecheck`, `pnpm check:i18n`, `pnpm check:scenarios` (when affected)
- [ ] Brazil: `pnpm typecheck:br`, `pnpm check:i18n:br`, `pnpm check:scenarios:br` (when affected)
- [ ] Brazil: `pnpm test:br:holidays`, `pnpm test:br:servicos`, `pnpm test:br:contract` (when affected)
- [ ] Accessibility / keyboard / narrow viewport reviewed (when UI changes)
- [ ] Official handoff URLs, privacy and failure states checked (when relevant)
- [ ] Third-party credits, license and country-neutral shared code checked

## Risk, rollback and known limitations

Describe migrations, generated assets, caching, sensitive-data exposure risks, remaining gaps and any checks not run. Screenshots must be redacted.
