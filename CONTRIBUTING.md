# Contributing

Thanks for helping make government services easier to use.

1. **Facts first.** Every fee, date, threshold and phone number must come from the current official page.
   Record the URL and its "Date modified" next to the data. If you can't verify it, link the page instead.
2. **Both official languages.** Every user-visible string goes in `en.json` and `fr.json` (human-quality
   French). `pnpm check:i18n` must pass.
3. **Accessible by default.** WCAG 2.1 AA: labels, keyboard, focus, contrast, live regions, reduced motion.
4. **Private by design.** Never collect SIN, passport, banking or health card numbers. Save only on device.
5. **Stay in your lane.** Widgets live in their pack folder (see `docs/WIDGET_GUIDE.md`); core stays
   country-agnostic (see `docs/NEW_COUNTRY.md`).

Before opening a pull request: `pnpm typecheck && pnpm lint && pnpm check:i18n`, and attach screenshots
(desktop + mobile, light + dark, EN + FR) from `node scripts/shot.mjs`.
