# Widget guide (read this, then SPEC.md, then build)

Widgets are interactive tools that the AI renders **inside the conversation**: planners, calculators,
eligibility checkers, live data, maps, checklists, contact cards. This guide is the complete contract.
The passport renewal planner is the reference implementation — read it before you start:

```
src/countries/ca/tools/passport.ts                 tool (server): input schema + execute
src/countries/ca/widgets/passport/data.ts          verified facts + source URLs (isomorphic)
src/countries/ca/widgets/passport/plan.ts          pure computation (isomorphic, reused client-side)
src/countries/ca/widgets/passport/PassportPlanner.tsx   renderer
src/countries/ca/widgets/passport/index.tsx        { passportPlanner: PassportPlanner }
src/countries/ca/widgets/passport/fixtures.ts      every state, for /lab/passport
src/countries/ca/widgets/passport/messages/{en,fr}.json + index.ts
src/countries/ca/scenarios/passport.ts             scripted answers (EN + FR)
```

---

## 1. What you own (edit nothing else)

For widget id `<id>` (e.g. `benefits`, `life-events`, `veterans-defence`) in the Canada pack:

| File | Purpose |
| --- | --- |
| `src/countries/ca/tools/<id>.ts` | `export const tools = { … } satisfies ToolSet` |
| `src/countries/ca/widgets/<id>/**` | renderers, fixtures, messages, helpers, local primitives |
| `src/countries/ca/scenarios/<id>.ts` | `export default [...] as Scenario[]` |

These files are **pre-stubbed**. The registries (`tools/index.ts`, `widgets/registry.ts`,
`widgets/fixtures.ts`, `scenarios/index.ts`) already import them — never edit registries, core
(`src/app`, `src/components`, `src/lib`) or another widget's folder. Shared data you may *read*:
`src/countries/ca/data/holidays.ts` (federal holidays), `src/lib/dates/business-days.ts`.
If you need a new primitive, build it inside your widget folder.

## 2. Naming rule (routing depends on it)

Every tool name **must start with your widget's prefix** = camelCase of the id:
`passport` → `passportPlanner`, `passportFees`; `life-events` → `lifeEventsChecklist`;
`veterans-defence` → `veteransDefenceBenefits`. The chat routes `tool-<name>` parts to your widget by
longest prefix and lazy-loads only your code. The dev server warns if a name breaks the rule.

## 3. The tool (server)

```ts
// src/countries/ca/tools/<id>.ts
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';

export const tools = {
  benefitsFinder: tool({
    description: 'One precise paragraph: what it does, when the model should call it, what inputs mean.',
    inputSchema: z.object({ /* keep inputs few, optional, with .describe() */ lang: z.enum(['en','fr']).optional() }),
    execute: async (input, { abortSignal }) => {
      // compute or fetch (server-side). Live APIs: fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) })
      return { /* your data */, sources: [/* ToolSource[] */] };
    },
  }),
} satisfies ToolSet;
```

- `execute` runs on the server for both the real model and scripted mode. Always return JSON-serializable
  data. Never throw for "no result": return an empty/explanatory shape the widget can render.
- **Every output includes `sources: ToolSource[]`** (see `src/lib/widgets/types.ts`):
  `{ title, url, checked: 'YYYY-MM-DD', updated?, quote?, live? }`. The chat collects them into the
  numbered Sources list, and `WidgetShell` shows the first one in its footer.
- Accept `lang: 'en' | 'fr'` when your output contains prose or URLs, and return French URLs for French.
- Live data: fetch server-side with a timeout and `next: { revalidate }`, and on failure return a shape
  with `live: false` + the official page as fallback. Allowed hosts are in the CSP (`src/proxy.ts`):
  the browser only talks to our own origin; tools fetch from the server.

### Read the department guidance first
Before writing data or copy, read the matching CDS AI Answers department file(s) in
`vendor/cds-ai-answers/scenarios/context-<dept>/` (`*-scenarios.js` and `*-services.md`): passports and
immigration → `context-ircc`; taxes and benefits → `context-cra-arc` + `context-edsc-esdc`; weather →
`context-eccc`; recalls and health → `context-hc-sc`; travel and borders → `context-cbsa-asfc`; vehicles,
drones and boating → `context-tc`; veterans → `context-vac-acc`; forces → `context-dnd-mdn`; elections →
`context-ceo-bec`; business → `context-ised-isde`. They list the right pages to cite (EN + FR), common
misconceptions, and things never to say (e.g. IRCC phone numbers, invented wait times).

