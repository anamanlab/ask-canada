/**
 * The landing's artwork files, built by `scripts/build-art.mjs` into public/art/ca. Each palette is baked into
 * its own file, so none of the drawing rides in the HTML or the RSC payload; CSS picks the light or dark
 * variant from custom properties set here (only the one on screen is fetched).
 */
import type { CSSProperties } from 'react';

const ART = '/art/ca';
const url = (name: string) => `url(${ART}/${name}.svg)`;

const themed = (name: string) => ({ '--art': url(`${name}-light`), '--art-d': url(`${name}-dark`) }) as CSSProperties;

/** The phone hero's lake (Shore) and its mist, the canoe, and the near bank. */
export const shoreArt = { ...themed('shore'), '--mist': url('shore-mist-light'), '--mist-d': url('shore-mist-dark') } as CSSProperties;
export const canoeArt = themed('shore-canoe');
/** The near bank (granite and reeds) at the bay's bottom corner. */
export const foreArt = themed('shore-fore');

/** The lake drawing itself, per theme: the phone hero's largest paint, so the page preloads it (see Hero). */
export const shoreFile = { light: `${ART}/shore-light.svg`, dark: `${ART}/shore-dark.svg` };

/** The closing panel's prairie. */
export const prairieArt = themed('prairie');

/**
 * The three ribbons of an aurora file (`aurora-day.svg` → `aurora-day-1.svg` …), in paint order: the build
 * splits every combined aurora this way, so the page can drift each ribbon on the compositor.
 */
export function ribbons(aurora: string) {
  return [2, 1, 3].map((n) => ({ n, src: aurora.replace(/\.svg$/, `-${n}.svg`) }));
}
