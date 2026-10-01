/**
 * Scene: the northern backdrop (sun glow, aurora, lake + reflected treeline) behind a section.
 * Artwork comes from the country pack as cacheable SVG files: the landscape is painted as a CSS background
 * (light/dark variants swap via CSS, and phones get the tighter `#m` crop defined inside each landscape
 * file); the aurora is its drifting ribbons (see Aurora).
 */
import type { CSSProperties } from 'react';
import type { SceneArt } from '@/lib/country/types';
import { Aurora } from './Aurora';

/**
 * `land={false}` keeps only the sky (stars, sun, aurora): the lake and treeline belong to the hero alone.
 * `priority`: the scene is above the fold, so its aurora is fetched first.
 */
export function Scene({ art, sun = true, stars, land = true, priority }: { art: SceneArt; sun?: boolean; stars?: boolean; land?: boolean; priority?: boolean }) {
  const vars = land
    ? ({
        '--land': `url(${art.land.light})`,
        '--land-d': `url(${art.land.dark})`,
        '--land-m': `url(${art.land.light}#m)`,
        '--land-dm': `url(${art.land.dark}#m)`,
      } as CSSProperties)
    : undefined;
  return (
    <div className="l-scene" aria-hidden style={vars}>
      {stars ? <div className="l-stars" /> : null}
      {sun ? <div className="l-sun" /> : null}
      <Aurora src={art.aurora} dark={art.auroraDark} priority={priority} />
      {land ? <div className="l-land" /> : null}
    </div>
  );
}