### Facts are sacred
Every number, fee, date, threshold, phone number and eligibility rule must come from the current official
page (today is 2026-09-29). Use WebFetch/curl on canada.ca, record the URL and its "Date modified" in a
`data.ts` comment block like `widgets/passport/data.ts`. If you can't verify something, don't show it —
link the official page instead. Pages often load numbers from JSON (e.g. passport fees come from
`/content/dam/ircc/documents/json/fees.json`); check the page source, and check that notices aren't
commented out before you claim a service disruption.

## 4. The renderer (client)

```tsx
// src/countries/ca/widgets/<id>/index.tsx
'use client';
import type { Renderers } from '@/lib/widgets/types';
import { BenefitsFinder } from './BenefitsFinder';

export const renderers: Renderers = { benefitsFinder: BenefitsFinder };
export default renderers;
```

Each component receives `WidgetProps<Input, Output>`:

```ts
type WidgetProps<I, O> = {
  part: {
    type: `tool-${string}`; toolCallId: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | …;
    input?: Partial<I> | I;   // partial while streaming
    output?: O;
    errorText?: string;
  };
  locale: Locale;
};
```

Render **all** states:

```tsx
export function BenefitsFinder({ part }: WidgetProps<Input, Output>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') return <WidgetError message={t('error')} fallback={{ href, label }} />;
  if (part.state !== 'output-available' || !part.output) return <WidgetSkeleton title={t('title')} icon={HandCoins} rows={4} />;
  return <Finder data={part.output} />;
}
```

The skeleton must match the final layout's rough height (no layout jump when output arrives).
The chat already wraps you in an error boundary and a spring entrance — don't add your own.

### Use the primitives (`@/components/ui`)
Each file documents its props at the top. The important ones:

- `WidgetShell` — frame with icon/title/subtitle/badge, `sources` footer, `handoff` primary button
  ("Continue on canada.ca ↗" + note), `secondaryAction`, `footnote`. Use `WidgetSection` for titled parts.
- `WidgetSkeleton`, `WidgetError`, `EmptyState`, `ErrorState`, `Notice` (warn/info/ok/danger banners).
- `Segmented` (choices with sub-labels), `Tabs`, `Toggle`, `Field` + `Input`/`Select`/`Textarea`, `Slider`.
- `Stat` + `NumberTicker` (animated numbers), `Badge`, `Stepper` (vertical/horizontal), `Checklist`
  (progress saved on device), `CalendarGrid` + `DateTile`, `Map` (no-key tiles, keyboard accessible),
  `Tooltip`, `Sheet`/`Dialog`, `Button`/`LinkButton`/`IconButton`, `Chip`, `Card`.
- `MoneyInput`/`PercentInput`/`NumberInput`, `ExternalLink`, `Disclosure`, `LiveRegion` (see below).

### Shared building blocks
Reach for these before writing a local copy (each file documents its API at the top). They replace the
per-widget helpers that the audit found duplicated across widgets.

