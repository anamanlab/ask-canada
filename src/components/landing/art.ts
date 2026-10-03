/**
 * The landing's artwork. A pack supplies every drawing through `pack.art` and `pack.phoneArt`; each palette
 * is baked into its own file, so none of the drawing rides in the HTML or the RSC payload, and CSS picks the
 * light or dark variant from custom properties set here (only the one on screen is fetched).
 *
 * `phoneArt` keys are the names the core CSS already knows. A key the pack omits falls back to Canada's file,
 * which is only ever the right picture for Canada — so a pack should supply all five.
 */
import type { CSSProperties } from 'react';
import { pack } from '@/countries/active';

const CANADA = '/art/ca';

/** The pack's themed pair for `name`, or Canada's when the pack does not draw it. */
const pair = (name: string): { light: string; dark: string } =>
  pack.phoneArt?.[name] ?? { light: `${CANADA}/${name}-light.svg`, dark: `${CANADA}/${name}-dark.svg` };

const themed = (name: string) => ({ '--art': `url(${pair(name).light})`, '--art-d': `url(${pair(name).dark})` }) as CSSProperties;

/** The phone hero's water (Shore) and its mist, the boat, and the near bank. */
export const shoreArt = {
  ...themed('shore'),
  '--mist': `url(${pair('shore-mist').light})`,
  '--mist-d': `url(${pair('shore-mist').dark})`,
} as CSSProperties;
export const canoeArt = themed('shore-canoe');
/** The near bank at the water's bottom corner. */
export const foreArt = themed('shore-fore');

/** The water drawing itself, per theme: the phone hero's largest paint, so the page preloads it (see Hero). */
export const shoreFile = pair('shore');

/** The closing panel's wide plain. */
export const prairieArt = themed('prairie');

/**
 * The three ribbons of an aurora file (`aurora-day.svg` → `aurora-day-1.svg` …), in paint order: the build
 * splits every combined aurora this way, so the page can drift each ribbon on the compositor.
 */
export function ribbons(aurora: string) {
  return [2, 1, 3].map((n) => ({ n, src: aurora.replace(/\.svg$/, `-${n}.svg`) }));
}
