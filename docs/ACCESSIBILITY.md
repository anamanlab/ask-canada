# Accessibility conformance notes

Target: **WCAG 2.1 level AA** (Standard on Web Accessibility; EN 301 549 clause 9).

| Area | How it is met | Where |
| --- | --- | --- |
| Keyboard | All controls are native buttons/links/inputs; segmented controls, tabs and maps support arrow keys; "/" focuses the question box, Esc stops an answer; dialogs use native `<dialog>` (focus trap, Esc, focus return). | `components/ui/*`, `chat/AskApp.tsx` |
| Focus visible | Two-ring focus style on every element (`--focus`). | `app/globals.css` |
| Skip links | "Skip to the question box", "Skip to conversation", "Skip to question box". | landing, `ChatView` |
| Landmarks & headings | `header`, `main`, `nav`, `footer`; one `h1` per page; answer verdicts are `h2`; widget titles `h3`. | pages |
| Live regions | Answer progress/ready announcements, composer notes, verdict changes and computed results use `aria-live="polite"`. | `ChatView`, widgets |
| Text alternatives | Decorative art is `aria-hidden`; timelines have sr-only sentences; maps have text lists; icons have labels. | widgets |
| Contrast | Token palette meets AA in light and dark (`ink-3` #5A6472 on paper ≥ 5:1; dark `ink-3` ≥ 6:1). | tokens |
| Reflow & zoom | Fluid layouts from 320px; no horizontal scrolling (checked on every screenshot run). | all |
| Target size | Interactive targets ≥ 44×44px (40px minimum for dense icon rows with spacing). | primitives |
| Motion | `prefers-reduced-motion` disables animation; content never depends on animation or scroll observers. | `globals.css` |
| Language | `lang` on `<html>` and on mixed-language text (greetings, answers); `dir` for RTL, bidi-isolated numbers. | layout, landing |
| Forms | Every control labelled; hints/errors via `aria-describedby`; voice input optional. | `Field`, `Composer` |
| Time limits | None. | — |

**Testing:** automated screenshots at 390/1440px, light/dark, EN/FR and `?dir=rtl` for every page and
widget state (`scripts/shot.mjs`); keyboard walkthrough of landing → chat → widget → handoff. Recommended
before adoption: an audit with screen readers (NVDA, JAWS, VoiceOver, TalkBack) by a qualified assessor.
