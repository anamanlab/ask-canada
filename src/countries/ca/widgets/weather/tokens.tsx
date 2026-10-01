/**
 * The weather palette as local design tokens. Colour note: alert banners (yellow/orange/red) and the AQHI
 * scale (blue → red → burgundy) are official data encodings from Environment Canada, so they use fixed
 * palette values rather than theme tokens.
 */
/*
 * Weather palette, defined ONCE as local design tokens (light + dark) so no component carries a colour
 * literal. The app's own tokens cover rain (glacier) and smoke (amber); these add what a sky needs:
 *  - accents: sun gold, moonlight, storm violet, snow blue, sunset orange;
 *  - sky backgrounds for each mood of the "now" panel (--wx-sky-*) and its glow/haze/flake effects;
 *  - the temperature ramp stops used by the 7-day range bars (--wx-t-*, cold glacier → warm maple);
 *  - Environment Canada's official AQHI scale colours 1 → 10+ (--wx-aqhi-*), with the darkest steps lifted
 *    in dark mode so they stay visible on the card;
 *  - text, stars and rain on the dark skies, and the hero's insight pill;
 *  - the calm "no alerts" wash.
 * React hoists and de-duplicates the <style> by its href.
 */
/** Class for a weather WidgetShell: the --wx-* tokens are defined on it (with its container query context). */
export const WX_SCOPE = 'wx';

const tokens = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `--wx-${k}:${v}`)
    .join(';');