| Need | Use | From |
|---|---|---|
| Unique heading ids (a widget can render twice) | automatic in `WidgetShell` / `WidgetSection`; don't hardcode `id`s | `@/components/ui` |
| Checklist whose count you show elsewhere | `const list = useChecklist(key, label, n)` + `<Checklist value={list.value} onChange={list.onChange} …/>`; count with `list.value.length` during render (`onProgress` is deprecated) | `@/components/ui` |
| "Today" / "now" without hydration mismatch | `useToday(output.today, { maxDriftDays?, timeZone?, pinned? })`, `useNow(output.asOf, { tickMs?, pinned? })` | `@/lib/hooks` |
| Direction of *this* subtree | `dirOf(e.currentTarget)` in handlers, `const [ref, dir] = useDir()` for rendering; never `document.documentElement.dir` | `@/lib/hooks` |
| Arrow-key groups (radio grids, chip rails, tabs) | `useRovingFocus({ count, index, onMove, orientation, isDisabled })` → `itemProps(i)` | `@/lib/hooks` |
| Sliding selection indicator (a thumb or underline that follows the chosen item) | `useSlidingThumb(index, getItem, count)` with `getItem` from `useRovingFocus`; style the group's `::before` from `--thumb-x/y/w/h` (see `Segmented`, `Tabs`), no `motion` `layoutId` | `@/lib/hooks` |
| Element width/height, scroller edge fades | `useElementSize()`, `useScrollEdges({ axis })` (destructure: `const { ref, end, maskStyle } = …`) | `@/lib/hooks` |
| Debounced screen-reader announcement | `<LiveRegion text={…} delay={700} />`, or `useSettled(value, ms)` | `@/components/ui`, `@/lib/hooks` |
| Money / percent / number fields (fr-CA "5,5" and "1 234,56") | `MoneyInput`, `PercentInput`, `NumberInput`; parsing alone: `parseLocaleNumber(raw, intl)` | `@/components/ui`, `@/lib/i18n/number` |
| Money display | `fmt.money(n, { cents: 'auto' \| 'always' \| 'never', compact? })` instead of a local `money` lambda | `useLocale().fmt` |
| Link to an official page | `<ExternalLink href standalone?>` (↗ glued to the last word + sr-only "(opens in a new tab)") | `@/components/ui` |
| "Show more" section | `<Disclosure title summary? count? lazy?>` (`lazy` mounts heavy content on first open) | `@/components/ui` |
| Upstream JSON in a tool | `fetchJson(url, zodSchema, { revalidate, timeout, signal })` → `{ ok, data } \| { ok: false, reason }`; `fetchText` for HTML | `@/lib/server/fetch-json` (server only) |
| Map projection | `project` / `unproject` / `worldSize` / `tileX` / `tileY` | `@/lib/map/mercator` |
| Modal overlay of your own | `useScrollLock(open)` (counted, shared with `Sheet`/`Dialog`) | `@/lib/hooks` |

Style with Tailwind utilities on the design tokens only: `bg-card`, `bg-paper-2`, `text-ink`, `text-ink-2`,
`text-ink-3`, `border-hair`, `text-maple`, `bg-maple-wash`, `text-pine`, `bg-pine-wash`, `text-glacier`,
`text-amber`, `rounded-card|tile|field|chip`, `shadow-sm|md|lg`, `font-serif|sans|mono`. **No hex values.**
Dark mode is automatic when you stick to tokens. Big numbers use `font-serif` (see `Stat`); labels use
the mono uppercase style of `WidgetSection`. Use `@container` + `@xl:` variants for layouts that must
adapt to the message column (≈370px on phones, ≈760px on desktop).

### Actions inside a widget
```ts
const { send, addToolOutput } = useChatActions(); // '@/components/chat/actions'
send('Find a passport office near K1A 0B1');      // follow-up as the user
```

### Saving on the device
Plans, checklists and reminders are saved **only on the device**, through `@/lib/device-store`:
```ts
const [plan, savePlan] = useDeviceItem<Plan>('benefits:plan', { label: t('saved.label'), kind: 'plan' });
savePlan(data, { detail: '3 of 5 ready' });   // shows up in the privacy card + "Clear this device"
```
Namespace keys with your widget id. Never store personal identifiers.

### Handoffs
When the next step is signing in, applying or paying, hand off with `WidgetShell handoff={{ href, label, note }}`.
Label: "Continue on canada.ca" (or the real destination, e.g. "Continue to CRA My Account"). Note: what
will happen there ("You'll sign in to the IRCC Portal to apply and pay."). Never collect SIN, passport
numbers, banking, health card numbers or passwords — not even "optional" fields.

## 4b. React & Next.js patterns (critics treat violations as majors)

The React Compiler lint rules are on (`react-hooks/*`); they catch some of this, not all. The rules:

- **No effect for derived data.** Compute during render (`const total = items.reduce(…)`). The compiler
  memoizes; add `useMemo` only for genuinely expensive work. Never `useEffect(() => setX(f(props)), [props])`.
  To reset state when an input changes, key the component or use the render-phase "previous value" pattern.
- **User-triggered logic goes in event handlers**, not in effects watching state that a click changed.
- **Browser state = shared hooks** from `@/lib/hooks`, never ad-hoc `matchMedia` / `MutationObserver` /
  `window.addEventListener` in an effect: `useMediaQuery(query)`, `useResolvedTheme()`,
  `prefersReducedMotion()` (handlers only), `useReducedMotion()` from `motion/react` for animation,
  `useToday`/`useNow`, `useDir`, `useElementSize`/`useScrollEdges` (see "Shared building blocks").
  On-device data = `useDeviceItem` (`@/lib/device-store`). New external store? `useSyncExternalStore`.
- **No DOM queries.** No `document.querySelector` / `getElementById` / reading `document.documentElement`
  in components. Use refs (`useRef`, callback refs) and pass them down; focus and scroll via refs.
- **Effects are only for synchronizing with something outside React** (a timer, a `ResizeObserver` on your
  own ref, a fetch with `AbortController`) and always clean up. No `eslint-disable` of
  `react-hooks/exhaustive-deps` — restructure instead (move the function inside, use an event handler, or
  `useEffectEvent`).
- **No `window` / `document` / `localStorage` / `Date.now()` / `Math.random()` during render** — it breaks
  hydration. Read them in handlers, effects or `useSyncExternalStore` snapshots.
- **Server does the fetching.** Live data comes from your tool's `execute` (server) — never `fetch` a
  third-party API from the widget. Validate upstream JSON at the boundary with `zod` (`safeParse`); no `any`.
- **Performance:** keep the initial render cheap (the chat can hold many widgets). Lazy-load heavy,
  rarely-opened parts (`next/dynamic` / `React.lazy` behind a disclosure), avoid giant inline data in client
  components (keep datasets server-side in the tool output), animate `transform`/`opacity` only, and virtualize
  or paginate lists over ~50 rows. No new dependencies without need.
- **Types & hygiene:** no `any`, no unused exports, no dead code, no commented-out code, no `@ts-ignore`.
  One component per concern; files under ~300 lines — split when bigger.

## 5. Language (EN + FR at parity, other locales later)

- No user-visible strings in TSX. Put them in `widgets/<id>/messages/en.json` + `fr.json` (same keys),
  exported through `messages/index.ts` (`defineMessages({ en, fr })`), and use `const t = useMessages(messages)`.
- ICU-lite: `"{count, plural, one {# day} other {# days}}"`, `"{kind, select, online {…} other {…}}"`,
  `"Ready by {date}"`. Numbers passed as values are locale-formatted; pass years as strings.
- Format with `const { fmt } = useLocale()`: `fmt.currency(163.5, { minimumFractionDigits: 2 })`
  → `$163.50` / `163,50 $`; `fmt.date('2026-10-29', { month: 'short', day: 'numeric' })`; `fmt.number`.
- French is written by you, at human quality (Canada.ca French: "Vérifié le 29 sept. 2026", "jours ouvrables",
  official program names). French strings run ~20% longer: never truncate, let them wrap.