const WX_LIGHT = tokens({
  sun: 'oklch(0.76 0.16 72)',
  moon: 'oklch(0.58 0.14 276)',
  storm: 'oklch(0.55 0.2 296)',
  snow: 'oklch(0.66 0.12 232)',
  dusk: 'oklch(0.68 0.17 46)',
  'sky-sun': 'linear-gradient(160deg,oklch(0.86 0.075 232),oklch(0.93 0.045 215) 52%,oklch(0.95 0.07 88))',
  'sky-soft': 'linear-gradient(160deg,oklch(0.88 0.05 236),oklch(0.93 0.03 225) 55%,oklch(0.95 0.04 85))',
  'sky-grey': 'linear-gradient(165deg,oklch(0.88 0.018 245),oklch(0.93 0.012 240))',
  'sky-rain': 'linear-gradient(165deg,oklch(0.82 0.04 242),oklch(0.9 0.025 232))',
  'sky-snow': 'linear-gradient(165deg,oklch(0.92 0.03 232),oklch(0.97 0.012 220))',
  'sky-smoke': 'linear-gradient(165deg,oklch(0.87 0.06 70),oklch(0.92 0.045 55))',
  // Dark skies are dark in both themes (white text on them).
  'sky-storm': 'linear-gradient(165deg,oklch(0.36 0.08 285),oklch(0.22 0.05 268))',
  'sky-night': 'linear-gradient(170deg,oklch(0.3 0.08 272),oklch(0.19 0.05 262))',
  'sky-night-grey': 'linear-gradient(170deg,oklch(0.3 0.03 256),oklch(0.2 0.02 256))',
  glow: 'radial-gradient(circle,oklch(0.97 0.09 90/.9),oklch(0.95 0.08 85/0) 68%)',
  haze: 'radial-gradient(ellipse,oklch(0.75 0.06 55/.35),transparent 70%)',
  flake: 'oklch(1 0 0)',
  'flake-glow': '0 0 4px oklch(0.7 0.03 240/.6)',
  'drop-light': 'color-mix(in oklch,var(--glacier) 50%,transparent)',
  // On the dark skies (storm, night), which stay dark in both themes: text, quiet text, stars, rain.
  'on-dark': 'oklch(1 0 0)',
  'on-dark-2': 'oklch(1 0 0/.8)',
  star: 'oklch(1 0 0)',
  'drop-dark': 'oklch(1 0 0/.45)',
  // The hero's insight pill: frosted on a light sky, a faint veil on a dark one.
  pill: 'oklch(1 0 0/.55)',
  'pill-dark': 'oklch(1 0 0/.12)',
  calm: 'linear-gradient(135deg,oklch(0.93 0.05 165/.7),oklch(0.94 0.04 200/.5))',
  't-n25': 'oklch(0.74 0.14 265)',
  't-n10': 'oklch(0.74 0.14 245)',
  't-0': 'oklch(0.74 0.14 215)',
  't-10': 'oklch(0.74 0.14 165)',
  't-18': 'oklch(0.74 0.14 100)',
  't-25': 'oklch(0.74 0.14 62)',
  't-32': 'oklch(0.74 0.14 32)',
  'aqhi-1': 'oklch(0.786 0.148 224.3)',
  'aqhi-2': 'oklch(0.641 0.129 231.1)',
  'aqhi-3': 'oklch(0.487 0.113 240.8)',
  'aqhi-4': 'oklch(0.94 0.19 109.8)',
  'aqhi-5': 'oklch(0.865 0.177 90.4)',
  'aqhi-6': 'oklch(0.774 0.163 60.3)',
  'aqhi-7': 'oklch(0.704 0.187 23.2)',
  'aqhi-8': 'oklch(0.628 0.258 29.2)',
  'aqhi-9': 'oklch(0.531 0.218 29.2)',
  'aqhi-10': 'oklch(0.429 0.176 29.2)',
  'aqhi-11': 'oklch(0.32 0.131 29.2)',
  // "Low risk" text: glacier (#2a7596) is 4.36:1 on paper-2, under AA; this darker blue is 4.97:1.
  'aqhi-low-ink': 'oklch(0.5 0.1 232)',
});
const WX_DARK = tokens({
  sun: 'oklch(0.86 0.14 86)',
  moon: 'oklch(0.8 0.09 276)',
  storm: 'oklch(0.78 0.12 296)',
  snow: 'oklch(0.84 0.08 232)',
  dusk: 'oklch(0.8 0.12 56)',
  'sky-sun': 'linear-gradient(160deg,oklch(0.4 0.09 248),oklch(0.31 0.07 250) 58%,oklch(0.35 0.07 62))',
  'sky-soft': 'linear-gradient(160deg,oklch(0.37 0.06 248),oklch(0.29 0.05 250) 60%,oklch(0.31 0.04 70))',
  'sky-grey': 'linear-gradient(165deg,oklch(0.33 0.022 252),oklch(0.26 0.02 252))',
  'sky-rain': 'linear-gradient(165deg,oklch(0.36 0.06 245),oklch(0.27 0.045 250))',
  'sky-snow': 'linear-gradient(165deg,oklch(0.36 0.035 240),oklch(0.28 0.03 245))',
  'sky-smoke': 'linear-gradient(165deg,oklch(0.36 0.06 58),oklch(0.27 0.04 45))',
  glow: 'radial-gradient(circle,oklch(0.8 0.1 80/.35),transparent 68%)',
  flake: 'oklch(1 0 0/.8)',
  'drop-light': 'oklch(1 0 0/.35)',
  pill: 'oklch(1 0 0/.1)',
  calm: 'linear-gradient(135deg,oklch(0.4 0.06 165/.35),oklch(0.35 0.05 210/.3))',
  'aqhi-3': 'oklch(0.56 0.11 240.8)',
  // The three darkest steps are lifted (still descending) so each dot is at least 3:1 against a dark tile.
  'aqhi-9': 'oklch(0.595 0.218 29.2)',
  'aqhi-10': 'oklch(0.56 0.18 29.2)',
  'aqhi-11': 'oklch(0.53 0.13 12)',
  'aqhi-low-ink': 'var(--glacier)',
});
/** Scoped to the weather shells (class `wx`), not :root: the tokens exist only where the widget is. */
const WX_CSS = `.${WX_SCOPE}{${WX_LIGHT}}@media (prefers-color-scheme:dark){:root:not([data-theme='light']) .${WX_SCOPE}{${WX_DARK}}}:root[data-theme='dark'] .${WX_SCOPE}{${WX_DARK}}`;

/** Render once per widget shell (which carries the `WX_SCOPE` class), before anything that uses a --wx-* token. */
export function WxTokens() {
  return (
    <style href="wx-tokens" precedence="default">
      {WX_CSS}
    </style>
  );
}