- RTL: use logical utilities only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`), add
  `flip-rtl` to directional icons, wrap numeric ranges in `<bdi dir="ltr">`. Test with `?dir=rtl`.
- Other locales fall back to English automatically; the localization phase adds more JSON files.

## 6. Fixtures (the lab)

`widgets/<id>/fixtures.ts` default-exports `Fixture[]` covering **every state and edge case**:
`input-streaming`, `input-available`, each meaningful `output-available` variant (empty results, long
French strings, live-data fallback, ineligible, many items), and `output-error`. Build outputs with the same
pure functions your tool uses (see `widgets/passport/fixtures.ts`). View at `/lab/<id>`; add `?theme=dark`,
`?lang=fr`, `?dir=rtl`.

## 7. Scripted scenarios (deterministic answers)

`scenarios/<id>.ts` default-exports `Scenario[]` (`src/lib/scripted/types.ts`). Used when `SCRIPTED_AI=1`
(dev, screenshots) and as a fallback when the model is down. Tool calls in scenarios **really execute**.

```ts
{
  id: 'benefits-lost-job',
  priority: 5,                                   // higher wins among matches
  match: [/\blost (my )?job\b/i, /\bperdu (mon )?emploi\b/i],   // EN + FR
  reply: {
    en: '# You may be able to get *Employment Insurance*.\n\nBody with citations [1](https://www.canada.ca/…).',
    fr: '# Vous pourriez avoir droit à l’*assurance-emploi*.\n\nTexte avec citations [1](https://www.canada.ca/fr/…).',
  },
  vars: ({ text, lang }) => ({ month: '…' }),     // optional {placeholders} in reply
  toolCalls: [{ toolName: 'benefitsFinder', input: ({ text, lang }) => ({ situation: 'job-loss', lang }) }],
  followUps: { en: ['…'], fr: ['…'] },
}
```

Answer style (also what the real model is told): start with a one-sentence verdict as `# Heading`
(confident, caveats go in the body), wrap at most one phrase in `*italics*` (rendered in maple italic),
2–4 short paragraphs at grade-8 level, cite each fact with a numbered link `[n](url)` right after the
sentence, one sentence introducing the widget, then 2–4 follow-ups written as the person would ask them.

## 8. Accessibility (WCAG 2.1 AA)

- Semantic HTML: headings inside widgets are `h3`/`h4` (the shell's title is `h3`), lists are lists,
  tables have headers. Every control has a visible label or `aria-label`; targets ≥ 44px.
- Toggle-like buttons use `role="checkbox"`/`aria-checked` or `aria-pressed`; choice groups use `Segmented`.
- Announce computed results politely (`aria-live="polite"`), provide text equivalents for charts and maps
  (a list next to the map, an sr-only sentence for a timeline — see `PassportPlanner` `timeline.sr`).
- Contrast: text on tokens is AA; don't put `text-ink-3` on `bg-paper-2` for body copy.
- Motion: use `motion/react` with `useReducedMotion()`, or CSS respecting `prefers-reduced-motion`.
  Content must be visible without animation or JavaScript observers (no hide-until-scrolled).

## 9. Quality bar (critics check all of these)

Screenshot every fixture at desktop + mobile, light + dark, EN + FR:
```
node scripts/shot.mjs --url /lab/<id> --out .shots/<id>/r1 --sizes desktop,mobile --schemes light,dark --full
node scripts/shot.mjs --url "/lab/<id>?lang=fr" --out .shots/<id>/fr --sizes desktop,mobile --full
node scripts/shot.mjs --url "/?q=<your scenario question>" --out .shots/<id>/chat --wait 9000 --full
```
No console errors, no horizontal overflow, no truncated French, no layout shift when output arrives,
numbers formatted per locale, realistic content (no lorem, no "John Doe"), sources on every fact.
Never start/kill the dev server or run `next build`.

## 10. Copyable checklist

```
[ ] Read SPEC.md, this guide, and the passport widget
[ ] Verified every fact on the official page; URLs + "Date modified" recorded in data.ts
[ ] tools/<id>.ts: names start with the widget prefix; zod inputs described; outputs carry sources[]
[ ] Live data: server fetch with timeout + revalidate + graceful fallback
[ ] widgets/<id>/index.tsx exports `renderers` (named + default)
[ ] Renderer handles input-streaming / input-available (skeleton), output-available, output-error
[ ] Built only from @/components/ui primitives + tokens; no hex; logical (RTL-safe) spacing
[ ] Handoff to the official page for sign-in/apply/pay; no personal identifiers collected
[ ] Device-only saving via @/lib/device-store with a clear label/detail
[ ] messages/en.json + fr.json at full parity; no strings in TSX; ICU plurals; fmt.* for numbers/dates
[ ] fixtures.ts covers every state + edge cases; /lab/<id> looks right in light/dark, EN/FR, mobile/desktop, ?dir=rtl
[ ] scenarios/<id>.ts: EN + FR matches, verdict heading, numbered citations, real tool calls, follow-ups
[ ] a11y: labels, roles, live regions, text alternatives, 44px targets, reduced motion
[ ] pnpm exec tsc --noEmit, pnpm lint, node scripts/check-i18n.mjs all clean
```
